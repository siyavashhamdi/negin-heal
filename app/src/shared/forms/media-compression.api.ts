import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";
import { EMPTY_DURATION_PARTS, type DurationParts } from "./durationTimeInput.util";

export type MediaCompressDialogSource = {
  readonly fileId: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly mediaKind: "video" | "audio";
  readonly previewUrl: string;
  readonly sizeBytes: number;
};

export type MediaCompressTrimFormState = {
  readonly start: DurationParts;
  readonly end: DurationParts;
};

export type MediaCompressFormState = {
  readonly targetQuality: string;
  readonly outputMode: "video" | "audio";
  readonly videoOutputExtension: string;
  readonly audioOutputExtension: string;
  readonly trim: MediaCompressTrimFormState;
};

export type FileCompressMediaMutationVariables = {
  readonly input: {
    readonly fileId: string;
    readonly targetQuality: string;
    readonly videoOutputExtension?: string | null;
    readonly audioOutputExtension?: string | null;
    readonly trim?: {
      readonly startSeconds?: number | null;
      readonly endSeconds?: number | null;
    } | null;
  };
};

export type FileCompressMediaMutationResult = {
  readonly durationMs: number;
  readonly previousQuality: string;
  readonly currentQuality: string;
  readonly mediaType: string;
  readonly wasCompressed: boolean;
  readonly skipReason: string;
  readonly previousFileId: string;
  readonly fileId: string;
  readonly previousSizeBytes: number;
  readonly currentSizeBytes: number;
  readonly compressionRatio: number;
  readonly previousExtension: string;
  readonly currentExtension: string;
  readonly previousCodec: string;
  readonly currentCodec: string;
  readonly previousCodecFamily: string;
  readonly currentCodecFamily: string;
  readonly previousBitrateKbps?: number | null;
  readonly currentBitrateKbps?: number | null;
  readonly previousResolution: {
    readonly width: number;
    readonly height: number;
  };
  readonly currentResolution: {
    readonly width: number;
    readonly height: number;
  };
  readonly mediaDurationSeconds: number;
  readonly trim: {
    readonly requested: {
      readonly startSeconds?: number | null;
      readonly endSeconds?: number | null;
    };
    readonly applied: {
      readonly startSeconds: number;
      readonly endSeconds: number;
      readonly durationSeconds: number;
    };
  };
  readonly file: {
    readonly name: string;
    readonly mimeType: string;
    readonly sizeBytes: number;
    readonly path: string;
    readonly uploadedAt: string;
    readonly accessUrl?: {
      readonly baseUrl?: string | null;
      readonly apiPath: string;
      readonly fileId: string;
      readonly token: string;
      readonly name?: string | null;
      readonly mimeType?: string | null;
      readonly sizeBytes?: number | null;
    } | null;
  };
};

export type FileCompressMediaMutation = {
  readonly fileCompressMedia: FileCompressMediaMutationResult;
};

export function mapCompressMediaAccessUrl(
  result: FileCompressMediaMutationResult
): FileAccessUrl | null {
  const accessUrl = result.file.accessUrl;
  if (!accessUrl?.fileId || !accessUrl.token || !accessUrl.apiPath) {
    return null;
  }

  return {
    baseUrl: accessUrl.baseUrl,
    apiPath: accessUrl.apiPath,
    fileId: String(accessUrl.fileId),
    token: accessUrl.token,
    name: accessUrl.name ?? result.file.name,
    mimeType: accessUrl.mimeType ?? result.file.mimeType,
    sizeBytes: accessUrl.sizeBytes ?? result.file.sizeBytes,
  };
}

export function buildDefaultMediaCompressForm(
  source: MediaCompressDialogSource
): MediaCompressFormState {
  return {
    targetQuality: "MEDIUM",
    outputMode: source.mediaKind === "audio" ? "audio" : "video",
    videoOutputExtension: "MP4",
    audioOutputExtension: "MP3",
    trim: {
      start: { ...EMPTY_DURATION_PARTS },
      end: { ...EMPTY_DURATION_PARTS },
    },
  };
}
