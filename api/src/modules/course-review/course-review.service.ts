import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomUUID } from "crypto";
import { FilterQuery, Model, Types } from "mongoose";

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
import { SortingOrder } from "../../common/pagination/input";
import { buildSortOptions } from "../../common/pagination/utils";
import { FileService, FileAccessUrlDescriptor } from "../file";
import { resolveAvatarAccessUrl } from "../file/file-access-url.util";
import {
  CourseReviewListGqlInput,
  CourseReviewModerationUpdateGqlInput,
  CourseReviewSubmitGqlInput,
  UserCourseReviewListGqlInput,
} from "./graphql/inputs";
import { UserCourseReviewListSortOptionInput } from "./graphql/inputs/user-course-review-list-sort-option.gql.input";
import {
  CourseReviewListGqlResponse,
  CourseReviewListPaginatedCursorGqlResponse,
  CourseReviewModerationGqlResponse,
  CourseReviewSubmitGqlResponse,
  UserCourseReviewListGqlResponse,
  UserCourseReviewListPaginatedCursorGqlResponse,
} from "./graphql/responses";
import { UserMinimalGqlResponse } from "../user/graphql/responses/common";
import {
  CaptchaVerificationStatus,
  UserCaptchaService,
} from "../user/user-captcha.service";

type CourseReviewListSortField = Extract<
  keyof UserCourseReviewListSortOptionInput,
  string
>;

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

type CourseReviewUserLookupRecord = Pick<User, "profile" | "status" | "audit" | "roles"> & {
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
      isStaffSupportSubmit && Boolean(this.normalizeOptionalText(input.comment));

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

    const requiresPaidEnrollment = !isStaff || isStaffSupportSubmit;

    if (!userCourse && requiresPaidEnrollment) {
      throw new BadRequestException(
        "A paid course enrollment is required before submitting a review",
      );
    }

    if (needsStaffActor && !actorUser) {
      throw new BadRequestException("Staff user not found");
    }

    if (
      userCourse &&
      !this.isSameObjectId(userCourse.userId, targetUserId)
    ) {
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

    if (
      (this.resolveReviewModeration(review?.moderation).visibility ===
        CourseReviewVisibility.HIDDEN ||
        review?.rating?.moderation.visibility ===
          CourseReviewVisibility.HIDDEN) &&
      !isStaffSupportSubmit
    ) {
      throw new ForbiddenException(
        "You cannot update a review that has been hidden by moderation",
      );
    }

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

          if (
            !isStaffSupportSubmit &&
            hasCommentInput &&
            !hadRatingComment
          ) {
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
    const normalizedHiddenReason = this.normalizeOptionalText(input.hiddenReason);

    const applyVisibility = (moderation: CourseReviewModeration): void => {
      moderation.visibility = input.visibility;

      if (input.visibility === CourseReviewVisibility.HIDDEN) {
        moderation.hiddenAt = now;
        moderation.hiddenBy = actorUserId;
        moderation.hiddenReason = normalizedHiddenReason;
        return;
      }

      delete moderation.hiddenAt;
      delete moderation.hiddenBy;
      delete moderation.hiddenReason;
    };

    switch (input.target) {
      case CourseReviewModerationTarget.REVIEW: {
        review.moderation = this.resolveReviewModeration(review.moderation);
        applyVisibility(review.moderation);
        break;
      }
      case CourseReviewModerationTarget.RATING: {
        if (!review.rating) {
          throw new BadRequestException("This review does not have a rating");
        }

        applyVisibility(review.rating.moderation);
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

        applyVisibility(message.moderation);
        break;
      }
      default:
        throw new BadRequestException("Unsupported moderation target");
    }

    await review.save();

    const ownerUsersById = await this.buildReviewOwnerUsersById([
      { userId: review.userId },
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
          limit: input.options?.limit ?? PAGINATION_CONSTANT.CURSOR_BASED.DEFAULT_LIMIT,
          total: 0,
          count: 0,
          hasNextPage: false,
          hasPreviousPage: Boolean(input.options?.startCursor),
        },
      };
    }

    const baseFilterQuery = this.buildEndUserListFilterQuery(
      new Types.ObjectId(courseId),
      currentUserId,
      input.filters?.stars,
    );
    const { reviews, total, limit, hasNextPage } =
      await this.findCursorPaginatedReviews(baseFilterQuery, input.options);
    const ownerUsersById = await this.buildReviewOwnerUsersById(reviews);

    const items = reviews
      .map((review) =>
        this.toEndUserListResponse(review, currentUserId, ownerUsersById),
      )
      .filter(
        (review): review is UserCourseReviewListGqlResponse => review !== null,
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
    };
  }

  async listForSuperAdmin(
    input: CourseReviewListGqlInput,
  ): Promise<CourseReviewListPaginatedCursorGqlResponse> {
    const baseFilterQuery = this.buildSuperAdminListFilterQuery(input.filters);
    const { reviews, total, limit, hasNextPage } =
      await this.findCursorPaginatedReviews(baseFilterQuery, input.options);
    const relatedLookups = await this.buildRelatedLookups(
      reviews as CourseReviewAdminListRecord[],
    );

    const items = (reviews as CourseReviewAdminListRecord[]).map((review) =>
      this.toSuperAdminListResponse(
        review,
        relatedLookups,
        this.isReviewOwnerListable(
          review.userId,
          relatedLookups.usersById,
        ),
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
    };
  }

  private async findCursorPaginatedReviews(
    baseFilterQuery: FilterQuery<CourseReview>,
    options: CourseReviewCursorListOptions | undefined,
  ): Promise<{
    reviews: CourseReviewEndUserListRecord[];
    total: number;
    limit: number;
    hasNextPage: boolean;
  }> {
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.CURSOR_BASED.DEFAULT_LIMIT;
    const requestedSort = options?.sort;
    const sortFieldMap = this.getSortFieldMap();
    const cursorSort = this.resolveCursorSort(requestedSort);
    const sortOptions = {
      ...buildSortOptions<CourseReviewListSortField>(
        requestedSort ?? {},
        sortFieldMap,
        { updatedAt: SortingOrder.DESC },
      ),
      _id: cursorSort.direction,
    };
    const cursorFilterQuery = await this.buildCursorFilterQuery(
      options?.startCursor,
      baseFilterQuery,
      cursorSort.path,
      cursorSort.direction,
    );
    const filterQuery =
      cursorFilterQuery == null
        ? baseFilterQuery
        : { $and: [baseFilterQuery, cursorFilterQuery] };

    const [reviewsWithExtra, total] = await Promise.all([
      this.courseReviewModel
        .find(filterQuery)
        .sort(sortOptions)
        .limit(limit + 1)
        .lean<CourseReviewEndUserListRecord[]>()
        .exec(),
      this.courseReviewModel.countDocuments(baseFilterQuery).exec(),
    ]);

    return {
      reviews: reviewsWithExtra.slice(0, limit),
      total,
      limit,
      hasNextPage: reviewsWithExtra.length > limit,
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
      query["rating.stars"] = stars;
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

  private async buildReviewOwnerUsersById(
    reviews: Pick<CourseReviewEndUserListRecord, "userId">[],
  ): Promise<Map<string, CourseReviewUserLookupRecord>> {
    const userIds = [
      ...new Set(reviews.map((review) => review.userId.toString())),
    ]
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (userIds.length === 0) {
      return new Map();
    }

    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select({ _id: 1, status: 1, audit: 1, roles: 1 })
      .lean<CourseReviewUserLookupRecord[]>()
      .exec();

    return new Map(users.map((user) => [user._id.toString(), user]));
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
        ? (review.messages ?? []).map((message) =>
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

    if (
      !isMine &&
      (moderation.visibility === CourseReviewVisibility.HIDDEN ||
        moderation.visibility === CourseReviewVisibility.PRIVATE)
    ) {
      return null;
    }

    const rating = this.mapVisibleRating(
      review.rating,
      isMine,
      ownerListable,
    );
    const reviewOwner = ownerUsersById.get(review.userId.toString());
    const ownerIsStaff = this.isStaffUser(reviewOwner);
    const messages = this.mapVisibleMessages(
      review.messages ?? [],
      review.userId,
      isMine,
      ownerListable,
      ownerIsStaff,
    );

    if (!isMine && !rating && messages.length === 0) {
      return null;
    }

    if (isMine && !rating && messages.length === 0) {
      return null;
    }

    return {
      id: review._id,
      isMine,
      author: {
        firstName: ownerIsStaff
          ? "پشتیبانی"
          : this.extractFirstName(review.userSnapshot.fullName),
      },
      rating,
      messages,
    };
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
      rating.moderation.visibility === CourseReviewVisibility.PRIVATE &&
      !isMine
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
    includeSupportMessages: boolean,
    ownerListable = true,
    ownerIsStaff = false,
  ): UserCourseReviewListGqlResponse["messages"] {
    if (!ownerListable && !includeSupportMessages) {
      return [];
    }

    return messages
      .filter((message) => {
        if (message.moderation.visibility === CourseReviewVisibility.HIDDEN) {
          return false;
        }

        const isOwnerMessage = this.isSameObjectId(
          message.senderUserId,
          threadUserId,
        );

        if (
          isOwnerMessage &&
          message.moderation.visibility === CourseReviewVisibility.PUBLIC
        ) {
          return true;
        }

        return includeSupportMessages && !isOwnerMessage;
      })
      .map((message) => {
        const isOwnerMessage = this.isSameObjectId(
          message.senderUserId,
          threadUserId,
        );

        return {
          key: message.key,
          body: message.body,
          sentAt: message.sentAt,
          sender: {
            firstName: isOwnerMessage
              ? ownerIsStaff
                ? "پشتیبانی"
                : this.extractFirstName(message.senderSnapshot.fullName)
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
    return (
      roles.includes(UserRole.SUPER_ADMIN) || roles.includes(UserRole.ADMIN)
    );
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

  private extractFirstName(fullName: string | undefined): string {
    const trimmed = fullName?.trim();
    if (!trimmed) {
      return "کاربر";
    }

    return trimmed.split(/\s+/)[0] || "کاربر";
  }

  private getSortFieldMap(): Record<CourseReviewListSortField, string> {
    return {
      ratedAt: "rating.ratedAt",
      stars: "rating.stars",
      createdAt: "audit.createdAt",
      updatedAt: "audit.updatedAt",
    };
  }

  private resolveCursorSort(
    requestedSort: UserCourseReviewListSortOptionInput | undefined,
  ): { path: string; direction: 1 | -1 } {
    const sortFieldMap = this.getSortFieldMap();
    const sortEntries = Object.entries(requestedSort ?? {}) as Array<
      [CourseReviewListSortField, SortingOrder | undefined]
    >;
    const [field, order] =
      sortEntries.find(([, sortOrder]) => sortOrder != null) ??
      (["updatedAt", SortingOrder.DESC] as const);

    return {
      path: sortFieldMap[field],
      direction: order === SortingOrder.ASC ? 1 : -1,
    };
  }

  private async buildCursorFilterQuery(
    startCursor: string | undefined,
    baseFilterQuery: FilterQuery<CourseReview>,
    sortPath: string,
    direction: 1 | -1,
  ): Promise<FilterQuery<CourseReview> | null> {
    if (!startCursor || !Types.ObjectId.isValid(startCursor)) {
      return null;
    }

    const cursorId = new Types.ObjectId(startCursor);
    const cursorReview = await this.courseReviewModel
      .findOne({
        ...baseFilterQuery,
        _id: cursorId,
      })
      .lean<Record<string, unknown>>()
      .exec();

    if (!cursorReview) {
      return null;
    }

    const operator = direction === 1 ? "$gt" : "$lt";
    const cursorValue = this.getValueByPath(cursorReview, sortPath);

    if (cursorValue == null) {
      return {
        _id: { [operator]: cursorId },
      };
    }

    return {
      $or: [
        { [sortPath]: { [operator]: cursorValue } },
        {
          [sortPath]: cursorValue,
          _id: { [operator]: cursorId },
        },
      ],
    };
  }

  private getValueByPath(
    source: Record<string, unknown>,
    path: string,
  ): unknown {
    return path.split(".").reduce<unknown>((current, segment) => {
      if (current == null || typeof current !== "object") {
        return undefined;
      }

      return (current as Record<string, unknown>)[segment];
    }, source);
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
