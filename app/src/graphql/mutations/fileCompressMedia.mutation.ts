import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const FILE_COMPRESS_MEDIA_MUTATION = gql`
  mutation FileCompressMedia($input: FileCompressMediaGqlInput!) {
    fileCompressMedia(input: $input) {
      durationMs
      previousQuality
      currentQuality
      mediaType
      wasCompressed
      skipReason
      previousFileId
      fileId
      previousSizeBytes
      currentSizeBytes
      compressionRatio
      previousExtension
      currentExtension
      previousCodec
      currentCodec
      previousCodecFamily
      currentCodecFamily
      previousBitrateKbps
      currentBitrateKbps
      previousResolution {
        width
        height
      }
      currentResolution {
        width
        height
      }
      mediaDurationSeconds
      trim {
        requested {
          startSeconds
          endSeconds
        }
        applied {
          startSeconds
          endSeconds
          durationSeconds
        }
      }
      file {
        name
        mimeType
        sizeBytes
        path
        uploadedAt
        accessUrl {
          ${FILE_ACCESS_URL_FIELDS}
        }
      }
    }
  }
`;
