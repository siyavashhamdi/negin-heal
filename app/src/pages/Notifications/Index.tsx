import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Alert, Button, CircularProgress, Skeleton, Stack } from "@mui/material";
import { type ReactElement, useCallback } from "react";

import { GENERAL_SUBSCRIPTION_UPDATE_TYPES } from "../../constants";
import { useGeneralUpdatesSubscription } from "../../hooks/useGeneralUpdatesSubscription";
import { useTranslation } from "../../hooks/useTranslation";
import NotificationCard from "./NotificationCard";
import NotificationFilterTabs from "./NotificationFilterTabs";
import { useNotificationList } from "./useNotificationList";
import styles from "./styles/notifications.module.scss";

const Notifications = (): ReactElement => {
  const { t } = useTranslation();
  const {
    activeTab,
    setActiveTab,
    items,
    totalCount,
    loading,
    isFetchingMore,
    error,
    refetch,
    hasNextPage,
    loadMoreRef,
    markAsRead,
    markAsUnread,
    archive,
    markAllLoadedAsRead,
    isUpdating,
    canMarkAllAsRead,
  } = useNotificationList();

  const handleMarkAllAsRead = useCallback(async (): Promise<void> => {
    await markAllLoadedAsRead();
  }, [markAllLoadedAsRead]);
  const shouldShowMarkAllAsRead = activeTab === "unread" && canMarkAllAsRead;

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
      <header className={styles.hero}>
        <div className={styles.heroIcon}>
          <NotificationsActiveRoundedIcon />
        </div>
        <div className={styles.heroContent}>
          <p>{t("pages.notifications.eyebrow")}</p>
          <h1>{t("pages.notifications.title")}</h1>
          <span>{t("pages.notifications.subtitle")}</span>
        </div>
        <div className={styles.heroActions}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshRoundedIcon />}
            onClick={refetch}
            disabled={loading || isUpdating}
          >
            {t("pages.notifications.refresh")}
          </Button>
          {shouldShowMarkAllAsRead ? (
            <Button
              variant="contained"
              size="small"
              startIcon={<DoneAllRoundedIcon />}
              onClick={() => void handleMarkAllAsRead()}
              disabled={isUpdating}
            >
              {t("pages.notifications.markAllRead")}
            </Button>
          ) : null}
        </div>
      </header>

      <NotificationFilterTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        totalCount={totalCount}
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

      <div className={styles.feed} role="feed" aria-busy={loading || isFetchingMore}>
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

        {!loading && items.length > 0 && !hasNextPage ? (
          <p className={styles.endMessage}>
            {t("pages.notifications.endMessage", {
              count: items.length,
            })}
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default Notifications;
