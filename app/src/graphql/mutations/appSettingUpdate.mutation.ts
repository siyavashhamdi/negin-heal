import { gql } from "@apollo/client";

export const APP_SETTING_UPDATE_MUTATION = gql`
  mutation AppSettingUpdate($input: AppSettingUpdateGqlInput!) {
    appSettingUpdate(input: $input) {
      id
      key
      label
      valueType
      value
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;
