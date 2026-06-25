import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { basename, extname, join } from "path";
import { tmpdir } from "os";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { Types } from "mongoose";

import {
  AudioOutputExtension,
  MediaCodecFamily,
  MediaCompressionQuality,
  MediaCompressionSkipReason,
  MediaType,
  VideoOutputExtension,
} from "../../enums";
import { EXCEPTION_CONSTANT } from "../../constants/exception.constant";
import { FileService } from "./file.service";
import {
  AUDIO_BITRATE_QUALITY_THRESHOLDS_KBPS,
  AUDIO_OUTPUT_FORMATS,
  AUDIO_QUALITY_PRESETS,
  MEDIA_COMPRESSION_MIN_FILE_BYTES,
  MEDIA_COMPRESSION_QUALITY_ORDINAL,
  MEDIA_COMPRESSION_TARGET_QUALITIES,
  MEDIA_COMPRESSION_TIMEOUT_MS,
  VIDEO_BITRATE_QUALITY_THRESHOLDS_KBPS,
  VIDEO_HEIGHT_QUALITY_THRESHOLDS,
  VIDEO_OUTPUT_FORMATS,
  VIDEO_QUALITY_PRESETS,
  type MediaCompressionTargetQuality,
} from "./media-compression.constants";
import {
  FfprobeResult,
  FfprobeStream,
  MediaCompressionEncodeRequest,
  MediaCompressionEncodeResult,
  MediaCompressionTrimInput,
  MediaCompressionTrimState,
  MediaProbeProfile,
} from "./media-compression.types";

@Injectable()
export class MediaCompressionService implements OnModuleInit {
  private readonly logger = new Logger(MediaCompressionService.name);
  private isCompressionRunning = false;
  private ffmpegToolsAvailable: boolean | null = null;
  private ffmpegPath = "ffmpeg";
  private ffprobePath = "ffprobe";

  constructor(private readonly fileService: FileService) {}

  async onModuleInit(): Promise<void> {
    await this.verifyFfmpegAvailability();
  }

  async compressMedia(
    input: MediaCompressionEncodeRequest,
  ): Promise<MediaCompressionEncodeResult> {
    if (this.isCompressionRunning) {
      throw new ConflictException(
        EXCEPTION_CONSTANT.MEDIA_COMPRESSION_BUSY,
      );
    }

    this.isCompressionRunning = true;
    const startedAt = Date.now();
    let tempDir: string | undefined;

    try {
      await this.ensureFfmpegToolsAvailable();

      if (
        !MEDIA_COMPRESSION_TARGET_QUALITIES.includes(
          input.targetQuality as (typeof MEDIA_COMPRESSION_TARGET_QUALITIES)[number],
        )
      ) {
        throw new BadRequestException(
          EXCEPTION_CONSTANT.MEDIA_COMPRESSION_INVALID_TARGET_QUALITY,
        );
      }

      const sourceFileId = input.sourceFileId;
      const { storedFile, buffer: sourceBuffer } =
        await this.fileService.downloadBufferById(sourceFileId);

      if (this.isSoftDeleted(storedFile)) {
        throw new BadRequestException(EXCEPTION_CONSTANT.FILE_ALREADY_DELETED);
      }

      const sourceMimeType = storedFile.mimeType?.toLowerCase() ?? "";
      const sourceMediaType = this.resolveSourceMediaType(
        sourceMimeType,
        storedFile.name,
      );
      if (!sourceMediaType) {
        throw new BadRequestException(
          EXCEPTION_CONSTANT.MEDIA_COMPRESSION_UNSUPPORTED_FORMAT,
        );
      }

      const outputMode = this.resolveOutputMode(
        sourceMediaType,
        input.videoOutputExtension,
        input.audioOutputExtension,
      );

      tempDir = await mkdtemp(join(tmpdir(), "negin-media-compress-"));
      const sourceExtension = extname(storedFile.name) || ".bin";
      const inputPath = join(tempDir, `source${sourceExtension}`);
      await writeFile(inputPath, sourceBuffer);

      const sourceProfile = await this.probeMedia(inputPath, sourceMediaType);
      const trimState = this.resolveTrimState(
        input.trim,
        sourceProfile.durationSeconds,
      );

      const previousQuality = sourceProfile.quality;
      const targetOrdinal =
        MEDIA_COMPRESSION_QUALITY_ORDINAL[input.targetQuality];
      const previousOrdinal = MEDIA_COMPRESSION_QUALITY_ORDINAL[previousQuality];

      const hasTrim =
        trimState.requested.startSeconds !== null ||
        trimState.requested.endSeconds !== null;

      if (
        storedFile.sizeBytes < MEDIA_COMPRESSION_MIN_FILE_BYTES &&
        !hasTrim &&
        this.isSameOutputContainer(
          storedFile.name,
          sourceProfile,
          outputMode,
        )
      ) {
        return this.buildSkippedResult({
          startedAt,
          sourceFileId,
          storedFile,
          sourceProfile,
          trimState,
          skipReason: MediaCompressionSkipReason.FILE_TOO_SMALL,
          currentQuality: previousQuality,
        });
      }

      if (
        !hasTrim &&
        targetOrdinal === previousOrdinal &&
        this.isSameOutputContainer(
          storedFile.name,
          sourceProfile,
          outputMode,
        )
      ) {
        return this.buildSkippedResult({
          startedAt,
          sourceFileId,
          storedFile,
          sourceProfile,
          trimState,
          skipReason: MediaCompressionSkipReason.ALREADY_AT_TARGET,
          currentQuality: previousQuality,
        });
      }

      const outputPath = join(
        tempDir,
        `output${this.resolveOutputExtension(outputMode)}`,
      );

      await this.runFfmpeg({
        inputPath,
        outputPath,
        sourceMediaType,
        outputMode,
        targetQuality: input.targetQuality as MediaCompressionTargetQuality,
        trimState,
      });

      const outputBuffer = await readFile(outputPath);
      const outputProfile = await this.probeMedia(
        outputPath,
        outputMode.mediaType,
      );

      if (
        !hasTrim &&
        outputBuffer.length >= storedFile.sizeBytes &&
        this.isSameOutputContainer(
          storedFile.name,
          sourceProfile,
          outputMode,
        )
      ) {
        return this.buildSkippedResult({
          startedAt,
          sourceFileId,
          storedFile,
          sourceProfile,
          trimState,
          skipReason: MediaCompressionSkipReason.OUTPUT_NOT_SMALLER,
          currentQuality: outputProfile.quality,
        });
      }

      const outputFileName = this.buildOutputFileName(
        storedFile.name,
        outputMode,
      );
      const outputMimeType = this.resolveOutputMimeType(outputMode);

      const uploadedFile = await this.fileService.uploadFromBuffer({
        name: outputFileName,
        mimeType: outputMimeType,
        buffer: outputBuffer,
      });

      await this.fileService.deleteByIds([storedFile._id as Types.ObjectId]);

      return {
        durationMs: Date.now() - startedAt,
        previousQuality,
        currentQuality: input.targetQuality,
        mediaType: outputMode.mediaType,
        wasCompressed: true,
        skipReason: MediaCompressionSkipReason.NONE,
        previousFileId: sourceFileId,
        fileId: uploadedFile.accessUrl.fileId.toString(),
        file: uploadedFile,
        trim: trimState,
        previousSizeBytes: storedFile.sizeBytes,
        currentSizeBytes: outputBuffer.length,
        compressionRatio: this.calculateCompressionRatio(
          storedFile.sizeBytes,
          outputBuffer.length,
        ),
        previousExtension: this.extractExtension(storedFile.name),
        currentExtension: this.extractExtension(outputFileName),
        previousCodec: sourceProfile.codec,
        currentCodec: outputProfile.codec,
        previousCodecFamily: sourceProfile.codecFamily,
        currentCodecFamily: outputProfile.codecFamily,
        previousBitrateKbps: sourceProfile.bitrateKbps,
        currentBitrateKbps: outputProfile.bitrateKbps,
        previousResolution: {
          width: sourceProfile.width,
          height: sourceProfile.height,
        },
        currentResolution: {
          width: outputProfile.width,
          height: outputProfile.height,
        },
        mediaDurationSeconds: trimState.applied.durationSeconds,
      };
    } finally {
      this.isCompressionRunning = false;

      if (tempDir) {
        await rm(tempDir, { recursive: true, force: true }).catch((error) => {
          this.logger.warn(
            `Failed to clean media compression temp dir: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        });
      }
    }
  }

  private async verifyFfmpegAvailability(): Promise<void> {
    try {
      await this.ensureFfmpegToolsAvailable();
    } catch (error) {
      this.logger.warn(
        `Media compression tools are unavailable: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async ensureFfmpegToolsAvailable(): Promise<void> {
    if (this.ffmpegToolsAvailable === true) {
      return;
    }

    for (const command of ["ffmpeg", "ffprobe"] as const) {
      try {
        await this.execCommand(command, ["-version"], 10_000);
      } catch (error) {
        if (this.isFfmpegUnavailableError(error)) {
          this.ffmpegToolsAvailable = false;
          throw new InternalServerErrorException(
            EXCEPTION_CONSTANT.MEDIA_COMPRESSION_UNAVAILABLE,
          );
        }

        throw error;
      }
    }

    this.ffmpegToolsAvailable = true;
  }

  private isFfmpegUnavailableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return error.message.includes("not installed or not available on PATH");
  }

  private throwMediaCompressionError(error: unknown, fallbackCode: string): never {
    if (this.isFfmpegUnavailableError(error)) {
      this.ffmpegToolsAvailable = false;
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.MEDIA_COMPRESSION_UNAVAILABLE,
      );
    }

    if (fallbackCode === EXCEPTION_CONSTANT.MEDIA_COMPRESSION_PROBE_FAILED) {
      throw new BadRequestException(fallbackCode);
    }

    throw new InternalServerErrorException(fallbackCode);
  }

  private resolveSourceMediaType(
    mimeType: string,
    fileName: string,
  ): MediaType | null {
    if (mimeType.startsWith("video/")) {
      return MediaType.VIDEO;
    }

    if (mimeType.startsWith("audio/")) {
      return MediaType.AUDIO;
    }

    const extension = this.extractExtension(fileName);
    if (["mp4", "mov", "mkv", "webm", "avi", "m4v", "ts", "flv"].includes(extension)) {
      return MediaType.VIDEO;
    }

    if (
      ["mp3", "m4a", "aac", "ogg", "opus", "flac", "wav", "wma"].includes(
        extension,
      )
    ) {
      return MediaType.AUDIO;
    }

    return null;
  }

  private resolveOutputMode(
    sourceMediaType: MediaType,
    videoOutputExtension?: VideoOutputExtension | null,
    audioOutputExtension?: AudioOutputExtension | null,
  ): OutputMode {
    const hasVideo = Boolean(videoOutputExtension);
    const hasAudio = Boolean(audioOutputExtension);

    if (hasVideo === hasAudio) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.MEDIA_COMPRESSION_OUTPUT_EXTENSION_REQUIRED,
      );
    }

    if (sourceMediaType === MediaType.AUDIO) {
      if (!audioOutputExtension) {
        throw new BadRequestException(
          EXCEPTION_CONSTANT.MEDIA_COMPRESSION_OUTPUT_EXTENSION_REQUIRED,
        );
      }

      return {
        mediaType: MediaType.AUDIO,
        audioOutputExtension,
      };
    }

    if (audioOutputExtension) {
      return {
        mediaType: MediaType.AUDIO,
        audioOutputExtension,
        extractAudioFromVideo: true,
      };
    }

    return {
      mediaType: MediaType.VIDEO,
      videoOutputExtension: videoOutputExtension!,
    };
  }

  private resolveTrimState(
    trim: MediaCompressionTrimInput | null | undefined,
    sourceDurationSeconds: number,
  ): MediaCompressionTrimState {
    const requested = {
      startSeconds:
        trim?.startSeconds === undefined || trim?.startSeconds === null
          ? null
          : trim.startSeconds,
      endSeconds:
        trim?.endSeconds === undefined || trim?.endSeconds === null
          ? null
          : trim.endSeconds,
    };

    const startSeconds = requested.startSeconds ?? 0;
    const endSeconds = requested.endSeconds ?? sourceDurationSeconds;

    if (
      startSeconds < 0 ||
      endSeconds <= startSeconds ||
      endSeconds > sourceDurationSeconds + 0.05
    ) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.MEDIA_COMPRESSION_INVALID_TRIM_RANGE,
      );
    }

    return {
      requested,
      applied: {
        startSeconds,
        endSeconds,
        durationSeconds: Math.max(0, endSeconds - startSeconds),
      },
    };
  }

  private async probeMedia(
    filePath: string,
    mediaType: MediaType,
  ): Promise<MediaProbeProfile> {
    let parsed: FfprobeResult;

    try {
      const output = await this.execCommand(this.ffprobePath, [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        filePath,
      ]);
      parsed = JSON.parse(output) as FfprobeResult;
    } catch (error) {
      this.logger.warn(
        `ffprobe failed for ${basename(filePath)}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      this.throwMediaCompressionError(
        error,
        EXCEPTION_CONSTANT.MEDIA_COMPRESSION_PROBE_FAILED,
      );
    }

    const streams = parsed.streams ?? [];
    const primaryStream =
      mediaType === MediaType.VIDEO
        ? this.findPrimaryVideoStream(streams)
        : this.findPrimaryAudioStream(streams);

    if (!primaryStream) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.MEDIA_COMPRESSION_PROBE_FAILED,
      );
    }

    const durationSeconds = this.parseDurationSeconds(parsed);
    const bitrateKbps = this.resolveBitrateKbps(parsed, primaryStream);
    const codec = primaryStream.codec_name ?? "unknown";
    const codecFamily = this.resolveCodecFamily(codec);
    const width = primaryStream.width ?? 0;
    const height = primaryStream.height ?? 0;

    const quality =
      mediaType === MediaType.VIDEO
        ? this.detectVideoQuality(height, bitrateKbps, codecFamily)
        : this.detectAudioQuality(bitrateKbps, codecFamily);

    return {
      mediaType,
      durationSeconds,
      codec,
      codecFamily,
      bitrateKbps,
      width,
      height,
      quality,
    };
  }

  private async runFfmpeg(params: {
    inputPath: string;
    outputPath: string;
    sourceMediaType: MediaType;
    outputMode: OutputMode;
    targetQuality: MediaCompressionTargetQuality;
    trimState: MediaCompressionTrimState;
  }): Promise<void> {
    const args = this.buildFfmpegArgs(params);

    try {
      await this.execCommand(this.ffmpegPath, args, MEDIA_COMPRESSION_TIMEOUT_MS);
    } catch (error) {
      this.logger.error(
        `ffmpeg failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.throwMediaCompressionError(
        error,
        EXCEPTION_CONSTANT.MEDIA_COMPRESSION_ENCODE_FAILED,
      );
    }
  }

  private buildFfmpegArgs(params: {
    inputPath: string;
    outputPath: string;
    sourceMediaType: MediaType;
    outputMode: OutputMode;
    targetQuality: MediaCompressionTargetQuality;
    trimState: MediaCompressionTrimState;
  }): string[] {
    const args = ["-y", "-hide_banner", "-loglevel", "error"];
    const hasTrim =
      params.trimState.requested.startSeconds !== null ||
      params.trimState.requested.endSeconds !== null;
    const { startSeconds, durationSeconds } = params.trimState.applied;

    // With `-ss` before `-i`, `-to` after `-i` is treated as output duration, not end time.
    // Use `-t` with the clip length (end - start) so شروع/پایان are absolute timestamps.
    if (hasTrim && startSeconds > 0) {
      args.push("-ss", startSeconds.toString());
    }

    args.push("-i", params.inputPath);

    if (hasTrim) {
      args.push("-t", durationSeconds.toString());
    }

    if (params.outputMode.mediaType === MediaType.AUDIO) {
      args.push("-vn");
      const format =
        AUDIO_OUTPUT_FORMATS[params.outputMode.audioOutputExtension!];
      const preset = AUDIO_QUALITY_PRESETS[params.targetQuality];
      args.push("-c:a", format.audioCodec);
      if (format.audioCodec === "pcm_s16le") {
        args.push("-ar", "44100");
      } else if (format.audioCodec !== "flac") {
        args.push("-b:a", `${preset.bitrateKbps}k`);
      }
      args.push(params.outputPath);
      return args;
    }

    const format = VIDEO_OUTPUT_FORMATS[params.outputMode.videoOutputExtension!];
    const preset = VIDEO_QUALITY_PRESETS[params.targetQuality];
    const scaleFilter = `scale=-2:min(ih\\,${preset.maxHeight})`;

    args.push("-vf", scaleFilter);
    args.push("-c:v", format.videoCodec);

    if (format.videoCodec === "libx264") {
      args.push("-preset", "medium", "-crf", preset.crf.toString());
      args.push(
        "-maxrate",
        `${preset.maxBitrateKbps}k`,
        "-bufsize",
        `${preset.maxBitrateKbps * 2}k`,
      );
    } else if (format.videoCodec === "libvpx-vp9") {
      args.push("-crf", `${Math.min(45, preset.crf + 6)}`, "-b:v", "0");
    } else {
      args.push("-b:v", `${preset.maxBitrateKbps}k`);
    }

    args.push("-c:a", format.audioCodec, "-b:a", `${preset.audioBitrateKbps}k`);
    args.push("-movflags", "+faststart");
    args.push(params.outputPath);
    return args;
  }

  private buildSkippedResult(params: {
    startedAt: number;
    sourceFileId: string;
    storedFile: Parameters<FileService["toUploadGqlResponse"]>[0];
    sourceProfile: MediaProbeProfile;
    trimState: MediaCompressionTrimState;
    skipReason: MediaCompressionSkipReason;
    currentQuality: MediaCompressionQuality;
  }): MediaCompressionEncodeResult {
    const file = this.fileService.toUploadGqlResponse(params.storedFile);

    return {
      durationMs: Date.now() - params.startedAt,
      previousQuality: params.sourceProfile.quality,
      currentQuality: params.currentQuality,
      mediaType: params.sourceProfile.mediaType,
      wasCompressed: false,
      skipReason: params.skipReason,
      previousFileId: params.sourceFileId,
      fileId: params.sourceFileId,
      file,
      trim: params.trimState,
      previousSizeBytes: params.storedFile.sizeBytes,
      currentSizeBytes: params.storedFile.sizeBytes,
      compressionRatio: 1,
      previousExtension: this.extractExtension(params.storedFile.name),
      currentExtension: this.extractExtension(params.storedFile.name),
      previousCodec: params.sourceProfile.codec,
      currentCodec: params.sourceProfile.codec,
      previousCodecFamily: params.sourceProfile.codecFamily,
      currentCodecFamily: params.sourceProfile.codecFamily,
      previousBitrateKbps: params.sourceProfile.bitrateKbps,
      currentBitrateKbps: params.sourceProfile.bitrateKbps,
      previousResolution: {
        width: params.sourceProfile.width,
        height: params.sourceProfile.height,
      },
      currentResolution: {
        width: params.sourceProfile.width,
        height: params.sourceProfile.height,
      },
      mediaDurationSeconds: params.trimState.applied.durationSeconds,
    };
  }

  private isSameOutputContainer(
    fileName: string,
    sourceProfile: MediaProbeProfile,
    outputMode: OutputMode,
  ): boolean {
    const currentExtension = this.extractExtension(fileName);

    if (outputMode.mediaType === MediaType.AUDIO) {
      if (outputMode.extractAudioFromVideo) {
        return false;
      }

      const targetExtension = AUDIO_OUTPUT_FORMATS[
        outputMode.audioOutputExtension!
      ].extension.slice(1);
      return currentExtension === targetExtension;
    }

    const targetExtension = VIDEO_OUTPUT_FORMATS[
      outputMode.videoOutputExtension!
    ].extension.slice(1);
    return (
      currentExtension === targetExtension &&
      sourceProfile.mediaType === MediaType.VIDEO
    );
  }

  private buildOutputFileName(fileName: string, outputMode: OutputMode): string {
    const baseName = basename(fileName, extname(fileName));
    const suffix = randomUUID().slice(0, 8);
    const extension = this.resolveOutputExtension(outputMode);
    return `${baseName}-compressed-${suffix}${extension}`;
  }

  private resolveOutputExtension(outputMode: OutputMode): string {
    if (outputMode.mediaType === MediaType.AUDIO) {
      return AUDIO_OUTPUT_FORMATS[outputMode.audioOutputExtension!].extension;
    }

    return VIDEO_OUTPUT_FORMATS[outputMode.videoOutputExtension!].extension;
  }

  private resolveOutputMimeType(outputMode: OutputMode): string {
    if (outputMode.mediaType === MediaType.AUDIO) {
      return AUDIO_OUTPUT_FORMATS[outputMode.audioOutputExtension!].mimeType;
    }

    return VIDEO_OUTPUT_FORMATS[outputMode.videoOutputExtension!].mimeType;
  }

  private detectVideoQuality(
    height: number,
    bitrateKbps: number | null,
    codecFamily: MediaCodecFamily,
  ): MediaCompressionQuality {
    const byHeight = this.detectQualityByThresholds(
      height,
      VIDEO_HEIGHT_QUALITY_THRESHOLDS,
      (value, threshold) => value <= threshold.maxHeight,
      (threshold) => threshold.quality,
    );
    const byBitrate = bitrateKbps
      ? this.detectQualityByThresholds(
          bitrateKbps,
          VIDEO_BITRATE_QUALITY_THRESHOLDS_KBPS,
          (value, threshold) => value <= threshold.maxBitrateKbps,
          (threshold) => threshold.quality,
        )
      : MediaCompressionQuality.MEDIUM;

    const detected = this.maxQuality(byHeight, byBitrate);
    return this.applyCodecEfficiencyBonus(detected, codecFamily);
  }

  private detectAudioQuality(
    bitrateKbps: number | null,
    codecFamily: MediaCodecFamily,
  ): MediaCompressionQuality {
    const detected = bitrateKbps
      ? this.detectQualityByThresholds(
          bitrateKbps,
          AUDIO_BITRATE_QUALITY_THRESHOLDS_KBPS,
          (value, threshold) => value <= threshold.maxBitrateKbps,
          (threshold) => threshold.quality,
        )
      : MediaCompressionQuality.MEDIUM;

    return this.applyCodecEfficiencyBonus(detected, codecFamily);
  }

  private detectQualityByThresholds<T>(
    value: number,
    thresholds: readonly T[],
    predicate: (value: number, threshold: T) => boolean,
    pickQuality: (threshold: T) => MediaCompressionQuality,
  ): MediaCompressionQuality {
    for (const threshold of thresholds) {
      if (predicate(value, threshold)) {
        return pickQuality(threshold);
      }
    }

    return MediaCompressionQuality.MAX;
  }

  private applyCodecEfficiencyBonus(
    quality: MediaCompressionQuality,
    codecFamily: MediaCodecFamily,
  ): MediaCompressionQuality {
    const efficientCodecs = new Set<MediaCodecFamily>([
      MediaCodecFamily.H265,
      MediaCodecFamily.VP9,
      MediaCodecFamily.AV1,
      MediaCodecFamily.OPUS,
      MediaCodecFamily.AAC,
    ]);

    if (!efficientCodecs.has(codecFamily)) {
      return quality;
    }

    const ordinal = MEDIA_COMPRESSION_QUALITY_ORDINAL[quality];
    const boostedOrdinal = Math.min(
      MEDIA_COMPRESSION_QUALITY_ORDINAL[MediaCompressionQuality.MAX],
      ordinal + 1,
    );

    return (
      Object.entries(MEDIA_COMPRESSION_QUALITY_ORDINAL).find(
        ([, value]) => value === boostedOrdinal,
      )?.[0] as MediaCompressionQuality | undefined
    ) ?? quality;
  }

  private maxQuality(
    left: MediaCompressionQuality,
    right: MediaCompressionQuality,
  ): MediaCompressionQuality {
    return MEDIA_COMPRESSION_QUALITY_ORDINAL[left] >=
      MEDIA_COMPRESSION_QUALITY_ORDINAL[right]
      ? left
      : right;
  }

  private findPrimaryVideoStream(
    streams: FfprobeStream[],
  ): FfprobeStream | undefined {
    return streams.find((stream) => stream.codec_type === "video");
  }

  private findPrimaryAudioStream(
    streams: FfprobeStream[],
  ): FfprobeStream | undefined {
    return streams.find((stream) => stream.codec_type === "audio");
  }

  private parseDurationSeconds(parsed: FfprobeResult): number {
    const duration = Number.parseFloat(parsed.format?.duration ?? "0");
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
  }

  private resolveBitrateKbps(
    parsed: FfprobeResult,
    stream: FfprobeStream,
  ): number | null {
    const streamBitrate = Number.parseInt(stream.bit_rate ?? "", 10);
    if (Number.isFinite(streamBitrate) && streamBitrate > 0) {
      return Math.round(streamBitrate / 1000);
    }

    const formatBitrate = Number.parseInt(parsed.format?.bit_rate ?? "", 10);
    if (Number.isFinite(formatBitrate) && formatBitrate > 0) {
      return Math.round(formatBitrate / 1000);
    }

    return null;
  }

  private resolveCodecFamily(codec: string): MediaCodecFamily {
    const normalized = codec.toLowerCase();

    if (["h264", "avc"].includes(normalized)) {
      return MediaCodecFamily.H264;
    }
    if (["hevc", "h265"].includes(normalized)) {
      return MediaCodecFamily.H265;
    }
    if (normalized.includes("vp9")) {
      return MediaCodecFamily.VP9;
    }
    if (normalized.includes("av1")) {
      return MediaCodecFamily.AV1;
    }
    if (normalized.includes("aac")) {
      return MediaCodecFamily.AAC;
    }
    if (normalized.includes("mp3")) {
      return MediaCodecFamily.MP3;
    }
    if (normalized.includes("opus")) {
      return MediaCodecFamily.OPUS;
    }
    if (normalized.includes("vorbis")) {
      return MediaCodecFamily.VORBIS;
    }
    if (["pcm_s16le", "pcm_s24le", "pcm_f32le"].includes(normalized)) {
      return MediaCodecFamily.PCM;
    }

    return MediaCodecFamily.UNKNOWN;
  }

  private calculateCompressionRatio(
    previousSizeBytes: number,
    currentSizeBytes: number,
  ): number {
    if (previousSizeBytes <= 0) {
      return 1;
    }

    return Number((currentSizeBytes / previousSizeBytes).toFixed(4));
  }

  private extractExtension(fileName: string): string {
    return extname(fileName).replace(/^\./, "").toLowerCase();
  }

  private isSoftDeleted(storedFile: {
    audit?: { deletedAt?: Date | null };
  }): boolean {
    return Boolean(storedFile.audit?.deletedAt);
  }

  private execCommand(
    command: string,
    args: string[],
    timeoutMs = 60_000,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error(`${command} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        clearTimeout(timeout);
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          reject(
            new Error(
              `${command} is not installed or not available on PATH`,
            ),
          );
          return;
        }

        reject(error);
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve(stdout || stderr);
          return;
        }

        reject(
          new Error(
            `${command} exited with code ${code}: ${stderr || stdout}`.trim(),
          ),
        );
      });
    });
  }
}

type OutputMode =
  | {
      mediaType: MediaType.VIDEO;
      videoOutputExtension: VideoOutputExtension;
      extractAudioFromVideo?: false;
    }
  | {
      mediaType: MediaType.AUDIO;
      audioOutputExtension: AudioOutputExtension;
      extractAudioFromVideo?: boolean;
    };
