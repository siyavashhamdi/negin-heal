import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import {
  BadgeCountTriggerAction,
  BadgeCountTriggerSource,
  PurchaseStatusChangedBy,
  UserCoursePurchaseStatus,
} from "../../enums";
import { UserCourse, UserCourseDocument } from "../../database/schemas";
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
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourseDocument>,
    private readonly badgeService: BadgeService,
  ) {}

  async expireStaleGatewayPayments(): Promise<GatewayPaymentExpiryRunResult> {
    const cutoffDate = new Date(Date.now() - GatewayPaymentExpiryService.EXPIRY_MS);

    const staleGatewayPurchases = await this.userCourseModel
      .find({
        "purchase.status": UserCoursePurchaseStatus.PENDING_GATEWAY,
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

    for (const userCourse of staleGatewayPurchases) {
      userCourse.purchase.status = UserCoursePurchaseStatus.FAILED;
      userCourse.purchase.failedAt = now;
      userCourse.purchase.statusChangedBy = PurchaseStatusChangedBy.SYSTEM;
      userCourse.purchase.isManualStatusChange = false;
      userCourse.purchase.manualStatusChangedBy = undefined;
      userCourse.purchase.manualStatusChangedDescription =
        GatewayPaymentExpiryService.EXPIRED_DESCRIPTION;

      const savedUserCourse = await userCourse.save();

      await this.badgeService.publishCountSignal({
        payload: {
          source: BadgeCountTriggerSource.PAYMENT,
          action: BadgeCountTriggerAction.UPDATED,
          courseId: savedUserCourse.courseId.toString(),
          userCourseId: savedUserCourse._id.toString(),
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
