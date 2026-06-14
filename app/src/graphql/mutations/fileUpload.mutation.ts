import { gql } from "@apollo/client";

export const FILE_UPLOAD_MUTATION = gql`
  mutation FileUpload($input: FileUploadGqlInput!) {
    fileUpload(input: $input) {
      id
      name
      mimeType
      sizeBytes
      path
      uploadedAt
    }
  }
`;
