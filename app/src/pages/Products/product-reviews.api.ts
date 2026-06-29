import type { SortOrder } from "./product-list.api";

export type ProductReviewVisibility = "PUBLIC" | "PRIVATE" | "HIDDEN";

export type ProductReviewModerationTarget = "REVIEW" | "RATING" | "MESSAGE";

export type ProductReviewListMode = "endUser" | "admin";

export type ProductReviewPagination = {
  readonly limit: number;
  readonly total: number;
  readonly count: number;
  readonly startCursor?: string | null;
  readonly endCursor?: string | null;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
};

export type EndUserProductReviewRecord = {
  readonly id: string;
  readonly isMine: boolean;
  readonly author: {
    readonly firstName: string;
  };
  readonly rating?: {
    readonly stars: number;
    readonly comment?: string | null;
    readonly ratedAt: string;
    readonly updatedAt?: string | null;
  } | null;
  readonly messages: ReadonlyArray<{
    readonly key: string;
    readonly body: string;
    readonly sentAt: string;
    readonly sender: {
      readonly firstName: string;
      readonly isSupport: boolean;
    };
  }>;
  readonly isSubmissionBlocked?: boolean;
  readonly isRatingHidden?: boolean;
};

export type AdminProductReviewRecord = {
  readonly id: string;
  readonly userId: string;
  readonly productId: string;
  readonly userProductId?: string | null;
  readonly user?: {
    readonly id: string;
    readonly roles?: ReadonlyArray<string> | null;
    readonly profile?: {
      readonly firstName?: string | null;
      readonly lastName?: string | null;
      readonly avatarAccessUrl?: {
        readonly baseUrl?: string | null;
        readonly apiPath?: string | null;
        readonly fileId?: string | null;
        readonly token?: string | null;
        readonly name?: string | null;
        readonly mimeType?: string | null;
        readonly sizeBytes?: number | null;
      } | null;
    } | null;
  } | null;
  readonly userSnapshot: {
    readonly fullName: string;
    readonly username: string;
  };
  readonly productSnapshot: {
    readonly title: string;
  };
  readonly moderation: {
    readonly visibility: ProductReviewVisibility;
    readonly hiddenAt?: string | null;
    readonly hiddenReason?: string | null;
  };
  readonly rating?: {
    readonly stars: number;
    readonly comment?: string | null;
    readonly ratedAt: string;
    readonly updatedAt?: string | null;
    readonly moderation: {
      readonly visibility: ProductReviewVisibility;
      readonly hiddenAt?: string | null;
      readonly hiddenReason?: string | null;
    };
  } | null;
  readonly messages: ReadonlyArray<{
    readonly key: string;
    readonly body: string;
    readonly sentAt: string;
    readonly senderUserId: string;
    readonly senderUser?: {
      readonly id: string;
      readonly profile?: {
        readonly firstName?: string | null;
        readonly lastName?: string | null;
      } | null;
    } | null;
    readonly moderation: {
      readonly visibility: ProductReviewVisibility;
      readonly hiddenAt?: string | null;
      readonly hiddenReason?: string | null;
    };
  }>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type UserProductReviewListQuery = {
  userProductReviewList: {
    items: EndUserProductReviewRecord[];
    pagination: ProductReviewPagination;
    summary: ProductReviewSummaryStats;
  };
};

export type ProductReviewListQuery = {
  productReviewList: {
    items: AdminProductReviewRecord[];
    pagination: ProductReviewPagination;
    summary: ProductReviewSummaryStats;
  };
};

type ProductReviewListSortInput = {
  ratedAt?: SortOrder;
  stars?: SortOrder;
  createdAt?: SortOrder;
  updatedAt?: SortOrder;
};

export type UserProductReviewListQueryVariables = {
  input: {
    filters: {
      productId: string;
      stars?: number;
    };
    options: {
      limit: number;
      startCursor?: string | null;
      sort?: ProductReviewListSortInput;
    };
  };
};

export type ProductReviewListQueryVariables = {
  input: {
    filters?: {
      productId?: string;
      stars?: number;
    };
    options: {
      limit: number;
      startCursor?: string | null;
      sort?: ProductReviewListSortInput;
    };
  };
};

export type ProductReviewSubmitMutation = {
  productReviewSubmit: {
    id: string;
    productId: string;
    isNewRating: boolean;
    rating?: {
      stars: number;
      comment?: string | null;
      ratedAt: string;
      updatedAt?: string | null;
    } | null;
  };
};

export type ProductReviewSubmitMutationVariables = {
  input: {
    productId: string;
    stars?: number;
    comment?: string;
    captchaId?: string;
    captchaValue?: string;
    userId?: string;
    messageVisibility?: ProductReviewVisibility;
  };
};

export type ProductReviewModerationUpdateMutation = {
  productReviewModerationUpdate: {
    id: string;
    moderation: {
      visibility: ProductReviewVisibility;
      hiddenAt?: string | null;
      hiddenReason?: string | null;
    };
    rating?: {
      stars: number;
      moderation: {
        visibility: ProductReviewVisibility;
        hiddenAt?: string | null;
        hiddenReason?: string | null;
      };
    } | null;
    messages: ReadonlyArray<{
      key: string;
      moderation: {
        visibility: ProductReviewVisibility;
        hiddenAt?: string | null;
        hiddenReason?: string | null;
      };
    }>;
  };
};

export type ProductReviewModerationUpdateMutationVariables = {
  input: {
    reviewId: string;
    target: ProductReviewModerationTarget;
    visibility: ProductReviewVisibility;
    messageKey?: string;
    hiddenReason?: string;
  };
};

export const PRODUCT_REVIEW_LIST_PAGE_SIZE = 8;
export const PRODUCT_REVIEW_COMMENT_PREVIEW_LIMIT = 2;
export const PRODUCT_REVIEW_COMMENT_PREVIEW_LENGTH = 180;

export function canUseEndUserProductReviewList(roles: readonly string[] | undefined): boolean {
  if (!roles?.length) {
    return false;
  }

  return roles.includes("END_USER") && !isStaffProductReviewer(roles);
}

export function canUseAdminProductReviewList(roles: readonly string[] | undefined): boolean {
  return isStaffProductReviewer(roles);
}

export function canUseProductReviewExperience(roles: readonly string[] | undefined): boolean {
  return canUseEndUserProductReviewList(roles) || canUseAdminProductReviewList(roles);
}

export function isStaffProductReviewer(roles: readonly string[] | undefined): boolean {
  return roles?.includes("SUPER_ADMIN") === true;
}

export function isStaffReviewOwner(review: AdminProductReviewRecord): boolean {
  return isStaffProductReviewer(review.user?.roles ?? undefined);
}

export function isReviewsSectionVisibleForViewer(input: {
  readonly roles?: readonly string[];
  readonly isReviewsSectionVisible?: boolean | null;
}): boolean {
  if (isStaffProductReviewer(input.roles)) {
    return true;
  }

  return input.isReviewsSectionVisible !== false;
}

export function resolveCanSubmitProductReview(input: {
  readonly isAuthenticated: boolean;
  readonly isFree?: boolean | null;
  readonly isPurchased?: boolean | null;
  readonly purchaseStatus?: string | null;
  readonly roles?: readonly string[];
  readonly isReviewsSectionVisible?: boolean | null;
  readonly isReviewSubmissionEnabled?: boolean | null;
}): boolean {
  if (!input.isAuthenticated) {
    return false;
  }

  if (isStaffProductReviewer(input.roles)) {
    return true;
  }

  if (input.isReviewsSectionVisible === false) {
    return false;
  }

  if (input.isReviewSubmissionEnabled === false) {
    return false;
  }

  const hasPendingManualReview = input.isFree !== true && input.purchaseStatus === "PENDING";
  const hasPendingPurchase = hasPendingManualReview;
  const canAccessProduct =
    input.isFree === true || input.isPurchased === true || input.purchaseStatus === "PAID";

  return canAccessProduct && !hasPendingPurchase;
}

export function findOwnAdminProductReview(
  items: ReadonlyArray<AdminProductReviewRecord>,
  userId: string | undefined
): AdminProductReviewRecord | null {
  if (!userId) {
    return null;
  }

  return items.find((item) => item.userId === userId) ?? null;
}

export function mapAdminProductReviewToEndUserRecord(
  review: AdminProductReviewRecord,
  currentUserId: string
): EndUserProductReviewRecord {
  const isMine = review.userId === currentUserId;
  const authorFirstName =
    review.user?.profile?.firstName?.trim() ||
    review.userSnapshot.fullName?.trim().split(/\s+/)[0] ||
    review.userSnapshot.username?.trim() ||
    "کاربر";

  return {
    id: review.id,
    isMine,
    author: {
      firstName: authorFirstName,
    },
    rating: review.rating
      ? {
          stars: review.rating.stars,
          comment: review.rating.comment,
          ratedAt: review.rating.ratedAt,
          updatedAt: review.rating.updatedAt,
        }
      : undefined,
    messages: review.messages.map((message) => {
      const isSupport = message.senderUserId !== review.userId;

      return {
        key: message.key,
        body: message.body,
        sentAt: message.sentAt,
        sender: {
          firstName: isSupport
            ? "پشتیبانی"
            : message.senderUser?.profile?.firstName?.trim() || authorFirstName,
          isSupport,
        },
      };
    }),
  };
}

export function mapAdminProductReviewToViewerRecord(
  review: AdminProductReviewRecord
): EndUserProductReviewRecord {
  return mapAdminProductReviewToEndUserRecord(review, "__viewer_not_owner__");
}

export function findOwnProductReview(
  items: ReadonlyArray<EndUserProductReviewRecord>
): EndUserProductReviewRecord | null {
  return items.find((item) => item.isMine) ?? null;
}

export const PRODUCT_REVIEW_VISIBILITY_LABEL: Record<ProductReviewVisibility, string> = {
  PUBLIC: "عمومی",
  PRIVATE: "خصوصی",
  HIDDEN: "پنهان",
};

export const PRODUCT_REVIEW_VISIBILITY_OPTIONS: ReadonlyArray<{
  readonly value: ProductReviewVisibility;
  readonly label: string;
}> = [
  { value: "PUBLIC", label: PRODUCT_REVIEW_VISIBILITY_LABEL.PUBLIC },
  { value: "PRIVATE", label: PRODUCT_REVIEW_VISIBILITY_LABEL.PRIVATE },
  { value: "HIDDEN", label: PRODUCT_REVIEW_VISIBILITY_LABEL.HIDDEN },
];

export const PRODUCT_REVIEW_REPLY_VISIBILITY_OPTIONS: ReadonlyArray<{
  readonly value: Extract<ProductReviewVisibility, "PUBLIC" | "PRIVATE">;
  readonly label: string;
}> = [
  { value: "PUBLIC", label: PRODUCT_REVIEW_VISIBILITY_LABEL.PUBLIC },
  { value: "PRIVATE", label: PRODUCT_REVIEW_VISIBILITY_LABEL.PRIVATE },
];

export type ProductReviewReplyVisibility = Extract<ProductReviewVisibility, "PUBLIC" | "PRIVATE">;

export const PRODUCT_REVIEW_STAR_FILTER_OPTIONS: ReadonlyArray<{
  readonly value: number | null;
  readonly label: string;
}> = [
  { value: null, label: "همه" },
  { value: 5, label: "۵ ستاره" },
  { value: 4, label: "۴ ستاره" },
  { value: 3, label: "۳ ستاره" },
  { value: 2, label: "۲ ستاره" },
  { value: 1, label: "۱ ستاره" },
];

export function buildEndUserProductReviewListVariables(
  productId: string,
  starsFilter: number | null,
  startCursor: string | null,
  limit = PRODUCT_REVIEW_LIST_PAGE_SIZE
): UserProductReviewListQueryVariables {
  return {
    input: {
      filters: {
        productId,
        ...(starsFilter != null ? { stars: starsFilter } : {}),
      },
      options: {
        limit,
        ...(startCursor ? { startCursor } : {}),
      },
    },
  };
}

export function buildAdminProductReviewListVariables(
  productId: string,
  starsFilter: number | null,
  startCursor: string | null,
  limit = PRODUCT_REVIEW_LIST_PAGE_SIZE
): ProductReviewListQueryVariables {
  return {
    input: {
      filters: {
        productId,
        ...(starsFilter != null ? { stars: starsFilter } : {}),
      },
      options: {
        limit,
        ...(startCursor ? { startCursor } : {}),
      },
    },
  };
}

export function resolveEndUserReviewAuthorLabel(review: EndUserProductReviewRecord): string {
  const firstName = review.author.firstName?.trim();
  return firstName || "کاربر";
}

export function resolveProductReviewThreadEntryAuthorLabel(input: {
  readonly senderFirstName: string;
  readonly isSupport: boolean;
  readonly isReviewOwnedByViewer: boolean;
}): string {
  if (input.isSupport) {
    return "پشتیبانی";
  }

  if (input.isReviewOwnedByViewer) {
    return "شما";
  }

  const firstName = input.senderFirstName.trim();
  return firstName || "کاربر";
}

export function resolveDefaultReplyVisibility(
  review: AdminProductReviewRecord
): ProductReviewReplyVisibility {
  const timeline: Array<{ sentAt: string; visibility: ProductReviewVisibility }> = [];

  if (review.rating?.comment?.trim()) {
    timeline.push({
      sentAt: review.rating.updatedAt ?? review.rating.ratedAt,
      visibility: review.rating.moderation.visibility,
    });
  }

  for (const message of review.messages) {
    timeline.push({
      sentAt: message.sentAt,
      visibility: message.moderation.visibility,
    });
  }

  if (timeline.length === 0) {
    return "PRIVATE";
  }

  timeline.sort(
    (left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime()
  );

  const lastVisibility = timeline[timeline.length - 1]!.visibility;
  return lastVisibility === "PUBLIC" ? "PUBLIC" : "PRIVATE";
}

export function resolveAdminReviewAuthorLabel(review: AdminProductReviewRecord): string {
  const profile = review.user?.profile;
  const profileName = [profile?.firstName, profile?.lastName]
    .filter((part) => part?.trim())
    .join(" ")
    .trim();
  if (profileName) {
    return profileName;
  }

  const snapshotName = review.userSnapshot.fullName?.trim();
  if (snapshotName) {
    return snapshotName;
  }

  return review.userSnapshot.username?.trim() || "کاربر";
}

export function resolveAdminProductReviewSenderUserLabel(
  senderUser?: AdminProductReviewRecord["messages"][number]["senderUser"]
): string {
  const profileName = [senderUser?.profile?.firstName, senderUser?.profile?.lastName]
    .filter((part) => part?.trim())
    .join(" ")
    .trim();

  return profileName || "کاربر";
}

export function resolveAdminProductReviewMessageSenderLabel(
  review: AdminProductReviewRecord,
  message: AdminProductReviewRecord["messages"][number]
): string {
  if (message.senderUserId === review.userId) {
    return resolveAdminReviewAuthorLabel(review);
  }

  return resolveAdminProductReviewSenderUserLabel(message.senderUser);
}

export function resolveReviewRatingDate(
  rating?: { readonly ratedAt: string; readonly updatedAt?: string | null } | null
): string | null {
  if (!rating) {
    return null;
  }

  return rating.updatedAt ?? rating.ratedAt;
}

export type ProductReviewSummaryStats = {
  readonly averageRating: number | null;
  readonly ratedCount: number;
  readonly distribution: ReadonlyArray<{
    readonly stars: number;
    readonly count: number;
    readonly percentage: number;
  }>;
};

type ProductReviewSummarySourceItem = {
  readonly rating?: {
    readonly stars?: number;
    readonly moderation?: { readonly visibility: ProductReviewVisibility };
  } | null;
  readonly moderation?: { readonly visibility: ProductReviewVisibility };
  readonly isSubmissionBlocked?: boolean;
  readonly isRatingHidden?: boolean;
};

export function isProductReviewRatingEligibleForSummary(
  item: ProductReviewSummarySourceItem
): boolean {
  if (item.isSubmissionBlocked || item.moderation?.visibility === "HIDDEN") {
    return false;
  }

  if (item.isRatingHidden) {
    return false;
  }

  const stars = item.rating?.stars;
  if (stars == null || stars < 1) {
    return false;
  }

  if (item.rating?.moderation?.visibility === "HIDDEN") {
    return false;
  }

  return true;
}

export function mapProductReviewRatingSummaryToStats(
  summary?: ProductReviewSummaryStats | null
): ProductReviewSummaryStats {
  return (
    summary ?? {
      averageRating: null,
      ratedCount: 0,
      distribution: [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: 0,
        percentage: 0,
      })),
    }
  );
}

export function computeProductReviewSummaryStats(
  items: ReadonlyArray<ProductReviewSummarySourceItem>
): ProductReviewSummaryStats {
  const eligibleRatedItems = items.filter(isProductReviewRatingEligibleForSummary);
  const distributionCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: eligibleRatedItems.filter((item) => item.rating?.stars === stars).length,
  }));
  const ratedCount = eligibleRatedItems.length;
  const distributionBase = ratedCount || 1;

  const averageRating =
    ratedCount > 0
      ? eligibleRatedItems.reduce((sum, item) => sum + (item.rating?.stars ?? 0), 0) / ratedCount
      : null;

  return {
    averageRating,
    ratedCount,
    distribution: distributionCounts.map(({ stars, count }) => ({
      stars,
      count,
      percentage: Math.round((count / distributionBase) * 100),
    })),
  };
}

export function shouldTruncateReviewComment(comment: string): boolean {
  return comment.trim().length > PRODUCT_REVIEW_COMMENT_PREVIEW_LENGTH;
}

export function truncateReviewComment(comment: string): string {
  const normalized = comment.trim();
  if (normalized.length <= PRODUCT_REVIEW_COMMENT_PREVIEW_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, PRODUCT_REVIEW_COMMENT_PREVIEW_LENGTH).trimEnd()}…`;
}
