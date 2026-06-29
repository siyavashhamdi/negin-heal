export const MEDIA_COMPRESSION_TARGET_QUALITIES = [
  "TINY",
  "VERY_LOW",
  "LOW",
  "MEDIUM_LOW",
  "MEDIUM",
  "MEDIUM_HIGH",
  "HIGH",
  "VERY_HIGH",
  "MAX",
] as const;

export type MediaCompressionTargetQuality = (typeof MEDIA_COMPRESSION_TARGET_QUALITIES)[number];

export const MEDIA_COMPRESSION_QUALITY_LABELS: Record<
  MediaCompressionTargetQuality | "ORIGINAL",
  string
> = {
  TINY: "بسیار کم (۳۶۰p / ۶۴kbps)",
  VERY_LOW: "خیلی کم (۴۸۰p / ۸۰kbps)",
  LOW: "کم (۵۴۰p / ۹۶kbps)",
  MEDIUM_LOW: "متوسط-کم (۷۲۰p / ۱۱۲kbps)",
  MEDIUM: "متوسط (۷۲۰p / ۱۲۸kbps)",
  MEDIUM_HIGH: "متوسط-زیاد (۱۰۸۰p / ۱۶۰kbps)",
  HIGH: "زیاد (۱۰۸۰p / ۱۹۲kbps)",
  VERY_HIGH: "خیلی زیاد (۱۰۸۰p / ۲۵۶kbps)",
  MAX: "حداکثر (۱۴۴۰p / ۳۲۰kbps)",
  ORIGINAL: "اصلی (بدون تغییر سطح)",
};

export const VIDEO_OUTPUT_EXTENSION_OPTIONS = [
  "MP4",
  "M4V",
  "WEBM",
  "MKV",
  "MOV",
  "AVI",
  "TS",
  "FLV",
] as const;

export type VideoOutputExtensionOption = (typeof VIDEO_OUTPUT_EXTENSION_OPTIONS)[number];

export const VIDEO_OUTPUT_EXTENSION_LABELS: Record<VideoOutputExtensionOption, string> = {
  MP4: "MP4",
  M4V: "M4V",
  WEBM: "WebM",
  MKV: "MKV",
  MOV: "MOV",
  AVI: "AVI",
  TS: "TS",
  FLV: "FLV",
};

export const AUDIO_OUTPUT_EXTENSION_OPTIONS = [
  "MP3",
  "M4A",
  "AAC",
  "OGG",
  "OPUS",
  "FLAC",
  "WAV",
  "WEBM_AUDIO",
  "WMA",
] as const;

export type AudioOutputExtensionOption = (typeof AUDIO_OUTPUT_EXTENSION_OPTIONS)[number];

export const AUDIO_OUTPUT_EXTENSION_LABELS: Record<AudioOutputExtensionOption, string> = {
  MP3: "MP3",
  M4A: "M4A",
  AAC: "AAC",
  OGG: "OGG",
  OPUS: "OPUS",
  FLAC: "FLAC",
  WAV: "WAV",
  WEBM_AUDIO: "WEBM",
  WMA: "WMA",
};

export const MEDIA_COMPRESSION_SKIP_REASON_LABELS: Record<string, string> = {
  NONE: "فشرده‌سازی انجام شد",
  ALREADY_AT_TARGET: "فایل از قبل در سطح کیفیت هدف است",
  ALREADY_BELOW_TARGET: "فایل از قبل فشرده‌تر از هدف است",
  OUTPUT_NOT_SMALLER: "خروجی کوچک‌تر از فایل فعلی نبود",
  FILE_TOO_SMALL: "فایل برای فشرده‌سازی بسیار کوچک است",
};

export const MEDIA_TYPE_LABELS: Record<string, string> = {
  VIDEO: "ویدیو",
  AUDIO: "صوت",
};
