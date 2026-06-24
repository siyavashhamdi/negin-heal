import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";

import { USER_LIST_QUERY } from "../../graphql/queries/userList.query";
import { useDebounce } from "../../hooks/useDebounce";
import {
  type UserListQuery,
  type UserListQueryVariables,
} from "../../pages/UsersManagement/users-management-list.api";
import {
  ACTIVE_END_USER_DEFAULT_OPTIONS_LIMIT,
  ACTIVE_END_USER_SEARCH_OPTIONS_LIMIT,
  mapActiveEndUserListItems,
  type ActiveEndUserOption,
} from "./active-end-user.util";

type UseActiveEndUserSearchOptions = {
  readonly value: ActiveEndUserOption | null;
  readonly onChange: (value: ActiveEndUserOption | null) => void;
  readonly enabled?: boolean;
};

export function useActiveEndUserSearch({
  value,
  onChange,
  enabled = true,
}: UseActiveEndUserSearchOptions) {
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 400);

  const variables = useMemo<UserListQueryVariables>(() => {
    const query = debouncedSearch.trim();
    return {
      input: {
        filters: {
          query: query || null,
          role: "END_USER",
          status: "ACTIVE",
        },
        options: {
          limit: query
            ? ACTIVE_END_USER_SEARCH_OPTIONS_LIMIT
            : ACTIVE_END_USER_DEFAULT_OPTIONS_LIMIT,
          skip: 0,
          sort: { createdAt: "DESC" },
        },
      },
    };
  }, [debouncedSearch]);

  const { data, loading } = useQuery<UserListQuery, UserListQueryVariables>(USER_LIST_QUERY, {
    variables,
    fetchPolicy: "network-only",
    skip: !enabled,
  });

  const options = useMemo(() => mapActiveEndUserListItems(data?.userList.items ?? []), [data]);

  const handleInputChange = useCallback(
    (nextValue: string): void => {
      setSearch(nextValue);
      onChange(null);
    },
    [onChange]
  );

  const handleChange = useCallback(
    (nextValue: ActiveEndUserOption | null): void => {
      onChange(nextValue);
      if (nextValue) {
        setSearch("");
      }
    },
    [onChange]
  );

  return {
    options,
    loading,
    inputValue: value ? value.label : search,
    onInputChange: handleInputChange,
    onChange: handleChange,
  };
}
