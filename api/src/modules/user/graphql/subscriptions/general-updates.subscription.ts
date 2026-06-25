import { randomUUID } from "crypto";

import { BadRequestException, UseGuards } from "@nestjs/common";
import { Args, Context, Resolver, Subscription } from "@nestjs/graphql";

import { OptionalGqlAuthGuard } from "../../../auth";
import { GeneralSubscriptionUpdateType } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GraphQLContextUtil } from "../../../../utils/graphql-context.util";
import { GeneralSubscriptionGqlResponse } from "../responses";
import { UserSubscriptionService } from "../../user-subscription.service";

interface GeneralUpdatesTopicPayload {
  generalUpdates: {
    targetUserId: string;
    data: GeneralSubscriptionGqlResponse;
  };
}

function resolveSubscriberId(context: GraphQLContext): string | null {
  const user = GraphQLContextUtil.getUser(context, false);
  if (user?.userId) {
    return user.userId.toString();
  }

  return context?.req?.subscriptionConnectionId ?? null;
}

@Resolver(() => GeneralSubscriptionGqlResponse)
export class GeneralUpdatesSubscription {
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  @Subscription(() => GeneralSubscriptionGqlResponse, {
    name: "generalUpdates",
    description: "General typed app updates for connected clients",
    filter: (
      payload: GeneralUpdatesTopicPayload,
      variables: { updateTypes?: GeneralSubscriptionUpdateType[] },
      context: GraphQLContext,
    ) => {
      const subscriberId = resolveSubscriberId(context);
      const update = payload.generalUpdates;

      if (!subscriberId || update.targetUserId !== subscriberId) {
        return false;
      }

      const selectedTypes = variables?.updateTypes;
      if (!selectedTypes?.length) {
        return true;
      }

      return selectedTypes.includes(update.data.updateType);
    },
    resolve: (payload: GeneralUpdatesTopicPayload) =>
      payload.generalUpdates.data,
  })
  @UseGuards(OptionalGqlAuthGuard)
  subscribe(
    @Args("updateTypes", {
      type: () => [GeneralSubscriptionUpdateType],
      nullable: true,
      description:
        "Optional type filters. Empty means receive all update types",
    })
    updateTypes?: GeneralSubscriptionUpdateType[],
    @Context() context?: GraphQLContext,
  ): AsyncIterator<GeneralUpdatesTopicPayload> {
    const user = GraphQLContextUtil.getUser(context, false);
    const subscriberId = resolveSubscriberId(context);
    if (!subscriberId) {
      throw new BadRequestException("Subscription connection is not available");
    }

    const sessionId = user?.sessionId ?? subscriberId;
    const connectionId =
      context?.req?.subscriptionConnectionId ?? `${subscriberId}:${sessionId}`;
    const operationId = randomUUID();

    this.userSubscriptionService.registerSubscription({
      connectionId,
      operationId,
      userId: subscriberId,
      sessionId,
      updateTypes,
    });

    const iterator =
      this.userSubscriptionService.createGeneralUpdatesIterator();

    return this.wrapIterator(iterator, connectionId, operationId);
  }

  private wrapIterator(
    iterator: AsyncIterator<GeneralUpdatesTopicPayload>,
    connectionId: string,
    operationId: string,
  ): AsyncIterator<GeneralUpdatesTopicPayload> {
    const originalReturn = iterator.return?.bind(iterator);
    const originalThrow = iterator.throw?.bind(iterator);

    iterator.return = async (value?: unknown) => {
      this.userSubscriptionService.unregisterSubscription(
        connectionId,
        operationId,
      );
      if (originalReturn) {
        return originalReturn(value);
      }

      return { done: true, value } as IteratorReturnResult<unknown>;
    };

    iterator.throw = async (error?: unknown) => {
      this.userSubscriptionService.unregisterSubscription(
        connectionId,
        operationId,
      );
      if (originalThrow) {
        return originalThrow(error);
      }

      throw error;
    };

    return iterator;
  }
}
