import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { Alert, Button, CircularProgress, Skeleton, Stack } from "@mui/material";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";

import { GENERAL_SUBSCRIPTION_UPDATE_TYPES } from "../../constants";
import { useGeneralUpdatesSubscription } from "../../hooks/useGeneralUpdatesSubscription";
import { useTranslation } from "../../hooks/useTranslation";
import NotificationCard from "./NotificationCard";
import NotificationFilterTabs from "./NotificationFilterTabs";
import type { NotificationFilterTab } from "./notifications-list.api";
import { useNotificationList } from "./useNotificationList";
import styles from "./styles/notifications.module.scss";

const Notifications = (): ReactElement => {
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
    [setActiveTab],
  );

  useEffect(() => {
    if (!loading) {
      setFeedMinHeight(undefined);
    }
  }, [loading, activeTab]);

  useGeneralUpdatesSubscription({
    enabled: true,
    updateTypes: [GENERAL_SUBSCRIPTION_UPDATE_TYPES.NOTIFICATION],
    onNotification: () => {
      refetch();
    },
  });

  const emptyMessageKey = `pages.notifications.empty.${activeTab}` as const;

  return (
    <section className={styles.page}>
      <NotificationFilterTabs
        activeTab={activeTab}
        onChange={handleTabChange}
      />

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

export default Notifications;
