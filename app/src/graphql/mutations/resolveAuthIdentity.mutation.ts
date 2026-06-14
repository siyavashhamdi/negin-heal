import { gql } from "@apollo/client";

export const RESOLVE_AUTH_IDENTITY_MUTATION = gql`
  mutation ResolveAuthIdentity($input: UserRequestLoginCodeGqlInput!) {
    resolveAuthIdentity(input: $input) {
      exists
    }
  }
`;
