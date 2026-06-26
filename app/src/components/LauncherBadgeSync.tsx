import { useEffect, type ReactElement } from "react";
import { App } from "@capacitor/app";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@apollo/client/react";
import { BADGE_COUNT_QUERY } from "../graphql/queries/badgeCount.query";
import { subscribeBadgeCountUpdates } from "../lib/badge-count-update-listeners";
import { clearLauncherBadgeCount, syncLauncherBadgeCount } from "../native/launcherBadge";
import { isAndroidApp } from "../utils/androidAppDownload.util";

type BadgeCountQuery = {
  readonly badgeCount: {
    readonly notifications: number | null;
  };
};

/**
 * Keeps the Android launcher icon badge in sync with unread notification count.
 */
export function LauncherBadgeSync(): ReactElement | null {
  const { isAuthenticated } = useAuth();
  const { data, refetch } = useQuery<BadgeCountQuery>(BADGE_COUNT_QUERY, {
    skip: !isAuthenticated || !isAndroidApp(),
    fetchPolicy: "cache-and-network",
  });

  const notificationBadgeCount = data?.badgeCount.notifications ?? 0;

  useEffect(() => {
    if (!isAuthenticated || !isAndroidApp()) {
      return;
    }

    return subscribeBadgeCountUpdates(() => {
      void refetch();
    });
  }, [isAuthenticated, refetch]);

  useEffect(() => {
    if (!isAuthenticated || !isAndroidApp()) {
      return;
    }

    const listenerPromise = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        void refetch();
      }
    });

    return () => {
      void listenerPromise.then((listener) => listener.remove());
    };
  }, [isAuthenticated, refetch]);

  useEffect(() => {
    if (!isAuthenticated) {
      void clearLauncherBadgeCount();
      return;
    }

    void syncLauncherBadgeCount(notificationBadgeCount);
  }, [isAuthenticated, notificationBadgeCount]);

  return null;
}
