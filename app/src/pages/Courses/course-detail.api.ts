import type { CourseDiscountType, CourseItemType, CourseReleaseType } from "./courses-list.api";
import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";

export type CourseDetailItem = {
  readonly title: string;
  readonly type: CourseItemType;
  readonly isLocked: boolean;
  readonly fileAccessUrl?: FileAccessUrl | null;
  readonly article?: string | null;
};

export type CourseDetailChapter = {
  readonly key: string;
  readonly title: string;
  readonly description?: string | null;
  readonly visibleAfterMinutes?: number | null;
  readonly isFree: boolean;
  readonly isLocked: boolean;
  readonly items: CourseDetailItem[];
};

export type CourseDetailRecord = {
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly coverImageAccessUrl?: FileAccessUrl | null;
  readonly priceIrt?: number | null;
  readonly discount?: {
    readonly type: CourseDiscountType;
    readonly value: number;
  } | null;
  readonly tags: string[];
  readonly releaseType: CourseReleaseType;
  readonly isFree: boolean;
  readonly isPurchased: boolean;
  readonly purchaseStatus?: UserCoursePurchaseStatus | null;
  readonly chapters: CourseDetailChapter[];
};

export type UserCourseDetailQuery = {
  course: CourseDetailRecord;
};

export type UserCourseDetailQueryVariables = {
  input: {
    id: string;
  };
};

export type UserCoursePaymentMethod =
  | "GATEWAY"
  | "CARD_TO_CARD"
  | "CRYPTOCURRENCY"
  | "FREE";

export type UserCoursePurchaseStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type CouponDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type PaymentCheckoutCard = {
  readonly cardNumber: string;
  readonly holderName: string;
  readonly bankName: string;
};

export type PaymentCheckoutCryptoWallet = {
  readonly address: string;
  readonly network: string;
};

export type PaymentCheckoutMethod = {
  readonly method: UserCoursePaymentMethod;
  readonly isVisible: boolean;
  readonly isActive: boolean;
  readonly isRecommended: boolean;
};

export type UsdtIrtRateConfig = {
  readonly valueIrt: number;
  readonly feeUsdt: number;
  readonly coefficient: number;
};

export type PaymentCheckoutConfig = {
  readonly paymentCards: PaymentCheckoutCard[];
  readonly cryptoWallets: PaymentCheckoutCryptoWallet[];
  readonly paymentMethods: PaymentCheckoutMethod[];
  readonly usdtIrtRate: UsdtIrtRateConfig;
};

export type PaymentCheckoutConfigQuery = {
  readonly paymentCheckoutConfig: PaymentCheckoutConfig;
};

export type CouponValidateRecord = {
  readonly isValid: boolean;
  readonly message?: string | null;
  readonly couponId?: string | null;
  readonly code?: string | null;
  readonly title?: string | null;
  readonly discountType?: CouponDiscountType | null;
  readonly discountValue?: number | null;
  readonly amountIrt?: number | null;
  readonly courseDiscountAmountIrt?: number | null;
  readonly payableAmountBeforeCouponIrt?: number | null;
  readonly couponDiscountAmountIrt?: number | null;
  readonly finalAmountIrt?: number | null;
};

export type CouponValidateQuery = {
  readonly couponValidate: CouponValidateRecord;
};

export type CouponValidateQueryVariables = {
  readonly input: {
    readonly courseId: string;
    readonly code: string;
  };
};

export type UserCoursePurchaseCurrency = "IRT" | "USDT";

export type CoursePurchaseSubmitRecord = {
  readonly id: string;
  readonly courseId: string;
  readonly status: UserCoursePurchaseStatus;
  readonly paymentMethod: UserCoursePaymentMethod;
  readonly currency: UserCoursePurchaseCurrency;
  readonly amountIrt: number;
  readonly discountAmountIrt?: number | null;
  readonly finalAmountIrt: number;
  readonly couponCode?: string | null;
  readonly uploadedReceiptFileId?: string | null;
  readonly paymentReference?: string | null;
  readonly transactionId?: string | null;
  readonly paymentUrl?: string | null;
  readonly paymentAuthority?: string | null;
  readonly isPurchased: boolean;
};

export type CoursePurchaseSubmitMutation = {
  readonly coursePurchaseSubmit: CoursePurchaseSubmitRecord;
};

export type CoursePurchaseSubmitMutationVariables = {
  readonly input: {
    readonly courseId: string;
    readonly paymentMethod: UserCoursePaymentMethod;
    readonly couponCode?: string | null;
    readonly uploadedReceiptFileId?: string | null;
    readonly paymentReference?: string | null;
    readonly transactionId?: string | null;
  };
};

export function getDiscountedPrice(
  priceIrt?: number | null,
  discount?: CourseDetailRecord["discount"],
): number | null {
  if (!priceIrt || !discount || discount.value <= 0) {
    return null;
  }

  const discountAmount =
    discount.type === "PERCENTAGE"
      ? priceIrt * (Math.min(discount.value, 100) / 100)
      : discount.value;
  const discountedPrice = Math.max(0, Math.round(priceIrt - discountAmount));

  return discountedPrice < priceIrt ? discountedPrice : null;
}

export function formatCoursePrice(priceIrt?: number | null): string {
  if (priceIrt == null || priceIrt === 0) {
    return "رایگان";
  }
  return `${priceIrt.toLocaleString("fa-IR").replace(/\u066c/g, ",")} تومان`;
}
