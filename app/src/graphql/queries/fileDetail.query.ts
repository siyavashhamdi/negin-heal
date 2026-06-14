import { gql } from "@apollo/client";

export const FILE_DETAIL_QUERY = gql`
  query FileDetail($input: FileDetailGqlInput!) {
    fileDetail(input: $input) {
      id
      name
      mimeType
      sizeBytes
      path
      uploadedAt
      accessUrl
    }
  }
`;
