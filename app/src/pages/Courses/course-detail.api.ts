import type { CourseDiscountType, CourseItemType, CourseReleaseType } from "./courses-list.api";
import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";
import { CHAPTER_UNLOCK_COUNTDOWN_THRESHOLD_MS } from "../../constants/course.constants";

export type CourseDetailItem = {
  readonly title: string;
  readonly type: CourseItemType;
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
  readonly unlocksAt?: string | null;
  readonly isCompleted: boolean;
  readonly userCompletedAt?: string | null;
  readonly items?: CourseDetailItem[] | null;
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
  readonly completedChapterCount: number;
  readonly accessibleChapterCount: number;
  readonly isReviewSubmissionEnabled: boolean;
  readonly isReviewsSectionVisible: boolean;
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

export type UserCoursePaymentMethod = "GATEWAY" | "CARD_TO_CARD" | "CRYPTOCURRENCY" | "FREE";

export type UserCoursePurchaseStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";

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

export type CourseChapterCompleteRecord = {
  readonly key: string;
  readonly titleSnapshot: string;
  readonly userCompletedAt: string;
  readonly completedChapterCount: number;
  readonly accessibleChapterCount: number;
};

export type CourseChapterCompleteMutation = {
  readonly courseChapterComplete: CourseChapterCompleteRecord;
};

export type CourseChapterCompleteMutationVariables = {
  readonly input: {
    readonly courseId: string;
    readonly chapterKey: string;
  };
};

export function getDiscountedPrice(
  priceIrt?: number | null,
  discount?: CourseDetailRecord["discount"]
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

function startOfLocalDay(date: Date): Date {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  return dayStart;
}

function isTomorrow(unlockDate: Date, now: Date): boolean {
  const tomorrowStart = startOfLocalDay(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfterTomorrowStart = startOfLocalDay(now);
  dayAfterTomorrowStart.setDate(dayAfterTomorrowStart.getDate() + 2);

  return (
    unlockDate.getTime() >= tomorrowStart.getTime() &&
    unlockDate.getTime() < dayAfterTomorrowStart.getTime()
  );
}

function diffInCalendarDays(unlockDate: Date, now: Date): number {
  const unlockDay = startOfLocalDay(unlockDate).getTime();
  const today = startOfLocalDay(now).getTime();
  return Math.round((unlockDay - today) / 86_400_000);
}

export function getChapterUnlockRemainingMs(
  unlocksAt?: string | null,
  now: Date = new Date()
): number | null {
  if (!unlocksAt) {
    return null;
  }

  const unlockDate = new Date(unlocksAt);
  if (Number.isNaN(unlockDate.getTime())) {
    return null;
  }

  return unlockDate.getTime() - now.getTime();
}

export function shouldShowChapterUnlockCountdown(
  unlocksAt?: string | null,
  now: Date = new Date()
): boolean {
  const remainingMs = getChapterUnlockRemainingMs(unlocksAt, now);
  if (remainingMs == null) {
    return false;
  }

  return remainingMs > 0 && remainingMs < CHAPTER_UNLOCK_COUNTDOWN_THRESHOLD_MS;
}

export function formatChapterUnlockCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formatted = [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");

  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

  return formatted.replace(/\d/g, (digit) => persianDigits.charAt(Number(digit)));
}

export function formatChapterUnlockRelativeMessage(
  unlocksAt?: string | null,
  now: Date = new Date()
): string | null {
  if (!unlocksAt) {
    return null;
  }

  const unlockDate = new Date(unlocksAt);
  if (Number.isNaN(unlockDate.getTime())) {
    return null;
  }

  const diffMs = unlockDate.getTime() - now.getTime();
  if (diffMs <= 0 || diffMs < CHAPTER_UNLOCK_COUNTDOWN_THRESHOLD_MS) {
    return null;
  }

  if (isTomorrow(unlockDate, now)) {
    return "طبق زمانبندی‌، این فصل فردا قابل مشاهده خواهد بود.";
  }

  const daysUntil = diffInCalendarDays(unlockDate, now);
  if (daysUntil >= 2) {
    return "طبق زمانبندی‌، این فصل در روزهای آینده قابل مشاهده خواهد بود.";
  }

  return "این فصل به‌زودی قابل مشاهده خواهد بود.";
}

export function isGradualChapterLock(
  chapter: Pick<CourseDetailChapter, "isLocked" | "unlocksAt">
): boolean {
  return chapter.isLocked && Boolean(chapter.unlocksAt);
}

type CourseDetailCopyContext = {
  readonly isSingleChapter: boolean;
  readonly isGradualRelease: boolean;
  readonly hasLockedChapters: boolean;
  readonly canAccessCourse: boolean;
  readonly totalItems: number;
};

export function getCourseContentIntroText({
  isSingleChapter,
  totalItems,
}: Pick<CourseDetailCopyContext, "isSingleChapter" | "totalItems">): string {
  if (!isSingleChapter) {
    return "فصل‌ها را به ترتیب جلو ببرید.";
  }

  if (totalItems === 0) {
    return "هنوز آیتمی برای این دوره ثبت نشده است.";
  }

  if (totalItems === 1) {
    return "محتوای دوره را مشاهده و مرور کنید.";
  }

  return "آیتم‌های دوره را مشاهده و مرور کنید.";
}

export function getCourseContentAccessNoteText({
  isSingleChapter,
  isGradualRelease,
  hasLockedChapters,
  canAccessCourse,
  totalItems,
}: Pick<
  CourseDetailCopyContext,
  "isSingleChapter" | "isGradualRelease" | "hasLockedChapters" | "canAccessCourse" | "totalItems"
>): string {
  if (isSingleChapter && totalItems === 0) {
    return "";
  }

  if (canAccessCourse) {
    if (!hasLockedChapters) {
      return isSingleChapter ? " همه محتوا در دسترس شماست." : " همه فصل‌ها در دسترس شماست.";
    }

    if (isGradualRelease) {
      return isSingleChapter
        ? " محتوای زمان‌بندی‌شده در زمان مقرر باز می‌شود."
        : " فصل‌های زمان‌بندی‌شده در زمان مقرر باز می‌شوند.";
    }

    return isSingleChapter ? " بخشی از محتوا هنوز قفل است." : " برخی فصل‌ها هنوز قفل هستند.";
  }

  if (isGradualRelease) {
    return isSingleChapter
      ? " پس از خرید، محتوا طبق زمان‌بندی انتشار در دسترس قرار می‌گیرد."
      : " فصل‌های زمان‌بندی‌شده پس از خرید، در زمان مقرر باز می‌شوند.";
  }

  if (hasLockedChapters) {
    return isSingleChapter
      ? " پس از خرید، به همه محتوا دسترسی خواهید داشت."
      : " فصل‌های قفل‌شده بعد از خرید دوره باز می‌شوند.";
  }

  return "";
}

export function getPurchaseCardAccessCaption({
  isSingleChapter,
  isGradualRelease,
}: Pick<CourseDetailCopyContext, "isSingleChapter" | "isGradualRelease">): string {
  if (isGradualRelease) {
    return isSingleChapter
      ? "بعد از خرید، محتوا طبق زمان‌بندی انتشار در دسترس قرار می‌گیرد."
      : "بعد از خرید، فصل‌ها و آیتم‌های دوره طبق زمان‌بندی انتشار در دسترس قرار می‌گیرند.";
  }

  return isSingleChapter
    ? "بعد از خرید، بلافاصله به محتوای دوره دسترسی پیدا می‌کنید."
    : "بعد از خرید، بلافاصله به فصل‌ها و آیتم‌های دوره دسترسی پیدا می‌کنید.";
}
