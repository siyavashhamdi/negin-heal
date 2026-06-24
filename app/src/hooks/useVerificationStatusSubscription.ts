import { useApolloClient } from "@apollo/client/react";
import { useEffect, useRef } from "react";
import type { ApolloClient, NormalizedCacheObject } from "@apollo/client/core";

import { GENERAL_SUBSCRIPTION_UPDATE_TYPES } from "../constants";
import type { VerificationStatusSubscriptionPayload } from "../constants/verification-status-subscription.constants";
import { USER_ME_QUERY } from "../graphql/queries/userMe.query";
import type { UserMeResponse } from "../hooks/useMe";
import { subscribeGeneralUpdates } from "../lib/general-updates-listeners";
import { parseVerificationStatusSubscriptionPayload } from "../utilities/verification-status-update.util";

interface UseVerificationStatusSubscriptionOptions {
  readonly enabled: boolean;
  readonly onVerificationStatus?: (verification: VerificationStatusSubscriptionPayload) => void;
}

export function applyVerificationStatusToMeCache(
  client: ApolloClient<NormalizedCacheObject>,
  verification: VerificationStatusSubscriptionPayload
): void {
  client.cache.updateQuery<UserMeResponse>({ query: USER_ME_QUERY }, (existing) => {
    if (!existing?.me) {
      return existing;
    }

    return {
      ...existing,
      me: {
        ...existing.me,
        verification: {
          emailVerifiedAt: verification.emailVerifiedAt ?? null,
          mobileVerifiedAt: verification.mobileVerifiedAt ?? null,
        },
      },
    };
  });
}

/**
 * Listens for `VERIFICATION_STATUS` general subscription events and keeps the
 * cached `me` query in sync. Optional callback runs after cache is updated.
 */
export const useVerificationStatusSubscription = ({
  enabled,
  onVerificationStatus,
}: UseVerificationStatusSubscriptionOptions): void => {
  const client = useApolloClient();
  const onVerificationStatusRef = useRef(onVerificationStatus);

  useEffect(() => {
    onVerificationStatusRef.current = onVerificationStatus;
  }, [onVerificationStatus]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return subscribeGeneralUpdates((update) => {
      if (update.updateType !== GENERAL_SUBSCRIPTION_UPDATE_TYPES.VERIFICATION_STATUS) {
        return;
      }

      const verification = parseVerificationStatusSubscriptionPayload(update.payload);
      if (!verification) {
        return;
      }

      applyVerificationStatusToMeCache(client, verification);
      onVerificationStatusRef.current?.(verification);
    });
  }, [client, enabled]);
};
