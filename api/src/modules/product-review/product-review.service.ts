import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomUUID } from "crypto";
import { FilterQuery, Model, PipelineStage, Types } from "mongoose";

import { PAGINATION_CONSTANT } from "../../constants";
import { EXCEPTION_CONSTANT } from "../../constants/exception.constant";
import { env } from "../../config";
import {
  Product,
  ProductDocument,
  ProductReview,
  ProductReviewDocument,
  ProductReviewMessage,
  ProductReviewModeration,
  ProductReviewRating,
  ProductReviewUserSnapshot,
  User,
  UserProduct,
  UserProductDocument,
  UserDocument,
} from "../../database/schemas";
import {
  ProductReviewVisibility,
  ProductReviewModerationTarget,
  UserProductPurchaseStatus,
  UserRole,
  UserStatus,
} from "../../enums";
import { FileService, FileAccessUrlDescriptor } from "../file";
import { resolveAvatarAccessUrl } from "../file/file-access-url.util";
import { isProductFree } from "../product/product-pricing.util";
import {
  ProductReviewListGqlInput,
  ProductReviewModerationUpdateGqlInput,
  ProductReviewSubmitGqlInput,
  UserProductReviewListGqlInput,
} from "./graphql/inputs";
import {
  ProductReviewListGqlResponse,
  ProductReviewListPaginatedCursorGqlResponse,
  ProductReviewModerationGqlResponse,
  ProductReviewRatingSummaryGqlResponse,
  ProductReviewSubmitGqlResponse,
  UserProductReviewListGqlResponse,
  UserProductReviewListPaginatedCursorGqlResponse,
} from "./graphql/responses";
import { UserMinimalGqlResponse } from "../user/graphql/responses/common";
import {
  CaptchaVerificationStatus,
  UserCaptchaService,
} from "../user/user-captcha.service";

type ProductReviewEndUserListRecord = Pick<
  ProductReview,
  "_id" | "userId" | "userSnapshot" | "moderation" | "rating" | "messages"
>;

type ProductReviewAdminListRecord = Pick<
  ProductReview,
  | "_id"
  | "userId"
  | "productId"
  | "userProductId"
  | "userSnapshot"
  | "productSnapshot"
  | "moderation"
  | "rating"
  | "messages"
  | "audit"
>;

type ProductReviewUserLookupRecord = Pick<
  User,
  "profile" | "status" | "audit" | "roles"
> & {
  _id: Types.ObjectId;
};

type ProductReviewRelatedLookups = {
  usersById: Map<string, ProductReviewUserLookupRecord>;
  avatarAccessUrlMap: Map<string, FileAccessUrlDescriptor>;
};

type ProductReviewCursorListOptions =
  | UserProductReviewListGqlInput["options"]
  | ProductReviewListGqlInput["options"];

@Injectable()
export class ProductReviewService {
  constructor(
    @InjectModel(ProductReview.name)
    private readonly productReviewModel: Model<ProductReviewDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(UserProduct.name)
    private readonly userProductModel: Model<UserProductDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly fileService: FileService,
    private readonly userCaptchaService: UserCaptchaService,
  ) {}

  async submitReview(
    input: ProductReviewSubmitGqlInput,
    actorUserId: Types.ObjectId,
    actorRoles: UserRole[],
  ): Promise<ProductReviewSubmitGqlResponse> {
    const isStaff = this.isStaffRole(actorRoles);
    if (!isStaff && env.CAPTCHA_ENABLED) {
      this.verifyCaptcha(input.captchaId, input.captchaValue);
    }

    const targetUserId = this.resolveSubmitTargetUserId(
      input.userId,
      actorUserId,
      isStaff,
    );
    const isStaffSupportSubmit = this.isStaffSupportSubmit(
      input,
      actorUserId,
      isStaff,
    );
    const product = await this.productModel.findById(input.productId).exec();
    if (!product) {
      throw new BadRequestException(EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND);
    }

    if (!product.isActive && !isStaff) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PRODUCT_NOT_AVAILABLE_FOR_REVIEW,
      );
    }

    if (!isStaff && product.isReviewsSectionVisible === false) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PRODUCT_REVIEWS_SECTION_DISABLED,
      );
    }

    if (!isStaff && product.isReviewSubmissionEnabled === false) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PRODUCT_REVIEW_SUBMISSION_DISABLED,
      );
    }

    const needsStaffActor =
      isStaffSupportSubmit &&
      Boolean(this.normalizeOptionalText(input.comment));

    const [targetUser, userProduct, actorUser] = await Promise.all([
      this.userModel.findById(targetUserId).exec(),
      this.userProductModel
        .findOne({
          productId: input.productId,
          userId: targetUserId,
          "purchase.status": UserProductPurchaseStatus.PAID,
        })
        .exec(),
      needsStaffActor
        ? this.userModel.findById(actorUserId).exec()
        : Promise.resolve(null),
    ]);

    if (!targetUser) {
      throw new BadRequestException(EXCEPTION_CONSTANT.USER_NOT_FOUND);
    }

    const productIsFree = isProductFree(product);
    const requiresPaidEnrollment =
      (!isStaff || isStaffSupportSubmit) && !productIsFree;

    if (!userProduct && requiresPaidEnrollment) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PRODUCT_REVIEW_PAID_ENROLLMENT_REQUIRED,
      );
    }

    if (needsStaffActor && !actorUser) {
      throw new BadRequestException(EXCEPTION_CONSTANT.STAFF_USER_NOT_FOUND);
    }

    if (userProduct && !this.isSameObjectId(userProduct.userId, targetUserId)) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PRODUCT_REVIEW_ENROLLMENT_USER_MISMATCH,
      );
    }

    if (
      userProduct &&
      !this.isSameObjectId(userProduct.productId, input.productId)
    ) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PRODUCT_REVIEW_ENROLLMENT_MISMATCH,
      );
    }

    const now = new Date();
    const normalizedComment = this.normalizeOptionalText(input.comment);
    const hasStarInput = this.hasSubmitStarInput(input.stars);
    const hasCommentInput = Boolean(normalizedComment);

    if (!hasStarInput && !hasCommentInput) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PRODUCT_REVIEW_INPUT_REQUIRED,
      );
    }

    let review = await this.resolveExistingReviewForSubmit(
      userProduct?._id ?? null,
      targetUserId,
      input.productId,
    );

    this.assertEndUserSubmitAllowed(
      review,
      hasStarInput,
      hasCommentInput,
      isStaffSupportSubmit,
    );

    const userSnapshot = this.toProductReviewUserSnapshot(targetUser);
    const staffSnapshot = actorUser
      ? this.toProductReviewUserSnapshot(actorUser)
      : null;
    let isNewRating = false;

    const appendPublicOwnerMessage = (
      targetReview: ProductReviewDocument,
      body: string,
    ): void => {
      targetReview.messages.push({
        key: randomUUID(),
        body,
        moderation: {
          visibility: ProductReviewVisibility.PUBLIC,
        },
        senderSnapshot: userSnapshot,
        senderUserId: targetUserId,
        sentAt: now,
      });
    };

    const appendStaffSupportMessage = (
      targetReview: ProductReviewDocument,
      body: string,
      visibility: ProductReviewVisibility,
    ): void => {
      targetReview.messages.push({
        key: randomUUID(),
        body,
        moderation: {
          visibility,
        },
        senderSnapshot: staffSnapshot!,
        senderUserId: actorUserId,
        sentAt: now,
      });
    };

    const staffReplyVisibility = this.resolveStaffReplyVisibility(
      input.messageVisibility,
    );

    const applySubmitChanges = (targetReview: ProductReviewDocument): void => {
      targetReview.userSnapshot = userSnapshot;
      targetReview.productSnapshot = { title: product.title };
      if (userProduct) {
        targetReview.userProductId = userProduct._id;
      }

      if (!targetReview.moderation?.visibility) {
        targetReview.moderation = {
          visibility: ProductReviewVisibility.PUBLIC,
        };
      }

      const hadRatingComment = Boolean(targetReview.rating?.comment?.trim());

      if (hasStarInput) {
        if (!targetReview.rating) {
          targetReview.rating = {
            stars: input.stars!,
            comment:
              !isStaffSupportSubmit && hasCommentInput && !hadRatingComment
                ? normalizedComment
                : undefined,
            ratedAt: now,
            moderation: {
              visibility: ProductReviewVisibility.PUBLIC,
            },
          };
          isNewRating = true;
        } else {
          targetReview.rating.stars = input.stars!;
          targetReview.rating.updatedAt = now;

          if (!isStaffSupportSubmit && hasCommentInput && !hadRatingComment) {
            targetReview.rating.comment = normalizedComment;
          }
        }
      }

      if (!hasCommentInput) {
        return;
      }

      if (isStaffSupportSubmit) {
        appendStaffSupportMessage(
          targetReview,
          normalizedComment!,
          staffReplyVisibility,
        );
        return;
      }

      if (hadRatingComment) {
        appendPublicOwnerMessage(targetReview, normalizedComment!);
        return;
      }

      if (targetReview.rating) {
        targetReview.rating.comment = normalizedComment;
        return;
      }

      appendPublicOwnerMessage(targetReview, normalizedComment!);
    };

    if (!review) {
      if (userProduct) {
        await this.assertUserProductIdIsAvailable(userProduct._id);
      }

      try {
        review = await this.productReviewModel.create({
          productId: input.productId,
          productSnapshot: {
            title: product.title,
          },
          messages: [],
          moderation: {
            visibility: ProductReviewVisibility.PUBLIC,
          },
          ...(userProduct ? { userProductId: userProduct._id } : {}),
          userId: targetUserId,
          userSnapshot,
          ...(hasStarInput
            ? {
                rating: {
                  stars: input.stars!,
                  comment:
                    !isStaffSupportSubmit && hasCommentInput
                      ? normalizedComment
                      : undefined,
                  ratedAt: now,
                  moderation: {
                    visibility: ProductReviewVisibility.PUBLIC,
                  },
                },
              }
            : {}),
        });
        isNewRating = hasStarInput;

        if (hasCommentInput) {
          if (isStaffSupportSubmit) {
            appendStaffSupportMessage(
              review,
              normalizedComment!,
              staffReplyVisibility,
            );
          } else if (!hasStarInput) {
            appendPublicOwnerMessage(review, normalizedComment!);
          }

          await review.save();
        }
      } catch (error) {
        if (!this.isDuplicateKeyError(error)) {
          throw error;
        }

        review = await this.resolveExistingReviewForSubmit(
          userProduct?._id ?? null,
          targetUserId,
          input.productId,
        );

        if (!review) {
          throw error;
        }

        this.assertEndUserSubmitAllowed(
          review,
          hasStarInput,
          hasCommentInput,
          isStaffSupportSubmit,
        );

        isNewRating = !review.rating;
        if (userProduct) {
          await this.assertUserProductIdIsAvailable(
            userProduct._id,
            review._id,
          );
        }
        applySubmitChanges(review);
        await review.save();
      }
    } else {
      if (userProduct) {
        await this.assertUserProductIdIsAvailable(userProduct._id, review._id);
      }

      this.assertEndUserSubmitAllowed(
        review,
        hasStarInput,
        hasCommentInput,
        isStaffSupportSubmit,
      );

      isNewRating = !review.rating && hasStarInput;
      applySubmitChanges(review);
      await review.save();
    }

    return this.toSubmitResponse(review, isStaff, isNewRating);
  }

  async updateModeration(
    input: ProductReviewModerationUpdateGqlInput,
    actorUserId: Types.ObjectId,
  ): Promise<ProductReviewListGqlResponse> {
    const review = await this.productReviewModel
      .findOne({
        _id: input.reviewId,
        ...this.buildNotDeletedFilter(),
      })
      .exec();

    if (!review) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PRODUCT_REVIEW_NOT_FOUND);
    }

    const now = new Date();
    const normalizedHiddenReason = this.normalizeOptionalText(
      input.hiddenReason,
    );

    switch (input.target) {
      case ProductReviewModerationTarget.REVIEW: {
        review.moderation = this.buildModerationVisibility(
          input.visibility,
          actorUserId,
          now,
          normalizedHiddenReason,
        );
        break;
      }
      case ProductReviewModerationTarget.RATING: {
        if (!review.rating) {
          throw new BadRequestException(
            EXCEPTION_CONSTANT.PRODUCT_REVIEW_NO_RATING,
          );
        }

        review.rating.moderation = this.buildModerationVisibility(
          input.visibility,
          actorUserId,
          now,
          normalizedHiddenReason,
        );
        review.markModified("rating");
        break;
      }
      case ProductReviewModerationTarget.MESSAGE: {
        const messageKey = input.messageKey?.trim();
        if (!messageKey) {
          throw new BadRequestException(
            EXCEPTION_CONSTANT.PRODUCT_REVIEW_MESSAGE_KEY_REQUIRED,
          );
        }

        const message = (review.messages ?? []).find(
          (item) => item.key === messageKey,
        );
        if (!message) {
          throw new NotFoundException(
            EXCEPTION_CONSTANT.PRODUCT_REVIEW_MESSAGE_NOT_FOUND,
          );
        }

        message.moderation = this.buildModerationVisibility(
          input.visibility,
          actorUserId,
          now,
          normalizedHiddenReason,
        );
        review.markModified("messages");
        break;
      }
      default:
        throw new BadRequestException(
          EXCEPTION_CONSTANT.MODERATION_TARGET_UNSUPPORTED,
        );
    }

    await review.save();

    const ownerUsersById = await this.buildReviewParticipantUsersById([
      { userId: review.userId, messages: review.messages ?? [] },
    ]);
    const relatedLookups = await this.buildRelatedLookups([
      {
        _id: review._id,
        audit: review.audit,
        productId: review.productId,
        productSnapshot: review.productSnapshot,
        messages: review.messages,
        moderation: review.moderation,
        rating: review.rating,
        userProductId: review.userProductId,
        userId: review.userId,
        userSnapshot: review.userSnapshot,
      },
    ]);

    return this.toSuperAdminListResponse(
      {
        _id: review._id,
        audit: review.audit,
        productId: review.productId,
        productSnapshot: review.productSnapshot,
        messages: review.messages,
        moderation: review.moderation,
        rating: review.rating,
        userProductId: review.userProductId,
        userId: review.userId,
        userSnapshot: review.userSnapshot,
      },
      relatedLookups,
      this.isReviewOwnerListable(review.userId, ownerUsersById),
    );
  }

  private hasSubmitStarInput(stars?: number): stars is number {
    return typeof stars === "number" && stars >= 1 && stars <= 5;
  }

  async listForEndUser(
    input: UserProductReviewListGqlInput,
    currentUserId?: Types.ObjectId,
  ): Promise<UserProductReviewListPaginatedCursorGqlResponse> {
    const productId = input.filters?.productId?.trim();
    if (!productId) {
      throw new BadRequestException(EXCEPTION_CONSTANT.PRODUCT_ID_REQUIRED);
    }

    const product = await this.productModel
      .findById(productId)
      .select({ isReviewsSectionVisible: 1 })
      .lean<{ isReviewsSectionVisible?: boolean }>()
      .exec();

    if (!product) {
      throw new BadRequestException(EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND);
    }

    if (product.isReviewsSectionVisible === false) {
      return {
        items: [],
        pagination: {
          limit:
            input.options?.limit ??
            PAGINATION_CONSTANT.CURSOR_BASED.DEFAULT_LIMIT,
          total: 0,
          count: 0,
          hasNextPage: false,
          hasPreviousPage: Boolean(input.options?.startCursor),
        },
        summary: this.createEmptyProductRatingSummary(),
      };
    }

    const productObjectId = new Types.ObjectId(productId);
    const baseFilterQuery = this.buildEndUserListFilterQuery(
      productObjectId,
      currentUserId,
      input.filters?.stars,
    );
    const [{ reviews, total, limit, hasNextPage }, summary] = await Promise.all(
      [
        this.findThreadSortedCursorPaginatedReviews(
          baseFilterQuery,
          input.options,
        ),
        this.computeProductRatingSummary(productObjectId, true),
      ],
    );
    const endUserReviews = reviews as ProductReviewEndUserListRecord[];
    const ownerUsersById =
      await this.buildReviewParticipantUsersById(endUserReviews);

    let items = endUserReviews
      .map((review) =>
        this.toEndUserListResponse(review, currentUserId, ownerUsersById),
      )
      .filter(
        (review): review is UserProductReviewListGqlResponse => review !== null,
      );

    if (currentUserId && !input.options?.startCursor) {
      items = await this.prependCurrentUserReviewIfNeeded(
        items,
        new Types.ObjectId(productId),
        currentUserId,
        ownerUsersById,
        limit,
      );
    }

    const firstReview = items[0];
    const lastReview = items[items.length - 1];

    return {
      items,
      pagination: {
        limit,
        total,
        count: items.length,
        startCursor: firstReview?.id.toString(),
        endCursor: lastReview?.id.toString(),
        hasNextPage,
        hasPreviousPage: Boolean(input.options?.startCursor),
      },
      summary,
    };
  }

  async listForSuperAdmin(
    input: ProductReviewListGqlInput,
  ): Promise<ProductReviewListPaginatedCursorGqlResponse> {
    const baseFilterQuery = this.buildSuperAdminListFilterQuery(input.filters);
    const productId = input.filters?.productId?.trim();
    const [{ reviews, total, limit, hasNextPage }, summary] = await Promise.all(
      [
        this.findThreadSortedCursorPaginatedReviews(
          baseFilterQuery,
          input.options,
        ),
        productId
          ? this.computeProductRatingSummary(
              new Types.ObjectId(productId),
              false,
            )
          : Promise.resolve(this.createEmptyProductRatingSummary()),
      ],
    );
    const relatedLookups = await this.buildRelatedLookups(
      reviews as ProductReviewAdminListRecord[],
    );

    const items = (reviews as ProductReviewAdminListRecord[]).map((review) =>
      this.toSuperAdminListResponse(
        review,
        relatedLookups,
        this.isReviewOwnerListable(review.userId, relatedLookups.usersById),
      ),
    );
    const firstReview = items[0];
    const lastReview = items[items.length - 1];

    return {
      items,
      pagination: {
        limit,
        total,
        count: items.length,
        startCursor: firstReview?.id.toString(),
        endCursor: lastReview?.id.toString(),
        hasNextPage,
        hasPreviousPage: Boolean(input.options?.startCursor),
      },
      summary,
    };
  }

  private createEmptyProductRatingSummary(): ProductReviewRatingSummaryGqlResponse {
    return {
      averageRating: null,
      ratedCount: 0,
      distribution: [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: 0,
        percentage: 0,
      })),
    };
  }

  private buildProductRatingSummaryFilterQuery(
    productId: Types.ObjectId,
    forEndUser: boolean,
  ): FilterQuery<ProductReview> {
    return {
      productId,
      ...this.buildNotDeletedFilter(),
      "moderation.visibility": forEndUser
        ? ProductReviewVisibility.PUBLIC
        : { $ne: ProductReviewVisibility.HIDDEN },
      rating: { $exists: true, $ne: null },
      "rating.moderation.visibility": forEndUser
        ? ProductReviewVisibility.PUBLIC
        : { $ne: ProductReviewVisibility.HIDDEN },
    };
  }

  private async computeProductRatingSummary(
    productId: Types.ObjectId,
    forEndUser: boolean,
  ): Promise<ProductReviewRatingSummaryGqlResponse> {
    const rows = await this.productReviewModel
      .aggregate<{ _id: number; count: number }>([
        {
          $match: this.buildProductRatingSummaryFilterQuery(
            productId,
            forEndUser,
          ),
        },
        {
          $group: {
            _id: "$rating.stars",
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const distributionCounts = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: rows.find((row) => row._id === stars)?.count ?? 0,
    }));
    const ratedCount = distributionCounts.reduce(
      (total, entry) => total + entry.count,
      0,
    );
    const averageRating =
      ratedCount > 0
        ? distributionCounts.reduce(
            (total, entry) => total + entry.stars * entry.count,
            0,
          ) / ratedCount
        : null;
    const distributionBase = ratedCount || 1;

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

  private async findThreadSortedCursorPaginatedReviews(
    baseFilterQuery: FilterQuery<ProductReview>,
    options: ProductReviewCursorListOptions | undefined,
  ): Promise<{
    reviews: ProductReviewEndUserListRecord[] | ProductReviewAdminListRecord[];
    total: number;
    limit: number;
    hasNextPage: boolean;
  }> {
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.CURSOR_BASED.DEFAULT_LIMIT;
    const cursorMatch = await this.buildThreadActivityCursorMatch(
      baseFilterQuery,
      options?.startCursor,
    );
    const pipeline: PipelineStage[] = [
      { $match: baseFilterQuery },
      ...this.buildThreadSortComputedStages(),
      ...(cursorMatch ? [{ $match: cursorMatch }] : []),
      {
        $sort: {
          lastThreadActivityAt: -1,
          _id: -1,
        },
      },
      { $limit: limit + 1 },
      { $project: { _id: 1 } },
    ];

    const [reviewIdRows, total] = await Promise.all([
      this.productReviewModel
        .aggregate<{ _id: Types.ObjectId }>(pipeline)
        .exec(),
      this.productReviewModel.countDocuments(baseFilterQuery).exec(),
    ]);
    const reviewIds = reviewIdRows.map((row) => row._id);
    const pageIds = reviewIds.slice(0, limit);

    if (pageIds.length === 0) {
      return {
        reviews: [],
        total,
        limit,
        hasNextPage: false,
      };
    }

    const reviewsById = new Map(
      (
        await this.productReviewModel
          .find({ _id: { $in: pageIds } })
          .lean<
            (ProductReviewEndUserListRecord | ProductReviewAdminListRecord)[]
          >()
          .exec()
      ).map((review) => [review._id.toString(), review]),
    );
    const reviews = pageIds
      .map((reviewId) => reviewsById.get(reviewId.toString()))
      .filter(
        (
          review,
        ): review is
          | ProductReviewEndUserListRecord
          | ProductReviewAdminListRecord => review != null,
      );

    return {
      reviews,
      total,
      limit,
      hasNextPage: reviewIds.length > limit,
    };
  }

  private buildEndUserListFilterQuery(
    productId: Types.ObjectId,
    currentUserId: Types.ObjectId | undefined,
    stars?: number,
  ): FilterQuery<ProductReview> {
    const publicReviewCondition = {
      "moderation.visibility": ProductReviewVisibility.PUBLIC,
      $or: [
        {
          rating: { $exists: true, $ne: null },
          "rating.moderation.visibility": ProductReviewVisibility.PUBLIC,
        },
        {
          messages: {
            $elemMatch: {
              "moderation.visibility": ProductReviewVisibility.PUBLIC,
            },
          },
        },
      ],
    };
    const query: FilterQuery<ProductReview> = {
      productId,
      $and: [
        this.buildNotDeletedFilter(),
        {
          $or: currentUserId
            ? [{ userId: currentUserId }, publicReviewCondition]
            : [publicReviewCondition],
        },
      ],
    };

    if (typeof stars === "number") {
      if (currentUserId) {
        this.addAndCondition(query, {
          $or: [
            {
              userId: currentUserId,
              "rating.stars": stars,
            },
            {
              "rating.stars": stars,
              "rating.moderation.visibility": ProductReviewVisibility.PUBLIC,
            },
          ],
        });
      } else {
        query["rating.stars"] = stars;
        query["rating.moderation.visibility"] = ProductReviewVisibility.PUBLIC;
      }
    }

    return query;
  }

  private buildSuperAdminListFilterQuery(
    filters?: ProductReviewListGqlInput["filters"],
  ): FilterQuery<ProductReview> {
    const query: FilterQuery<ProductReview> = {
      $and: [this.buildNotDeletedFilter()],
    };

    if (!filters) {
      return query;
    }

    if (filters.query?.trim()) {
      const searchRegex = this.createContainsRegex(filters.query);
      this.addAndCondition(query, {
        $or: [
          { "rating.comment": searchRegex },
          { "messages.body": searchRegex },
          { "userSnapshot.fullName": searchRegex },
          { "userSnapshot.username": searchRegex },
          { "productSnapshot.title": searchRegex },
        ],
      });
    }

    if (filters.productId) {
      query.productId = new Types.ObjectId(filters.productId);
    }

    if (filters.userId) {
      query.userId = new Types.ObjectId(filters.userId);
    }

    if (filters.userProductId) {
      query.userProductId = new Types.ObjectId(filters.userProductId);
    }

    if (typeof filters.stars === "number") {
      query["rating.stars"] = filters.stars;
    }

    if (filters.ratingVisibility) {
      query["rating.moderation.visibility"] = filters.ratingVisibility;
    }

    if (filters.reviewVisibility) {
      query["moderation.visibility"] = filters.reviewVisibility;
    }

    if (filters.messageVisibility) {
      query["messages.moderation.visibility"] = filters.messageVisibility;
    }

    if (filters.hasRating === true) {
      this.addAndCondition(query, {
        rating: { $exists: true, $ne: null },
      });
    }

    if (filters.hasRating === false) {
      this.addAndCondition(query, {
        $or: [{ rating: null }, { rating: { $exists: false } }],
      });
    }

    if (filters.hasMessages === true) {
      this.addAndCondition(query, {
        "messages.0": { $exists: true },
      });
    }

    if (filters.hasMessages === false) {
      this.addAndCondition(query, {
        $or: [{ messages: [] }, { messages: { $exists: false } }],
      });
    }

    return query;
  }

  private async buildRelatedLookups(
    reviews: ProductReviewAdminListRecord[],
  ): Promise<ProductReviewRelatedLookups> {
    const userIds = new Set<string>();

    reviews.forEach((review) => {
      this.collectUserId(userIds, review.userId);
      this.collectUserId(userIds, review.audit?.createdBy);
      this.collectUserId(userIds, review.audit?.updatedBy);
      this.collectUserId(userIds, review.audit?.deletedBy);
      this.collectUserId(userIds, review.moderation?.hiddenBy);
      this.collectUserId(userIds, review.rating?.moderation.hiddenBy);

      (review.messages ?? []).forEach((message) => {
        this.collectUserId(userIds, message.senderUserId);
        this.collectUserId(userIds, message.moderation.hiddenBy);
      });
    });

    const userObjectIds = [...userIds]
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (userObjectIds.length === 0) {
      return {
        usersById: new Map(),
        avatarAccessUrlMap: new Map(),
      };
    }

    const users = await this.userModel
      .find({ _id: { $in: userObjectIds } })
      .select({ _id: 1, profile: 1, status: 1, audit: 1, roles: 1 })
      .lean<ProductReviewUserLookupRecord[]>()
      .exec();
    const avatarAccessUrlMap = await this.fileService.getAccessUrlMap(
      users.map((user) => user.profile?.avatarFileId),
    );

    return {
      usersById: new Map(users.map((user) => [user._id.toString(), user])),
      avatarAccessUrlMap,
    };
  }

  private async buildReviewParticipantUsersById(
    reviews: Pick<ProductReviewEndUserListRecord, "userId" | "messages">[],
  ): Promise<Map<string, ProductReviewUserLookupRecord>> {
    const userIds = new Set<string>();

    reviews.forEach((review) => {
      this.collectUserId(userIds, review.userId);
      (review.messages ?? []).forEach((message) => {
        this.collectUserId(userIds, message.senderUserId);
      });
    });

    const lookupIds = [...userIds]
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (lookupIds.length === 0) {
      return new Map();
    }

    const users = await this.userModel
      .find({ _id: { $in: lookupIds } })
      .select({ _id: 1, profile: 1, status: 1, audit: 1, roles: 1 })
      .lean<ProductReviewUserLookupRecord[]>()
      .exec();

    return new Map(users.map((user) => [user._id.toString(), user]));
  }

  private buildReviewOwnerUsersById(
    reviews: Pick<ProductReviewEndUserListRecord, "userId">[],
  ): Promise<Map<string, ProductReviewUserLookupRecord>> {
    return this.buildReviewParticipantUsersById(
      reviews.map((review) => ({ userId: review.userId, messages: [] })),
    );
  }

  private isReviewOwnerListable(
    userId: Types.ObjectId,
    usersById: Map<string, ProductReviewUserLookupRecord>,
  ): boolean {
    const user = usersById.get(userId.toString());

    if (!user) {
      return false;
    }

    if (user.audit?.deletedAt) {
      return false;
    }

    return user.status === UserStatus.ACTIVE;
  }

  private toSuperAdminListResponse(
    review: ProductReviewAdminListRecord,
    relatedLookups: ProductReviewRelatedLookups,
    ownerListable: boolean,
  ): ProductReviewListGqlResponse {
    return {
      id: review._id,
      userId: review.userId,
      user: this.toUserMinimalResponse(
        review.userId,
        relatedLookups.usersById.get(review.userId.toString()),
        relatedLookups.avatarAccessUrlMap,
      ),
      productId: review.productId,
      userProductId: review.userProductId,
      userSnapshot: {
        fullName: review.userSnapshot.fullName,
        username: review.userSnapshot.username,
        avatarFileId: review.userSnapshot.avatarFileId,
      },
      productSnapshot: {
        title: review.productSnapshot.title,
      },
      moderation: this.toModerationResponse(
        this.resolveReviewModeration(review.moderation),
        relatedLookups,
      ),
      rating: review.rating
        ? this.toAdminRatingResponse(
            review.rating,
            relatedLookups,
            ownerListable,
          )
        : undefined,
      messages: ownerListable
        ? [...(review.messages ?? [])]
            .sort(
              (left, right) => right.sentAt.getTime() - left.sentAt.getTime(),
            )
            .map((message) =>
              this.toAdminMessageResponse(message, relatedLookups),
            )
        : [],
      createdAt: review.audit?.createdAt,
      updatedAt: review.audit?.updatedAt,
      deletedAt: review.audit?.deletedAt,
      createdByUserId: review.audit?.createdBy,
      createdByUser: this.toUserMinimalResponse(
        review.audit?.createdBy,
        review.audit?.createdBy
          ? relatedLookups.usersById.get(review.audit.createdBy.toString())
          : undefined,
        relatedLookups.avatarAccessUrlMap,
      ),
      updatedByUserId: review.audit?.updatedBy,
      updatedByUser: this.toUserMinimalResponse(
        review.audit?.updatedBy,
        review.audit?.updatedBy
          ? relatedLookups.usersById.get(review.audit.updatedBy.toString())
          : undefined,
        relatedLookups.avatarAccessUrlMap,
      ),
      deletedByUserId: review.audit?.deletedBy,
      deletedByUser: this.toUserMinimalResponse(
        review.audit?.deletedBy,
        review.audit?.deletedBy
          ? relatedLookups.usersById.get(review.audit.deletedBy.toString())
          : undefined,
        relatedLookups.avatarAccessUrlMap,
      ),
    };
  }

  private toAdminRatingResponse(
    rating: ProductReviewRating,
    relatedLookups: ProductReviewRelatedLookups,
    includeComments = true,
  ): ProductReviewListGqlResponse["rating"] {
    return {
      stars: rating.stars,
      comment: includeComments ? rating.comment : undefined,
      ratedAt: rating.ratedAt,
      updatedAt: rating.updatedAt,
      moderation: this.toModerationResponse(rating.moderation, relatedLookups),
    };
  }

  private toAdminMessageResponse(
    message: ProductReviewMessage,
    relatedLookups: ProductReviewRelatedLookups,
  ): ProductReviewListGqlResponse["messages"][number] {
    return {
      key: message.key,
      body: message.body,
      senderUserId: message.senderUserId,
      senderUser: this.toUserMinimalResponse(
        message.senderUserId,
        relatedLookups.usersById.get(message.senderUserId.toString()),
        relatedLookups.avatarAccessUrlMap,
      ),
      sentAt: message.sentAt,
      moderation: this.toModerationResponse(message.moderation, relatedLookups),
    };
  }

  private toModerationResponse(
    moderation: ProductReviewModeration,
    relatedLookups: ProductReviewRelatedLookups,
  ): ProductReviewModerationGqlResponse {
    return {
      visibility: moderation.visibility,
      hiddenAt: moderation.hiddenAt,
      hiddenByUserId: moderation.hiddenBy,
      hiddenByUser: this.toUserMinimalResponse(
        moderation.hiddenBy,
        moderation.hiddenBy
          ? relatedLookups.usersById.get(moderation.hiddenBy.toString())
          : undefined,
        relatedLookups.avatarAccessUrlMap,
      ),
      hiddenReason: moderation.hiddenReason,
    };
  }

  private toUserMinimalResponse(
    id?: Types.ObjectId | null,
    user?: ProductReviewUserLookupRecord,
    avatarAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): UserMinimalGqlResponse | undefined {
    if (!id) {
      return undefined;
    }

    const avatarAccessUrl = resolveAvatarAccessUrl(
      user?.profile?.avatarFileId,
      avatarAccessUrlMap,
    );

    return {
      id,
      roles: user?.roles,
      profile: user?.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            email: user.profile.email,
            phoneNumber: user.profile.phoneNumber,
            avatarAccessUrl: avatarAccessUrl ?? undefined,
            bio: user.profile.bio,
          }
        : undefined,
    };
  }

  private toEndUserListResponse(
    review: ProductReviewEndUserListRecord,
    currentUserId: Types.ObjectId | undefined,
    ownerUsersById: Map<string, ProductReviewUserLookupRecord>,
  ): UserProductReviewListGqlResponse | null {
    const isMine = this.isSameObjectId(review.userId, currentUserId);
    const ownerListable = this.isReviewOwnerListable(
      review.userId,
      ownerUsersById,
    );

    if (!isMine && !ownerListable) {
      return null;
    }

    const moderation = this.resolveReviewModeration(review.moderation);

    if (!isMine && moderation.visibility !== ProductReviewVisibility.PUBLIC) {
      return null;
    }

    const isSubmissionBlocked =
      isMine && moderation.visibility === ProductReviewVisibility.HIDDEN;
    const isRatingHidden =
      isMine &&
      !isSubmissionBlocked &&
      Boolean(review.rating) &&
      review.rating!.moderation.visibility === ProductReviewVisibility.HIDDEN;
    const rating = isSubmissionBlocked
      ? undefined
      : this.mapVisibleRating(review.rating, isMine, ownerListable);
    const reviewOwner = ownerUsersById.get(review.userId.toString());
    const messages = isSubmissionBlocked
      ? []
      : this.mapVisibleMessages(
          review.messages ?? [],
          review.userId,
          isMine,
          ownerListable,
          ownerUsersById,
        );

    if (!isMine && !rating && messages.length === 0) {
      return null;
    }

    if (isMine && !rating && messages.length === 0 && !isSubmissionBlocked) {
      return null;
    }

    return {
      id: review._id,
      isMine,
      author: {
        firstName: this.resolveUserPublicFirstName(reviewOwner),
      },
      rating,
      messages,
      isSubmissionBlocked,
      isRatingHidden,
    };
  }

  private async prependCurrentUserReviewIfNeeded(
    items: UserProductReviewListGqlResponse[],
    productId: Types.ObjectId,
    currentUserId: Types.ObjectId,
    ownerUsersById: Map<string, ProductReviewUserLookupRecord>,
    pageLimit: number,
  ): Promise<UserProductReviewListGqlResponse[]> {
    const existingOwnIndex = items.findIndex((item) => item.isMine);
    if (existingOwnIndex === 0) {
      return items;
    }

    if (existingOwnIndex > 0) {
      const ownReview = items[existingOwnIndex];
      return [
        ownReview,
        ...items.slice(0, existingOwnIndex),
        ...items.slice(existingOwnIndex + 1),
      ];
    }

    const ownReview = await this.productReviewModel
      .findOne({
        productId,
        userId: currentUserId,
        ...this.buildNotDeletedFilter(),
      })
      .lean<ProductReviewEndUserListRecord>()
      .exec();

    if (!ownReview) {
      return items;
    }

    const ownersById = ownerUsersById.has(currentUserId.toString())
      ? ownerUsersById
      : new Map([
          ...ownerUsersById,
          ...(await this.buildReviewParticipantUsersById([
            { userId: currentUserId, messages: ownReview.messages ?? [] },
          ])),
        ]);

    const ownItem = this.toEndUserListResponse(
      ownReview,
      currentUserId,
      ownersById,
    );

    if (!ownItem) {
      return items;
    }

    const merged = [ownItem, ...items];
    if (pageLimit > 0 && merged.length > pageLimit) {
      return merged.slice(0, pageLimit);
    }

    return merged;
  }

  private mapVisibleRating(
    rating: ProductReviewRating | undefined,
    isMine: boolean,
    ownerListable = true,
  ): UserProductReviewListGqlResponse["rating"] | undefined {
    if (!rating) {
      return undefined;
    }

    if (rating.moderation.visibility === ProductReviewVisibility.HIDDEN) {
      return undefined;
    }

    if (
      !isMine &&
      rating.moderation.visibility !== ProductReviewVisibility.PUBLIC
    ) {
      return undefined;
    }

    return {
      stars: rating.stars,
      comment: ownerListable || isMine ? rating.comment : undefined,
      ratedAt: rating.ratedAt,
      updatedAt: rating.updatedAt,
    };
  }

  private mapVisibleMessages(
    messages: ProductReviewMessage[],
    threadUserId: Types.ObjectId,
    isMine: boolean,
    ownerListable = true,
    usersById: Map<string, ProductReviewUserLookupRecord>,
  ): UserProductReviewListGqlResponse["messages"] {
    return messages
      .filter((message) => {
        if (message.moderation.visibility === ProductReviewVisibility.HIDDEN) {
          return false;
        }

        if (!isMine) {
          if (
            message.moderation.visibility !== ProductReviewVisibility.PUBLIC
          ) {
            return false;
          }

          const isOwnerMessage = this.isSameObjectId(
            message.senderUserId,
            threadUserId,
          );

          return !isOwnerMessage || ownerListable;
        }

        return (
          message.moderation.visibility === ProductReviewVisibility.PUBLIC ||
          message.moderation.visibility === ProductReviewVisibility.PRIVATE
        );
      })
      .map((message) => {
        const isOwnerMessage = this.isSameObjectId(
          message.senderUserId,
          threadUserId,
        );
        const senderUser = usersById.get(message.senderUserId.toString());

        return {
          key: message.key,
          body: message.body,
          sentAt: message.sentAt,
          sender: {
            firstName: isOwnerMessage
              ? this.resolveUserPublicFirstName(senderUser)
              : "پشتیبانی",
            isSupport: !isOwnerMessage,
          },
        };
      });
  }

  private verifyCaptcha(captchaId?: string, captchaValue?: string): void {
    if (!captchaId?.trim() || !captchaValue?.trim()) {
      throw new BadRequestException(EXCEPTION_CONSTANT.CAPTCHA_REQUIRED);
    }

    const verificationStatus = this.userCaptchaService.verifyCaptcha(
      captchaId,
      captchaValue,
    );

    if (verificationStatus === CaptchaVerificationStatus.EXPIRED) {
      throw new BadRequestException(EXCEPTION_CONSTANT.CAPTCHA_EXPIRED);
    }

    if (verificationStatus === CaptchaVerificationStatus.INVALID) {
      throw new BadRequestException(EXCEPTION_CONSTANT.CAPTCHA_INVALID);
    }
  }

  private resolveSubmitTargetUserId(
    requestedUserId: Types.ObjectId | undefined,
    actorUserId: Types.ObjectId,
    isStaff: boolean,
  ): Types.ObjectId {
    if (requestedUserId) {
      if (!isStaff) {
        throw new ForbiddenException(
          EXCEPTION_CONSTANT.STAFF_ONLY_CROSS_USER_REVIEW,
        );
      }

      return requestedUserId;
    }

    return actorUserId;
  }

  private async toSubmitResponse(
    review: ProductReviewDocument,
    isStaff: boolean,
    isNewRating: boolean,
  ): Promise<ProductReviewSubmitGqlResponse> {
    const response: ProductReviewSubmitGqlResponse = {
      id: review._id,
      productId: review.productId,
      rating: review.rating
        ? {
            stars: review.rating.stars,
            comment: review.rating.comment,
            ratedAt: review.rating.ratedAt,
            updatedAt: review.rating.updatedAt,
          }
        : undefined,
      isNewRating,
    };

    if (!isStaff) {
      return response;
    }

    const relatedLookups = await this.buildRelatedLookups([
      {
        _id: review._id,
        audit: review.audit,
        productId: review.productId,
        productSnapshot: review.productSnapshot,
        messages: review.messages,
        moderation: review.moderation,
        rating: review.rating,
        userProductId: review.userProductId,
        userId: review.userId,
        userSnapshot: review.userSnapshot,
      },
    ]);

    return {
      ...response,
      userId: review.userId,
      user: this.toUserMinimalResponse(
        review.userId,
        relatedLookups.usersById.get(review.userId.toString()),
        relatedLookups.avatarAccessUrlMap,
      ),
    };
  }

  private toProductReviewUserSnapshot(
    user: Pick<User, "profile" | "username">,
  ): ProductReviewUserSnapshot {
    const fullName = [
      this.normalizeOptionalText(user.profile?.firstName),
      this.normalizeOptionalText(user.profile?.lastName),
    ]
      .filter(Boolean)
      .join(" ");

    return {
      fullName: fullName || user.username,
      username: user.username,
      avatarFileId: user.profile?.avatarFileId,
    };
  }

  private assertEndUserSubmitAllowed(
    review: ProductReviewDocument | null | undefined,
    hasStarInput: boolean,
    hasCommentInput: boolean,
    isStaffSupportSubmit: boolean,
  ): void {
    if (isStaffSupportSubmit || !review) {
      return;
    }

    const reviewVisibility = this.resolveReviewModeration(
      review.moderation,
    ).visibility;

    if (reviewVisibility === ProductReviewVisibility.HIDDEN) {
      throw new ForbiddenException(EXCEPTION_CONSTANT.PRODUCT_REVIEW_HIDDEN);
    }

    if (
      review.rating?.moderation.visibility !== ProductReviewVisibility.HIDDEN
    ) {
      return;
    }

    if (hasStarInput) {
      throw new ForbiddenException(EXCEPTION_CONSTANT.PRODUCT_REVIEW_HIDDEN);
    }

    if (hasCommentInput) {
      throw new ForbiddenException(EXCEPTION_CONSTANT.PRODUCT_REVIEW_HIDDEN);
    }
  }

  private buildModerationVisibility(
    visibility: ProductReviewVisibility,
    actorUserId: Types.ObjectId,
    now: Date,
    hiddenReason?: string,
  ): ProductReviewModeration {
    if (visibility === ProductReviewVisibility.HIDDEN) {
      return {
        visibility,
        hiddenAt: now,
        hiddenBy: actorUserId,
        ...(hiddenReason ? { hiddenReason } : {}),
      };
    }

    return { visibility };
  }

  private resolveReviewModeration(
    moderation?: ProductReviewModeration,
  ): ProductReviewModeration {
    return (
      moderation ?? {
        visibility: ProductReviewVisibility.PUBLIC,
      }
    );
  }

  private resolveStaffReplyVisibility(
    visibility?: ProductReviewVisibility,
  ): ProductReviewVisibility {
    if (visibility === ProductReviewVisibility.PUBLIC) {
      return ProductReviewVisibility.PUBLIC;
    }

    if (visibility === ProductReviewVisibility.PRIVATE) {
      return ProductReviewVisibility.PRIVATE;
    }

    if (visibility === ProductReviewVisibility.HIDDEN) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.SUPPORT_REPLY_VISIBILITY_INVALID,
      );
    }

    return ProductReviewVisibility.PRIVATE;
  }

  private isStaffRole(roles: UserRole[]): boolean {
    return roles.includes(UserRole.SUPER_ADMIN);
  }

  private isStaffUser(user?: ProductReviewUserLookupRecord | null): boolean {
    if (!user?.roles?.length) {
      return false;
    }

    return this.isStaffRole(user.roles);
  }

  private isStaffSupportSubmit(
    input: ProductReviewSubmitGqlInput,
    actorUserId: Types.ObjectId,
    isStaff: boolean,
  ): boolean {
    if (!isStaff || !input.userId) {
      return false;
    }

    return !this.isSameObjectId(input.userId, actorUserId);
  }

  private async resolveExistingReviewForSubmit(
    userProductId: Types.ObjectId | null,
    userId: Types.ObjectId,
    productId: Types.ObjectId,
  ): Promise<ProductReviewDocument | null> {
    const notDeletedFilter = this.buildNotDeletedFilter();
    const [reviewByUserProduct, reviewByUserAndProduct] = await Promise.all([
      userProductId
        ? this.productReviewModel
            .findOne({ userProductId, ...notDeletedFilter })
            .exec()
        : Promise.resolve(null),
      this.productReviewModel
        .findOne({ productId, userId, ...notDeletedFilter })
        .exec(),
    ]);

    if (
      reviewByUserProduct &&
      reviewByUserAndProduct &&
      !reviewByUserProduct._id.equals(reviewByUserAndProduct._id)
    ) {
      throw new BadRequestException(EXCEPTION_CONSTANT.PRODUCT_REVIEW_CONFLICT);
    }

    const review = reviewByUserProduct ?? reviewByUserAndProduct;

    if (!review) {
      return null;
    }

    if (
      !this.isSameObjectId(review.userId, userId) ||
      !this.isSameObjectId(review.productId, productId)
    ) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PRODUCT_REVIEW_ENROLLMENT_LINKED,
      );
    }

    if (
      userProductId &&
      reviewByUserAndProduct &&
      !reviewByUserProduct &&
      review.userProductId &&
      !this.isSameObjectId(review.userProductId, userProductId)
    ) {
      await this.assertUserProductIdIsAvailable(userProductId, review._id);
    }

    return review;
  }

  private async assertUserProductIdIsAvailable(
    userProductId: Types.ObjectId,
    currentReviewId?: Types.ObjectId,
  ): Promise<void> {
    const conflictingReview = await this.productReviewModel
      .findOne({
        ...this.buildNotDeletedFilter(),
        userProductId,
        ...(currentReviewId ? { _id: { $ne: currentReviewId } } : {}),
      })
      .exec();

    if (conflictingReview) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PRODUCT_REVIEW_ALREADY_EXISTS,
      );
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    );
  }

  private normalizeOptionalText(value?: string | null): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private buildNotDeletedFilter(): FilterQuery<ProductReview> {
    return {
      $or: [
        { "audit.deletedAt": null },
        { "audit.deletedAt": { $exists: false } },
      ],
    };
  }

  private addAndCondition(
    query: FilterQuery<ProductReview>,
    condition: FilterQuery<ProductReview>,
  ): void {
    if (!query.$and) {
      query.$and = [this.buildNotDeletedFilter()];
    }

    query.$and.push(condition);
  }

  private createContainsRegex(value: string): RegExp {
    const escaped = value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(escaped, "i");
  }

  private collectUserId(
    userIds: Set<string>,
    userId?: Types.ObjectId | null,
  ): void {
    if (userId) {
      userIds.add(userId.toString());
    }
  }

  private resolveUserPublicFirstName(
    user?: ProductReviewUserLookupRecord | null,
  ): string {
    const firstName = user?.profile?.firstName?.trim();
    if (firstName) {
      return firstName;
    }

    return "کاربر";
  }

  private buildThreadSortComputedStages(): PipelineStage[] {
    return [
      {
        $addFields: {
          _threadEntries: {
            $concatArrays: [
              {
                $cond: [
                  {
                    $and: [
                      { $ne: [{ $ifNull: ["$rating", null] }, null] },
                      {
                        $gt: [
                          {
                            $strLenCP: {
                              $trim: {
                                input: {
                                  $ifNull: ["$rating.comment", ""],
                                },
                              },
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                  [
                    {
                      sentAt: {
                        $ifNull: ["$rating.updatedAt", "$rating.ratedAt"],
                      },
                      senderUserId: "$userId",
                    },
                  ],
                  {
                    $cond: [
                      { $ne: [{ $ifNull: ["$rating", null] }, null] },
                      [
                        {
                          sentAt: {
                            $ifNull: ["$rating.updatedAt", "$rating.ratedAt"],
                          },
                          senderUserId: "$userId",
                        },
                      ],
                      [],
                    ],
                  },
                ],
              },
              {
                $map: {
                  input: { $ifNull: ["$messages", []] },
                  as: "message",
                  in: {
                    sentAt: "$$message.sentAt",
                    senderUserId: "$$message.senderUserId",
                  },
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          _latestThreadEntry: {
            $reduce: {
              input: "$_threadEntries",
              initialValue: null,
              in: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$$value", null] },
                      { $gt: ["$$this.sentAt", "$$value.sentAt"] },
                    ],
                  },
                  "$$this",
                  "$$value",
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          lastThreadActivityAt: {
            $ifNull: [
              "$_latestThreadEntry.sentAt",
              { $ifNull: ["$audit.updatedAt", "$audit.createdAt"] },
            ],
          },
        },
      },
    ];
  }

  private async buildThreadActivityCursorMatch(
    baseFilterQuery: FilterQuery<ProductReview>,
    startCursor: string | undefined,
  ): Promise<FilterQuery<ProductReview> | null> {
    if (!startCursor) {
      return null;
    }

    if (!Types.ObjectId.isValid(startCursor)) {
      return { _id: { $exists: false } };
    }

    const cursorId = new Types.ObjectId(startCursor);
    const cursorReview = await this.productReviewModel
      .findOne({
        ...baseFilterQuery,
        _id: cursorId,
      })
      .lean<ProductReviewAdminListRecord>()
      .exec();

    if (!cursorReview) {
      return { _id: { $exists: false } };
    }

    const cursorMeta = this.getReviewThreadSortMeta(cursorReview);

    return {
      $or: [
        { lastThreadActivityAt: { $lt: cursorMeta.lastThreadActivityAt } },
        {
          lastThreadActivityAt: cursorMeta.lastThreadActivityAt,
          _id: { $lt: cursorId },
        },
      ],
    };
  }

  private getReviewThreadSortMeta(review: {
    userId: Types.ObjectId;
    rating?: ProductReviewRating | null;
    messages?: ProductReviewMessage[];
    audit?: { updatedAt?: Date; createdAt?: Date };
  }): { lastThreadActivityAt: Date } {
    type ThreadEntry = {
      sentAt: Date;
      senderUserId: Types.ObjectId;
    };

    const entries: ThreadEntry[] = [];
    const ratingComment = review.rating?.comment?.trim();

    if (ratingComment) {
      entries.push({
        sentAt: review.rating!.updatedAt ?? review.rating!.ratedAt,
        senderUserId: review.userId,
      });
    } else if (review.rating) {
      entries.push({
        sentAt: review.rating.updatedAt ?? review.rating.ratedAt,
        senderUserId: review.userId,
      });
    }

    for (const message of review.messages ?? []) {
      entries.push({
        sentAt: message.sentAt,
        senderUserId: message.senderUserId,
      });
    }

    const fallbackActivityAt =
      review.audit?.updatedAt ?? review.audit?.createdAt ?? new Date(0);

    if (entries.length === 0) {
      return {
        lastThreadActivityAt: fallbackActivityAt,
      };
    }

    const latestEntry = entries.reduce((latest, entry) =>
      entry.sentAt > latest.sentAt ? entry : latest,
    );

    return {
      lastThreadActivityAt: latestEntry.sentAt,
    };
  }

  private isSameObjectId(
    left?: Types.ObjectId | null,
    right?: Types.ObjectId | null,
  ): boolean {
    if (!left || !right) {
      return false;
    }

    return left.toString() === right.toString();
  }
}
