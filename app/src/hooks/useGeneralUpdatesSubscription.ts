import { useSubscription } from "@apollo/client/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GENERAL_SUBSCRIPTION_UPDATE_TYPES,
  type GeneralSubscriptionUpdateType,
} from "../constants";
import { GENERAL_UPDATES_SUBSCRIPTION } from "../graphql/subscriptions/generalUpdates.subscription";
import { setGeneralUpdatesOnline } from "../lib/general-updates-listeners";
import { disposeGraphqlWsClient, subscribeGraphqlWsConnection } from "../lib/graphql-ws-client";
import {
  resolveSubscriptionRetryDelayMs,
  subscribeSubscriptionRetryReset,
  waitForSubscriptionRetryDelayMs,
} from "../lib/subscription-retry.util";
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

const INITIAL_SUBSCRIPTION_ONLINE_TIMEOUT_MS = 3000;

export const useGeneralUpdatesSubscription = ({
  enabled,
  updateTypes,
  onNotification,
  onBadgeCounts,
  onVerificationStatus,
  onAnyUpdate,
}: UseGeneralUpdatesSubscriptionProps): void => {
  const subscriptionActive = enabled;
  const [wsConnected, setWsConnected] = useState(false);
  const [subscriptionBroken, setSubscriptionBroken] = useState(false);
  const isOnline = subscriptionActive && wsConnected && !subscriptionBroken;
  const enabledRef = useRef(subscriptionActive);
  const restartRef = useRef<(() => void) | null>(null);
  const restartAttemptRef = useRef(0);
  const restartWaitAbortRef = useRef<AbortController | null>(null);
  const initialOnlineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscriptionAliveRef = useRef(false);
  const hasEstablishedConnectionRef = useRef(false);
  const callbacksRef = useRef<SubscriptionCallbacks>({
    onNotification,
    onBadgeCounts,
    onVerificationStatus,
    onAnyUpdate,
  });

  const clearScheduledRestart = useCallback(() => {
    restartWaitAbortRef.current?.abort();
    restartWaitAbortRef.current = null;
  }, []);

  const clearInitialOnlineTimeout = useCallback(() => {
    if (initialOnlineTimeoutRef.current) {
      clearTimeout(initialOnlineTimeoutRef.current);
      initialOnlineTimeoutRef.current = null;
    }
  }, []);

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
    if (!subscriptionActive) {
      clearInitialOnlineTimeout();
      hasEstablishedConnectionRef.current = false;
      setGeneralUpdatesOnline(null);
      return;
    }

    if (isOnline) {
      clearInitialOnlineTimeout();
      hasEstablishedConnectionRef.current = true;
      setGeneralUpdatesOnline(true);
      return;
    }

    if (hasEstablishedConnectionRef.current) {
      setGeneralUpdatesOnline(false);
    }
  }, [isOnline, subscriptionActive, clearInitialOnlineTimeout]);

  useEffect(() => {
    if (!subscriptionActive) {
      return;
    }

    clearInitialOnlineTimeout();
    initialOnlineTimeoutRef.current = setTimeout(() => {
      initialOnlineTimeoutRef.current = null;

      if (enabledRef.current && !hasEstablishedConnectionRef.current) {
        setGeneralUpdatesOnline(false);
      }
    }, INITIAL_SUBSCRIPTION_ONLINE_TIMEOUT_MS);

    return clearInitialOnlineTimeout;
  }, [subscriptionActive, clearInitialOnlineTimeout]);

  useEffect(() => {
    return subscribeGraphqlWsConnection((connected) => {
      setWsConnected(connected);

      if (!connected) {
        subscriptionAliveRef.current = false;
      }
    });
  }, []);

  const restartSubscriptionFromStart = useCallback(() => {
    restartAttemptRef.current = 0;
    clearScheduledRestart();
    setSubscriptionBroken(false);
    subscriptionAliveRef.current = false;

    void disposeGraphqlWsClient();

    if (enabledRef.current) {
      restartRef.current?.();
    }
  }, [clearScheduledRestart]);

  const scheduleSubscriptionRestart = useCallback(() => {
    if (!enabledRef.current || subscriptionAliveRef.current) {
      return;
    }

    clearScheduledRestart();

    const delayMs = resolveSubscriptionRetryDelayMs(restartAttemptRef.current);
    restartAttemptRef.current += 1;

    const abortController = new AbortController();
    restartWaitAbortRef.current = abortController;

    void waitForSubscriptionRetryDelayMs(delayMs, abortController.signal).then((result) => {
      if (restartWaitAbortRef.current !== abortController) {
        return;
      }

      restartWaitAbortRef.current = null;

      if (result === "aborted") {
        return;
      }

      if (!enabledRef.current || subscriptionAliveRef.current) {
        return;
      }

      setSubscriptionBroken(false);
      restartRef.current?.();
    });
  }, [clearScheduledRestart]);

  useEffect(() => {
    return subscribeSubscriptionRetryReset(restartSubscriptionFromStart);
  }, [restartSubscriptionFromStart]);

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

    if (!enabledRef.current) {
      return;
    }

    restartAttemptRef.current = 0;
    setSubscriptionBroken(false);
    restart();
  }, [restart]);

  useEffect(() => {
    setSubscriptionBroken(false);
    subscriptionAliveRef.current = false;

    if (!subscriptionActive) {
      clearScheduledRestart();
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

      restartSubscriptionFromStart();
    };

    window.addEventListener("online", recoverDeadSubscription);
    document.addEventListener("visibilitychange", recoverDeadSubscription);

    return () => {
      window.removeEventListener("online", recoverDeadSubscription);
      document.removeEventListener("visibilitychange", recoverDeadSubscription);
      clearScheduledRestart();
    };
  }, [subscriptionActive, clearScheduledRestart, restartSubscriptionFromStart]);
};
