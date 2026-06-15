import { randomUUID } from "crypto";

import { BadRequestException, UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import {
  AdminNotificationMode,
  GeneralSubscriptionUpdateType,
  UserRole,
} from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { UserSubscriptionService } from "../../user-subscription.service";
import { AdminNotificationSendGqlInput } from "../inputs";
import { AdminNotificationSendGqlResponse } from "../responses";

@Resolver(() => AdminNotificationSendGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminNotificationSendMutation {
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  @Mutation(() => AdminNotificationSendGqlResponse, {
    name: "adminNotificationSend",
    description:
      "Broadcast an admin notification to active users subscribed to general updates",
  })
  async sendAdminNotification(
    @Args("input") input: AdminNotificationSendGqlInput,
  ): Promise<AdminNotificationSendGqlResponse> {
    const title = input.title.trim();
    const description = input.description.trim();
    const mode = input.mode ?? AdminNotificationMode.INFO;

    if (!title || !description) {
      throw new BadRequestException(
        "Admin notification title and description are required",
      );
    }

    const activeSubscribedUsers =
      this.userSubscriptionService.getActiveSubscribedUserIds(
        GeneralSubscriptionUpdateType.ADMIN_NOTIFICATION,
      ).length;

    const deliveredUsers =
      await this.userSubscriptionService.publishToActiveUsers({
        updateType: GeneralSubscriptionUpdateType.ADMIN_NOTIFICATION,
        targetId: randomUUID(),
        payload: {
          ...input.payload,
          title,
          description,
          mode,
        },
      });

    return {
      deliveredUsers,
      activeSubscribedUsers,
    };
  }
}
