import { useQuery, type QueryResult } from "@apollo/client/react";
import { LOCAL_STORAGE_KEYS } from "../constants";
import { USER_ME_QUERY } from "../graphql/queries/userMe.query";
import type { UserMeGqlResponse } from "../lib/graphql/generated/graphql";

export interface UserMeResponse {
  me: UserMeGqlResponse;
}

export type UseMeResult = Pick<QueryResult<UserMeResponse>, "loading" | "error" | "refetch"> & {
  readonly user: UserMeGqlResponse | null;
};

/**
 * Current user from `USER_ME_QUERY` (`errorPolicy: "all"`, `cache-and-network`).
 */
export const useMe = (): UseMeResult => {
  const hasAccessToken = Boolean(localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN));
  const { data, loading, error, refetch } = useQuery<UserMeResponse>(USER_ME_QUERY, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    skip: !hasAccessToken,
  });

  return {
    user: data?.me ?? null,
    loading: hasAccessToken ? loading : false,
    error,
    refetch,
  };
};
