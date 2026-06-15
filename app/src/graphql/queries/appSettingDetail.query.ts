import { gql } from "@apollo/client";

export const APP_SETTING_DETAIL_QUERY = gql`
  query AppSettingDetail($input: AppSettingDetailGqlInput!) {
    appSettingDetail(input: $input) {
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
