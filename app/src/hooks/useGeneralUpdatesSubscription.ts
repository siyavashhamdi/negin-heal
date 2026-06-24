import { useSubscription } from "@apollo/client/react";
import { useCallback, useEffect, useRef } from "react";
import {
  GENERAL_SUBSCRIPTION_UPDATE_TYPES,
  type GeneralSubscriptionUpdateType,
} from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { GENERAL_UPDATES_SUBSCRIPTION } from "../graphql/subscriptions/generalUpdates.subscription";
import { WS_SUBSCRIPTION_RETRY_ATTEMPTS } from "../lib/graphql-ws-client";
import { isRecoverableSubscriptionError } from "../lib/subscription-error.util";

const WS_SUBSCRIPTION_RESTART_BASE_DELAY_MS = 1_000;

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
}: UseGeneralUpdatesSubscriptionProps): void => {
  const { isAuthenticated } = useAuth();
  const subscriptionActive = enabled && isAuthenticated;
  const enabledRef = useRef(subscriptionActive);
  const restartRef = useRef<(() => void) | null>(null);
  const restartAttemptRef = useRef(0);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscriptionAliveRef = useRef(subscriptionActive);
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

    if (restartAttemptRef.current >= WS_SUBSCRIPTION_RETRY_ATTEMPTS) {
      return;
    }

    clearRestartTimer();

    const delayMs = WS_SUBSCRIPTION_RESTART_BASE_DELAY_MS * 2 ** restartAttemptRef.current;
    restartAttemptRef.current += 1;

    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;

      if (!enabledRef.current || subscriptionAliveRef.current) {
        return;
      }

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
      restartAttemptRef.current = 0;

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

      if (!enabledRef.current || !isRecoverableSubscriptionError(error)) {
        return;
      }

      scheduleSubscriptionRestart();
    },
    onComplete: () => {
      subscriptionAliveRef.current = false;

      if (enabledRef.current) {
        scheduleSubscriptionRestart();
      }
    },
  });

  useEffect(() => {
    restartRef.current = restart;
  }, [restart]);

  useEffect(() => {
    subscriptionAliveRef.current = subscriptionActive;

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
};
