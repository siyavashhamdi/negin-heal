import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";

import {
  Product,
  ProductChapter,
  ProductDocument,
  NotificationDocument,
  UserProduct,
  UserProductDocument,
} from "../../database/schemas";
import {
  GeneralSubscriptionUpdateType,
  GlobalAnouncementMessageType,
  NotificationMode,
  NotificationSource,
  UserProductPurchaseStatus,
} from "../../enums";
import { UserSubscriptionService } from "../user";
import { NotificationService } from "../notification";
import { PushNotificationService } from "../push-notification";
import {
  resolveWebPushBody,
  resolveWebPushTitle,
} from "../push-notification/utils/resolve-web-push-content.util";
import { coercePaidAt } from "./chapter-access.util";
import {
  buildChapterReleasePushClaimFilter,
  buildChapterReleaseRetryClaimFilter,
  findDueChapterReleaseNotifications,
  getCompletedNotificationChapterKeys,
} from "./chapter-release-notification.util";

const USER_PRODUCT_BATCH_SIZE = 200;
const CHAPTER_RELEASE_NOTIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

type GradualReleaseProduct = Pick<Product, "title" | "chapters"> & {
  _id: Types.ObjectId;
};

type PendingReleaseUserProduct = Pick<
  UserProduct,
  "productId" | "productSnapshot" | "purchase" | "chapterReleaseNotifications"
> & {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
};

export type ChapterReleaseNotificationRunResult = {
  scannedUserProducts: number;
  notifiedChapters: number;
  skippedChapters: number;
};

@Injectable()
export class ChapterReleaseNotificationService {
  private readonly logger = new Logger(ChapterReleaseNotificationService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(UserProduct.name)
    private readonly userProductModel: Model<UserProductDocument>,
    private readonly notificationService: NotificationService,
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async processPendingNotifications(): Promise<ChapterReleaseNotificationRunResult> {
    const gradualProducts = await this.findGradualReleaseProducts();

    if (!gradualProducts.length) {
      this.logger.log(
        "Chapter release check: no products with scheduled chapter unlocks found; nothing to notify.",
      );
      return {
        scannedUserProducts: 0,
        notifiedChapters: 0,
        skippedChapters: 0,
      };
    }

    const productById = new Map(
      gradualProducts.map((product) => [product._id.toString(), product]),
    );
    const productIds = gradualProducts.map((product) => product._id);

    let scannedUserProducts = 0;
    let notifiedChapters = 0;
    let skippedChapters = 0;
    let lastUserProductId: Types.ObjectId | undefined;

    while (true) {
      const userProducts = await this.findPendingReleaseUserProducts(
        productIds,
        lastUserProductId,
      );

      if (!userProducts.length) {
        break;
      }

      for (const userProduct of userProducts) {
        scannedUserProducts += 1;

        const product = productById.get(userProduct.productId.toString());
        if (!product) {
          continue;
        }

        const chaptersToNotify = this.findChaptersPendingReleaseNotification(
          product,
          userProduct,
        );

        for (const chapter of chaptersToNotify) {
          try {
            const didNotify = await this.notifyChapterReleased(
              userProduct,
              product,
              chapter,
            );

            if (didNotify) {
              notifiedChapters += 1;
            } else {
              skippedChapters += 1;
            }
          } catch (error) {
            skippedChapters += 1;
            this.logger.error(
              `Failed chapter release notification for userProduct=${userProduct._id.toString()} chapter=${chapter.key}`,
              error instanceof Error ? error.stack : String(error),
            );
          }
        }
      }

      lastUserProductId = userProducts[userProducts.length - 1]?._id;
      if (userProducts.length < USER_PRODUCT_BATCH_SIZE) {
        break;
      }
    }

    if (notifiedChapters > 0) {
      this.logger.log(
        `Chapter release notifications sent: ${notifiedChapters} chapter(s) across ${scannedUserProducts} user product(s)`,
      );
    } else {
      this.logger.log(
        "Chapter release check completed: no due chapter unlock notifications found.",
      );
    }

    return {
      scannedUserProducts,
      notifiedChapters,
      skippedChapters,
    };
  }

  private async findGradualReleaseProducts(): Promise<GradualReleaseProduct[]> {
    return this.productModel
      .find({
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
        chapters: {
          $elemMatch: {
            isFree: { $ne: true },
            visibleAfterMinutes: { $gte: 0, $type: "number" },
          },
        },
      })
      .select({ title: 1, chapters: 1 })
      .lean<GradualReleaseProduct[]>()
      .exec();
  }

  private async findPendingReleaseUserProducts(
    productIds: Types.ObjectId[],
    lastUserProductId?: Types.ObjectId,
  ): Promise<PendingReleaseUserProduct[]> {
    const query: FilterQuery<UserProduct> = {
      productId: { $in: productIds },
      "purchase.status": UserProductPurchaseStatus.PAID,
      "purchase.paidAt": { $exists: true, $ne: null },
      $or: [
        { "audit.deletedAt": null },
        { "audit.deletedAt": { $exists: false } },
      ],
    };

    if (lastUserProductId) {
      query._id = { $gt: lastUserProductId };
    }

    return this.userProductModel
      .find(query)
      .sort({ _id: 1 })
      .limit(USER_PRODUCT_BATCH_SIZE)
      .select({
        userId: 1,
        productId: 1,
        productSnapshot: 1,
        purchase: 1,
        chapterReleaseNotifications: 1,
      })
      .lean<PendingReleaseUserProduct[]>()
      .exec();
  }

  private findChaptersPendingReleaseNotification(
    product: GradualReleaseProduct,
    userProduct: PendingReleaseUserProduct,
  ): ProductChapter[] {
    const paidAt = userProduct.purchase.paidAt;
    if (!coercePaidAt(paidAt)) {
      return [];
    }

    const notifiedKeys = getCompletedNotificationChapterKeys(
      userProduct.chapterReleaseNotifications?.chapters,
    );

    return findDueChapterReleaseNotifications(
      product.chapters || [],
      paidAt,
      notifiedKeys,
      new Date(),
    );
  }

  private async notifyChapterReleased(
    userProduct: PendingReleaseUserProduct,
    product: GradualReleaseProduct,
    chapter: ProductChapter,
  ): Promise<boolean> {
    const productId = userProduct.productId.toString();
    const productTitle =
      this.normalizeText(userProduct.productSnapshot?.title) ||
      this.normalizeText(product.title) ||
      "دوره";
    const chapterTitle = this.normalizeText(chapter.title) || "فصل";
    const title = "فصل جدید قابل مشاهده است";
    const message = `فصل «${chapterTitle}» از دوره «${productTitle}» اکنون برای شما قابل دسترس است.`;
    const notificationPayload: Record<string, unknown> = {
      productId,
      chapterKey: chapter.key,
    };
    const visibleUntil = new Date(
      Date.now() + CHAPTER_RELEASE_NOTIFICATION_TTL_MS,
    );
    const subscriptionPayload: Record<string, unknown> = {
      ...notificationPayload,
      messageType: GlobalAnouncementMessageType.SNACKBAR,
      isPushNotification: true,
      title: null,
      description: message,
      mode: NotificationMode.INFO,
    };

    const claimed = await this.claimChapterNotificationSlot(
      userProduct._id,
      chapter.key,
      chapterTitle,
    );

    if (!claimed) {
      return false;
    }

    let notification: NotificationDocument;

    try {
      notification = await this.notificationService.createForEndUser({
        userId: userProduct.userId,
        source: NotificationSource.PRODUCT_CHAPTER,
        mode: NotificationMode.SUCCESS,
        title,
        message,
        payload: notificationPayload,
        visibleUntil,
      });

      const linkResult = await this.userProductModel.updateOne(
        { _id: userProduct._id },
        {
          $set: {
            "chapterReleaseNotifications.chapters.$[chapter].notificationId":
              notification._id,
          },
        },
        {
          arrayFilters: [
            {
              "chapter.key": chapter.key,
              $or: [
                { "chapter.notificationId": { $exists: false } },
                { "chapter.notificationId": null },
              ],
            },
          ],
        },
      );

      if (linkResult.matchedCount === 0) {
        this.logger.warn(
          `Chapter release notification created but userProduct link failed for userProduct=${userProduct._id.toString()} chapter=${chapter.key}`,
        );
      }
    } catch (error) {
      await this.userProductModel.updateOne(
        { _id: userProduct._id },
        {
          $pull: {
            "chapterReleaseNotifications.chapters": { key: chapter.key },
          },
        },
      );
      throw error;
    }

    await this.userSubscriptionService.publishToUser({
      userId: userProduct.userId.toString(),
      updateType: GeneralSubscriptionUpdateType.NOTIFICATION,
      targetId: notification._id.toString(),
      payload: subscriptionPayload,
    });

    void this.pushNotificationService.deliverToUser(
      userProduct.userId.toString(),
      {
        title: resolveWebPushTitle(subscriptionPayload, title),
        body: resolveWebPushBody(subscriptionPayload, message),
        notificationId: notification._id.toString(),
        payload: subscriptionPayload,
        tag: notification._id.toString(),
      },
    );

    return true;
  }

  private async claimChapterNotificationSlot(
    userProductId: Types.ObjectId,
    chapterKey: string,
    chapterTitle: string,
  ): Promise<boolean> {
    const notificationSentAt = new Date();
    const chapterEntry = {
      key: chapterKey,
      titleSnapshot: chapterTitle,
      notificationSentAt,
    };

    const retryResult = await this.userProductModel.updateOne(
      buildChapterReleaseRetryClaimFilter(userProductId, chapterKey),
      {
        $set: {
          "chapterReleaseNotifications.chapters.$.titleSnapshot": chapterTitle,
          "chapterReleaseNotifications.chapters.$.notificationSentAt":
            notificationSentAt,
        },
      },
    );

    if (retryResult.matchedCount > 0) {
      return true;
    }

    const claimResult = await this.userProductModel.updateOne(
      buildChapterReleasePushClaimFilter(userProductId, chapterKey),
      {
        $push: {
          "chapterReleaseNotifications.chapters": chapterEntry,
        },
      },
    );

    return claimResult.modifiedCount > 0;
  }

  private normalizeText(value?: string | null): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
  }
}
