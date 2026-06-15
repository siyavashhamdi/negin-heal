import { gql } from "@apollo/client";

export const APP_SETTING_KEY_LIST_QUERY = gql`
  query AppSettingKeyList($input: AppSettingKeyListGqlInput!) {
    appSettingKeyList(input: $input) {
      items {
        id
        key
        label
        valueType
        description
        isActive
        createdAt
        updatedAt
      }
      pagination {
        limit
        skip
        total
        count
      }
    }
  }
`;
