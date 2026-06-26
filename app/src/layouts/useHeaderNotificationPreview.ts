import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { USER_NOTIFICATION_UPDATE_MUTATION } from "../graphql/mutations/userNotificationUpdate.mutation";
import { USER_NOTIFICATION_LIST_QUERY } from "../graphql/queries/userNotificationList.query";
import { useSnackbar } from "../hooks/useSnackbar";
import { useTranslation } from "../hooks/useTranslation";
import {
  buildNotificationListQueryVariables,
  mapNotificationListRowToRecord,
  type NotificationListQuery,
  type NotificationListQueryVariables,
  type NotificationUpdateMutation,
  type NotificationUpdateMutationVariables,
} from "../pages/Notifications/notifications-list.api";
import { showErrorIfNotQueued } from "../utilities/graphql-error.util";
import { notifyBadgeCountUpdateListeners } from "../lib/badge-count-update-listeners";

const HEADER_NOTIFICATION_PREVIEW_LIMIT = 5;

export type HeaderNotificationPreviewItem = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly timeLabel: string;
};

type UseHeaderNotificationPreviewResult = {
  readonly items: readonly HeaderNotificationPreviewItem[];
  readonly upsertLiveItem: (item: HeaderNotificationPreviewItem) => void;
  readonly markAllAsRead: () => Promise<void>;
  readonly canMarkAllAsRead: boolean;
  readonly isMarkingAllAsRead: boolean;
};

function formatHeaderNotificationTimeLabel(value: string | null | undefined): string {
  if (!value) {
    return "همین الان";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "همین الان";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) {
    return "همین الان";
  }

  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function mapPreviewItem(
  row: NotificationListQuery["userNotificationList"]["items"][number]
): HeaderNotificationPreviewItem {
  const record = mapNotificationListRowToRecord(row);
  return {
    id: record.id,
    title: record.title,
    description: record.message,
    timeLabel: formatHeaderNotificationTimeLabel(record.createdAt),
  };
}

export function useHeaderNotificationPreview(enabled: boolean): UseHeaderNotificationPreviewResult {
  const { t } = useTranslation();
  const { showError, showSuccess } = useSnackbar();
  const [liveItems, setLiveItems] = useState<readonly HeaderNotificationPreviewItem[]>([]);

  const listVariables = useMemo(
    () => buildNotificationListQueryVariables("unread", HEADER_NOTIFICATION_PREVIEW_LIMIT, null),
    []
  );

  const { data, refetch } = useQuery<NotificationListQuery, NotificationListQueryVariables>(
    USER_NOTIFICATION_LIST_QUERY,
    {
      variables: listVariables,
      skip: !enabled,
      fetchPolicy: "cache-and-network",
    }
  );

  const [updateNotifications, updateResult] = useMutation<
    NotificationUpdateMutation,
    NotificationUpdateMutationVariables
  >(USER_NOTIFICATION_UPDATE_MUTATION, {
    onError: (mutationError) => {
      showErrorIfNotQueued(showError, mutationError);
    },
  });

  const fetchedItems = useMemo(
    () => (data?.userNotificationList.items ?? []).map(mapPreviewItem),
    [data]
  );

  useEffect(() => {
    setLiveItems(fetchedItems);
  }, [fetchedItems]);

  const items = useMemo(() => {
    const byId = new Map<string, HeaderNotificationPreviewItem>();
    for (const item of liveItems) {
      byId.set(item.id, item);
    }
    return [...byId.values()].slice(0, 20);
  }, [liveItems]);

  const upsertLiveItem = useCallback((item: HeaderNotificationPreviewItem): void => {
    setLiveItems((previous) => {
      const next = [item, ...previous.filter((entry) => entry.id !== item.id)];
      return next.slice(0, 20);
    });
  }, []);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    const unreadIds = items.map((item) => item.id);
    if (unreadIds.length === 0) {
      return;
    }

    const result = await updateNotifications({
      variables: {
        input: {
          notificationIds: unreadIds,
          action: "SET_AS_READ",
        },
      },
    });

    const modifiedCount = result.data?.userNotificationUpdate.modifiedCount ?? 0;
    if (modifiedCount > 0) {
      showSuccess(t("pages.notifications.markAllReadSuccess"));
      setLiveItems([]);
      notifyBadgeCountUpdateListeners();
      void refetch();
    }
  }, [items, refetch, showSuccess, t, updateNotifications]);

  return {
    items,
    upsertLiveItem,
    markAllAsRead,
    canMarkAllAsRead: items.length > 0,
    isMarkingAllAsRead: updateResult.loading,
  };
}
