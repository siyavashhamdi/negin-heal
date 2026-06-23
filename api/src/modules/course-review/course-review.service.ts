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
import { env } from "../../config";
import {
  CaptchaExpiredException,
  CaptchaInvalidException,
  CaptchaRequiredException,
} from "../../exceptions";
import {
  Course,
  CourseDocument,
  CourseReview,
  CourseReviewDocument,
  CourseReviewMessage,
  CourseReviewModeration,
  CourseReviewRating,
  CourseReviewUserSnapshot,
  User,
  UserCourse,
  UserCourseDocument,
  UserDocument,
} from "../../database/schemas";
import {
  CourseReviewVisibility,
  CourseReviewModerationTarget,
  UserCoursePurchaseStatus,
  UserRole,
  UserStatus,
} from "../../enums";
import { FileService, FileAccessUrlDescriptor } from "../file";
import { resolveAvatarAccessUrl } from "../file/file-access-url.util";
import { isCourseFree } from "../course/course-pricing.util";
import {
  CourseReviewListGqlInput,
  CourseReviewModerationUpdateGqlInput,
  CourseReviewSubmitGqlInput,
  UserCourseReviewListGqlInput,
} from "./graphql/inputs";
import {
  CourseReviewListGqlResponse,
  CourseReviewListPaginatedCursorGqlResponse,
  CourseReviewModerationGqlResponse,
  CourseReviewRatingSummaryGqlResponse,
  CourseReviewSubmitGqlResponse,
  UserCourseReviewListGqlResponse,
  UserCourseReviewListPaginatedCursorGqlResponse,
} from "./graphql/responses";
import { UserMinimalGqlResponse } from "../user/graphql/responses/common";
import {
  CaptchaVerificationStatus,
  UserCaptchaService,
} from "../user/user-captcha.service";

type CourseReviewEndUserListRecord = Pick<
  CourseReview,
  "_id" | "userId" | "userSnapshot" | "moderation" | "rating" | "messages"
>;

type CourseReviewAdminListRecord = Pick<
  CourseReview,
  | "_id"
  | "userId"
  | "courseId"
  | "userCourseId"
  | "userSnapshot"
  | "courseSnapshot"
  | "moderation"
  | "rating"
  | "messages"
  | "audit"
>;

type CourseReviewUserLookupRecord = Pick<
  User,
  "profile" | "status" | "audit" | "roles"
> & {
  _id: Types.ObjectId;
};

type CourseReviewRelatedLookups = {
  usersById: Map<string, CourseReviewUserLookupRecord>;
  avatarAccessUrlMap: Map<string, FileAccessUrlDescriptor>;
};

type CourseReviewCursorListOptions =
  | UserCourseReviewListGqlInput["options"]
  | CourseReviewListGqlInput["options"];

@Injectable()
export class CourseReviewService {
  constructor(
    @InjectModel(CourseReview.name)
    private readonly courseReviewModel: Model<CourseReviewDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourseDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly fileService: FileService,
    private readonly userCaptchaService: UserCaptchaService,
  ) {}

  async submitReview(
    input: CourseReviewSubmitGqlInput,
    actorUserId: Types.ObjectId,
    actorRoles: UserRole[],
  ): Promise<CourseReviewSubmitGqlResponse> {
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
    const course = await this.courseModel.findById(input.courseId).exec();
    if (!course) {
      throw new BadRequestException("Course not found");
    }

    if (!course.isActive && !isStaff) {
      throw new BadRequestException("Course is not available for review");
    }

    if (!isStaff && course.isReviewsSectionVisible === false) {
      throw new BadRequestException("بخش نظرات برای این دوره غیرفعال است.");
    }

    if (!isStaff && course.isReviewSubmissionEnabled === false) {
      throw new BadRequestException("ثبت نظر برای این دوره غیرفعال است.");
    }

    const needsStaffActor =
      isStaffSupportSubmit &&
      Boolean(this.normalizeOptionalText(input.comment));

    const [targetUser, userCourse, actorUser] = await Promise.all([
      this.userModel.findById(targetUserId).exec(),
      this.userCourseModel
        .findOne({
          courseId: input.courseId,
          userId: targetUserId,
          "purchase.status": UserCoursePurchaseStatus.PAID,
        })
        .exec(),
      needsStaffActor
        ? this.userModel.findById(actorUserId).exec()
        : Promise.resolve(null),
    ]);

    if (!targetUser) {
      throw new BadRequestException("User not found");
    }

    const courseIsFree = isCourseFree(course);
    const requiresPaidEnrollment =
      (!isStaff || isStaffSupportSubmit) && !courseIsFree;

    if (!userCourse && requiresPaidEnrollment) {
      throw new BadRequestException(
        "برای ثبت نظر، ابتدا باید در این دورهٔ پولی ثبت‌نام کرده باشید.",
      );
    }

    if (needsStaffActor && !actorUser) {
      throw new BadRequestException("Staff user not found");
    }

    if (userCourse && !this.isSameObjectId(userCourse.userId, targetUserId)) {
      throw new BadRequestException(
        "Course enrollment does not belong to this user",
      );
    }

    if (
      userCourse &&
      !this.isSameObjectId(userCourse.courseId, input.courseId)
    ) {
      throw new BadRequestException(
        "Course enrollment does not match the submitted course",
      );
    }

    const now = new Date();
    const normalizedComment = this.normalizeOptionalText(input.comment);
    const hasStarInput = this.hasSubmitStarInput(input.stars);
    const hasCommentInput = Boolean(normalizedComment);

    if (!hasStarInput && !hasCommentInput) {
      throw new BadRequestException(
        "Either a star rating or a comment is required",
      );
    }

    let review = await this.resolveExistingReviewForSubmit(
      userCourse?._id ?? null,
      targetUserId,
      input.courseId,
    );

    this.assertEndUserSubmitAllowed(
      review,
      hasStarInput,
      hasCommentInput,
      isStaffSupportSubmit,
    );

    const userSnapshot = this.toCourseReviewUserSnapshot(targetUser);
    const staffSnapshot = actorUser
      ? this.toCourseReviewUserSnapshot(actorUser)
      : null;
    let isNewRating = false;

    const appendPublicOwnerMessage = (
      targetReview: CourseReviewDocument,
      body: string,
    ): void => {
      targetReview.messages.push({
        key: randomUUID(),
        body,
        moderation: {
          visibility: CourseReviewVisibility.PUBLIC,
        },
        senderSnapshot: userSnapshot,
        senderUserId: targetUserId,
        sentAt: now,
      });
    };

    const appendStaffSupportMessage = (
      targetReview: CourseReviewDocument,
      body: string,
      visibility: CourseReviewVisibility,
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

    const applySubmitChanges = (targetReview: CourseReviewDocument): void => {
      targetReview.userSnapshot = userSnapshot;
      targetReview.courseSnapshot = { title: course.title };
      if (userCourse) {
        targetReview.userCourseId = userCourse._id;
      }

      if (!targetReview.moderation?.visibility) {
        targetReview.moderation = {
          visibility: CourseReviewVisibility.PUBLIC,
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
              visibility: CourseReviewVisibility.PUBLIC,
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
      if (userCourse) {
        await this.assertUserCourseIdIsAvailable(userCourse._id);
      }

      try {
        review = await this.courseReviewModel.create({
          courseId: input.courseId,
          courseSnapshot: {
            title: course.title,
          },
          messages: [],
          moderation: {
            visibility: CourseReviewVisibility.PUBLIC,
          },
          ...(userCourse ? { userCourseId: userCourse._id } : {}),
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
                    visibility: CourseReviewVisibility.PUBLIC,
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
          userCourse?._id ?? null,
          targetUserId,
          input.courseId,
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
        if (userCourse) {
          await this.assertUserCourseIdIsAvailable(userCourse._id, review._id);
        }
        applySubmitChanges(review);
        await review.save();
      }
    } else {
      if (userCourse) {
        await this.assertUserCourseIdIsAvailable(userCourse._id, review._id);
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
    input: CourseReviewModerationUpdateGqlInput,
    actorUserId: Types.ObjectId,
  ): Promise<CourseReviewListGqlResponse> {
    const review = await this.courseReviewModel
      .findOne({
        _id: input.reviewId,
        ...this.buildNotDeletedFilter(),
      })
      .exec();

    if (!review) {
      throw new NotFoundException("Course review not found");
    }

    const now = new Date();
    const normalizedHiddenReason = this.normalizeOptionalText(
      input.hiddenReason,
    );

    switch (input.target) {
      case CourseReviewModerationTarget.REVIEW: {
        review.moderation = this.buildModerationVisibility(
          input.visibility,
          actorUserId,
          now,
          normalizedHiddenReason,
        );
        break;
      }
      case CourseReviewModerationTarget.RATING: {
        if (!review.rating) {
          throw new BadRequestException("This review does not have a rating");
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
      case CourseReviewModerationTarget.MESSAGE: {
        const messageKey = input.messageKey?.trim();
        if (!messageKey) {
          throw new BadRequestException(
            "Message key is required when updating message moderation",
          );
        }

        const message = (review.messages ?? []).find(
          (item) => item.key === messageKey,
        );
        if (!message) {
          throw new NotFoundException("Review message not found");
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
        throw new BadRequestException("Unsupported moderation target");
    }

    await review.save();

    const ownerUsersById = await this.buildReviewParticipantUsersById([
      { userId: review.userId, messages: review.messages ?? [] },
    ]);
    const relatedLookups = await this.buildRelatedLookups([
      {
        _id: review._id,
        audit: review.audit,
        courseId: review.courseId,
        courseSnapshot: review.courseSnapshot,
        messages: review.messages,
        moderation: review.moderation,
        rating: review.rating,
        userCourseId: review.userCourseId,
        userId: review.userId,
        userSnapshot: review.userSnapshot,
      },
    ]);

    return this.toSuperAdminListResponse(
      {
        _id: review._id,
        audit: review.audit,
        courseId: review.courseId,
        courseSnapshot: review.courseSnapshot,
        messages: review.messages,
        moderation: review.moderation,
        rating: review.rating,
        userCourseId: review.userCourseId,
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
    input: UserCourseReviewListGqlInput,
    currentUserId?: Types.ObjectId,
  ): Promise<UserCourseReviewListPaginatedCursorGqlResponse> {
    const courseId = input.filters?.courseId?.trim();
    if (!courseId) {
      throw new BadRequestException("Course ID is required");
    }

    const course = await this.courseModel
      .findById(courseId)
      .select({ isReviewsSectionVisible: 1 })
      .lean<{ isReviewsSectionVisible?: boolean }>()
      .exec();

    if (!course) {
      throw new BadRequestException("Course not found");
    }

    if (course.isReviewsSectionVisible === false) {
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
        summary: this.createEmptyCourseRatingSummary(),
      };
    }

    const courseObjectId = new Types.ObjectId(courseId);
    const baseFilterQuery = this.buildEndUserListFilterQuery(
      courseObjectId,
      currentUserId,
      input.filters?.stars,
    );
    const [{ reviews, total, limit, hasNextPage }, summary] = await Promise.all(
      [
        this.findThreadSortedCursorPaginatedReviews(
          baseFilterQuery,
          input.options,
        ),
        this.computeCourseRatingSummary(courseObjectId, true),
      ],
    );
    const endUserReviews = reviews as CourseReviewEndUserListRecord[];
    const ownerUsersById =
      await this.buildReviewParticipantUsersById(endUserReviews);

    let items = endUserReviews
      .map((review) =>
        this.toEndUserListResponse(review, currentUserId, ownerUsersById),
      )
      .filter(
        (review): review is UserCourseReviewListGqlResponse => review !== null,
      );

    if (currentUserId && !input.options?.startCursor) {
      items = await this.prependCurrentUserReviewIfNeeded(
        items,
        new Types.ObjectId(courseId),
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
    input: CourseReviewListGqlInput,
  ): Promise<CourseReviewListPaginatedCursorGqlResponse> {
    const baseFilterQuery = this.buildSuperAdminListFilterQuery(input.filters);
    const courseId = input.filters?.courseId?.trim();
    const [{ reviews, total, limit, hasNextPage }, summary] = await Promise.all(
      [
        this.findThreadSortedCursorPaginatedReviews(
          baseFilterQuery,
          input.options,
        ),
        courseId
          ? this.computeCourseRatingSummary(new Types.ObjectId(courseId), false)
          : Promise.resolve(this.createEmptyCourseRatingSummary()),
      ],
    );
    const relatedLookups = await this.buildRelatedLookups(
      reviews as CourseReviewAdminListRecord[],
    );

    const items = (reviews as CourseReviewAdminListRecord[]).map((review) =>
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

  private createEmptyCourseRatingSummary(): CourseReviewRatingSummaryGqlResponse {
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

  private buildCourseRatingSummaryFilterQuery(
    courseId: Types.ObjectId,
    forEndUser: boolean,
  ): FilterQuery<CourseReview> {
    return {
      courseId,
      ...this.buildNotDeletedFilter(),
      "moderation.visibility": forEndUser
        ? CourseReviewVisibility.PUBLIC
        : { $ne: CourseReviewVisibility.HIDDEN },
      rating: { $exists: true, $ne: null },
      "rating.moderation.visibility": forEndUser
        ? CourseReviewVisibility.PUBLIC
        : { $ne: CourseReviewVisibility.HIDDEN },
    };
  }

  private async computeCourseRatingSummary(
    courseId: Types.ObjectId,
    forEndUser: boolean,
  ): Promise<CourseReviewRatingSummaryGqlResponse> {
    const rows = await this.courseReviewModel
      .aggregate<{ _id: number; count: number }>([
        {
          $match: this.buildCourseRatingSummaryFilterQuery(
            courseId,
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
    baseFilterQuery: FilterQuery<CourseReview>,
    options: CourseReviewCursorListOptions | undefined,
  ): Promise<{
    reviews: CourseReviewEndUserListRecord[] | CourseReviewAdminListRecord[];
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
      this.courseReviewModel
        .aggregate<{ _id: Types.ObjectId }>(pipeline)
        .exec(),
      this.courseReviewModel.countDocuments(baseFilterQuery).exec(),
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
        await this.courseReviewModel
          .find({ _id: { $in: pageIds } })
          .lean<
            (CourseReviewEndUserListRecord | CourseReviewAdminListRecord)[]
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
          | CourseReviewEndUserListRecord
          | CourseReviewAdminListRecord => review != null,
      );

    return {
      reviews,
      total,
      limit,
      hasNextPage: reviewIds.length > limit,
    };
  }

  private buildEndUserListFilterQuery(
    courseId: Types.ObjectId,
    currentUserId: Types.ObjectId | undefined,
    stars?: number,
  ): FilterQuery<CourseReview> {
    const publicReviewCondition = {
      "moderation.visibility": CourseReviewVisibility.PUBLIC,
      $or: [
        {
          rating: { $exists: true, $ne: null },
          "rating.moderation.visibility": CourseReviewVisibility.PUBLIC,
        },
        {
          messages: {
            $elemMatch: {
              "moderation.visibility": CourseReviewVisibility.PUBLIC,
            },
          },
        },
      ],
    };
    const query: FilterQuery<CourseReview> = {
      courseId,
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
              "rating.moderation.visibility": CourseReviewVisibility.PUBLIC,
            },
          ],
        });
      } else {
        query["rating.stars"] = stars;
        query["rating.moderation.visibility"] = CourseReviewVisibility.PUBLIC;
      }
    }

    return query;
  }

  private buildSuperAdminListFilterQuery(
    filters?: CourseReviewListGqlInput["filters"],
  ): FilterQuery<CourseReview> {
    const query: FilterQuery<CourseReview> = {
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
          { "courseSnapshot.title": searchRegex },
        ],
      });
    }

    if (filters.courseId) {
      query.courseId = new Types.ObjectId(filters.courseId);
    }

    if (filters.userId) {
      query.userId = new Types.ObjectId(filters.userId);
    }

    if (filters.userCourseId) {
      query.userCourseId = new Types.ObjectId(filters.userCourseId);
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
    reviews: CourseReviewAdminListRecord[],
  ): Promise<CourseReviewRelatedLookups> {
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
      .lean<CourseReviewUserLookupRecord[]>()
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
    reviews: Pick<CourseReviewEndUserListRecord, "userId" | "messages">[],
  ): Promise<Map<string, CourseReviewUserLookupRecord>> {
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
      .lean<CourseReviewUserLookupRecord[]>()
      .exec();

    return new Map(users.map((user) => [user._id.toString(), user]));
  }

  private buildReviewOwnerUsersById(
    reviews: Pick<CourseReviewEndUserListRecord, "userId">[],
  ): Promise<Map<string, CourseReviewUserLookupRecord>> {
    return this.buildReviewParticipantUsersById(
      reviews.map((review) => ({ userId: review.userId, messages: [] })),
    );
  }

  private isReviewOwnerListable(
    userId: Types.ObjectId,
    usersById: Map<string, CourseReviewUserLookupRecord>,
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
    review: CourseReviewAdminListRecord,
    relatedLookups: CourseReviewRelatedLookups,
    ownerListable: boolean,
  ): CourseReviewListGqlResponse {
    return {
      id: review._id,
      userId: review.userId,
      user: this.toUserMinimalResponse(
        review.userId,
        relatedLookups.usersById.get(review.userId.toString()),
        relatedLookups.avatarAccessUrlMap,
      ),
      courseId: review.courseId,
      userCourseId: review.userCourseId,
      userSnapshot: {
        fullName: review.userSnapshot.fullName,
        username: review.userSnapshot.username,
        avatarFileId: review.userSnapshot.avatarFileId,
      },
      courseSnapshot: {
        title: review.courseSnapshot.title,
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
    rating: CourseReviewRating,
    relatedLookups: CourseReviewRelatedLookups,
    includeComments = true,
  ): CourseReviewListGqlResponse["rating"] {
    return {
      stars: rating.stars,
      comment: includeComments ? rating.comment : undefined,
      ratedAt: rating.ratedAt,
      updatedAt: rating.updatedAt,
      moderation: this.toModerationResponse(rating.moderation, relatedLookups),
    };
  }

  private toAdminMessageResponse(
    message: CourseReviewMessage,
    relatedLookups: CourseReviewRelatedLookups,
  ): CourseReviewListGqlResponse["messages"][number] {
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
    moderation: CourseReviewModeration,
    relatedLookups: CourseReviewRelatedLookups,
  ): CourseReviewModerationGqlResponse {
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
    user?: CourseReviewUserLookupRecord,
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
    review: CourseReviewEndUserListRecord,
    currentUserId: Types.ObjectId | undefined,
    ownerUsersById: Map<string, CourseReviewUserLookupRecord>,
  ): UserCourseReviewListGqlResponse | null {
    const isMine = this.isSameObjectId(review.userId, currentUserId);
    const ownerListable = this.isReviewOwnerListable(
      review.userId,
      ownerUsersById,
    );

    if (!isMine && !ownerListable) {
      return null;
    }

    const moderation = this.resolveReviewModeration(review.moderation);

    if (!isMine && moderation.visibility !== CourseReviewVisibility.PUBLIC) {
      return null;
    }

    const isSubmissionBlocked =
      isMine && moderation.visibility === CourseReviewVisibility.HIDDEN;
    const isRatingHidden =
      isMine &&
      !isSubmissionBlocked &&
      Boolean(review.rating) &&
      review.rating!.moderation.visibility === CourseReviewVisibility.HIDDEN;
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
    items: UserCourseReviewListGqlResponse[],
    courseId: Types.ObjectId,
    currentUserId: Types.ObjectId,
    ownerUsersById: Map<string, CourseReviewUserLookupRecord>,
    pageLimit: number,
  ): Promise<UserCourseReviewListGqlResponse[]> {
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

    const ownReview = await this.courseReviewModel
      .findOne({
        courseId,
        userId: currentUserId,
        ...this.buildNotDeletedFilter(),
      })
      .lean<CourseReviewEndUserListRecord>()
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
    rating: CourseReviewRating | undefined,
    isMine: boolean,
    ownerListable = true,
  ): UserCourseReviewListGqlResponse["rating"] | undefined {
    if (!rating) {
      return undefined;
    }

    if (rating.moderation.visibility === CourseReviewVisibility.HIDDEN) {
      return undefined;
    }

    if (
      !isMine &&
      rating.moderation.visibility !== CourseReviewVisibility.PUBLIC
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
    messages: CourseReviewMessage[],
    threadUserId: Types.ObjectId,
    isMine: boolean,
    ownerListable = true,
    usersById: Map<string, CourseReviewUserLookupRecord>,
  ): UserCourseReviewListGqlResponse["messages"] {
    return messages
      .filter((message) => {
        if (message.moderation.visibility === CourseReviewVisibility.HIDDEN) {
          return false;
        }

        if (!isMine) {
          if (message.moderation.visibility !== CourseReviewVisibility.PUBLIC) {
            return false;
          }

          const isOwnerMessage = this.isSameObjectId(
            message.senderUserId,
            threadUserId,
          );

          return !isOwnerMessage || ownerListable;
        }

        return (
          message.moderation.visibility === CourseReviewVisibility.PUBLIC ||
          message.moderation.visibility === CourseReviewVisibility.PRIVATE
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
      throw new CaptchaRequiredException();
    }

    const verificationStatus = this.userCaptchaService.verifyCaptcha(
      captchaId,
      captchaValue,
    );

    if (verificationStatus === CaptchaVerificationStatus.EXPIRED) {
      throw new CaptchaExpiredException();
    }

    if (verificationStatus === CaptchaVerificationStatus.INVALID) {
      throw new CaptchaInvalidException();
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
          "Only staff accounts can submit reviews for another user",
        );
      }

      return requestedUserId;
    }

    return actorUserId;
  }

  private async toSubmitResponse(
    review: CourseReviewDocument,
    isStaff: boolean,
    isNewRating: boolean,
  ): Promise<CourseReviewSubmitGqlResponse> {
    const response: CourseReviewSubmitGqlResponse = {
      id: review._id,
      courseId: review.courseId,
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
        courseId: review.courseId,
        courseSnapshot: review.courseSnapshot,
        messages: review.messages,
        moderation: review.moderation,
        rating: review.rating,
        userCourseId: review.userCourseId,
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

  private toCourseReviewUserSnapshot(
    user: Pick<User, "profile" | "username">,
  ): CourseReviewUserSnapshot {
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
    review: CourseReviewDocument | null | undefined,
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

    if (reviewVisibility === CourseReviewVisibility.HIDDEN) {
      throw new ForbiddenException("امکان ثبت نظر برای شما وجود ندارد.");
    }

    if (
      review.rating?.moderation.visibility !== CourseReviewVisibility.HIDDEN
    ) {
      return;
    }

    if (hasStarInput) {
      throw new ForbiddenException(
        "امکان ثبت یا ویرایش امتیاز برای شما وجود ندارد.",
      );
    }

    if (hasCommentInput) {
      throw new ForbiddenException("امکان ثبت نظر برای شما وجود ندارد.");
    }
  }

  private buildModerationVisibility(
    visibility: CourseReviewVisibility,
    actorUserId: Types.ObjectId,
    now: Date,
    hiddenReason?: string,
  ): CourseReviewModeration {
    if (visibility === CourseReviewVisibility.HIDDEN) {
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
    moderation?: CourseReviewModeration,
  ): CourseReviewModeration {
    return (
      moderation ?? {
        visibility: CourseReviewVisibility.PUBLIC,
      }
    );
  }

  private resolveStaffReplyVisibility(
    visibility?: CourseReviewVisibility,
  ): CourseReviewVisibility {
    if (visibility === CourseReviewVisibility.PUBLIC) {
      return CourseReviewVisibility.PUBLIC;
    }

    if (visibility === CourseReviewVisibility.PRIVATE) {
      return CourseReviewVisibility.PRIVATE;
    }

    if (visibility === CourseReviewVisibility.HIDDEN) {
      throw new BadRequestException(
        "Support reply visibility must be PUBLIC or PRIVATE",
      );
    }

    return CourseReviewVisibility.PRIVATE;
  }

  private isStaffRole(roles: UserRole[]): boolean {
    return roles.includes(UserRole.SUPER_ADMIN);
  }

  private isStaffUser(user?: CourseReviewUserLookupRecord | null): boolean {
    if (!user?.roles?.length) {
      return false;
    }

    return this.isStaffRole(user.roles);
  }

  private isStaffSupportSubmit(
    input: CourseReviewSubmitGqlInput,
    actorUserId: Types.ObjectId,
    isStaff: boolean,
  ): boolean {
    if (!isStaff || !input.userId) {
      return false;
    }

    return !this.isSameObjectId(input.userId, actorUserId);
  }

  private async resolveExistingReviewForSubmit(
    userCourseId: Types.ObjectId | null,
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<CourseReviewDocument | null> {
    const notDeletedFilter = this.buildNotDeletedFilter();
    const [reviewByUserCourse, reviewByUserAndCourse] = await Promise.all([
      userCourseId
        ? this.courseReviewModel
            .findOne({ userCourseId, ...notDeletedFilter })
            .exec()
        : Promise.resolve(null),
      this.courseReviewModel
        .findOne({ courseId, userId, ...notDeletedFilter })
        .exec(),
    ]);

    if (
      reviewByUserCourse &&
      reviewByUserAndCourse &&
      !reviewByUserCourse._id.equals(reviewByUserAndCourse._id)
    ) {
      throw new BadRequestException(
        "Conflicting review records exist for this course enrollment",
      );
    }

    const review = reviewByUserCourse ?? reviewByUserAndCourse;

    if (!review) {
      return null;
    }

    if (
      !this.isSameObjectId(review.userId, userId) ||
      !this.isSameObjectId(review.courseId, courseId)
    ) {
      throw new BadRequestException(
        "This course enrollment is already linked to a different review",
      );
    }

    if (
      userCourseId &&
      reviewByUserAndCourse &&
      !reviewByUserCourse &&
      review.userCourseId &&
      !this.isSameObjectId(review.userCourseId, userCourseId)
    ) {
      await this.assertUserCourseIdIsAvailable(userCourseId, review._id);
    }

    return review;
  }

  private async assertUserCourseIdIsAvailable(
    userCourseId: Types.ObjectId,
    currentReviewId?: Types.ObjectId,
  ): Promise<void> {
    const conflictingReview = await this.courseReviewModel
      .findOne({
        ...this.buildNotDeletedFilter(),
        userCourseId,
        ...(currentReviewId ? { _id: { $ne: currentReviewId } } : {}),
      })
      .exec();

    if (conflictingReview) {
      throw new BadRequestException(
        "A review already exists for this course enrollment",
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

  private buildNotDeletedFilter(): FilterQuery<CourseReview> {
    return {
      $or: [
        { "audit.deletedAt": null },
        { "audit.deletedAt": { $exists: false } },
      ],
    };
  }

  private addAndCondition(
    query: FilterQuery<CourseReview>,
    condition: FilterQuery<CourseReview>,
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
    user?: CourseReviewUserLookupRecord | null,
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
    baseFilterQuery: FilterQuery<CourseReview>,
    startCursor: string | undefined,
  ): Promise<FilterQuery<CourseReview> | null> {
    if (!startCursor) {
      return null;
    }

    if (!Types.ObjectId.isValid(startCursor)) {
      return { _id: { $exists: false } };
    }

    const cursorId = new Types.ObjectId(startCursor);
    const cursorReview = await this.courseReviewModel
      .findOne({
        ...baseFilterQuery,
        _id: cursorId,
      })
      .lean<CourseReviewAdminListRecord>()
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
    rating?: CourseReviewRating | null;
    messages?: CourseReviewMessage[];
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
