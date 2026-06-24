import { useSubscription } from "@apollo/client/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GENERAL_SUBSCRIPTION_UPDATE_TYPES,
  type GeneralSubscriptionUpdateType,
} from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { GENERAL_UPDATES_SUBSCRIPTION } from "../graphql/subscriptions/generalUpdates.subscription";
import { subscribeGraphqlWsConnection } from "../lib/graphql-ws-client";
import { resolveSubscriptionRetryDelayMs } from "../lib/subscription-retry.util";
import { isRecoverableSubscriptionError } from "../lib/subscription-error.util";

export interface GeneralUpdateEvent {
  readonly updateType: GeneralSubscriptionUpdateType;
  readonly targetId?: string | null;
  readonly createdAt: string;
  readonly payload?: unknown;
}

interface GeneralUpdatesSubscriptionData {
  readonly generalUpdates: GeneralUpdateEvent;
}

interface GeneralUpdatesSubscriptionVariables {
  readonly updateTypes?: readonly GeneralSubscriptionUpdateType[];
}

interface UseGeneralUpdatesSubscriptionProps {
  readonly enabled: boolean;
  readonly updateTypes?: readonly GeneralSubscriptionUpdateType[];
  readonly onNotification?: (event: GeneralUpdateEvent) => void;
  readonly onBadgeCounts?: (event: GeneralUpdateEvent) => void;
  readonly onVerificationStatus?: (event: GeneralUpdateEvent) => void;
  readonly onAnyUpdate?: (event: GeneralUpdateEvent) => void;
}

interface SubscriptionCallbacks {
  readonly onNotification?: (event: GeneralUpdateEvent) => void;
  readonly onBadgeCounts?: (event: GeneralUpdateEvent) => void;
  readonly onVerificationStatus?: (event: GeneralUpdateEvent) => void;
  readonly onAnyUpdate?: (event: GeneralUpdateEvent) => void;
}

export const useGeneralUpdatesSubscription = ({
  enabled,
  updateTypes,
  onNotification,
  onBadgeCounts,
  onVerificationStatus,
  onAnyUpdate,
}: UseGeneralUpdatesSubscriptionProps): { readonly isOnline: boolean } => {
  const { isAuthenticated } = useAuth();
  const subscriptionActive = enabled && isAuthenticated;
  const [wsConnected, setWsConnected] = useState(false);
  const [subscriptionBroken, setSubscriptionBroken] = useState(false);
  const isOnline = subscriptionActive && wsConnected && !subscriptionBroken;
  const enabledRef = useRef(subscriptionActive);
  const restartRef = useRef<(() => void) | null>(null);
  const restartAttemptRef = useRef(0);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscriptionAliveRef = useRef(false);
  const callbacksRef = useRef<SubscriptionCallbacks>({
    onNotification,
    onBadgeCounts,
    onVerificationStatus,
    onAnyUpdate,
  });

  useEffect(() => {
    enabledRef.current = subscriptionActive;
    callbacksRef.current = {
      onNotification,
      onBadgeCounts,
      onVerificationStatus,
      onAnyUpdate,
    };
  }, [subscriptionActive, onNotification, onBadgeCounts, onVerificationStatus, onAnyUpdate]);

  useEffect(() => {
    if (isOnline) {
      restartAttemptRef.current = 0;
    }
  }, [isOnline]);

  useEffect(() => {
    return subscribeGraphqlWsConnection((connected) => {
      setWsConnected(connected);

      if (!connected) {
        subscriptionAliveRef.current = false;
      }
    });
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const scheduleSubscriptionRestart = useCallback(() => {
    if (!enabledRef.current || subscriptionAliveRef.current) {
      return;
    }

    clearRestartTimer();

    const delayMs = resolveSubscriptionRetryDelayMs(restartAttemptRef.current);
    restartAttemptRef.current += 1;

    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;

      if (!enabledRef.current || subscriptionAliveRef.current) {
        return;
      }

      setSubscriptionBroken(false);
      restartRef.current?.();
    }, delayMs);
  }, [clearRestartTimer]);

  const { restart } = useSubscription<
    GeneralUpdatesSubscriptionData,
    GeneralUpdatesSubscriptionVariables
  >(GENERAL_UPDATES_SUBSCRIPTION, {
    skip: !subscriptionActive,
    ignoreResults: true,
    variables: {
      updateTypes: updateTypes && updateTypes.length ? updateTypes : undefined,
    },
    onData: ({ data }) => {
      subscriptionAliveRef.current = true;
      setSubscriptionBroken(false);

      const update = data.data?.generalUpdates;
      if (!update) {
        return;
      }

      const callbacks = callbacksRef.current;
      callbacks.onAnyUpdate?.(update);

      switch (update.updateType) {
        case GENERAL_SUBSCRIPTION_UPDATE_TYPES.NOTIFICATION:
          callbacks.onNotification?.(update);
          break;
        case GENERAL_SUBSCRIPTION_UPDATE_TYPES.BADGE_COUNTS:
          callbacks.onBadgeCounts?.(update);
          break;
        case GENERAL_SUBSCRIPTION_UPDATE_TYPES.VERIFICATION_STATUS:
          callbacks.onVerificationStatus?.(update);
          break;
        default:
          break;
      }
    },
    onError: (error) => {
      subscriptionAliveRef.current = false;
      setSubscriptionBroken(true);

      if (!enabledRef.current || !isRecoverableSubscriptionError(error)) {
        return;
      }

      scheduleSubscriptionRestart();
    },
    onComplete: () => {
      subscriptionAliveRef.current = false;
      setSubscriptionBroken(true);

      if (enabledRef.current) {
        scheduleSubscriptionRestart();
      }
    },
  });

  useEffect(() => {
    restartRef.current = restart;
  }, [restart]);

  useEffect(() => {
    setSubscriptionBroken(false);
    subscriptionAliveRef.current = false;

    if (!subscriptionActive) {
      clearRestartTimer();
      restartAttemptRef.current = 0;
      return;
    }

    const recoverDeadSubscription = (): void => {
      if (
        !enabledRef.current ||
        subscriptionAliveRef.current ||
        document.visibilityState !== "visible" ||
        !navigator.onLine
      ) {
        return;
      }

      restartAttemptRef.current = 0;
      setSubscriptionBroken(false);
      restartRef.current?.();
    };

    window.addEventListener("online", recoverDeadSubscription);
    document.addEventListener("visibilitychange", recoverDeadSubscription);

    return () => {
      window.removeEventListener("online", recoverDeadSubscription);
      document.removeEventListener("visibilitychange", recoverDeadSubscription);
      clearRestartTimer();
    };
  }, [subscriptionActive, clearRestartTimer]);

  return { isOnline };
};
