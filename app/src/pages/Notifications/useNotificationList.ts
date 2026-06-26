import { NetworkStatus } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { USER_NOTIFICATION_LIST_QUERY } from "../../graphql/queries/userNotificationList.query";
import { USER_NOTIFICATION_UPDATE_MUTATION } from "../../graphql/mutations/userNotificationUpdate.mutation";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import { useBadgeCountFirstPageReload } from "../../hooks/useBadgeCountFirstPageReload";
import { useCursorScrollLoadMore } from "../../hooks/useCursorScrollLoadMore";
import { showErrorIfNotQueued } from "../../utilities/graphql-error.util";
import { notifyBadgeCountUpdateListeners } from "../../lib/badge-count-update-listeners";
import {
  buildNotificationListQueryVariables,
  mapNotificationListRowToRecord,
  mergeUpdatedNotificationRecords,
  NOTIFICATION_LIST_PAGE_SIZE,
  type NotificationFilterTab,
  type NotificationListQuery,
  type NotificationListQueryVariables,
  type NotificationRecord,
  type NotificationUpdateAction,
  type NotificationUpdateMutation,
  type NotificationUpdateMutationVariables,
} from "./notifications-list.api";

type UseNotificationListResult = {
  readonly activeTab: NotificationFilterTab;
  readonly setActiveTab: (tab: NotificationFilterTab) => void;
  readonly items: NotificationRecord[];
  readonly totalCount: number;
  readonly loading: boolean;
  readonly isFetchingMore: boolean;
  readonly error: unknown;
  readonly refetch: () => void;
  readonly hasNextPage: boolean;
  readonly loadMoreRef: RefObject<HTMLDivElement>;
  readonly markAsRead: (id: string) => Promise<void>;
  readonly markAsUnread: (id: string) => Promise<void>;
  readonly archive: (id: string) => Promise<void>;
  readonly unarchive: (id: string) => Promise<void>;
  readonly markAllLoadedAsRead: () => Promise<void>;
  readonly isUpdating: boolean;
  readonly canMarkAllAsRead: boolean;
  readonly isOnFirstPage: boolean;
};

export const useNotificationList = (): UseNotificationListResult => {
  const [activeTab, setActiveTab] = useState<NotificationFilterTab>("unread");
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [isOnFirstPage, setIsOnFirstPage] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    hasNextPage: false,
    endCursor: null as string | null,
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const fetchingMoreRef = useRef(false);

  const listVariables = useMemo(
    () => buildNotificationListQueryVariables(activeTab, NOTIFICATION_LIST_PAGE_SIZE, null),
    [activeTab]
  );

  useEffect(() => {
    setIsOnFirstPage(true);
    setItems([]);
    setPagination({
      total: 0,
      hasNextPage: false,
      endCursor: null,
    });
  }, [activeTab]);

  const { data, loading, error, fetchMore, refetch, networkStatus } = useQuery<
    NotificationListQuery,
    NotificationListQueryVariables
  >(USER_NOTIFICATION_LIST_QUERY, {
    variables: listVariables,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const { t } = useTranslation();
  const { showError, showSuccess } = useSnackbar();

  const [updateNotifications, updateResult] = useMutation<
    NotificationUpdateMutation,
    NotificationUpdateMutationVariables
  >(USER_NOTIFICATION_UPDATE_MUTATION, {
    onError: (mutationError) => {
      showErrorIfNotQueued(showError, mutationError);
    },
  });

  const isFetchingMore = networkStatus === NetworkStatus.fetchMore;
  const isInitialLoading =
    (loading || networkStatus === NetworkStatus.loading) && items.length === 0;

  useEffect(() => {
    const page = data?.userNotificationList;
    if (!page) {
      return;
    }

    if (networkStatus === NetworkStatus.loading || networkStatus === NetworkStatus.setVariables) {
      return;
    }

    setItems(page.items.map(mapNotificationListRowToRecord));
    setPagination({
      total: page.pagination.total,
      hasNextPage: page.pagination.hasNextPage,
      endCursor: page.pagination.endCursor ?? null,
    });
  }, [data, networkStatus]);

  const loadNextPage = useCallback(async (): Promise<boolean> => {
    const nextCursor = pagination.endCursor ?? items[items.length - 1]?.id ?? null;
    if (
      fetchingMoreRef.current ||
      loading ||
      isFetchingMore ||
      !pagination.hasNextPage ||
      !nextCursor
    ) {
      return false;
    }

    fetchingMoreRef.current = true;
    try {
      const result = await fetchMore({
        variables: {
          input: {
            ...listVariables.input,
            options: {
              ...listVariables.input.options,
              startCursor: nextCursor,
            },
          },
        },
        updateQuery: (previous, { fetchMoreResult }) => {
          if (!fetchMoreResult?.userNotificationList) {
            return previous;
          }

          const existingIds = new Set(previous.userNotificationList.items.map((item) => item.id));
          const newItems = fetchMoreResult.userNotificationList.items.filter(
            (item) => !existingIds.has(item.id)
          );

          return {
            userNotificationList: {
              items: [...previous.userNotificationList.items, ...newItems],
              pagination: fetchMoreResult.userNotificationList.pagination,
            },
          };
        },
      });

      if (!result.data?.userNotificationList) {
        return false;
      }

      setIsOnFirstPage(false);
      return true;
    } catch {
      return false;
    } finally {
      fetchingMoreRef.current = false;
    }
  }, [
    fetchMore,
    isFetchingMore,
    items,
    listVariables,
    loading,
    pagination.endCursor,
    pagination.hasNextPage,
  ]);

  useCursorScrollLoadMore({
    loadMoreRef,
    hasNextPage: pagination.hasNextPage,
    loadMore: loadNextPage,
  });

  const refetchList = useCallback((): void => {
    void refetch();
  }, [refetch]);

  useBadgeCountFirstPageReload({
    enabled: true,
    isOnFirstPage,
    reload: refetchList,
  });

  const applyMutationResult = useCallback(
    (result: NotificationUpdateMutation | undefined | null): void => {
      const payload = result?.userNotificationUpdate;
      if (!payload?.items?.length) {
        void refetch();
        return;
      }

      setItems((current) => mergeUpdatedNotificationRecords(current, payload.items, activeTab));
    },
    [activeTab, refetch]
  );

  const runUpdate = useCallback(
    async (
      notificationIds: string[],
      action: NotificationUpdateAction,
      successMessage?: string
    ): Promise<void> => {
      if (notificationIds.length === 0) {
        return;
      }

      const result = await updateNotifications({
        variables: {
          input: {
            notificationIds,
            action,
          },
        },
      });

      applyMutationResult(result.data);
      if (
        (action === "SET_AS_READ" || action === "SET_AS_UNREAD") &&
        (result.data?.userNotificationUpdate.modifiedCount ?? 0) > 0
      ) {
        notifyBadgeCountUpdateListeners();
      }
      if (successMessage) {
        showSuccess(successMessage);
      }
    },
    [applyMutationResult, showSuccess, updateNotifications]
  );

  const markAsRead = useCallback(
    async (id: string): Promise<void> => {
      await runUpdate([id], "SET_AS_READ");
    },
    [runUpdate]
  );

  const markAsUnread = useCallback(
    async (id: string): Promise<void> => {
      await runUpdate([id], "SET_AS_UNREAD");
    },
    [runUpdate]
  );

  const archive = useCallback(
    async (id: string): Promise<void> => {
      await runUpdate([id], "ARCHIVE");
    },
    [runUpdate]
  );

  const unarchive = useCallback(
    async (id: string): Promise<void> => {
      await runUpdate([id], "UNARCHIVE");
    },
    [runUpdate]
  );

  const actionableUnreadIds = useMemo(
    () =>
      items
        .filter((item) => item.isActionable && !item.isRead && !item.archivedAt)
        .map((item) => item.id),
    [items]
  );

  const markAllLoadedAsRead = useCallback(async (): Promise<void> => {
    await runUpdate(
      actionableUnreadIds,
      "SET_AS_READ",
      t("pages.notifications.markAllReadSuccess")
    );
  }, [actionableUnreadIds, runUpdate, t]);

  return {
    activeTab,
    setActiveTab,
    items,
    totalCount: pagination.total,
    loading: isInitialLoading,
    isFetchingMore,
    error,
    refetch: refetchList,
    hasNextPage: pagination.hasNextPage,
    loadMoreRef,
    markAsRead,
    markAsUnread,
    archive,
    unarchive,
    markAllLoadedAsRead,
    isUpdating: updateResult.loading,
    canMarkAllAsRead: actionableUnreadIds.length > 0,
    isOnFirstPage,
  };
};
