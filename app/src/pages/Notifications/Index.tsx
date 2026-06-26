import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { Alert, Button, CircularProgress, Skeleton, Stack } from "@mui/material";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";

import { GENERAL_SUBSCRIPTION_UPDATE_TYPES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeGeneralUpdates } from "../../lib/general-updates-listeners";
import {
  consumePendingNotificationListRefetch,
  subscribeNotificationListRefetch,
} from "../../lib/notification-list-refetch-listeners";
import { useTranslation } from "../../hooks/useTranslation";
import { LoginRequiredState } from "../../shared/auth/LoginRequiredState";
import NotificationCard from "./NotificationCard";
import NotificationFilterTabs from "./NotificationFilterTabs";
import type { NotificationFilterTab } from "./notifications-list.api";
import { useNotificationList } from "./useNotificationList";
import styles from "./styles/notifications.module.scss";

const NotificationsContent = (): ReactElement => {
  const { t } = useTranslation();
  const {
    activeTab,
    setActiveTab,
    items,
    loading,
    isFetchingMore,
    error,
    refetch,
    loadMoreRef,
    markAsRead,
    markAsUnread,
    archive,
    unarchive,
    markAllLoadedAsRead,
    canMarkAllAsRead,
    isUpdating,
  } = useNotificationList();
  const feedRef = useRef<HTMLDivElement>(null);
  const [feedMinHeight, setFeedMinHeight] = useState<number | undefined>();

  const handleTabChange = useCallback(
    (tab: NotificationFilterTab) => {
      if (feedRef.current) {
        setFeedMinHeight(feedRef.current.offsetHeight);
      }
      setActiveTab(tab);
    },
    [setActiveTab]
  );

  useEffect(() => {
    if (!loading) {
      setFeedMinHeight(undefined);
    }
  }, [loading, activeTab]);

  useEffect(() => {
    return subscribeGeneralUpdates((update) => {
      if (update.updateType === GENERAL_SUBSCRIPTION_UPDATE_TYPES.NOTIFICATION) {
        void refetch();
      }
    });
  }, [refetch]);

  useEffect(() => {
    if (consumePendingNotificationListRefetch()) {
      void refetch();
    }
  }, [refetch]);

  useEffect(() => {
    return subscribeNotificationListRefetch(() => {
      void refetch();
    });
  }, [refetch]);

  const emptyMessageKey = `pages.notifications.empty.${activeTab}` as const;

  return (
    <section className={styles.page}>
      <NotificationFilterTabs activeTab={activeTab} onChange={handleTabChange} />

      {canMarkAllAsRead ? (
        <Button
          size="small"
          variant="outlined"
          fullWidth
          className={styles.markAllReadButton}
          startIcon={<DoneAllOutlinedIcon fontSize="small" />}
          disabled={isUpdating || loading}
          onClick={() => void markAllLoadedAsRead()}
        >
          {t("pages.notifications.markAllRead")}
        </Button>
      ) : null}

      {error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              {t("pages.notifications.retry")}
            </Button>
          }
        >
          {t("pages.notifications.loadError")}
        </Alert>
      ) : null}

      <div
        ref={feedRef}
        className={styles.feed}
        role="feed"
        aria-busy={loading || isFetchingMore}
        style={feedMinHeight ? { minHeight: feedMinHeight } : undefined}
      >
        {loading ? (
          <Stack spacing={1.2}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={`notification-skeleton-${index}`}
                variant="rounded"
                height={132}
                className={styles.skeleton}
              />
            ))}
          </Stack>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <InboxOutlinedIcon />
            </div>
            <h2>{t(emptyMessageKey)}</h2>
            <p>{t("pages.notifications.emptyHint")}</p>
          </div>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className={styles.list}>
            {items.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={(id) => void markAsRead(id)}
                onMarkUnread={(id) => void markAsUnread(id)}
                onArchive={(id) => void archive(id)}
                onUnarchive={(id) => void unarchive(id)}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        ) : null}

        <div ref={loadMoreRef} className={styles.loadMoreSentinel} aria-hidden="true" />

        {isFetchingMore ? (
          <div className={styles.loadMoreState}>
            <CircularProgress size={22} />
            <span>{t("pages.notifications.loadingMore")}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
};

const Notifications = (): ReactElement => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  if (!isAuthenticated) {
    return (
      <LoginRequiredState
        eyebrow={t("pages.notifications.eyebrow")}
        title={t("pages.notifications.loginRequired.title")}
        description={t("pages.notifications.loginRequired.description")}
        icon={<NotificationsNoneRoundedIcon />}
      />
    );
  }

  return <NotificationsContent />;
};

export default Notifications;
