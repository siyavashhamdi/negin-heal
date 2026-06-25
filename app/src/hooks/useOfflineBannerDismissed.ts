import { useSyncExternalStore } from "react";
import {
  dismissOfflineBanner,
  isOfflineBannerDismissed,
  subscribeOfflineBannerDismiss,
} from "../lib/offline-state";

export function useOfflineBannerDismissed(): {
  readonly dismissed: boolean;
  readonly dismiss: () => void;
} {
  const dismissed = useSyncExternalStore(
    subscribeOfflineBannerDismiss,
    isOfflineBannerDismissed,
    () => false
  );

  return { dismissed, dismiss: dismissOfflineBanner };
}
