import { BadRequestException, UseGuards } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../../../constants/exception.constant";
import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import {
  GlobalAnouncementMessageType,
  GeneralSubscriptionUpdateType,
  NotificationMode,
  NotificationSource,
  UserRole,
} from "../../../../enums";
import {
  Notification,
  NotificationDocument,
} from "../../../../database/schemas";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { PushNotificationService } from "../../../push-notification";
import { UserSubscriptionService } from "../../user-subscription.service";
import { GlobalAnouncementSendGqlInput } from "../inputs";
import { GlobalAnouncementSendGqlResponse } from "../responses";
import {
  resolveWebPushBody,
  resolveWebPushTitle,
} from "../../../push-notification/utils/resolve-web-push-content.util";

@Resolver(() => GlobalAnouncementSendGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class GlobalAnouncementSendMutation {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly pushNotificationService: PushNotificationService,
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
    const mode = input.mode ?? NotificationMode.INFO;
    const messageType = input.messageType ?? GlobalAnouncementMessageType.POPUP;
    const isPushNotification = Boolean(input.isPushNotification);

    if (!description) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.GLOBAL_ANNOUNCEMENT_DESCRIPTION_REQUIRED,
      );
    }

    if (messageType === GlobalAnouncementMessageType.POPUP && !title) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.GLOBAL_ANNOUNCEMENT_TITLE_REQUIRED,
      );
    }

    const activeSubscribedUsers =
      this.userSubscriptionService.getActiveSubscribedUserIds(
        GeneralSubscriptionUpdateType.NOTIFICATION,
      ).length;

    const notificationPayload: Record<string, unknown> = {
      ...input.payload,
      messageType,
      isPushNotification,
    };
    const subscriptionPayload: Record<string, unknown> = {
      ...notificationPayload,
      ...(title ? { title } : {}),
      description,
      mode,
    };

    const notification = await this.notificationModel.create({
      isGlobalAnnouncement: true,
      source: NotificationSource.OTHER,
      mode,
      title,
      message: description,
      payload: notificationPayload,
      visibleUntil: new Date(),
    });

    const deliveredUsers =
      await this.userSubscriptionService.publishToActiveUsers({
        updateType: GeneralSubscriptionUpdateType.NOTIFICATION,
        targetId: notification._id.toString(),
        payload: subscriptionPayload,
      });

    void this.pushNotificationService
      .deliverToAllUsers({
        title: resolveWebPushTitle(subscriptionPayload, title),
        body: resolveWebPushBody(subscriptionPayload, description),
        notificationId: notification._id.toString(),
        payload: subscriptionPayload,
        tag: notification._id.toString(),
      })
      .catch((error: unknown) => {
        console.error("[GlobalAnouncement] Web Push delivery failed:", error);
      });

    notification.payload = {
      ...notificationPayload,
      delivery: {
        deliveredUsers,
        activeSubscribedUsers,
      },
    };
    await notification.save();

    return {
      deliveredUsers,
      activeSubscribedUsers,
    };
  }
}
