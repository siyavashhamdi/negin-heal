import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { ForbiddenException, UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";

import {
  Notification,
  NotificationDocument,
} from "../../../../database/schemas";
import { NotificationUpdateAction } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GraphQLContextUtil } from "../../../../utils";
import { GqlAuthGuard } from "../../../auth";
import { NotificationUpdateGqlInput } from "../inputs";
import {
  NotificationListGqlResponse,
  NotificationUpdateGqlResponse,
} from "../responses";

type NotificationUpdateRecord = Pick<
  Notification,
  | "_id"
  | "userId"
  | "isGlobalAnnouncement"
  | "source"
  | "mode"
  | "title"
  | "message"
  | "payload"
  | "isRead"
  | "readAt"
  | "archivedAt"
  | "visibleUntil"
  | "audit"
>;

type NotificationUpdateOperation = {
  $set?: Record<string, unknown>;
  $unset?: Record<string, 1>;
};

@Resolver(() => NotificationUpdateGqlResponse)
@UseGuards(GqlAuthGuard)
export class NotificationUpdateMutation {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  @Mutation(() => NotificationUpdateGqlResponse, {
    name: "userNotificationUpdate",
    description:
      "Bulk update current-user notifications by setting them read, unread, or archived",
  })
  async updateUserNotifications(
    @Args("input") input: NotificationUpdateGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<NotificationUpdateGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);
    const notificationIds = this.getUniqueNotificationIds(
      input.notificationIds,
    );
    const objectIds = notificationIds.map((id) => new Types.ObjectId(id));
    const ownershipFilter = this.buildOwnershipFilter(user.userId, objectIds);
    const matchingNotifications = await this.notificationModel
      .find(ownershipFilter)
      .select({ _id: 1 })
      .lean<Array<{ _id: Types.ObjectId }>>()
      .exec();

    if (matchingNotifications.length !== notificationIds.length) {
      throw new ForbiddenException(
        "One or more notifications do not belong to the current user",
      );
    }

    const updateResult = await this.notificationModel
      .updateMany(ownershipFilter, this.buildUpdateOperation(input.action))
      .exec();
    const updatedNotifications = await this.notificationModel
      .find(ownershipFilter)
      .lean<NotificationUpdateRecord[]>()
      .exec();
    const updatedNotificationById = new Map(
      updatedNotifications.map((notification) => [
        notification._id.toString(),
        notification,
      ]),
    );

    return {
      action: input.action,
      notificationIds,
      requestedCount: notificationIds.length,
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      items: notificationIds
        .map((id) => updatedNotificationById.get(id))
        .filter(Boolean)
        .map((notification) =>
          this.toNotificationListResponse(
            notification as NotificationUpdateRecord,
          ),
        ),
    };
  }

  private buildOwnershipFilter(
    userId: Types.ObjectId,
    notificationIds: Types.ObjectId[],
  ): FilterQuery<Notification> {
    return {
      $and: [
        {
          $or: [
            { "audit.deletedAt": null },
            { "audit.deletedAt": { $exists: false } },
          ],
        },
        {
          _id: { $in: notificationIds },
          userId,
          isGlobalAnnouncement: false,
        },
      ],
    };
  }

  private buildUpdateOperation(
    action: NotificationUpdateAction,
  ): NotificationUpdateOperation {
    const now = new Date();

    switch (action) {
      case NotificationUpdateAction.SET_AS_READ:
        return {
          $set: {
            isRead: true,
            readAt: now,
          },
        };
      case NotificationUpdateAction.SET_AS_UNREAD:
        return {
          $set: {
            isRead: false,
          },
          $unset: {
            readAt: 1,
          },
        };
      case NotificationUpdateAction.ARCHIVE:
        return {
          $set: {
            archivedAt: now,
          },
        };
    }
  }

  private getUniqueNotificationIds(notificationIds: string[]): string[] {
    return Array.from(new Set(notificationIds));
  }

  private toNotificationListResponse(
    notification: NotificationUpdateRecord,
  ): NotificationListGqlResponse {
    return {
      id: notification._id,
      userId: notification.userId,
      isGlobalAnnouncement: notification.isGlobalAnnouncement,
      source: notification.source,
      mode: notification.mode,
      title: notification.title,
      message: notification.message,
      payload: notification.payload,
      isRead: notification.isRead,
      readAt: notification.readAt,
      archivedAt: notification.archivedAt,
      visibleUntil: notification.visibleUntil,
      createdAt: notification.audit?.createdAt,
      updatedAt: notification.audit?.updatedAt,
    };
  }
}
