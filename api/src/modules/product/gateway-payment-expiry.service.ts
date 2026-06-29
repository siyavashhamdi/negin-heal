import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import {
  BadgeCountTriggerAction,
  BadgeCountTriggerSource,
  PurchaseStatusChangedBy,
  UserProductPurchaseStatus,
} from "../../enums";
import { UserProduct, UserProductDocument } from "../../database/schemas";
import { BadgeService } from "../badge";

export type GatewayPaymentExpiryRunResult = {
  expiredCount: number;
};

@Injectable()
export class GatewayPaymentExpiryService {
  private readonly logger = new Logger(GatewayPaymentExpiryService.name);
  private static readonly EXPIRY_MS = 30 * 60 * 1000;
  private static readonly EXPIRED_DESCRIPTION =
    "پرداخت درگاه پس از ۳۰ دقیقه تکمیل نشد.";

  constructor(
    @InjectModel(UserProduct.name)
    private readonly userProductModel: Model<UserProductDocument>,
    private readonly badgeService: BadgeService,
  ) {}

  async expireStaleGatewayPayments(): Promise<GatewayPaymentExpiryRunResult> {
    const cutoffDate = new Date(
      Date.now() - GatewayPaymentExpiryService.EXPIRY_MS,
    );

    const staleGatewayPurchases = await this.userProductModel
      .find({
        "purchase.status": UserProductPurchaseStatus.PENDING_GATEWAY,
        "purchase.gatewayPendingAt": { $exists: true, $lte: cutoffDate },
      })
      .exec();

    if (!staleGatewayPurchases.length) {
      this.logger.log(
        "Gateway payment expiry: no stale gateway payments to fail",
      );
      return { expiredCount: 0 };
    }

    const now = new Date();
    let expiredCount = 0;

    for (const userProduct of staleGatewayPurchases) {
      userProduct.purchase.status = UserProductPurchaseStatus.FAILED;
      userProduct.purchase.failedAt = now;
      userProduct.purchase.statusChangedBy = PurchaseStatusChangedBy.SYSTEM;
      userProduct.purchase.isManualStatusChange = false;
      userProduct.purchase.manualStatusChangedBy = undefined;
      userProduct.purchase.manualStatusChangedDescription =
        GatewayPaymentExpiryService.EXPIRED_DESCRIPTION;

      const savedUserProduct = await userProduct.save();

      await this.badgeService.publishCountSignal({
        payload: {
          source: BadgeCountTriggerSource.PAYMENT,
          action: BadgeCountTriggerAction.UPDATED,
          productId: savedUserProduct.productId.toString(),
          userProductId: savedUserProduct._id.toString(),
        },
      });

      expiredCount++;
    }

    this.logger.log(
      `Gateway payment expiry: marked ${expiredCount} payment(s) as failed`,
    );

    return { expiredCount };
  }
}
