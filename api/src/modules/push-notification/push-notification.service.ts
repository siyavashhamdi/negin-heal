import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { FilterQuery, Model, Types } from "mongoose";
import * as webpush from "web-push";

import { env } from "../../config";
import {
  Notification,
  NotificationDocument,
  User,
  UserDocument,
  UserNativePushToken,
  UserPushSubscription,
} from "../../database/schemas";
import { NativePushPlatform } from "../../enums";
import {
  buildFcmBadgeSyncData,
  buildFcmNotificationData,
} from "./utils/build-fcm-data-message.util";
import { buildWebPushPayloadJson } from "./utils/build-web-push-payload.util";
import { buildPushNotificationUrl } from "./utils/build-push-notification-url.util";
import { countUnreadUserNotifications } from "./utils/count-unread-user-notifications.util";
import { shouldSendWebPush } from "./utils/should-send-web-push.util";
import {
  buildUserNativePushTokenDocument,
  normalizeStoredNativePushToken,
} from "./utils/user-native-push-token-document.util";
import {
  buildUserPushSubscriptionDocument,
  normalizeStoredPushSubscription,
} from "./utils/user-push-subscription-document.util";

export type RegisterPushSubscriptionInput = {
  userId: Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  replacesEndpoint?: string | null;
};

export type RegisterNativePushTokenInput = {
  userId: Types.ObjectId;
  token: string;
  platform: NativePushPlatform;
};

export type DeliverWebPushInput = {
  title: string;
  body: string;
  notificationId?: string;
  payload?: Record<string, unknown>;
  tag?: string;
};

type DeliverableUserPushSubscription = UserPushSubscription & {
  userId: Types.ObjectId;
};

type DeliverableNativePushToken = UserNativePushToken & {
  userId: Types.ObjectId;
};

type WebPushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private webPushConfigured = false;
  private fcmConfigured = false;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {
    this.configureWebPush();
    this.configureFirebase();
  }

  isEnabled(): boolean {
    return this.webPushConfigured;
  }

  isNativePushEnabled(): boolean {
    return this.fcmConfigured;
  }

  getPublicKey(): string | null {
    return env.VAPID_PUBLIC_KEY ?? null;
  }

  async registerSubscription(
    input: RegisterPushSubscriptionInput,
  ): Promise<UserPushSubscription> {
    const endpoint = input.endpoint.trim();
    const keys = {
      p256dh: input.keys.p256dh.trim(),
      auth: input.keys.auth.trim(),
    };
    const now = new Date();
    const replacesEndpoint = input.replacesEndpoint?.trim();

    if (replacesEndpoint && replacesEndpoint !== endpoint) {
      await this.userModel
        .updateOne(
          { _id: input.userId },
          {
            $pull: {
              pushSubscriptions: { endpoint: replacesEndpoint },
            },
          },
        )
        .exec();
    }

    await this.userModel
      .updateMany(
        {
          _id: { $ne: input.userId },
          "pushSubscriptions.endpoint": endpoint,
        },
        {
          $pull: {
            pushSubscriptions: { endpoint },
          },
        },
      )
      .exec();

    const existingOwner = await this.userModel
      .findOne({
        _id: input.userId,
        "pushSubscriptions.endpoint": endpoint,
      })
      .select({ pushSubscriptions: 1 })
      .lean()
      .exec();

    const existingSubscription = normalizeStoredPushSubscription(
      existingOwner?.pushSubscriptions?.find(
        (subscription) => subscription.endpoint === endpoint,
      ),
    );

    if (existingSubscription) {
      await this.userModel
        .updateOne(
          {
            _id: input.userId,
            "pushSubscriptions.endpoint": endpoint,
          },
          {
            $set: {
              "pushSubscriptions.$.keys": keys,
              "pushSubscriptions.$.updatedAt": now,
            },
          },
        )
        .exec();

      this.logger.log(
        `Updated push subscription for user=${input.userId.toString()} endpoint=${endpoint}`,
      );

      return buildUserPushSubscriptionDocument({
        endpoint,
        keys,
        registeredAt: existingSubscription.registeredAt,
        updatedAt: now,
      });
    }

    const createdSubscription = buildUserPushSubscriptionDocument({
      endpoint,
      keys,
      registeredAt: now,
      updatedAt: now,
    });

    await this.userModel
      .updateOne(
        { _id: input.userId },
        {
          $push: {
            pushSubscriptions: createdSubscription,
          },
        },
      )
      .exec();

    this.logger.log(
      `Registered push subscription for user=${input.userId.toString()} endpoint=${endpoint}`,
    );

    return createdSubscription;
  }

  async unregisterSubscription(
    userId: Types.ObjectId,
    endpoint: string,
  ): Promise<boolean> {
    const result = await this.userModel
      .updateOne(
        { _id: userId },
        {
          $pull: {
            pushSubscriptions: { endpoint: endpoint.trim() },
          },
        },
      )
      .exec();

    return result.modifiedCount > 0;
  }

  async registerNativeToken(
    input: RegisterNativePushTokenInput,
  ): Promise<UserNativePushToken> {
    const token = input.token.trim();
    const now = new Date();

    await this.userModel
      .updateMany(
        {
          _id: { $ne: input.userId },
          "nativePushTokens.token": token,
        },
        {
          $pull: {
            nativePushTokens: { token },
          },
        },
      )
      .exec();

    const existingOwner = await this.userModel
      .findOne({
        _id: input.userId,
        "nativePushTokens.token": token,
      })
      .select({ nativePushTokens: 1 })
      .lean()
      .exec();

    const existingToken = normalizeStoredNativePushToken(
      existingOwner?.nativePushTokens?.find(
        (nativeToken) => nativeToken.token === token,
      ),
    );

    if (existingToken) {
      await this.userModel
        .updateOne(
          {
            _id: input.userId,
            "nativePushTokens.token": token,
          },
          {
            $set: {
              "nativePushTokens.$.platform": input.platform,
              "nativePushTokens.$.updatedAt": now,
            },
          },
        )
        .exec();

      this.logger.log(
        `Updated native push token for user=${input.userId.toString()} platform=${input.platform}`,
      );

      return buildUserNativePushTokenDocument({
        token,
        platform: input.platform,
        registeredAt: existingToken.registeredAt,
        updatedAt: now,
      });
    }

    const createdToken = buildUserNativePushTokenDocument({
      token,
      platform: input.platform,
      registeredAt: now,
      updatedAt: now,
    });

    await this.userModel
      .updateOne(
        { _id: input.userId },
        {
          $push: {
            nativePushTokens: createdToken,
          },
        },
      )
      .exec();

    this.logger.log(
      `Registered native push token for user=${input.userId.toString()} platform=${input.platform}`,
    );

    return createdToken;
  }

  async unregisterNativeToken(
    userId: Types.ObjectId,
    token: string,
  ): Promise<boolean> {
    const result = await this.userModel
      .updateOne(
        { _id: userId },
        {
          $pull: {
            nativePushTokens: { token: token.trim() },
          },
        },
      )
      .exec();

    return result.modifiedCount > 0;
  }

  async syncLauncherBadgeCountsForUsers(userIds: string[]): Promise<void> {
    if (!this.fcmConfigured || userIds.length === 0) {
      return;
    }

    const uniqueUserIds = [
      ...new Set(userIds.map((userId) => userId.trim())),
    ].filter(Boolean);

    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const badgeCount = await countUnreadUserNotifications(
          this.notificationModel,
          userId,
        );
        await this.deliverNativeBadgeSyncToUser(userId, badgeCount);
      }),
    );
  }

  async deliverToUser(
    userId: string,
    input: DeliverWebPushInput,
  ): Promise<number> {
    let deliveredCount = 0;

    if (shouldSendWebPush(input.payload)) {
      const badgeCount = await countUnreadUserNotifications(
        this.notificationModel,
        userId,
      );

      if (this.webPushConfigured) {
        const subscriptions = await this.findDeliverableWebPushSubscriptions([
          userId,
        ]);

        if (subscriptions.length) {
          deliveredCount = await this.sendToWebPushSubscriptions(
            subscriptions,
            input,
            badgeCount,
          );
          this.logger.log(
            `Web Push delivered ${deliveredCount}/${subscriptions.length} subscription(s) for user=${userId} title="${input.title}"`,
          );
        } else {
          this.logger.log(
            `No deliverable Web Push subscriptions for user=${userId} title="${input.title}"`,
          );
        }
      } else {
        this.logger.debug(
          `Skipped Web Push for user=${userId}: VAPID not configured.`,
        );
      }

      void this.deliverNativeNotificationToUser(userId, input, badgeCount);
    } else {
      this.logger.debug(
        `Skipped push delivery for user=${userId}: payload opted out.`,
      );
    }

    return deliveredCount;
  }

  async deliverToAllUsers(input: DeliverWebPushInput): Promise<number> {
    if (!shouldSendWebPush(input.payload)) {
      this.logger.debug("Skipped broadcast push delivery: payload opted out.");
      return 0;
    }

    let deliveredCount = 0;

    if (this.webPushConfigured) {
      const subscriptions = await this.findDeliverableWebPushSubscriptions();

      if (subscriptions.length) {
        deliveredCount = await this.sendToWebPushSubscriptions(
          subscriptions,
          input,
        );
        this.logger.log(
          `Web Push broadcast delivered ${deliveredCount}/${subscriptions.length} subscription(s) title="${input.title}"`,
        );
      } else {
        this.logger.log(
          `No deliverable Web Push subscriptions for broadcast title="${input.title}"`,
        );
      }
    } else {
      this.logger.debug("Skipped broadcast Web Push: VAPID not configured.");
    }

    void this.deliverNativeNotificationToAllUsers(input);

    return deliveredCount;
  }

  private configureWebPush(): void {
    const publicKey = env.VAPID_PUBLIC_KEY?.trim();
    const privateKey = env.VAPID_PRIVATE_KEY?.trim();
    const subject = env.VAPID_SUBJECT?.trim();

    if (!publicKey || !privateKey || !subject) {
      this.logger.warn(
        "Web Push is disabled because VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or VAPID_SUBJECT is missing.",
      );
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.webPushConfigured = true;
  }

  private configureFirebase(): void {
    const projectId = env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey = env.FIREBASE_PRIVATE_KEY?.trim()?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        "Native push is disabled because FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY is missing.",
      );
      return;
    }

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    this.fcmConfigured = true;
  }

  private async deliverNativeBadgeSyncToUser(
    userId: string,
    badgeCount: number,
  ): Promise<number> {
    if (!this.fcmConfigured) {
      return 0;
    }

    const tokens = await this.findDeliverableNativeTokens([userId]);
    if (!tokens.length) {
      return 0;
    }

    const data = buildFcmBadgeSyncData(badgeCount);
    let deliveredCount = 0;

    await Promise.all(
      tokens.map(async (tokenRecord) => {
        const didDeliver = await this.sendFcmDataMessage(tokenRecord, data);
        if (didDeliver) {
          deliveredCount += 1;
        }
      }),
    );

    if (deliveredCount > 0) {
      this.logger.log(
        `FCM badge sync delivered ${deliveredCount}/${tokens.length} token(s) for user=${userId} count=${badgeCount}`,
      );
    }

    return deliveredCount;
  }

  private async deliverNativeNotificationToUser(
    userId: string,
    input: DeliverWebPushInput,
    badgeCount: number,
  ): Promise<number> {
    if (!this.fcmConfigured) {
      return 0;
    }

    const tokens = await this.findDeliverableNativeTokens([userId]);
    if (!tokens.length) {
      return 0;
    }

    const data = buildFcmNotificationData({
      title: input.title,
      body: input.body,
      url: buildPushNotificationUrl(input.payload),
      tag: input.tag ?? input.notificationId ?? "negin-heal-push",
      notificationId: input.notificationId,
      badgeCount,
      payload: input.payload,
    });

    let deliveredCount = 0;

    await Promise.all(
      tokens.map(async (tokenRecord) => {
        const didDeliver = await this.sendFcmDataMessage(tokenRecord, data);
        if (didDeliver) {
          deliveredCount += 1;
        }
      }),
    );

    if (deliveredCount > 0) {
      this.logger.log(
        `FCM notification delivered ${deliveredCount}/${tokens.length} token(s) for user=${userId} title="${input.title}"`,
      );
    }

    return deliveredCount;
  }

  private async deliverNativeNotificationToAllUsers(
    input: DeliverWebPushInput,
  ): Promise<number> {
    if (!this.fcmConfigured) {
      return 0;
    }

    const tokens = await this.findDeliverableNativeTokens();
    if (!tokens.length) {
      return 0;
    }

    let deliveredCount = 0;

    await Promise.all(
      tokens.map(async (tokenRecord) => {
        const badgeCount = await countUnreadUserNotifications(
          this.notificationModel,
          tokenRecord.userId.toString(),
        );
        const data = buildFcmNotificationData({
          title: input.title,
          body: input.body,
          url: buildPushNotificationUrl(input.payload),
          tag: input.tag ?? input.notificationId ?? "negin-heal-push",
          notificationId: input.notificationId,
          badgeCount,
          payload: input.payload,
        });
        const didDeliver = await this.sendFcmDataMessage(tokenRecord, data);
        if (didDeliver) {
          deliveredCount += 1;
        }
      }),
    );

    if (deliveredCount > 0) {
      this.logger.log(
        `FCM broadcast delivered ${deliveredCount}/${tokens.length} token(s) title="${input.title}"`,
      );
    }

    return deliveredCount;
  }

  private async findDeliverableWebPushSubscriptions(
    userIds?: string[],
  ): Promise<DeliverableUserPushSubscription[]> {
    const userFilter: FilterQuery<UserDocument> = {
      "preferences.notificationsEnabled": { $ne: false },
      pushSubscriptions: { $exists: true, $not: { $size: 0 } },
    };

    if (userIds?.length) {
      userFilter._id = {
        $in: userIds.map((userId) => new Types.ObjectId(userId)),
      };
    }

    const users = await this.userModel
      .find(userFilter)
      .select({ _id: 1, pushSubscriptions: 1 })
      .lean()
      .exec();

    const subscriptions: DeliverableUserPushSubscription[] = [];

    for (const user of users) {
      for (const rawSubscription of user.pushSubscriptions ?? []) {
        const subscription = normalizeStoredPushSubscription(rawSubscription);
        if (!subscription) {
          continue;
        }

        subscriptions.push({
          userId: user._id,
          ...subscription,
        });
      }
    }

    return subscriptions;
  }

  private async findDeliverableNativeTokens(
    userIds?: string[],
  ): Promise<DeliverableNativePushToken[]> {
    const userFilter: FilterQuery<UserDocument> = {
      "preferences.notificationsEnabled": { $ne: false },
      nativePushTokens: { $exists: true, $not: { $size: 0 } },
    };

    if (userIds?.length) {
      userFilter._id = {
        $in: userIds.map((userId) => new Types.ObjectId(userId)),
      };
    }

    const users = await this.userModel
      .find(userFilter)
      .select({ _id: 1, nativePushTokens: 1 })
      .lean()
      .exec();

    const tokens: DeliverableNativePushToken[] = [];

    for (const user of users) {
      for (const rawToken of user.nativePushTokens ?? []) {
        const token = normalizeStoredNativePushToken(rawToken);
        if (!token) {
          continue;
        }

        tokens.push({
          userId: user._id,
          ...token,
        });
      }
    }

    return tokens;
  }

  private async sendToWebPushSubscriptions(
    subscriptions: DeliverableUserPushSubscription[],
    input: DeliverWebPushInput,
    badgeCount?: number,
  ): Promise<number> {
    if (!subscriptions.length) {
      return 0;
    }

    const resolvedBadgeCount =
      typeof badgeCount === "number"
        ? badgeCount
        : await countUnreadUserNotifications(
            this.notificationModel,
            subscriptions[0].userId.toString(),
          );

    const payload = buildWebPushPayloadJson({
      title: input.title,
      body: input.body,
      notificationId: input.notificationId,
      tag: input.tag,
      badgeCount: resolvedBadgeCount,
      payload: input.payload,
    });

    let deliveredCount = 0;

    await Promise.all(
      subscriptions.map(async (subscription) => {
        const didDeliver = await this.sendWebPushToSubscription(
          subscription,
          payload,
        );
        if (didDeliver) {
          deliveredCount += 1;
        }
      }),
    );

    return deliveredCount;
  }

  private async sendWebPushToSubscription(
    subscription: DeliverableUserPushSubscription,
    payload: string,
  ): Promise<boolean> {
    const webPushSubscription: WebPushSubscriptionPayload = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    try {
      await webpush.sendNotification(webPushSubscription, payload);
      return true;
    } catch (error) {
      const statusCode = this.extractPushErrorStatusCode(error);

      if (statusCode === 404 || statusCode === 410) {
        await this.userModel
          .updateOne(
            { _id: subscription.userId },
            {
              $pull: {
                pushSubscriptions: { endpoint: subscription.endpoint },
              },
            },
          )
          .exec();
        this.logger.debug(
          `Removed expired push subscription endpoint=${subscription.endpoint}`,
        );
        return false;
      }

      this.logger.warn(
        `Failed to deliver Web Push to endpoint=${subscription.endpoint}: ${this.extractErrorMessage(error)}`,
      );
      return false;
    }
  }

  private async sendFcmDataMessage(
    tokenRecord: DeliverableNativePushToken,
    data: Record<string, string>,
  ): Promise<boolean> {
    try {
      await getMessaging().send({
        token: tokenRecord.token,
        data,
        android: {
          priority: "high",
        },
      });
      return true;
    } catch (error) {
      if (this.isInvalidFcmTokenError(error)) {
        await this.userModel
          .updateOne(
            { _id: tokenRecord.userId },
            {
              $pull: {
                nativePushTokens: { token: tokenRecord.token },
              },
            },
          )
          .exec();
        this.logger.debug(
          `Removed expired native push token token=${tokenRecord.token}`,
        );
        return false;
      }

      this.logger.warn(
        `Failed to deliver FCM message to token=${tokenRecord.token}: ${this.extractErrorMessage(error)}`,
      );
      return false;
    }
  }

  private isInvalidFcmTokenError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }

    const code = (error as { code?: unknown }).code;
    return (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token"
    );
  }

  private extractPushErrorStatusCode(error: unknown): number | undefined {
    if (!error || typeof error !== "object") {
      return undefined;
    }

    const statusCode = (error as { statusCode?: unknown }).statusCode;
    return typeof statusCode === "number" ? statusCode : undefined;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
