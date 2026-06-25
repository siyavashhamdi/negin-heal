import { MediaCompressionQuality } from "../../enums/media-compression-quality.enum";
import { AudioOutputExtension } from "../../enums/audio-output-extension.enum";
import { VideoOutputExtension } from "../../enums/video-output-extension.enum";

export const MEDIA_COMPRESSION_TIMEOUT_MS = 15 * 60 * 1000;

export const MEDIA_COMPRESSION_MIN_FILE_BYTES = 100 * 1024;

export const MEDIA_COMPRESSION_TARGET_QUALITIES = [
  MediaCompressionQuality.TINY,
  MediaCompressionQuality.VERY_LOW,
  MediaCompressionQuality.LOW,
  MediaCompressionQuality.MEDIUM_LOW,
  MediaCompressionQuality.MEDIUM,
  MediaCompressionQuality.MEDIUM_HIGH,
  MediaCompressionQuality.HIGH,
  MediaCompressionQuality.VERY_HIGH,
  MediaCompressionQuality.MAX,
] as const;

export type MediaCompressionTargetQuality =
  (typeof MEDIA_COMPRESSION_TARGET_QUALITIES)[number];

export const MEDIA_COMPRESSION_QUALITY_ORDINAL: Record<
  MediaCompressionQuality,
  number
> = {
  [MediaCompressionQuality.TINY]: 0,
  [MediaCompressionQuality.VERY_LOW]: 1,
  [MediaCompressionQuality.LOW]: 2,
  [MediaCompressionQuality.MEDIUM_LOW]: 3,
  [MediaCompressionQuality.MEDIUM]: 4,
  [MediaCompressionQuality.MEDIUM_HIGH]: 5,
  [MediaCompressionQuality.HIGH]: 6,
  [MediaCompressionQuality.VERY_HIGH]: 7,
  [MediaCompressionQuality.MAX]: 8,
  [MediaCompressionQuality.ORIGINAL]: 9,
};

export type VideoQualityPreset = {
  maxHeight: number;
  crf: number;
  maxBitrateKbps: number;
  audioBitrateKbps: number;
};

export const VIDEO_QUALITY_PRESETS: Record<
  MediaCompressionTargetQuality,
  VideoQualityPreset
> = {
  [MediaCompressionQuality.TINY]: {
    maxHeight: 360,
    crf: 32,
    maxBitrateKbps: 400,
    audioBitrateKbps: 64,
  },
  [MediaCompressionQuality.VERY_LOW]: {
    maxHeight: 480,
    crf: 30,
    maxBitrateKbps: 700,
    audioBitrateKbps: 80,
  },
  [MediaCompressionQuality.LOW]: {
    maxHeight: 540,
    crf: 28,
    maxBitrateKbps: 1000,
    audioBitrateKbps: 96,
  },
  [MediaCompressionQuality.MEDIUM_LOW]: {
    maxHeight: 720,
    crf: 26,
    maxBitrateKbps: 1200,
    audioBitrateKbps: 112,
  },
  [MediaCompressionQuality.MEDIUM]: {
    maxHeight: 720,
    crf: 24,
    maxBitrateKbps: 2000,
    audioBitrateKbps: 128,
  },
  [MediaCompressionQuality.MEDIUM_HIGH]: {
    maxHeight: 1080,
    crf: 23,
    maxBitrateKbps: 2500,
    audioBitrateKbps: 160,
  },
  [MediaCompressionQuality.HIGH]: {
    maxHeight: 1080,
    crf: 22,
    maxBitrateKbps: 4000,
    audioBitrateKbps: 192,
  },
  [MediaCompressionQuality.VERY_HIGH]: {
    maxHeight: 1080,
    crf: 20,
    maxBitrateKbps: 6000,
    audioBitrateKbps: 256,
  },
  [MediaCompressionQuality.MAX]: {
    maxHeight: 1440,
    crf: 18,
    maxBitrateKbps: 8000,
    audioBitrateKbps: 320,
  },
};

export const AUDIO_QUALITY_PRESETS: Record<
  MediaCompressionTargetQuality,
  { bitrateKbps: number }
> = {
  [MediaCompressionQuality.TINY]: { bitrateKbps: 64 },
  [MediaCompressionQuality.VERY_LOW]: { bitrateKbps: 80 },
  [MediaCompressionQuality.LOW]: { bitrateKbps: 96 },
  [MediaCompressionQuality.MEDIUM_LOW]: { bitrateKbps: 112 },
  [MediaCompressionQuality.MEDIUM]: { bitrateKbps: 128 },
  [MediaCompressionQuality.MEDIUM_HIGH]: { bitrateKbps: 160 },
  [MediaCompressionQuality.HIGH]: { bitrateKbps: 192 },
  [MediaCompressionQuality.VERY_HIGH]: { bitrateKbps: 256 },
  [MediaCompressionQuality.MAX]: { bitrateKbps: 320 },
};

export type VideoOutputFormat = {
  extension: string;
  mimeType: string;
  videoCodec: string;
  audioCodec: string;
};

export const VIDEO_OUTPUT_FORMATS: Record<
  VideoOutputExtension,
  VideoOutputFormat
> = {
  [VideoOutputExtension.MP4]: {
    extension: ".mp4",
    mimeType: "video/mp4",
    videoCodec: "libx264",
    audioCodec: "aac",
  },
  [VideoOutputExtension.M4V]: {
    extension: ".m4v",
    mimeType: "video/x-m4v",
    videoCodec: "libx264",
    audioCodec: "aac",
  },
  [VideoOutputExtension.WEBM]: {
    extension: ".webm",
    mimeType: "video/webm",
    videoCodec: "libvpx-vp9",
    audioCodec: "libopus",
  },
  [VideoOutputExtension.MKV]: {
    extension: ".mkv",
    mimeType: "video/x-matroska",
    videoCodec: "libx264",
    audioCodec: "aac",
  },
  [VideoOutputExtension.MOV]: {
    extension: ".mov",
    mimeType: "video/quicktime",
    videoCodec: "libx264",
    audioCodec: "aac",
  },
  [VideoOutputExtension.AVI]: {
    extension: ".avi",
    mimeType: "video/x-msvideo",
    videoCodec: "libx264",
    audioCodec: "mp3",
  },
  [VideoOutputExtension.TS]: {
    extension: ".ts",
    mimeType: "video/mp2t",
    videoCodec: "libx264",
    audioCodec: "aac",
  },
  [VideoOutputExtension.FLV]: {
    extension: ".flv",
    mimeType: "video/x-flv",
    videoCodec: "libx264",
    audioCodec: "aac",
  },
};

export type AudioOutputFormat = {
  extension: string;
  mimeType: string;
  audioCodec: string;
};

export const AUDIO_OUTPUT_FORMATS: Record<
  AudioOutputExtension,
  AudioOutputFormat
> = {
  [AudioOutputExtension.MP3]: {
    extension: ".mp3",
    mimeType: "audio/mpeg",
    audioCodec: "libmp3lame",
  },
  [AudioOutputExtension.M4A]: {
    extension: ".m4a",
    mimeType: "audio/mp4",
    audioCodec: "aac",
  },
  [AudioOutputExtension.AAC]: {
    extension: ".aac",
    mimeType: "audio/aac",
    audioCodec: "aac",
  },
  [AudioOutputExtension.OGG]: {
    extension: ".ogg",
    mimeType: "audio/ogg",
    audioCodec: "libvorbis",
  },
  [AudioOutputExtension.OPUS]: {
    extension: ".opus",
    mimeType: "audio/opus",
    audioCodec: "libopus",
  },
  [AudioOutputExtension.FLAC]: {
    extension: ".flac",
    mimeType: "audio/flac",
    audioCodec: "flac",
  },
  [AudioOutputExtension.WAV]: {
    extension: ".wav",
    mimeType: "audio/wav",
    audioCodec: "pcm_s16le",
  },
  [AudioOutputExtension.WEBM_AUDIO]: {
    extension: ".webm",
    mimeType: "audio/webm",
    audioCodec: "libopus",
  },
  [AudioOutputExtension.WMA]: {
    extension: ".wma",
    mimeType: "audio/x-ms-wma",
    audioCodec: "wmav2",
  },
};

export const VIDEO_HEIGHT_QUALITY_THRESHOLDS: Array<{
  maxHeight: number;
  quality: MediaCompressionQuality;
}> = [
  { maxHeight: 360, quality: MediaCompressionQuality.TINY },
  { maxHeight: 480, quality: MediaCompressionQuality.VERY_LOW },
  { maxHeight: 540, quality: MediaCompressionQuality.LOW },
  { maxHeight: 720, quality: MediaCompressionQuality.MEDIUM_LOW },
  { maxHeight: 900, quality: MediaCompressionQuality.MEDIUM },
  { maxHeight: 1080, quality: MediaCompressionQuality.MEDIUM_HIGH },
  { maxHeight: 1200, quality: MediaCompressionQuality.HIGH },
  { maxHeight: 1440, quality: MediaCompressionQuality.VERY_HIGH },
];

export const VIDEO_BITRATE_QUALITY_THRESHOLDS_KBPS: Array<{
  maxBitrateKbps: number;
  quality: MediaCompressionQuality;
}> = [
  { maxBitrateKbps: 450, quality: MediaCompressionQuality.TINY },
  { maxBitrateKbps: 750, quality: MediaCompressionQuality.VERY_LOW },
  { maxBitrateKbps: 1100, quality: MediaCompressionQuality.LOW },
  { maxBitrateKbps: 1400, quality: MediaCompressionQuality.MEDIUM_LOW },
  { maxBitrateKbps: 2200, quality: MediaCompressionQuality.MEDIUM },
  { maxBitrateKbps: 2800, quality: MediaCompressionQuality.MEDIUM_HIGH },
  { maxBitrateKbps: 4500, quality: MediaCompressionQuality.HIGH },
  { maxBitrateKbps: 6500, quality: MediaCompressionQuality.VERY_HIGH },
];

export const AUDIO_BITRATE_QUALITY_THRESHOLDS_KBPS: Array<{
  maxBitrateKbps: number;
  quality: MediaCompressionQuality;
}> = [
  { maxBitrateKbps: 72, quality: MediaCompressionQuality.TINY },
  { maxBitrateKbps: 88, quality: MediaCompressionQuality.VERY_LOW },
  { maxBitrateKbps: 104, quality: MediaCompressionQuality.LOW },
  { maxBitrateKbps: 120, quality: MediaCompressionQuality.MEDIUM_LOW },
  { maxBitrateKbps: 140, quality: MediaCompressionQuality.MEDIUM },
  { maxBitrateKbps: 176, quality: MediaCompressionQuality.MEDIUM_HIGH },
  { maxBitrateKbps: 220, quality: MediaCompressionQuality.HIGH },
  { maxBitrateKbps: 290, quality: MediaCompressionQuality.VERY_HIGH },
];
