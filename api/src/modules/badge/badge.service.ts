import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";

import {
  Product,
  ProductDocument,
  Notification,
  NotificationDocument,
  Ticket,
  TicketDocument,
  UserProduct,
  UserProductDocument,
} from "../../database/schemas";
import {
  BadgeCountTriggerAction,
  BadgeCountTriggerSource,
  GeneralSubscriptionUpdateType,
  TicketStatus,
  UserProductPurchaseStatus,
  UserRole,
} from "../../enums";
import { AuthenticatedUser } from "../../types/graphql-context.types";
import { PushNotificationService } from "../push-notification";
import { UserService, UserSubscriptionService } from "../user";
import { BadgeCountGqlResponse } from "./graphql/responses";

export type BadgeCountSignalPayload = {
  source: BadgeCountTriggerSource;
  action: BadgeCountTriggerAction;
} & Record<string, unknown>;

type BadgeCountSignalTargetUserIds = Types.ObjectId | Types.ObjectId[];

export interface PublishBadgeCountSignalInput {
  targetUserIds?: BadgeCountSignalTargetUserIds;
  includeStaffUsers?: boolean;
  includeActiveSubscribedUsers?: boolean;
  excludeStaffUsers?: boolean;
  payload: BadgeCountSignalPayload;
}

@Injectable()
export class BadgeService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(UserProduct.name)
    private readonly userProductModel: Model<UserProductDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
    private readonly userService: UserService,
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async getCount(
    user: AuthenticatedUser | null,
  ): Promise<BadgeCountGqlResponse> {
    if (!user) {
      return {
        products: await this.countProducts(false),
        payments: null,
        notifications: null,
        tickets: null,
      };
    }

    const isStaff = this.isStaff(user);

    const [products, payments, notifications, tickets] = await Promise.all([
      this.countProducts(isStaff),
      isStaff ? this.countPendingPayments() : Promise.resolve(null),
      this.countUnreadNotifications(user),
      this.countTickets(user, isStaff),
    ]);

    return {
      products,
      payments,
      notifications,
      tickets,
    };
  }

  async publishCountSignal(
    input: PublishBadgeCountSignalInput,
  ): Promise<number> {
    const targetUserIds = new Set(
      this.normalizeTargetUserIds(input.targetUserIds),
    );
    let staffUserIds: string[] = [];

    if (input.includeStaffUsers) {
      staffUserIds = await this.userService.findActiveStaffUserIds();
      staffUserIds.forEach((userId) => targetUserIds.add(userId));
    }

    if (input.includeActiveSubscribedUsers) {
      const activeUserIds =
        this.userSubscriptionService.getActiveSubscribedUserIds(
          GeneralSubscriptionUpdateType.BADGE_COUNTS,
        );
      activeUserIds.forEach((userId) => targetUserIds.add(userId));
    }

    if (input.excludeStaffUsers) {
      if (staffUserIds.length === 0) {
        staffUserIds = await this.userService.findActiveStaffUserIds();
      }
      staffUserIds.forEach((userId) => targetUserIds.delete(userId));
    }

    const published = await this.userSubscriptionService.publishToUsers(
      [...targetUserIds],
      {
        updateType: GeneralSubscriptionUpdateType.BADGE_COUNTS,
        payload: input.payload,
      },
    );

    if (input.payload.source === BadgeCountTriggerSource.NOTIFICATION) {
      void this.pushNotificationService.syncLauncherBadgeCountsForUsers([
        ...targetUserIds,
      ]);
    }

    return published;
  }

  private normalizeTargetUserIds(
    targetUserIds?: BadgeCountSignalTargetUserIds,
  ): string[] {
    if (!targetUserIds) {
      return [];
    }

    const userIds = Array.isArray(targetUserIds)
      ? targetUserIds
      : [targetUserIds];

    return userIds.map((userId) => userId.toString());
  }

  private countProducts(isStaff: boolean): Promise<number> {
    const filterQuery: FilterQuery<Product> = isStaff ? {} : { isActive: true };

    return this.productModel.countDocuments(filterQuery).exec();
  }

  private countPendingPayments(): Promise<number> {
    return this.userProductModel
      .countDocuments({
        "purchase.status": UserProductPurchaseStatus.PENDING,
      })
      .exec();
  }

  private countUnreadNotifications(user: AuthenticatedUser): Promise<number> {
    const now = new Date();

    return this.notificationModel
      .countDocuments({
        $and: [
          {
            $or: [
              { "audit.deletedAt": null },
              { "audit.deletedAt": { $exists: false } },
            ],
          },
          {
            userId: user.userId,
            isGlobalAnnouncement: false,
            isRead: false,
            $or: [
              { visibleUntil: null },
              { visibleUntil: { $exists: false } },
              { visibleUntil: { $gte: now } },
            ],
          },
        ],
      })
      .exec();
  }

  private countTickets(
    user: AuthenticatedUser,
    isStaff: boolean,
  ): Promise<number> {
    const filterQuery: FilterQuery<Ticket> = isStaff
      ? { status: TicketStatus.OPEN }
      : {
          "audit.createdBy": user.userId,
          status: TicketStatus.ANSWERED,
        };

    return this.ticketModel.countDocuments(filterQuery).exec();
  }

  private isStaff(user: AuthenticatedUser): boolean {
    return user.roles?.includes(UserRole.SUPER_ADMIN) ?? false;
  }
}
