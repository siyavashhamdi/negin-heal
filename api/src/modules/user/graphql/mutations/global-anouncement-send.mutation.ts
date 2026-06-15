import { randomUUID } from "crypto";

import { BadRequestException, UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import {
  GlobalAnouncementMessageType,
  GlobalAnouncementMode,
  GeneralSubscriptionUpdateType,
  UserRole,
} from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { UserSubscriptionService } from "../../user-subscription.service";
import { GlobalAnouncementSendGqlInput } from "../inputs";
import { GlobalAnouncementSendGqlResponse } from "../responses";

@Resolver(() => GlobalAnouncementSendGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class GlobalAnouncementSendMutation {
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  @Mutation(() => GlobalAnouncementSendGqlResponse, {
    name: "globalAnouncementSend",
    description:
      "Broadcast a global anouncement to active users subscribed to general updates",
  })
  async sendGlobalAnouncement(
    @Args("input") input: GlobalAnouncementSendGqlInput,
  ): Promise<GlobalAnouncementSendGqlResponse> {
    const title = input.title?.trim();
    const description = input.description.trim();
    const mode = input.mode ?? GlobalAnouncementMode.INFO;
    const messageType = input.messageType ?? GlobalAnouncementMessageType.POPUP;
    const isPushNotification = Boolean(input.isPushNotification);

    if (!description) {
      throw new BadRequestException(
        "Global anouncement description is required",
      );
    }

    if (messageType === GlobalAnouncementMessageType.POPUP && !title) {
      throw new BadRequestException(
        "Global anouncement title is required for popup messages",
      );
    }

    const activeSubscribedUsers =
      this.userSubscriptionService.getActiveSubscribedUserIds(
        GeneralSubscriptionUpdateType.NOTIFICATION,
      ).length;

    const deliveredUsers =
      await this.userSubscriptionService.publishToActiveUsers({
        updateType: GeneralSubscriptionUpdateType.NOTIFICATION,
        targetId: randomUUID(),
        payload: {
          ...input.payload,
          ...(title ? { title } : {}),
          description,
          mode,
          messageType,
          isPushNotification,
        },
      });

    return {
      deliveredUsers,
      activeSubscribedUsers,
    };
  }
}
