import { Injectable } from "@nestjs/common";
import { PubSub } from "graphql-subscriptions";

import { GeneralSubscriptionUpdateType } from "../../enums";
import { GeneralSubscriptionGqlResponse } from "./graphql/responses";

const GENERAL_UPDATES_TOPIC = "generalUpdates";

interface GeneralSubscriptionEnvelope {
  targetUserId: string;
  data: GeneralSubscriptionGqlResponse;
}

interface GeneralUpdatesTopicPayload {
  generalUpdates: GeneralSubscriptionEnvelope;
}

interface SubscriptionOperationState {
  updateTypes?: Set<GeneralSubscriptionUpdateType>;
  subscribedAt: Date;
}

interface SubscriptionConnectionState {
  userId: string;
  sessionId: string;
  operations: Map<string, SubscriptionOperationState>;
  connectedAt: Date;
  lastSeenAt: Date;
}

export interface RegisterGeneralSubscriptionInput {
  connectionId: string;
  operationId: string;
  userId: string;
  sessionId: string;
  updateTypes?: GeneralSubscriptionUpdateType[];
}

export interface PublishGeneralUpdateInput {
  userId: string;
  updateType: GeneralSubscriptionUpdateType;
  targetId?: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class UserSubscriptionService {
  private readonly pubSub = new PubSub();

  private readonly connections = new Map<string, SubscriptionConnectionState>();
  private readonly userConnections = new Map<string, Set<string>>();

  createGeneralUpdatesIterator(): AsyncIterator<GeneralUpdatesTopicPayload> {
    return this.pubSub.asyncIterator(
      GENERAL_UPDATES_TOPIC,
    ) as AsyncIterator<GeneralUpdatesTopicPayload>;
  }

  registerSubscription(input: RegisterGeneralSubscriptionInput): void {
    const {
      connectionId,
      operationId,
      userId,
      sessionId,
      updateTypes = [],
    } = input;

    let connectionState = this.connections.get(connectionId);
    const now = new Date();

    if (!connectionState || connectionState.userId !== userId) {
      if (connectionState && connectionState.userId !== userId) {
        this.detachConnection(connectionId, connectionState.userId);
      }

      connectionState = {
        userId,
        sessionId,
        connectedAt: now,
        lastSeenAt: now,
        operations: new Map<string, SubscriptionOperationState>(),
      };
      this.connections.set(connectionId, connectionState);

      const existingConnections = this.userConnections.get(userId) || new Set();
      existingConnections.add(connectionId);
      this.userConnections.set(userId, existingConnections);
    }

    connectionState.lastSeenAt = now;
    connectionState.sessionId = sessionId;
    connectionState.operations.set(operationId, {
      updateTypes: updateTypes.length ? new Set(updateTypes) : undefined,
      subscribedAt: now,
    });
  }

  unregisterSubscription(connectionId: string, operationId: string): void {
    const connectionState = this.connections.get(connectionId);
    if (!connectionState) {
      return;
    }

    connectionState.operations.delete(operationId);
    connectionState.lastSeenAt = new Date();

    if (!connectionState.operations.size) {
      this.detachConnection(connectionId, connectionState.userId);
    }
  }

  unregisterConnection(connectionId: string): void {
    const connectionState = this.connections.get(connectionId);
    if (!connectionState) {
      return;
    }

    this.detachConnection(connectionId, connectionState.userId);
  }

  hasActiveUserSubscriptions(
    userId: string,
    updateType?: GeneralSubscriptionUpdateType,
  ): boolean {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds?.size) {
      return false;
    }

    for (const connectionId of connectionIds) {
      const connectionState = this.connections.get(connectionId);
      if (!connectionState) {
        continue;
      }

      for (const operation of connectionState.operations.values()) {
        if (!updateType) {
          return true;
        }

        if (
          !operation.updateTypes?.size ||
          operation.updateTypes.has(updateType)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  getActiveSubscribedUserIds(
    updateType?: GeneralSubscriptionUpdateType,
  ): string[] {
    const userIds: string[] = [];

    for (const userId of this.userConnections.keys()) {
      if (this.hasActiveUserSubscriptions(userId, updateType)) {
        userIds.push(userId);
      }
    }

    return userIds;
  }

  async publishToUser(input: PublishGeneralUpdateInput): Promise<boolean> {
    if (!this.hasActiveUserSubscriptions(input.userId, input.updateType)) {
      return false;
    }

    await this.pubSub.publish(GENERAL_UPDATES_TOPIC, {
      [GENERAL_UPDATES_TOPIC]: {
        targetUserId: input.userId,
        data: {
          updateType: input.updateType,
          createdAt: new Date(),
          targetId: input.targetId,
          payload: input.payload,
        },
      },
    });

    return true;
  }

  async publishToUsers(
    userIds: string[],
    update: Omit<PublishGeneralUpdateInput, "userId">,
  ): Promise<number> {
    let publishedCount = 0;
    const uniqueUserIds = new Set([...userIds]);

    for (const userId of uniqueUserIds) {
      const didPublish = await this.publishToUser({
        userId,
        ...update,
      });

      if (didPublish) {
        publishedCount += 1;
      }
    }

    return publishedCount;
  }

  async publishToActiveUsers(
    update: Omit<PublishGeneralUpdateInput, "userId">,
  ): Promise<number> {
    const activeUserIds = this.getActiveSubscribedUserIds(update.updateType);
    return this.publishToUsers(activeUserIds, update);
  }

  getActiveSubscriptionStats(): {
    users: number;
    connections: number;
    operations: number;
  } {
    let operations = 0;
    for (const connectionState of this.connections.values()) {
      operations += connectionState.operations.size;
    }

    return {
      users: this.userConnections.size,
      connections: this.connections.size,
      operations,
    };
  }

  private detachConnection(connectionId: string, userId: string): void {
    this.connections.delete(connectionId);

    const userConnectionIds = this.userConnections.get(userId);
    if (!userConnectionIds) {
      return;
    }

    userConnectionIds.delete(connectionId);
    if (!userConnectionIds.size) {
      this.userConnections.delete(userId);
    }
  }
}
