import { Model, Types } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import {
  Course,
  CourseDocument,
  PaymentCoupon,
  PaymentCouponDocument,
  UserCourse,
  UserCourseDocument,
} from "../../database/schemas";
import {
  CourseDiscountType,
  PaymentCouponDiscountType,
  UserCoursePurchaseStatus,
} from "../../enums";
import { PaymentCouponValidateGqlInput } from "./graphql/inputs";
import { PaymentCouponValidateGqlResponse } from "./graphql/responses";

const COMMITTED_PURCHASE_STATUSES = [
  UserCoursePurchaseStatus.PENDING,
  UserCoursePurchaseStatus.PAID,
];

type CourseWithId = Course & { _id: Types.ObjectId };
type PaymentCouponWithId = PaymentCoupon & { _id: Types.ObjectId };

@Injectable()
export class PaymentCouponService {
  constructor(
    @InjectModel(PaymentCoupon.name)
    private readonly paymentCouponModel: Model<PaymentCouponDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourseDocument>,
  ) {}

  async validateForCoursePurchase(
    input: PaymentCouponValidateGqlInput,
    userId: Types.ObjectId,
  ): Promise<PaymentCouponValidateGqlResponse> {
    const normalizedCode = this.normalizeCode(input.code);
    if (!normalizedCode) {
      return this.invalid("کد تخفیف را وارد کنید.");
    }

    const course = await this.courseModel
      .findOne({ _id: input.courseId, isActive: true })
      .lean<CourseWithId>()
      .exec();

    if (!course) {
      return this.invalid("دوره موردنظر پیدا نشد یا فعال نیست.");
    }

    const existingUserCourse = await this.userCourseModel
      .findOne({
        courseId: course._id,
        userId,
        "purchase.status": { $in: COMMITTED_PURCHASE_STATUSES },
      })
      .lean()
      .exec();

    if (existingUserCourse) {
      return this.invalid("شما قبلاً برای این دوره خرید فعال دارید.");
    }

    const priceSummary = this.calculateCoursePriceSummary(course);
    if (priceSummary.payableAmountBeforeCouponIrt <= 0) {
      return this.invalid("این دوره رایگان است و نیازی به کد تخفیف ندارد.");
    }

    const coupon = await this.paymentCouponModel
      .findOne({ code: normalizedCode })
      .lean<PaymentCouponWithId>()
      .exec();

    const invalidCouponReason = await this.getInvalidCouponReason(
      coupon,
      course._id,
      userId,
    );
    if (invalidCouponReason) {
      return this.invalid(invalidCouponReason);
    }

    const couponDiscountAmountIrt = this.calculateCouponDiscountAmount(
      coupon,
      priceSummary.amountIrt,
    );

    if (couponDiscountAmountIrt <= 0) {
      return this.invalid("این کد تخفیف مبلغ قابل پرداخت را کاهش نمی‌دهد.");
    }

    return {
      isValid: true,
      couponId: coupon._id,
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      amountIrt: priceSummary.amountIrt,
      courseDiscountAmountIrt: priceSummary.courseDiscountAmountIrt,
      payableAmountBeforeCouponIrt: priceSummary.payableAmountBeforeCouponIrt,
      couponDiscountAmountIrt,
      finalAmountIrt: Math.max(
        0,
        priceSummary.amountIrt - couponDiscountAmountIrt,
      ),
    };
  }

  private async getInvalidCouponReason(
    coupon: PaymentCouponWithId | null,
    courseId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<string | null> {
    if (!coupon) {
      return "کد تخفیف معتبر نیست.";
    }

    if (!coupon.isActive) {
      return "این کد تخفیف فعال نیست.";
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return "زمان استفاده از این کد تخفیف هنوز شروع نشده است.";
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      return "مهلت استفاده از این کد تخفیف به پایان رسیده است.";
    }

    if (!this.isCouponApplicableToCourse(coupon, courseId)) {
      return "این کد تخفیف برای این دوره قابل استفاده نیست.";
    }

    if (coupon.totalUsageLimit) {
      const totalUsageCount = await this.countCouponUsage(coupon._id);
      if (totalUsageCount >= coupon.totalUsageLimit) {
        return "ظرفیت استفاده از این کد تخفیف تکمیل شده است.";
      }
    }

    if (coupon.perUserUsageLimit) {
      const userUsageCount = await this.countCouponUsage(coupon._id, userId);
      if (userUsageCount >= coupon.perUserUsageLimit) {
        return "شما قبلاً از این کد تخفیف استفاده کرده‌اید.";
      }
    }

    if (coupon.isFirstPurchaseOnly) {
      const userPurchaseCount = await this.userCourseModel.countDocuments({
        userId,
        "purchase.status": { $in: COMMITTED_PURCHASE_STATUSES },
      });

      if (userPurchaseCount > 0) {
        return "این کد تخفیف فقط برای اولین خرید قابل استفاده است.";
      }
    }

    return null;
  }

  private countCouponUsage(
    couponId: Types.ObjectId,
    userId?: Types.ObjectId,
  ): Promise<number> {
    return this.userCourseModel.countDocuments({
      ...(userId ? { userId } : {}),
      "purchase.couponSnapshot.couponId": couponId,
      "purchase.status": { $in: COMMITTED_PURCHASE_STATUSES },
    });
  }

  private isCouponApplicableToCourse(
    coupon: PaymentCouponWithId,
    courseId: Types.ObjectId,
  ): boolean {
    if (!coupon.applicableCourseIds?.length) {
      return true;
    }

    return coupon.applicableCourseIds.some((applicableCourseId) =>
      applicableCourseId.equals(courseId),
    );
  }

  private calculateCoursePriceSummary(course: Course): {
    amountIrt: number;
    courseDiscountAmountIrt: number;
    payableAmountBeforeCouponIrt: number;
  } {
    const amountIrt = Math.max(0, course.priceIrt ?? 0);
    const courseDiscountAmountIrt = this.calculateCourseDiscountAmount(course);

    return {
      amountIrt,
      courseDiscountAmountIrt,
      payableAmountBeforeCouponIrt: Math.max(
        0,
        amountIrt - courseDiscountAmountIrt,
      ),
    };
  }

  private calculateCourseDiscountAmount(course: Course): number {
    const priceIrt = Math.max(0, course.priceIrt ?? 0);
    const discount = course.discount;

    if (!discount || discount.value <= 0 || priceIrt <= 0) {
      return 0;
    }

    if (discount.type === CourseDiscountType.PERCENTAGE) {
      return Math.round(priceIrt * (Math.min(discount.value, 100) / 100));
    }

    return Math.min(priceIrt, discount.value);
  }

  private calculateCouponDiscountAmount(
    coupon: PaymentCoupon,
    amountIrt: number,
  ): number {
    if (coupon.discountType === PaymentCouponDiscountType.PERCENTAGE) {
      return Math.min(
        amountIrt,
        Math.round(amountIrt * (Math.min(coupon.discountValue, 100) / 100)),
      );
    }

    return Math.min(amountIrt, coupon.discountValue);
  }

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  private invalid(message: string): PaymentCouponValidateGqlResponse {
    return {
      isValid: false,
      message,
    };
  }
}
