import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import * as webpush from "web-push";

import { env } from "../../config";
import {
  User,
  UserDocument,
  UserPushSubscription,
} from "../../database/schemas";
import { buildPushNotificationUrl } from "./utils/build-push-notification-url.util";
import { shouldSendWebPush } from "./utils/should-send-web-push.util";
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
  private configured = false;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    this.configureWebPush();
  }

  isEnabled(): boolean {
    return this.configured;
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

  async deliverToUser(
    userId: string,
    input: DeliverWebPushInput,
  ): Promise<number> {
    if (!this.configured) {
      this.logger.debug(
        `Skipped Web Push for user=${userId}: VAPID not configured.`,
      );
      return 0;
    }

    if (!shouldSendWebPush(input.payload)) {
      this.logger.debug(
        `Skipped Web Push for user=${userId}: payload opted out.`,
      );
      return 0;
    }

    const subscriptions = await this.findDeliverableSubscriptions([userId]);
    if (!subscriptions.length) {
      this.logger.log(
        `No deliverable push subscriptions for user=${userId} title="${input.title}"`,
      );
      return 0;
    }

    const deliveredCount = await this.sendToSubscriptions(subscriptions, input);
    this.logger.log(
      `Web Push delivered ${deliveredCount}/${subscriptions.length} subscription(s) for user=${userId} title="${input.title}"`,
    );
    return deliveredCount;
  }

  async deliverToAllUsers(input: DeliverWebPushInput): Promise<number> {
    if (!this.configured) {
      this.logger.debug("Skipped broadcast Web Push: VAPID not configured.");
      return 0;
    }

    if (!shouldSendWebPush(input.payload)) {
      this.logger.debug("Skipped broadcast Web Push: payload opted out.");
      return 0;
    }

    const subscriptions = await this.findDeliverableSubscriptions();
    if (!subscriptions.length) {
      this.logger.log(
        `No deliverable push subscriptions for broadcast title="${input.title}"`,
      );
      return 0;
    }

    const deliveredCount = await this.sendToSubscriptions(subscriptions, input);
    this.logger.log(
      `Web Push broadcast delivered ${deliveredCount}/${subscriptions.length} subscription(s) title="${input.title}"`,
    );
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
    this.configured = true;
  }

  private async findDeliverableSubscriptions(
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

  private async sendToSubscriptions(
    subscriptions: DeliverableUserPushSubscription[],
    input: DeliverWebPushInput,
  ): Promise<number> {
    if (!subscriptions.length) {
      return 0;
    }

    const payload = JSON.stringify({
      title: input.title,
      body: input.body,
      url: buildPushNotificationUrl(input.payload),
      tag: input.tag ?? input.notificationId ?? "negin-heal-push",
      notificationId: input.notificationId,
    });

    let deliveredCount = 0;

    await Promise.all(
      subscriptions.map(async (subscription) => {
        const didDeliver = await this.sendToSubscription(subscription, payload);
        if (didDeliver) {
          deliveredCount += 1;
        }
      }),
    );

    return deliveredCount;
  }

  private async sendToSubscription(
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
