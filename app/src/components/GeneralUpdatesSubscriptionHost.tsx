import { useMemo, type ReactElement } from "react";
import { GENERAL_SUBSCRIPTION_UPDATE_TYPES } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { useGeneralUpdatesSubscription } from "../hooks/useGeneralUpdatesSubscription";
import { notifyGeneralUpdateListeners } from "../lib/general-updates-listeners";

/**
 * Keeps the general-updates GraphQL subscription active for all app-shell users,
 * including guests without a user id.
 */
export function GeneralUpdatesSubscriptionHost(): ReactElement | null {
  const { user } = useAuth();
  const updateTypes = useMemo(
    () =>
      user
        ? [
            GENERAL_SUBSCRIPTION_UPDATE_TYPES.NOTIFICATION,
            GENERAL_SUBSCRIPTION_UPDATE_TYPES.BADGE_COUNTS,
            GENERAL_SUBSCRIPTION_UPDATE_TYPES.VERIFICATION_STATUS,
          ]
        : [GENERAL_SUBSCRIPTION_UPDATE_TYPES.NOTIFICATION],
    [user],
  );

  useGeneralUpdatesSubscription({
    enabled: true,
    updateTypes,
    onAnyUpdate: notifyGeneralUpdateListeners,
  });

  return null;
}
