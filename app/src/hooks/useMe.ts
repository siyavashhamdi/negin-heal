import { useQuery, type QueryResult } from "@apollo/client/react";
import { LOCAL_STORAGE_KEYS } from "../constants";
import { FILE_DETAIL_QUERY } from "../graphql/queries/fileDetail.query";
import { USER_ME_QUERY } from "../graphql/queries/userMe.query";

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
    readonly avatarFileId?: string | null;
    readonly bio?: string | null;
  } | null;
  readonly preferences?: {
    readonly language?: string | null;
    readonly timezone?: string | null;
    readonly notificationsEnabled: boolean;
    readonly theme?: string | null;
  } | null;
};

export interface UserMeResponse {
  me: UserMeGqlResponse;
}

export type UseMeResult = Pick<QueryResult<UserMeResponse>, "loading" | "error" | "refetch"> & {
  readonly user: UserMeGqlResponse | null;
  readonly avatarUrl: string | null;
};

type FileDetailQueryResult = {
  fileDetail?: {
    id: string;
    accessUrl?: string | null;
  } | null;
};

type FileDetailQueryVariables = {
  input: {
    id: string;
  };
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
  const avatarFileId = data?.me?.profile?.avatarFileId?.trim();
  const { data: avatarData } = useQuery<FileDetailQueryResult, FileDetailQueryVariables>(
    FILE_DETAIL_QUERY,
    {
      variables: { input: { id: avatarFileId || "" } },
      skip: !hasAccessToken || !avatarFileId,
      fetchPolicy: "cache-first",
    }
  );
  const avatarFileDetail = avatarData?.fileDetail;
  let avatarUrl: string | null = null;
  if (avatarFileDetail && avatarFileDetail.id === avatarFileId) {
    avatarUrl = avatarFileDetail.accessUrl?.trim() || null;
  }

  return {
    user: data?.me ?? null,
    avatarUrl,
    loading: hasAccessToken ? loading : false,
    error,
    refetch,
  };
};
