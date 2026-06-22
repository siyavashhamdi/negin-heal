import { useQuery, type QueryResult } from "@apollo/client/react";
import { LOCAL_STORAGE_KEYS } from "../constants";
import { USER_ME_QUERY } from "../graphql/queries/userMe.query";
import {
  resolveFileAccessUrl,
  type FileAccessUrl,
} from "../utils/fileAccessUrl.util";

export type UserMeGqlResponse = {
  readonly id: string;
  readonly username: string;
  readonly roles: readonly string[];
  readonly status: string;
  readonly profile?: {
    readonly firstName?: string | null;
    readonly lastName?: string | null;
    readonly email?: string | null;
    readonly phoneNumber?: string | null;
    readonly avatarAccessUrl?: FileAccessUrl | null;
    readonly bio?: string | null;
  } | null;
  readonly preferences?: {
    readonly language?: string | null;
    readonly timezone?: string | null;
    readonly notificationsEnabled: boolean;
    readonly theme?: string | null;
  } | null;
  readonly verification: {
    readonly emailVerifiedAt?: string | null;
    readonly mobileVerifiedAt?: string | null;
  };
};

export interface UserMeResponse {
  me: UserMeGqlResponse;
}

export type UseMeResult = Pick<QueryResult<UserMeResponse>, "loading" | "error" | "refetch"> & {
  readonly user: UserMeGqlResponse | null;
  readonly avatarUrl: string | null;
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
    avatarUrl: resolveFileAccessUrl(data?.me?.profile?.avatarAccessUrl),
    loading: hasAccessToken ? loading : false,
    error,
    refetch,
  };
};
