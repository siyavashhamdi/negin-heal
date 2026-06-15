import { useSubscription } from "@apollo/client/react";
import {
  GENERAL_SUBSCRIPTION_UPDATE_TYPES,
  type GeneralSubscriptionUpdateType,
} from "../constants";
import { GENERAL_UPDATES_SUBSCRIPTION } from "../graphql/subscriptions/generalUpdates.subscription";

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
  readonly onAnyUpdate?: (event: GeneralUpdateEvent) => void;
}

export const useGeneralUpdatesSubscription = ({
  enabled,
  updateTypes,
  onNotification,
  onBadgeCounts,
  onAnyUpdate,
}: UseGeneralUpdatesSubscriptionProps): void => {
  useSubscription<GeneralUpdatesSubscriptionData, GeneralUpdatesSubscriptionVariables>(
    GENERAL_UPDATES_SUBSCRIPTION,
    {
      skip: !enabled,
      variables: {
        updateTypes: updateTypes && updateTypes.length ? updateTypes : undefined,
      },
      onData: ({ data }) => {
        const update = data.data?.generalUpdates;
        if (!update) {
          return;
        }

        onAnyUpdate?.(update);

        switch (update.updateType) {
          case GENERAL_SUBSCRIPTION_UPDATE_TYPES.NOTIFICATION:
            onNotification?.(update);
            break;
          case GENERAL_SUBSCRIPTION_UPDATE_TYPES.BADGE_COUNTS:
            onBadgeCounts?.(update);
            break;
          default:
            break;
        }
      },
    }
  );
};
