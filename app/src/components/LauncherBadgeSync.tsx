import { useEffect, type ReactElement } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@apollo/client/react";
import { BADGE_COUNT_QUERY } from "../graphql/queries/badgeCount.query";
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
  const { data } = useQuery<BadgeCountQuery>(BADGE_COUNT_QUERY, {
    skip: !isAuthenticated || !isAndroidApp(),
    fetchPolicy: "cache-and-network",
  });

  const notificationBadgeCount = data?.badgeCount.notifications ?? 0;

  useEffect(() => {
    if (!isAuthenticated) {
      void clearLauncherBadgeCount();
      return;
    }

    void syncLauncherBadgeCount(notificationBadgeCount);
  }, [isAuthenticated, notificationBadgeCount]);

  return null;
}
