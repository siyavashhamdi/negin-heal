import { randomUUID } from "crypto";

import { BadRequestException, UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import {
  GeneralAnouncementMode,
  GeneralSubscriptionUpdateType,
  UserRole,
} from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { UserSubscriptionService } from "../../user-subscription.service";
import { GeneralAnouncementSendGqlInput } from "../inputs";
import { GeneralAnouncementSendGqlResponse } from "../responses";

@Resolver(() => GeneralAnouncementSendGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class GeneralAnouncementSendMutation {
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  @Mutation(() => GeneralAnouncementSendGqlResponse, {
    name: "generalAnouncementSend",
    description:
      "Broadcast a general anouncement to active users subscribed to general updates",
  })
  async sendGeneralAnouncement(
    @Args("input") input: GeneralAnouncementSendGqlInput,
  ): Promise<GeneralAnouncementSendGqlResponse> {
    const title = input.title.trim();
    const description = input.description.trim();
    const mode = input.mode ?? GeneralAnouncementMode.INFO;

    if (!title || !description) {
      throw new BadRequestException(
        "General anouncement title and description are required",
      );
    }

    const activeSubscribedUsers =
      this.userSubscriptionService.getActiveSubscribedUserIds(
        GeneralSubscriptionUpdateType.GENERAL_ANOUNCEMENT,
      ).length;

    const deliveredUsers =
      await this.userSubscriptionService.publishToActiveUsers({
        updateType: GeneralSubscriptionUpdateType.GENERAL_ANOUNCEMENT,
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
