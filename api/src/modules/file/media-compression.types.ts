import {
  AudioOutputExtension,
  MediaCodecFamily,
  MediaCompressionQuality,
  MediaCompressionSkipReason,
  MediaType,
  VideoOutputExtension,
} from "../../enums";
import { FileUploadGqlResponse } from "./graphql/responses";

export type MediaCompressionTrimInput = {
  startSeconds?: number | null;
  endSeconds?: number | null;
};

export type MediaCompressionTrimState = {
  requested: {
    startSeconds: number | null;
    endSeconds: number | null;
  };
  applied: {
    startSeconds: number;
    endSeconds: number;
    durationSeconds: number;
  };
};

export type MediaProbeProfile = {
  mediaType: MediaType;
  durationSeconds: number;
  codec: string;
  codecFamily: MediaCodecFamily;
  bitrateKbps: number | null;
  width: number;
  height: number;
  quality: MediaCompressionQuality;
};

export type MediaCompressionEncodeRequest = {
  sourceFileId: string;
  targetQuality: MediaCompressionQuality;
  videoOutputExtension?: VideoOutputExtension | null;
  audioOutputExtension?: AudioOutputExtension | null;
  trim?: MediaCompressionTrimInput | null;
};

export type MediaCompressionEncodeResult = {
  durationMs: number;
  previousQuality: MediaCompressionQuality;
  currentQuality: MediaCompressionQuality;
  mediaType: MediaType;
  wasCompressed: boolean;
  skipReason: MediaCompressionSkipReason;
  previousFileId: string;
  fileId: string;
  file: FileUploadGqlResponse;
  trim: MediaCompressionTrimState;
  previousSizeBytes: number;
  currentSizeBytes: number;
  compressionRatio: number;
  previousExtension: string;
  currentExtension: string;
  previousCodec: string;
  currentCodec: string;
  previousCodecFamily: MediaCodecFamily;
  currentCodecFamily: MediaCodecFamily;
  previousBitrateKbps: number | null;
  currentBitrateKbps: number | null;
  previousResolution: { width: number; height: number };
  currentResolution: { width: number; height: number };
  mediaDurationSeconds: number;
};

export type FfprobeStream = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  bit_rate?: string;
  sample_rate?: string;
  channels?: number;
};

export type FfprobeResult = {
  format?: {
    duration?: string;
    bit_rate?: string;
  };
  streams?: FfprobeStream[];
};
