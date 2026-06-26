import { useCallback, useEffect, type ReactElement } from "react";
import { App } from "@capacitor/app";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@apollo/client/react";
import { GENERAL_SUBSCRIPTION_UPDATE_TYPES } from "../constants";
import { BADGE_COUNT_QUERY } from "../graphql/queries/badgeCount.query";
import { subscribeBadgeCountUpdates } from "../lib/badge-count-update-listeners";
import { subscribeGeneralUpdates } from "../lib/general-updates-listeners";
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

  const syncLauncherBadgeFromServer = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !isAndroidApp()) {
      return;
    }

    try {
      const result = await refetch();
      const count = result.data?.badgeCount.notifications ?? 0;
      await syncLauncherBadgeCount(count);
    } catch (error) {
      console.warn("[LauncherBadge] Failed to refetch badge count for launcher sync.", error);
    }
  }, [isAuthenticated, refetch]);

  useEffect(() => {
    if (!isAuthenticated || !isAndroidApp()) {
      return;
    }

    return subscribeBadgeCountUpdates(() => {
      void syncLauncherBadgeFromServer();
    });
  }, [isAuthenticated, syncLauncherBadgeFromServer]);

  useEffect(() => {
    if (!isAuthenticated || !isAndroidApp()) {
      return;
    }

    return subscribeGeneralUpdates((event) => {
      if (event.updateType === GENERAL_SUBSCRIPTION_UPDATE_TYPES.BADGE_COUNTS) {
        void syncLauncherBadgeFromServer();
      }
    });
  }, [isAuthenticated, syncLauncherBadgeFromServer]);

  useEffect(() => {
    if (!isAuthenticated || !isAndroidApp()) {
      return;
    }

    let debounceTimer: number | null = null;

    const listenerPromise = App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        return;
      }

      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
      }

      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        void syncLauncherBadgeFromServer();
      }, 500);
    });

    return () => {
      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
      }

      void listenerPromise.then((listener) => listener.remove());
    };
  }, [isAuthenticated, syncLauncherBadgeFromServer]);

  useEffect(() => {
    if (!isAuthenticated) {
      void clearLauncherBadgeCount();
      return;
    }

    void syncLauncherBadgeCount(notificationBadgeCount);
  }, [isAuthenticated, notificationBadgeCount]);

  return null;
}
