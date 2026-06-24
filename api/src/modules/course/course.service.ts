import axios from "axios";
import { Model, FilterQuery, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import { APP_SETTING_KEY, PAGINATION_CONSTANT, EXCEPTION_CONSTANT } from "../../constants";
import {
  BadgeCountTriggerAction,
  BadgeCountTriggerSource,
  CourseDeleteDependencyImpact,
  CourseDiscountType,
  CourseItemType,
  CourseReleaseType,
  CouponDiscountType,
  GeneralSubscriptionUpdateType,
  NotificationMode,
  NotificationSource,
  UserRole,
  UserCoursePaymentMethod,
  UserCoursePurchaseCurrency,
  UserCoursePurchaseStatus,
  UserStatus,
} from "../../enums";
import { SortingOrder } from "../../common/pagination/input";
import { buildSortOptions } from "../../common/pagination/utils";
import { env } from "../../config";
import {
  Course,
  CourseChapter,
  CourseDocument,
  CourseItem,
  CourseReview,
  CourseReviewDocument,
  Coupon,
  CouponDocument,
  StoredFile,
  StoredFileDocument,
  Notification,
  NotificationDocument,
  User,
  UserCourse,
  UserCourseDocument,
  UserDocument,
} from "../../database/schemas";
import {
  CourseChapterGqlInput,
  CourseDiscountGqlInput,
  CourseItemGqlInput,
} from "./graphql/inputs/course-common.gql.input";
import { CourseCreateGqlInput } from "./graphql/inputs/course-create.gql.input";
import { CourseDetailGqlInput } from "./graphql/inputs/course-detail.gql.input";
import { CourseDeleteGqlInput } from "./graphql/inputs/course-delete.gql.input";
import { CourseListGqlInput } from "./graphql/inputs/course-list.gql.input";
import { CoursePaymentListGqlInput } from "./graphql/inputs/course-payment-list.gql.input";
import { CoursePaymentDetailGqlInput } from "./graphql/inputs/course-payment-detail.gql.input";
import { CoursePaymentManualCreateGqlInput } from "./graphql/inputs/course-payment-manual-create.gql.input";
import { CoursePaymentStatusUpdateGqlInput } from "./graphql/inputs/course-payment-status-update.gql.input";
import { CoursePurchaseSubmitGqlInput } from "./graphql/inputs/course-purchase-submit.gql.input";
import { CourseChapterCompleteGqlInput } from "./graphql/inputs/course-chapter-complete.gql.input";
import { CourseListSortOptionInput } from "./graphql/inputs/course-list-sort-option.gql.input";
import { CourseUpdateGqlInput } from "./graphql/inputs/course-update.gql.input";
import { UserCourseDetailGqlInput } from "./graphql/inputs/user-course-detail.gql.input";
import { FileService, FileAccessUrlDescriptor } from "../file/file.service";
import {
  CourseListChapterGqlResponse,
  CourseListGqlResponse,
  CourseListItemGqlResponse,
  CourseListPaginatedCursorGqlResponse,
  CourseListSummaryGqlResponse,
} from "./graphql/responses/course-list.gql.response";
import {
  UserCourseDetailChapterGqlResponse,
  UserCourseDetailGqlResponse,
  UserCourseDetailItemGqlResponse,
} from "./graphql/responses/user-course-detail.gql.response";
import {
  UserCourseListGqlResponse,
  UserCourseListPaginatedCursorGqlResponse,
} from "./graphql/responses/user-course-list.gql.response";
import {
  CoursePaymentListGqlResponse,
  CoursePaymentListPaginatedOffsetGqlResponse,
  CoursePaymentListSummaryGqlResponse,
} from "./graphql/responses/course-payment-list.gql.response";
import { CoursePurchaseSubmitGqlResponse } from "./graphql/responses/course-purchase-submit.gql.response";
import { CourseChapterCompleteGqlResponse } from "./graphql/responses/course-chapter-complete.gql.response";
import {
  CourseDeleteDependenciesGqlResponse,
  CourseDeleteDependencyBreakdownGqlResponse,
  CourseDeleteDependencyGroupGqlResponse,
} from "./graphql/responses/course-delete-dependencies.gql.response";
import { AppSettingsService } from "../app-settings";
import { BadgeService } from "../badge";
import { CouponService } from "../coupon";
import { NotificationService } from "../notification";
import { UserSubscriptionService } from "../user";
import {
  canAccessChapter,
  resolveChapterUnlocksAt,
} from "./chapter-access.util";
import { hasRichTextContent } from "../../utils/rich-text-content.util";

type PlainCourse = Course & {
  _id: Types.ObjectId;
};

type FileTypeLookup = Map<string, CourseItemType>;
type CourseListSortField = Extract<keyof CourseListSortOptionInput, string>;
type CourseFileReferenceSource = {
  coverImageFileId?: Types.ObjectId;
  chapters: Array<{
    items: Array<{
      fileId?: Types.ObjectId;
    }>;
  }>;
};
type UserCourseListRecord = Pick<
  UserCourse,
  "courseId" | "purchase" | "progress"
> & {
  _id: Types.ObjectId;
};
type CoursePaymentListRecord = UserCourse & {
  _id: Types.ObjectId;
};
type CoursePaymentUserLookupRecord = Pick<User, "profile" | "username"> & {
  _id: Types.ObjectId;
};
type CoursePaymentFileLookupRecord = Pick<
  StoredFile,
  "mimeType" | "name" | "path" | "sizeBytes"
> & {
  accessUrl?: FileAccessUrlDescriptor;
};
type CoursePaymentRelatedLookups = {
  usersById: Map<string, CoursePaymentUserLookupRecord>;
  filesById: Map<string, CoursePaymentFileLookupRecord>;
};
type CoursePurchasePricingInput = {
  courseId: Types.ObjectId;
  couponCode?: string;
};
type PurchasePriceSummary = {
  amountIrt: number;
  discountPercentage?: number;
  discountAmountIrt?: number;
  finalAmountIrt: number;
  couponSnapshot?: {
    couponId: Types.ObjectId;
    code: string;
    discountType: CouponDiscountType;
    discountValue: number;
  };
};
type ZarinPalRequestResponse = {
  data?: {
    authority?: string;
    code?: number;
    message?: string;
  };
  errors?: unknown;
};
type ZarinPalVerifyResponse = {
  data?: {
    code?: number;
    message?: string;
    ref_id?: number;
  };
  errors?: unknown;
};
type ZarinPalHttpError = {
  response?: {
    data?: ZarinPalRequestResponse | ZarinPalVerifyResponse;
    statusText?: string;
  };
  message?: string;
};
type StoredZarinPalConfig = {
  merchantId?: unknown;
  requestUrl?: unknown;
  verifyUrl?: unknown;
  startPayUrl?: unknown;
  minAmountIrr?: unknown;
};
type ZarinPalConfig = {
  merchantId: string;
  requestUrl: string;
  verifyUrl: string;
  startPayUrl: string;
  callbackBaseUrl: string;
  minAmountIrr: number;
};
export type ZarinPalVerificationResult = {
  status: "success" | "failed" | "cancelled";
  courseId?: string;
  refId?: string;
  reason?: string;
};

type CourseDeleteDependencyCounts = {
  enrollmentsByStatus: Map<UserCoursePurchaseStatus, number>;
  reviewTotal: number;
  reviewRatingCount: number;
  reviewMessageCount: number;
  couponTotal: number;
  couponSamples: Array<
    Pick<Coupon, "code" | "title" | "isActive"> & { _id: Types.ObjectId }
  >;
  notificationTotal: number;
  notificationsBySource: Map<NotificationSource, number>;
  attachedFileCount: number;
  deletableFileCount: number;
};

const COURSE_DELETE_DEPENDENCY_SAMPLE_LIMIT = 4;

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourseDocument>,
    @InjectModel(CourseReview.name)
    private readonly courseReviewModel: Model<CourseReviewDocument>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
    @InjectModel(StoredFile.name)
    private readonly storedFileModel: Model<StoredFileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly fileService: FileService,
    private readonly appSettingsService: AppSettingsService,
    private readonly badgeService: BadgeService,
    private readonly couponService: CouponService,
    private readonly notificationService: NotificationService,
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  async create(input: CourseCreateGqlInput): Promise<CourseListGqlResponse> {
    this.validateCreateInput(input);

    const normalizedInput = this.normalizeCreateInput(input);
    normalizedInput.sortOrder = await this.getNextCourseSortOrder();
    await this.ensureReferencedFilesExist(normalizedInput);

    const course = await this.courseModel.create(normalizedInput);
    await this.publishCourseBadgeCountSignal(
      BadgeCountTriggerAction.CREATED,
      course._id,
      {
        includeStaffUsers: true,
        includeActiveSubscribedUsers: course.isActive,
      },
    );
    const fileTypeLookup = await this.buildFileTypeLookup([course]);
    const fileAccessUrlMap = await this.buildFileAccessUrlLookup([course]);

    return this.toListResponse(course, fileTypeLookup, fileAccessUrlMap);
  }

  async update(input: CourseUpdateGqlInput): Promise<CourseListGqlResponse> {
    this.validateCreateInput(input);

    const existingCourse = await this.courseModel.findById(input.id).exec();
    if (!existingCourse) {
      throw new NotFoundException(EXCEPTION_CONSTANT.COURSE_NOT_FOUND);
    }

    const oldFileIds = this.collectReferencedFileIds(existingCourse);
    const existingIsActive = existingCourse.isActive;
    const normalizedInput = this.normalizeCreateInput(input);
    await this.ensureReferencedFilesExist(normalizedInput);

    const updatedCourse = await this.courseModel
      .findByIdAndUpdate(input.id, normalizedInput, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedCourse) {
      throw new NotFoundException(EXCEPTION_CONSTANT.COURSE_NOT_FOUND);
    }

    const newFileIds = this.collectReferencedFileIds(normalizedInput);
    const fileTypeLookup = await this.buildFileTypeLookup([updatedCourse]);
    const fileAccessUrlMap = await this.buildFileAccessUrlLookup([
      updatedCourse,
    ]);
    const response = this.toListResponse(
      updatedCourse,
      fileTypeLookup,
      fileAccessUrlMap,
    );

    if (existingIsActive !== updatedCourse.isActive) {
      await this.publishCourseBadgeCountSignal(
        BadgeCountTriggerAction.UPDATED,
        updatedCourse._id,
        {
          includeActiveSubscribedUsers: true,
          excludeStaffUsers: true,
        },
      );
    }

    await this.deleteDetachedFiles(input.id, oldFileIds, newFileIds);

    return response;
  }

  async getDeleteDependencies(
    input: CourseDeleteGqlInput,
  ): Promise<CourseDeleteDependenciesGqlResponse> {
    const course = await this.courseModel.findById(input.id).exec();
    if (!course) {
      throw new NotFoundException(EXCEPTION_CONSTANT.COURSE_NOT_FOUND);
    }

    const counts = await this.collectCourseDeleteDependencyCounts(
      input.id,
      course,
    );
    const groups = this.buildCourseDeleteDependencyGroups(counts);
    const retainedCount = groups
      .filter((group) => group.impact === CourseDeleteDependencyImpact.RETAINED)
      .reduce((total, group) => total + group.totalCount, 0);
    const removedCount = groups
      .filter((group) => group.impact === CourseDeleteDependencyImpact.REMOVED)
      .reduce((total, group) => total + group.totalCount, 0);

    return {
      courseId: course._id,
      courseTitle: course.title,
      summary: {
        retainedCount,
        removedCount,
        hasRetainedDependencies: retainedCount > 0,
        hasRemovedDependencies: removedCount > 0,
      },
      groups,
    };
  }

  async delete(input: CourseDeleteGqlInput): Promise<void> {
    const existingCourse = await this.courseModel.findById(input.id).exec();
    if (!existingCourse) {
      throw new NotFoundException(EXCEPTION_CONSTANT.COURSE_NOT_FOUND);
    }

    const oldFileIds = this.collectReferencedFileIds(existingCourse);

    const deletedCourse = await this.courseModel
      .findByIdAndDelete(input.id)
      .exec();
    if (!deletedCourse) {
      throw new NotFoundException(EXCEPTION_CONSTANT.COURSE_NOT_FOUND);
    }

    await this.deleteCourseRelatedNotifications(input.id);
    await this.publishCourseBadgeCountSignal(
      BadgeCountTriggerAction.DELETED,
      deletedCourse._id,
      {
        includeStaffUsers: true,
        includeActiveSubscribedUsers: deletedCourse.isActive,
      },
    );
    await this.deleteDetachedFiles(input.id, oldFileIds, []);
  }

  async submitPurchase(
    input: CoursePurchaseSubmitGqlInput,
    userId: Types.ObjectId,
  ): Promise<CoursePurchaseSubmitGqlResponse> {
    this.validatePurchaseInputShape(input);

    const [course, user, existingUserCourse] = await Promise.all([
      this.courseModel.findOne({ _id: input.courseId, isActive: true }).exec(),
      this.userModel.findById(userId).exec(),
      this.userCourseModel
        .findOne({
          courseId: input.courseId,
          userId,
        })
        .exec(),
    ]);

    if (!course) {
      throw new NotFoundException(EXCEPTION_CONSTANT.COURSE_NOT_FOUND_OR_INACTIVE);
    }

    if (!user) {
      throw new NotFoundException(EXCEPTION_CONSTANT.USER_NOT_FOUND);
    }

    if (existingUserCourse?.purchase.status === UserCoursePurchaseStatus.PAID) {
      throw new ConflictException(EXCEPTION_CONSTANT.COURSE_ALREADY_PURCHASED);
    }

    if (
      existingUserCourse?.purchase.status === UserCoursePurchaseStatus.PENDING
    ) {
      throw new ConflictException(EXCEPTION_CONSTANT.COURSE_PENDING_PURCHASE);
    }

    const priceSummary = await this.resolvePurchasePriceSummary(
      input,
      course,
      userId,
    );
    this.validatePurchaseMethodAgainstPrice(input, priceSummary.finalAmountIrt);

    const uploadedReceiptFileId = await this.resolveReceiptFileId(input);
    const gatewayPayment =
      input.paymentMethod === UserCoursePaymentMethod.GATEWAY
        ? await this.requestZarinPalPayment(
            course,
            user,
            priceSummary.finalAmountIrt,
          )
        : undefined;
    const now = new Date();
    const status =
      input.paymentMethod === UserCoursePaymentMethod.FREE
        ? UserCoursePurchaseStatus.PAID
        : UserCoursePurchaseStatus.PENDING;
    const userCoursePayload = {
      userId,
      courseId: course._id,
      userSnapshot: this.toUserCourseUserSnapshot(user),
      courseSnapshot: {
        title: course.title,
        description: course.description,
        priceIrt: priceSummary.amountIrt,
        discount: course.discount
          ? {
              type: course.discount.type,
              value: course.discount.value,
            }
          : undefined,
      },
      purchase: {
        status,
        amountIrt: priceSummary.amountIrt,
        discountPercentage: priceSummary.discountPercentage,
        discountAmountIrt: priceSummary.discountAmountIrt,
        finalAmountIrt: priceSummary.finalAmountIrt,
        currency:
          input.paymentMethod === UserCoursePaymentMethod.CRYPTOCURRENCY
            ? UserCoursePurchaseCurrency.USDT
            : UserCoursePurchaseCurrency.IRT,
        paymentMethod: input.paymentMethod,
        paymentProvider:
          input.paymentMethod === UserCoursePaymentMethod.GATEWAY
            ? "ZARINPAL"
            : undefined,
        paymentReference:
          gatewayPayment?.authority ??
          this.normalizeOptionalText(input.paymentReference),
        transactionId: this.normalizeOptionalText(input.transactionId),
        pendingAt:
          status === UserCoursePurchaseStatus.PENDING ? now : undefined,
        paidAt: status === UserCoursePurchaseStatus.PAID ? now : undefined,
        isManualStatusChange: false,
        uploadedReceiptFileId,
        receiptUploadedBy: uploadedReceiptFileId ? userId : undefined,
        couponSnapshot: priceSummary.couponSnapshot,
      },
      progress: { chapters: [] },
    };

    const previousStatus = existingUserCourse?.purchase.status;

    const userCourse =
      existingUserCourse ??
      new this.userCourseModel({
        userId,
        courseId: course._id,
      });

    userCourse.set(userCoursePayload);

    try {
      await userCourse.save();
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(EXCEPTION_CONSTANT.COURSE_PURCHASE_EXISTS);
      }

      throw error;
    }

    const nextStatus = userCourse.purchase.status;

    await this.publishPaymentBadgeCountSignal({
      userCourseId: userCourse._id,
      courseId: userCourse.courseId,
      action:
        previousStatus != null && previousStatus !== nextStatus
          ? BadgeCountTriggerAction.UPDATED
          : BadgeCountTriggerAction.CREATED,
      includeStaffUsersWhenPendingPaymentsExist: true,
      previousStatus,
      nextStatus,
    });

    return this.toCoursePurchaseSubmitResponse(
      userCourse,
      gatewayPayment?.paymentUrl,
    );
  }

  async verifyZarinPalPurchase(
    authority?: string,
    status?: string,
  ): Promise<ZarinPalVerificationResult> {
    const normalizedAuthority = this.normalizeOptionalText(authority);

    if (!normalizedAuthority) {
      return { status: "failed", reason: EXCEPTION_CONSTANT.ZARINPAL_MISSING_AUTHORITY };
    }

    const userCourse = await this.userCourseModel
      .findOne({
        "purchase.paymentProvider": "ZARINPAL",
        "purchase.paymentReference": normalizedAuthority,
      })
      .exec();

    if (!userCourse) {
      return { status: "failed", reason: EXCEPTION_CONSTANT.ZARINPAL_PURCHASE_NOT_FOUND };
    }

    const courseId = userCourse.courseId.toString();

    if (status !== "OK") {
      const previousStatus = userCourse.purchase.status;
      userCourse.purchase.status = UserCoursePurchaseStatus.CANCELLED;
      userCourse.purchase.cancelledAt = new Date();
      await userCourse.save();
      await this.publishPaymentStatusChangeBadgeCountSignal({
        userCourseId: userCourse._id,
        courseId: userCourse.courseId,
        previousStatus,
        nextStatus: UserCoursePurchaseStatus.CANCELLED,
      });
      return { status: "cancelled", courseId };
    }

    const zarinPalConfig = await this.resolveZarinPalConfig();
    const amountIrr = this.toZarinPalAmountIrr(
      userCourse.purchase.finalAmountIrt,
      zarinPalConfig.minAmountIrr,
    );

    try {
      const { data } = await axios.post<ZarinPalVerifyResponse>(
        zarinPalConfig.verifyUrl,
        {
          merchant_id: zarinPalConfig.merchantId,
          amount: amountIrr,
          authority: normalizedAuthority,
        },
        {
          headers: { accept: "application/json" },
          timeout: 15000,
        },
      );

      const verification = data.data;
      if (!verification || ![100, 101].includes(verification.code ?? 0)) {
        const previousStatus = userCourse.purchase.status;
        userCourse.purchase.status = UserCoursePurchaseStatus.FAILED;
        userCourse.purchase.failedAt = new Date();
        await userCourse.save();
        await this.publishPaymentStatusChangeBadgeCountSignal({
          userCourseId: userCourse._id,
          courseId: userCourse.courseId,
          previousStatus,
          nextStatus: UserCoursePurchaseStatus.FAILED,
        });
        this.logger.warn(
          `ZarinPal verification failed for authority=${normalizedAuthority}: ${verification?.message ?? "unknown"}`,
        );
        return {
          status: "failed",
          courseId,
          reason: EXCEPTION_CONSTANT.ZARINPAL_VERIFICATION_FAILED,
        };
      }

      const previousStatus = userCourse.purchase.status;
      userCourse.purchase.status = UserCoursePurchaseStatus.PAID;
      userCourse.purchase.paidAt = new Date();
      userCourse.purchase.transactionId = verification.ref_id?.toString();
      await userCourse.save();
      await this.publishPaymentStatusChangeBadgeCountSignal({
        userCourseId: userCourse._id,
        courseId: userCourse.courseId,
        previousStatus,
        nextStatus: UserCoursePurchaseStatus.PAID,
      });
      await this.notifyCoursePurchaseStatusChanged(userCourse, previousStatus);

      return {
        status: "success",
        courseId,
        refId: verification.ref_id?.toString(),
      };
    } catch (error) {
      this.logger.error(
        `ZarinPal verification error for authority=${normalizedAuthority}: ${this.extractZarinPalErrorMessage(error) || String(error)}`,
      );
      return {
        status: "failed",
        courseId,
        reason: EXCEPTION_CONSTANT.ZARINPAL_VERIFICATION_ERROR,
      };
    }
  }

  async paymentDetail(
    input: CoursePaymentDetailGqlInput,
  ): Promise<CoursePaymentListGqlResponse> {
    const userCourse = await this.userCourseModel.findById(input.id).exec();

    if (!userCourse) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PAYMENT_NOT_FOUND);
    }

    const relatedLookups = await this.buildCoursePaymentRelatedLookups([
      userCourse.toObject() as CoursePaymentListRecord,
    ]);

    return this.toCoursePaymentListResponse(userCourse, relatedLookups);
  }

  async listPayments(
    input: CoursePaymentListGqlInput,
  ): Promise<CoursePaymentListPaginatedOffsetGqlResponse> {
    const { filters, options } = input || {};
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_LIMIT;
    const skip = options?.skip ?? PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_SKIP;
    const filterQuery = this.buildPaymentListFilterQuery(filters);

    const [userCourses, total] = await Promise.all([
      this.userCourseModel
        .aggregate<CoursePaymentListRecord>([
          { $match: filterQuery },
          {
            $addFields: {
              paymentSortAt: {
                $ifNull: ["$audit.updatedAt", "$audit.createdAt"],
              },
            },
          },
          { $sort: { paymentSortAt: -1, _id: -1 } },
          { $skip: skip },
          { $limit: limit },
        ])
        .exec(),
      this.userCourseModel.countDocuments(filterQuery).exec(),
    ]);
    const relatedLookups = await this.buildCoursePaymentFileLookup(userCourses);

    return {
      items: userCourses.map((userCourse) =>
        this.toCoursePaymentListSummaryResponse(userCourse, relatedLookups),
      ),
      pagination: {
        limit,
        skip,
        total,
        count: userCourses.length,
      },
    };
  }

  async updatePaymentStatus(
    input: CoursePaymentStatusUpdateGqlInput,
    adminUserId: Types.ObjectId,
  ): Promise<CoursePaymentListGqlResponse> {
    const userCourse = await this.userCourseModel.findById(input.id).exec();

    if (!userCourse) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PAYMENT_NOT_FOUND);
    }

    const previousStatus = userCourse.purchase.status;
    const now = new Date();
    userCourse.purchase.status = input.status;
    userCourse.purchase.isManualStatusChange = true;
    userCourse.purchase.manualStatusChangedBy = adminUserId;
    userCourse.purchase.manualStatusChangedDescription =
      this.normalizeOptionalText(input.manualStatusChangedDescription) ??
      undefined;
    this.setPurchaseStatusTimestamp(userCourse, input.status, now);

    await userCourse.save();
    await this.publishPaymentStatusChangeBadgeCountSignal({
      userCourseId: userCourse._id,
      courseId: userCourse.courseId,
      previousStatus,
      nextStatus: input.status,
    });
    await this.notifyCoursePurchaseStatusChanged(userCourse, previousStatus, {
      changedByInvestigationTeam: true,
    });

    const relatedLookups = await this.buildCoursePaymentRelatedLookups([
      userCourse.toObject() as CoursePaymentListRecord,
    ]);

    return this.toCoursePaymentListResponse(userCourse, relatedLookups);
  }

  async createManualPayment(
    input: CoursePaymentManualCreateGqlInput,
    adminUserId: Types.ObjectId,
  ): Promise<CoursePaymentListGqlResponse> {
    this.validateManualPaymentInputShape(input);

    const [course, user, existingUserCourse] = await Promise.all([
      this.courseModel.findOne({ _id: input.courseId, isActive: true }).exec(),
      this.userModel
        .findOne({
          _id: input.userId,
          status: UserStatus.ACTIVE,
          roles: { $eq: [UserRole.END_USER] },
          $or: [
            { "audit.deletedAt": null },
            { "audit.deletedAt": { $exists: false } },
          ],
        })
        .exec(),
      this.userCourseModel
        .findOne({
          courseId: input.courseId,
          userId: input.userId,
        })
        .exec(),
    ]);

    if (!course) {
      throw new NotFoundException(EXCEPTION_CONSTANT.COURSE_NOT_FOUND_OR_INACTIVE);
    }

    if (this.isCourseFree(course)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.MANUAL_PAYMENT_PAID_COURSE_ONLY);
    }

    if (!user) {
      throw new BadRequestException(EXCEPTION_CONSTANT.MANUAL_PAYMENT_END_USER_ONLY);
    }

    if (existingUserCourse?.purchase.status === UserCoursePurchaseStatus.PAID) {
      throw new ConflictException(EXCEPTION_CONSTANT.USER_COURSE_ALREADY_PAID);
    }

    if (existingUserCourse) {
      throw new ConflictException(EXCEPTION_CONSTANT.USER_COURSE_PURCHASE_EXISTS);
    }

    const priceSummary = await this.resolvePurchasePriceSummary(
      {
        courseId: input.courseId,
        couponCode: input.couponCode,
      },
      course,
      input.userId,
    );
    const manualPriceSummary =
      input.paymentMethod === UserCoursePaymentMethod.FREE
        ? this.toManualFreePriceSummary(priceSummary)
        : priceSummary;
    this.validatePurchaseMethodAgainstPrice(
      input,
      manualPriceSummary.finalAmountIrt,
    );
    const uploadedReceiptFileId = await this.resolveManualPaymentReceiptFileId(
      input.uploadedReceiptFileId,
    );

    const now = new Date();
    const userCourse = new this.userCourseModel({
      userId: input.userId,
      courseId: course._id,
      userSnapshot: this.toUserCourseUserSnapshot(user),
      courseSnapshot: {
        title: course.title,
        description: course.description,
        priceIrt: manualPriceSummary.amountIrt,
        discount: course.discount
          ? {
              type: course.discount.type,
              value: course.discount.value,
            }
          : undefined,
      },
      purchase: {
        status: input.status,
        amountIrt: manualPriceSummary.amountIrt,
        discountPercentage: manualPriceSummary.discountPercentage,
        discountAmountIrt: manualPriceSummary.discountAmountIrt,
        finalAmountIrt: manualPriceSummary.finalAmountIrt,
        currency:
          input.paymentMethod === UserCoursePaymentMethod.CRYPTOCURRENCY
            ? UserCoursePurchaseCurrency.USDT
            : UserCoursePurchaseCurrency.IRT,
        paymentMethod: input.paymentMethod,
        submittedInitiallyByAdmin: true,
        isManualStatusChange: false,
        uploadedReceiptFileId,
        receiptUploadedBy: uploadedReceiptFileId ? adminUserId : undefined,
        couponSnapshot: manualPriceSummary.couponSnapshot,
      },
      progress: { chapters: [] },
    });

    this.setPurchaseStatusTimestamp(userCourse, input.status, now);
    await userCourse.save();

    await this.publishPaymentBadgeCountSignal({
      userCourseId: userCourse._id,
      courseId: course._id,
      action: BadgeCountTriggerAction.CREATED,
      includeStaffUsersWhenPendingPaymentsExist: true,
      nextStatus: input.status,
    });

    const relatedLookups = await this.buildCoursePaymentRelatedLookups([
      userCourse.toObject() as CoursePaymentListRecord,
    ]);

    return this.toCoursePaymentListResponse(userCourse, relatedLookups);
  }

  async detail(input: CourseDetailGqlInput): Promise<CourseListGqlResponse> {
    const course = await this.courseModel.findById(input.id).exec();
    if (!course) {
      throw new NotFoundException(EXCEPTION_CONSTANT.COURSE_NOT_FOUND);
    }

    const fileTypeLookup = await this.buildFileTypeLookup([course]);
    const fileAccessUrlMap = await this.buildFileAccessUrlLookup([course]);

    return this.toListResponse(course, fileTypeLookup, fileAccessUrlMap);
  }

  async list(
    input: CourseListGqlInput,
  ): Promise<CourseListPaginatedCursorGqlResponse> {
    const { filters, options } = input || {};
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.CURSOR_BASED.DEFAULT_LIMIT;
    const includeUserId = filters?.includeUserId;
    const baseFilterQuery = await this.applyIncludeUserIdFilter(
      await this.buildListFilterQuery(
        includeUserId ? { ...filters, includeUserId: undefined } : filters,
      ),
      includeUserId,
    );
    const sortFieldMap: Record<CourseListSortField, string> = {
      createdAt: "audit.createdAt",
      updatedAt: "audit.updatedAt",
      title: "title",
      priceIrt: "priceIrt",
      isActive: "isActive",
      sortOrder: "sortOrder",
    };
    const requestedSort = options?.sort ?? { createdAt: SortingOrder.DESC };
    const cursorSort = this.resolveCourseCursorSort(requestedSort);
    const sortOptions = {
      ...buildSortOptions<CourseListSortField>(requestedSort, sortFieldMap),
      _id: cursorSort.direction,
    };
    const cursorFilterQuery = await this.buildCursorFilterQuery(
      options?.startCursor,
      cursorSort.path,
      cursorSort.direction,
    );
    const filterQuery =
      cursorFilterQuery == null
        ? baseFilterQuery
        : { $and: [baseFilterQuery, cursorFilterQuery] };

    const [coursesWithExtra, total] = await Promise.all([
      this.courseModel
        .find(filterQuery)
        .sort(sortOptions)
        .limit(limit + 1)
        .exec(),
      this.courseModel.countDocuments(baseFilterQuery).exec(),
    ]);
    const hasNextPage = coursesWithExtra.length > limit;
    const courses = coursesWithExtra.slice(0, limit);

    const fileTypeLookup = await this.buildFileTypeLookup(courses);
    const fileAccessUrlMap = await this.buildFileAccessUrlLookup(courses);
    const firstCourse = courses[0];
    const lastCourse = courses[courses.length - 1];

    return {
      items: courses.map((course) =>
        this.toListSummaryResponse(course, fileTypeLookup, fileAccessUrlMap),
      ),
      pagination: {
        limit,
        total,
        count: courses.length,
        startCursor: firstCourse?._id.toString(),
        endCursor: lastCourse?._id.toString(),
        hasNextPage,
        hasPreviousPage: Boolean(options?.startCursor),
      },
    };
  }

  async listForUser(
    input: CourseListGqlInput,
    userId?: Types.ObjectId,
  ): Promise<UserCourseListPaginatedCursorGqlResponse> {
    const { filters, options } = input || {};
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.CURSOR_BASED.DEFAULT_LIMIT;
    const baseFilterQuery = await this.applyUserCoursePurchaseFilter(
      await this.buildListFilterQuery({
        ...(filters ?? {}),
        isActive: true,
      }),
      filters?.isPurchased,
      userId,
    );
    const sortFieldMap: Record<CourseListSortField, string> = {
      createdAt: "audit.createdAt",
      updatedAt: "audit.updatedAt",
      title: "title",
      priceIrt: "priceIrt",
      isActive: "isActive",
      sortOrder: "sortOrder",
    };
    const requestedSort = options?.sort ?? { createdAt: SortingOrder.DESC };
    const cursorSort = this.resolveCourseCursorSort(requestedSort);
    const sortOptions = {
      ...buildSortOptions<CourseListSortField>(requestedSort, sortFieldMap),
      _id: cursorSort.direction,
    };
    const cursorFilterQuery = await this.buildCursorFilterQuery(
      options?.startCursor,
      cursorSort.path,
      cursorSort.direction,
    );
    const filterQuery =
      cursorFilterQuery == null
        ? baseFilterQuery
        : { $and: [baseFilterQuery, cursorFilterQuery] };

    const [coursesWithExtra, total] = await Promise.all([
      this.courseModel
        .find(filterQuery)
        .sort(sortOptions)
        .limit(limit + 1)
        .select({
          title: 1,
          description: 1,
          coverImageFileId: 1,
          priceIrt: 1,
          discount: 1,
          tags: 1,
          chapters: 1,
        })
        .exec(),
      this.courseModel.countDocuments(baseFilterQuery).exec(),
    ]);
    const hasNextPage = coursesWithExtra.length > limit;
    const courses = coursesWithExtra.slice(0, limit);
    const [fileTypeLookup, userCourseLookup] = await Promise.all([
      this.buildFileTypeLookup(courses),
      this.buildUserCourseLookup(userId, courses),
    ]);
    const fileAccessUrlMap = await this.buildFileAccessUrlLookup(courses);
    const firstCourse = courses[0];
    const lastCourse = courses[courses.length - 1];

    return {
      items: courses.map((course) =>
        this.toUserListResponse(
          course,
          fileTypeLookup,
          userCourseLookup.get(course._id.toString()),
          fileAccessUrlMap,
        ),
      ),
      pagination: {
        limit,
        total,
        count: courses.length,
        startCursor: firstCourse?._id.toString(),
        endCursor: lastCourse?._id.toString(),
        hasNextPage,
        hasPreviousPage: Boolean(options?.startCursor),
      },
    };
  }

  async detailForUser(
    input: UserCourseDetailGqlInput,
    userId?: Types.ObjectId,
  ): Promise<UserCourseDetailGqlResponse> {
    const course = await this.courseModel
      .findOne({ _id: input.id, isActive: true })
      .select({
        title: 1,
        description: 1,
        coverImageFileId: 1,
        priceIrt: 1,
        discount: 1,
        tags: 1,
        chapters: 1,
        isReviewSubmissionEnabled: 1,
        isReviewsSectionVisible: 1,
      })
      .exec();
    if (!course) {
      throw new NotFoundException(EXCEPTION_CONSTANT.COURSE_NOT_FOUND);
    }

    const [fileTypeLookup, userCourseLookup] = await Promise.all([
      this.buildFileTypeLookup([course]),
      this.buildUserCourseLookup(userId, [course]),
    ]);
    const fileAccessUrlMap = await this.buildFileAccessUrlLookup([course]);
    const userCourse = userCourseLookup.get(course._id.toString());

    return this.toUserDetailResponse(
      course,
      fileTypeLookup,
      userCourse,
      fileAccessUrlMap,
    );
  }

  async completeChapter(
    input: CourseChapterCompleteGqlInput,
    userId: Types.ObjectId,
  ): Promise<CourseChapterCompleteGqlResponse> {
    const course = await this.courseModel
      .findOne({ _id: input.courseId, isActive: true })
      .select({ chapters: 1, priceIrt: 1, discount: 1 })
      .exec();
    if (!course) {
      throw new NotFoundException(EXCEPTION_CONSTANT.COURSE_NOT_FOUND);
    }

    const userCourse = await this.userCourseModel
      .findOne({
        userId,
        courseId: input.courseId,
      })
      .exec();
    if (!userCourse) {
      throw new NotFoundException(EXCEPTION_CONSTANT.COURSE_ENROLLMENT_NOT_FOUND);
    }

    if (userCourse.purchase.status !== UserCoursePurchaseStatus.PAID) {
      throw new BadRequestException(EXCEPTION_CONSTANT.CHAPTER_COMPLETION_REQUIRES_PURCHASE);
    }

    const chapters = this.sortChaptersForDisplay(
      ((course.toObject?.() || course) as PlainCourse).chapters || [],
    );
    const chapter = chapters.find(
      (entry) => entry.key === input.chapterKey.trim(),
    );
    if (!chapter) {
      throw new NotFoundException(EXCEPTION_CONSTANT.CHAPTER_NOT_FOUND);
    }

    const isCourseFree = this.isCourseFree(
      (course.toObject?.() || course) as PlainCourse,
    );
    const chapterAccessContext = {
      isCourseFree,
      isPurchased: true,
      paidAt: userCourse.purchase.paidAt,
    };
    if (!canAccessChapter(chapter, chapterAccessContext)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.CHAPTER_LOCKED);
    }

    const existingProgress = (userCourse.progress?.chapters || []).find(
      (entry) => entry.key === chapter.key,
    );
    const progressCounts = this.calculateChapterProgressCounts(
      chapters,
      chapterAccessContext,
      userCourse.progress?.chapters || [],
    );

    if (existingProgress) {
      return {
        key: existingProgress.key,
        titleSnapshot: existingProgress.titleSnapshot,
        userCompletedAt: existingProgress.userCompletedAt,
        completedChapterCount: progressCounts.completedChapterCount,
        accessibleChapterCount: progressCounts.accessibleChapterCount,
      };
    }

    const now = new Date();
    const progressEntry = {
      key: chapter.key,
      titleSnapshot: chapter.title,
      userCompletedAt: now,
    };
    const updateResult = await this.userCourseModel
      .updateOne(
        {
          _id: userCourse._id,
          "progress.chapters.key": { $ne: chapter.key },
        },
        {
          $push: {
            "progress.chapters": progressEntry,
          },
        },
      )
      .exec();

    if (updateResult.modifiedCount === 0) {
      const latestUserCourse = await this.userCourseModel
        .findById(userCourse._id)
        .select({ progress: 1 })
        .lean<{ progress?: UserCourse["progress"] }>()
        .exec();
      const latestProgress = (latestUserCourse?.progress?.chapters || []).find(
        (entry) => entry.key === chapter.key,
      );
      if (!latestProgress) {
        throw new ConflictException(EXCEPTION_CONSTANT.CHAPTER_COMPLETION_FAILED);
      }

      const latestCounts = this.calculateChapterProgressCounts(
        chapters,
        chapterAccessContext,
        latestUserCourse?.progress?.chapters || [],
      );

      return {
        key: latestProgress.key,
        titleSnapshot: latestProgress.titleSnapshot,
        userCompletedAt: latestProgress.userCompletedAt,
        completedChapterCount: latestCounts.completedChapterCount,
        accessibleChapterCount: latestCounts.accessibleChapterCount,
      };
    }

    return {
      key: progressEntry.key,
      titleSnapshot: progressEntry.titleSnapshot,
      userCompletedAt: progressEntry.userCompletedAt,
      completedChapterCount: progressCounts.completedChapterCount + 1,
      accessibleChapterCount: progressCounts.accessibleChapterCount,
    };
  }

  private calculateChapterProgressCounts(
    chapters: CourseChapter[],
    chapterAccessContext: {
      isCourseFree: boolean;
      isPurchased: boolean;
      paidAt?: Date;
    },
    completedChapters: Array<{ key: string }>,
  ): {
    completedChapterCount: number;
    accessibleChapterCount: number;
  } {
    const completedKeys = new Set(completedChapters.map((entry) => entry.key));
    let completedChapterCount = 0;
    let accessibleChapterCount = 0;

    chapters.forEach((chapter) => {
      if (!canAccessChapter(chapter, chapterAccessContext)) {
        return;
      }

      accessibleChapterCount += 1;
      if (completedKeys.has(chapter.key)) {
        completedChapterCount += 1;
      }
    });

    return { completedChapterCount, accessibleChapterCount };
  }

  private resolveChapterProgress(
    chapterKey: string,
    completedChapters: Array<{
      key: string;
      titleSnapshot: string;
      userCompletedAt: Date;
    }>,
  ): {
    isCompleted: boolean;
    userCompletedAt?: Date;
  } {
    const progress = completedChapters.find(
      (entry) => entry.key === chapterKey,
    );
    if (!progress) {
      return { isCompleted: false };
    }

    return {
      isCompleted: true,
      userCompletedAt: progress.userCompletedAt,
    };
  }

  private resolveCourseCursorSort(sort?: CourseListSortOptionInput): {
    field: CourseListSortField;
    path: string;
    direction: 1 | -1;
  } {
    const sortFieldMap: Record<CourseListSortField, string> = {
      createdAt: "audit.createdAt",
      updatedAt: "audit.updatedAt",
      title: "title",
      priceIrt: "priceIrt",
      isActive: "isActive",
      sortOrder: "sortOrder",
    };
    const sortEntries = Object.entries(sort ?? {}) as Array<
      [CourseListSortField, SortingOrder | undefined]
    >;
    const [field, order] =
      sortEntries.find(([, sortOrder]) => sortOrder != null) ??
      (["createdAt", SortingOrder.DESC] as const);

    return {
      field,
      path: sortFieldMap[field],
      direction: order === SortingOrder.ASC ? 1 : -1,
    };
  }

  private async buildCursorFilterQuery(
    startCursor: string | undefined,
    sortPath: string,
    direction: 1 | -1,
  ): Promise<FilterQuery<Course> | null> {
    if (!startCursor) {
      return null;
    }

    if (!Types.ObjectId.isValid(startCursor)) {
      return null;
    }

    const cursorId = new Types.ObjectId(startCursor);
    const cursorCourse = await this.courseModel
      .findById(cursorId)
      .lean<{ _id: Types.ObjectId; sortOrder?: number | null }>()
      .exec();
    if (!cursorCourse) {
      return null;
    }

    const operator = direction === 1 ? "$gt" : "$lt";
    if (sortPath === "sortOrder") {
      const rawSortOrder =
        "sortOrder" in cursorCourse ? cursorCourse.sortOrder : undefined;
      return this.buildSortOrderCursorFilter(cursorId, rawSortOrder, direction);
    }

    const cursorValue = this.getCourseValueByPath(cursorCourse, sortPath);

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

  private buildSortOrderCursorFilter(
    cursorId: Types.ObjectId,
    rawSortOrder: number | null | undefined,
    direction: 1 | -1,
  ): FilterQuery<Course> {
    const missingSortOrder: FilterQuery<Course> = {
      $or: [{ sortOrder: { $exists: false } }, { sortOrder: null }],
    };
    const isMissing = rawSortOrder === null || rawSortOrder === undefined;

    if (direction === 1) {
      if (isMissing) {
        return {
          $or: [
            { sortOrder: { $type: "number" } },
            {
              $and: [missingSortOrder, { _id: { $gt: cursorId } }],
            },
          ],
        };
      }

      return {
        $or: [
          { sortOrder: { $gt: rawSortOrder } },
          {
            $and: [{ sortOrder: rawSortOrder }, { _id: { $gt: cursorId } }],
          },
        ],
      };
    }

    if (isMissing) {
      return {
        $and: [missingSortOrder, { _id: { $lt: cursorId } }],
      };
    }

    return {
      $or: [
        { sortOrder: { $lt: rawSortOrder } },
        {
          $and: [{ sortOrder: rawSortOrder }, { _id: { $lt: cursorId } }],
        },
        missingSortOrder,
      ],
    };
  }

  private getCourseValueByPath(
    course: { get?: (path: string) => unknown } | Record<string, unknown>,
    path: string,
  ): unknown {
    let value: unknown;
    if (
      typeof (course as { get?: (path: string) => unknown }).get === "function"
    ) {
      value = (course as { get: (path: string) => unknown }).get(path);
    } else {
      value = path.split(".").reduce<unknown>((current, key) => {
        if (current && typeof current === "object" && key in current) {
          return (current as Record<string, unknown>)[key];
        }
        return undefined;
      }, course);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }

    return value ?? null;
  }

  private async publishCourseBadgeCountSignal(
    action: BadgeCountTriggerAction,
    courseId: Types.ObjectId,
    options: {
      includeStaffUsers?: boolean;
      includeActiveSubscribedUsers?: boolean;
      excludeStaffUsers?: boolean;
    } = { includeActiveSubscribedUsers: true },
  ): Promise<void> {
    await this.badgeService.publishCountSignal({
      includeStaffUsers: options.includeStaffUsers,
      includeActiveSubscribedUsers: options.includeActiveSubscribedUsers,
      excludeStaffUsers: options.excludeStaffUsers,
      payload: {
        source: BadgeCountTriggerSource.COURSE,
        action,
        courseId: courseId.toString(),
      },
    });
  }

  private async publishPaymentBadgeCountSignal(params: {
    userCourseId: Types.ObjectId;
    courseId: Types.ObjectId;
    action: BadgeCountTriggerAction;
    includeStaffUsers?: boolean;
    includeStaffUsersWhenPendingPaymentsExist?: boolean;
    previousStatus?: UserCoursePurchaseStatus;
    nextStatus?: UserCoursePurchaseStatus;
  }): Promise<void> {
    let includeStaffUsers = params.includeStaffUsers ?? false;

    if (params.includeStaffUsersWhenPendingPaymentsExist) {
      includeStaffUsers = await this.shouldPublishStaffPaymentBadgeCountSignal(
        params.previousStatus,
        params.nextStatus,
      );
    }

    if (!includeStaffUsers) {
      return;
    }

    await this.badgeService.publishCountSignal({
      includeStaffUsers,
      payload: {
        source: BadgeCountTriggerSource.PAYMENT,
        action: params.action,
        courseId: params.courseId.toString(),
        userCourseId: params.userCourseId.toString(),
      },
    });
  }

  private async publishPaymentStatusChangeBadgeCountSignal(params: {
    userCourseId: Types.ObjectId;
    courseId: Types.ObjectId;
    previousStatus: UserCoursePurchaseStatus;
    nextStatus: UserCoursePurchaseStatus;
  }): Promise<void> {
    if (params.previousStatus === params.nextStatus) {
      return;
    }

    await this.publishPaymentBadgeCountSignal({
      userCourseId: params.userCourseId,
      courseId: params.courseId,
      action: BadgeCountTriggerAction.UPDATED,
      includeStaffUsersWhenPendingPaymentsExist: true,
      previousStatus: params.previousStatus,
      nextStatus: params.nextStatus,
    });
  }

  private async shouldPublishStaffPaymentBadgeCountSignal(
    previousStatus?: UserCoursePurchaseStatus,
    nextStatus?: UserCoursePurchaseStatus,
  ): Promise<boolean> {
    if (nextStatus === UserCoursePurchaseStatus.PENDING) {
      return true;
    }

    if (await this.hasAnyPendingPayments()) {
      return true;
    }

    return previousStatus === UserCoursePurchaseStatus.PENDING;
  }

  private async hasAnyPendingPayments(): Promise<boolean> {
    const pendingPurchase = await this.userCourseModel
      .findOne({ "purchase.status": UserCoursePurchaseStatus.PENDING })
      .select({ _id: 1 })
      .lean<{ _id: Types.ObjectId }>()
      .exec();

    return pendingPurchase != null;
  }

  private failCourseValidation(
    key: (typeof EXCEPTION_CONSTANT)[keyof typeof EXCEPTION_CONSTANT],
    params?: Record<string, unknown>,
  ): never {
    if (params && Object.keys(params).length > 0) {
      throw new BadRequestException({ key, params });
    }

    throw new BadRequestException(key);
  }

  private formatChapterValidationLabel(
    chapterIndex: number,
    chapterTitle?: string,
  ): string {
    const chapterNumber = (chapterIndex + 1).toLocaleString("fa-IR");
    const trimmedTitle = chapterTitle?.trim();
    return trimmedTitle ? `فصل «${trimmedTitle}»` : `فصل ${chapterNumber}`;
  }

  private formatItemValidationLabel(
    chapterIndex: number,
    itemIndex: number,
    chapterTitle: string | undefined,
    itemTitle: string | undefined,
  ): string {
    const chapterLabel = this.formatChapterValidationLabel(
      chapterIndex,
      chapterTitle,
    );
    const itemNumber = (itemIndex + 1).toLocaleString("fa-IR");
    const trimmedItemTitle = itemTitle?.trim();
    const itemLabel = trimmedItemTitle
      ? `آیتم «${trimmedItemTitle}»`
      : `آیتم ${itemNumber}`;
    return `${itemLabel} در ${chapterLabel}`;
  }

  private validateCreateInput(input: CourseCreateGqlInput): void {
    if (!input.title?.trim()) {
      this.failCourseValidation(EXCEPTION_CONSTANT.COURSE_VALIDATION_TITLE_REQUIRED);
    }

    if (input.priceIrt != null && input.priceIrt < 0) {
      this.failCourseValidation(EXCEPTION_CONSTANT.COURSE_VALIDATION_PRICE_NEGATIVE);
    }

    if (input.discount) {
      const priceIrt = input.priceIrt ?? 0;
      if (priceIrt > 0) {
        if (input.discount.value <= 0) {
          this.failCourseValidation(EXCEPTION_CONSTANT.COURSE_VALIDATION_DISCOUNT_POSITIVE);
        }
        if (
          input.discount.type === CourseDiscountType.PERCENTAGE &&
          input.discount.value > 100
        ) {
          this.failCourseValidation(
            EXCEPTION_CONSTANT.COURSE_VALIDATION_DISCOUNT_PERCENTAGE_RANGE,
          );
        }
        if (
          input.discount.type === CourseDiscountType.FIXED_AMOUNT_IRT &&
          input.discount.value > priceIrt
        ) {
          this.failCourseValidation(
            EXCEPTION_CONSTANT.COURSE_VALIDATION_DISCOUNT_FIXED_TOO_HIGH,
          );
        }
      }
    }

    if (!input.chapters?.length) {
      this.failCourseValidation(EXCEPTION_CONSTANT.COURSE_CHAPTER_REQUIRED);
    }

    for (
      let chapterIndex = 0;
      chapterIndex < input.chapters.length;
      chapterIndex += 1
    ) {
      const chapter = input.chapters[chapterIndex];
      const chapterLabel = this.formatChapterValidationLabel(
        chapterIndex,
        chapter.title,
      );

      if (!chapter.title?.trim()) {
        this.failCourseValidation(
          EXCEPTION_CONSTANT.COURSE_VALIDATION_CHAPTER_TITLE_REQUIRED,
          { chapterLabel },
        );
      }

      if (
        chapter.visibleAfterMinutes != null &&
        chapter.visibleAfterMinutes < 0
      ) {
        this.failCourseValidation(
          EXCEPTION_CONSTANT.COURSE_VALIDATION_VISIBLE_AFTER_NEGATIVE,
          { chapterLabel },
        );
      }

      if (!chapter.items?.length) {
        this.failCourseValidation(
          EXCEPTION_CONSTANT.COURSE_CHAPTER_ITEM_REQUIRED,
          { chapterLabel },
        );
      }

      for (
        let itemIndex = 0;
        itemIndex < chapter.items.length;
        itemIndex += 1
      ) {
        const item = chapter.items[itemIndex];
        const itemLabel = this.formatItemValidationLabel(
          chapterIndex,
          itemIndex,
          chapter.title,
          item.title,
        );

        if (!item.title?.trim()) {
          this.failCourseValidation(
            EXCEPTION_CONSTANT.COURSE_VALIDATION_CHAPTER_TITLE_REQUIRED,
            { chapterLabel: itemLabel },
          );
        }

        const hasFile = Boolean(item.fileId);
        const hasArticle = hasRichTextContent(item.article);

        if (hasFile && hasArticle) {
          this.failCourseValidation(
            EXCEPTION_CONSTANT.COURSE_ITEM_FILE_AND_ARTICLE_BOTH,
            { itemLabel },
          );
        }

        if (!hasFile && !hasArticle) {
          this.failCourseValidation(
            EXCEPTION_CONSTANT.COURSE_ITEM_CONTENT_REQUIRED,
            { itemLabel },
          );
        }
      }
    }
  }

  private normalizeCreateInput(
    input: CourseCreateGqlInput,
  ): CourseCreateGqlInput {
    return {
      title: input.title.trim(),
      description: this.normalizeNullableText(input.description),
      coverImageFileId: input.coverImageFileId,
      priceIrt: input.priceIrt,
      discount: this.normalizeDiscountInput(input.discount),
      isActive: typeof input.isActive === "boolean" ? input.isActive : true,
      isReviewSubmissionEnabled:
        typeof input.isReviewSubmissionEnabled === "boolean"
          ? input.isReviewSubmissionEnabled
          : true,
      isReviewsSectionVisible:
        typeof input.isReviewsSectionVisible === "boolean"
          ? input.isReviewsSectionVisible
          : true,
      sortOrder: input.sortOrder,
      tags: this.normalizeTags(input.tags),
      chapters: input.chapters.map((chapter) =>
        this.normalizeCreateChapterInput(chapter),
      ),
    };
  }

  private async getNextCourseSortOrder(): Promise<number> {
    const lastCourseBySortOrder = await this.courseModel
      .findOne({ sortOrder: { $type: "number" } })
      .sort({ sortOrder: -1, _id: -1 })
      .select({ sortOrder: 1 })
      .lean<{ sortOrder?: number }>()
      .exec();

    return (lastCourseBySortOrder?.sortOrder ?? 0) + 1;
  }

  private normalizeCreateChapterInput(
    chapter: CourseChapterGqlInput,
  ): CourseChapterGqlInput {
    return {
      title: chapter.title.trim(),
      description: this.normalizeNullableText(chapter.description),
      visibleAfterMinutes: chapter.visibleAfterMinutes,
      isFree: chapter.isFree === true,
      sortOrder: chapter.sortOrder,
      items: chapter.items.map((item) => this.normalizeCreateItemInput(item)),
    };
  }

  private normalizeCreateItemInput(
    item: CourseItemGqlInput,
  ): CourseItemGqlInput {
    return {
      title: item.title.trim(),
      sortOrder: item.sortOrder,
      fileId: item.fileId === null ? null : item.fileId,
      article: this.normalizeNullableText(item.article),
    };
  }

  private normalizeDiscountInput(
    discount?: CourseDiscountGqlInput | null,
  ): CourseDiscountGqlInput | null | undefined {
    if (discount === null) {
      return null;
    }
    if (discount === undefined) {
      return undefined;
    }

    return {
      type: discount.type,
      value: discount.value,
    };
  }

  private async ensureReferencedFilesExist(
    input: CourseCreateGqlInput,
  ): Promise<void> {
    const fileIds = this.collectReferencedFileIds(input);
    if (fileIds.length === 0) {
      return;
    }

    const existingFileIds = await this.storedFileModel
      .distinct("_id", { _id: { $in: fileIds } })
      .exec();

    if (existingFileIds.length !== fileIds.length) {
      throw new NotFoundException(EXCEPTION_CONSTANT.COURSE_REFERENCED_FILE_NOT_FOUND);
    }
  }

  private collectReferencedFileIds(
    input: CourseFileReferenceSource,
  ): Types.ObjectId[] {
    const fileIds = [
      input.coverImageFileId,
      ...input.chapters.flatMap((chapter) =>
        chapter.items.map((item) => item.fileId),
      ),
    ].filter((fileId): fileId is Types.ObjectId => Boolean(fileId));

    return this.collectUniqueFileIds(fileIds);
  }

  private async collectCourseDeleteDependencyCounts(
    courseId: Types.ObjectId,
    course: CourseDocument,
  ): Promise<CourseDeleteDependencyCounts> {
    const courseIdString = courseId.toString();
    const attachedFileIds = this.collectReferencedFileIds(course);
    const [
      enrollmentStatusRows,
      reviewAggregation,
      couponTotal,
      couponSamples,
      notificationTotal,
      notificationSourceRows,
      deletableFileIds,
    ] = await Promise.all([
      this.userCourseModel
        .aggregate<{
          _id: UserCoursePurchaseStatus;
          count: number;
        }>([
          { $match: { courseId } },
          { $group: { _id: "$purchase.status", count: { $sum: 1 } } },
        ])
        .exec(),
      this.courseReviewModel
        .aggregate<{
          reviewTotal: number;
          reviewRatingCount: number;
          reviewMessageCount: number;
        }>([
          { $match: { courseId } },
          {
            $group: {
              _id: null,
              reviewTotal: { $sum: 1 },
              reviewRatingCount: {
                $sum: {
                  $cond: [{ $ifNull: ["$rating", false] }, 1, 0],
                },
              },
              reviewMessageCount: {
                $sum: { $size: { $ifNull: ["$messages", []] } },
              },
            },
          },
        ])
        .exec(),
      this.couponModel.countDocuments({ applicableCourseIds: courseId }).exec(),
      this.couponModel
        .find({ applicableCourseIds: courseId })
        .sort({ isActive: -1, code: 1 })
        .limit(COURSE_DELETE_DEPENDENCY_SAMPLE_LIMIT)
        .select({ code: 1, title: 1, isActive: 1 })
        .lean()
        .exec(),
      this.notificationModel
        .countDocuments({ "payload.courseId": courseIdString })
        .exec(),
      this.notificationModel
        .aggregate<{
          _id: NotificationSource;
          count: number;
        }>([
          { $match: { "payload.courseId": courseIdString } },
          { $group: { _id: "$source", count: { $sum: 1 } } },
        ])
        .exec(),
      this.findDeletableCourseFileIds(courseId, attachedFileIds),
    ]);

    const enrollmentsByStatus = new Map<UserCoursePurchaseStatus, number>();
    for (const row of enrollmentStatusRows) {
      if (!row?._id) {
        continue;
      }
      enrollmentsByStatus.set(row._id, row.count);
    }

    const reviewSummary = reviewAggregation[0] ?? {
      reviewTotal: 0,
      reviewRatingCount: 0,
      reviewMessageCount: 0,
    };

    const notificationsBySource = new Map<NotificationSource, number>();
    for (const row of notificationSourceRows) {
      if (!row?._id) {
        continue;
      }
      notificationsBySource.set(row._id, row.count);
    }

    return {
      enrollmentsByStatus,
      reviewTotal: reviewSummary.reviewTotal,
      reviewRatingCount: reviewSummary.reviewRatingCount,
      reviewMessageCount: reviewSummary.reviewMessageCount,
      couponTotal,
      couponSamples: couponSamples as Array<
        Pick<Coupon, "code" | "title" | "isActive"> & { _id: Types.ObjectId }
      >,
      notificationTotal,
      notificationsBySource,
      attachedFileCount: attachedFileIds.length,
      deletableFileCount: deletableFileIds.length,
    };
  }

  private buildCourseDeleteDependencyGroups(
    counts: CourseDeleteDependencyCounts,
  ): CourseDeleteDependencyGroupGqlResponse[] {
    const enrollmentBreakdown = this.buildPurchaseStatusBreakdown(
      counts.enrollmentsByStatus,
    );
    const enrollmentTotal = enrollmentBreakdown.reduce(
      (total, item) => total + item.count,
      0,
    );

    const reviewBreakdown = [
      { key: "reviews", count: counts.reviewTotal },
      { key: "ratings", count: counts.reviewRatingCount },
      { key: "messages", count: counts.reviewMessageCount },
    ].filter((item) => item.count > 0);

    const notificationBreakdown = Array.from(
      counts.notificationsBySource.entries(),
    )
      .sort((left, right) => right[1] - left[1])
      .map(([source, count]) => ({
        key: source,
        count,
      }));

    const fileBreakdown = [
      { key: "attached", count: counts.attachedFileCount },
      { key: "deletable", count: counts.deletableFileCount },
    ].filter((item) => item.count > 0);

    const groups: CourseDeleteDependencyGroupGqlResponse[] = [
      {
        key: "enrollments",
        impact: CourseDeleteDependencyImpact.RETAINED,
        totalCount: enrollmentTotal,
        breakdown: enrollmentBreakdown,
        samples: [],
        hiddenSampleCount: 0,
      },
      {
        key: "reviews",
        impact: CourseDeleteDependencyImpact.RETAINED,
        totalCount: counts.reviewTotal,
        breakdown: reviewBreakdown,
        samples: [],
        hiddenSampleCount: 0,
      },
      {
        key: "coupons",
        impact: CourseDeleteDependencyImpact.RETAINED,
        totalCount: counts.couponTotal,
        breakdown: [],
        samples: counts.couponSamples.map((coupon) => ({
          id: coupon._id,
          label: coupon.code,
          meta: coupon.title,
        })),
        hiddenSampleCount: Math.max(
          0,
          counts.couponTotal - counts.couponSamples.length,
        ),
      },
      {
        key: "notifications",
        impact: CourseDeleteDependencyImpact.REMOVED,
        totalCount: counts.notificationTotal,
        breakdown: notificationBreakdown,
        samples: [],
        hiddenSampleCount: 0,
      },
      {
        key: "files",
        impact: CourseDeleteDependencyImpact.REMOVED,
        totalCount: counts.deletableFileCount,
        breakdown: fileBreakdown,
        samples: [],
        hiddenSampleCount: 0,
      },
    ];

    return groups.filter((group) => group.totalCount > 0);
  }

  private buildPurchaseStatusBreakdown(
    enrollmentsByStatus: Map<UserCoursePurchaseStatus, number>,
  ): CourseDeleteDependencyBreakdownGqlResponse[] {
    const orderedStatuses: UserCoursePurchaseStatus[] = [
      UserCoursePurchaseStatus.PAID,
      UserCoursePurchaseStatus.PENDING,
      UserCoursePurchaseStatus.FAILED,
      UserCoursePurchaseStatus.REFUNDED,
      UserCoursePurchaseStatus.CANCELLED,
    ];

    return orderedStatuses
      .map((status) => ({
        key: status,
        count: enrollmentsByStatus.get(status) ?? 0,
      }))
      .filter((item) => item.count > 0);
  }

  private async findDeletableCourseFileIds(
    courseId: Types.ObjectId,
    attachedFileIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]> {
    if (attachedFileIds.length === 0) {
      return [];
    }

    const fileIdsStillUsedElsewhere =
      await this.findCourseReferencedFileIdsOutsideCourse(
        courseId,
        attachedFileIds,
      );
    const fileIdsStillUsedElsewhereSet = new Set(
      fileIdsStillUsedElsewhere.map((fileId) => fileId.toString()),
    );

    return attachedFileIds.filter(
      (fileId) => !fileIdsStillUsedElsewhereSet.has(fileId.toString()),
    );
  }

  private async deleteCourseRelatedNotifications(
    courseId: Types.ObjectId,
  ): Promise<void> {
    await this.notificationModel.deleteMany({
      "payload.courseId": courseId.toString(),
    });
  }

  private async deleteDetachedFiles(
    courseId: Types.ObjectId,
    oldFileIds: Types.ObjectId[],
    newFileIds: Types.ObjectId[],
  ): Promise<void> {
    const newFileIdSet = new Set(newFileIds.map((fileId) => fileId.toString()));
    const detachedFileIds = oldFileIds.filter(
      (fileId) => !newFileIdSet.has(fileId.toString()),
    );

    if (detachedFileIds.length === 0) {
      return;
    }

    const fileIdsStillUsedElsewhere =
      await this.findCourseReferencedFileIdsOutsideCourse(
        courseId,
        detachedFileIds,
      );
    const fileIdsStillUsedElsewhereSet = new Set(
      fileIdsStillUsedElsewhere.map((fileId) => fileId.toString()),
    );
    const deletableFileIds = detachedFileIds.filter(
      (fileId) => !fileIdsStillUsedElsewhereSet.has(fileId.toString()),
    );

    await this.fileService.deleteByIds(deletableFileIds);
  }

  private async findCourseReferencedFileIdsOutsideCourse(
    courseId: Types.ObjectId,
    fileIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]> {
    const courses = await this.courseModel
      .find({
        _id: { $ne: courseId },
        $or: [
          { coverImageFileId: { $in: fileIds } },
          { "chapters.items.fileId": { $in: fileIds } },
        ],
      })
      .select({
        coverImageFileId: 1,
        "chapters.items.fileId": 1,
      })
      .exec();

    return this.collectUniqueFileIds(
      courses.flatMap((course) => this.collectReferencedFileIds(course)),
    );
  }

  private collectUniqueFileIds(fileIds: Types.ObjectId[]): Types.ObjectId[] {
    return Array.from(
      new Map(fileIds.map((fileId) => [fileId.toString(), fileId])).values(),
    );
  }

  private async buildListFilterQuery(
    filters?: CourseListGqlInput["filters"],
  ): Promise<FilterQuery<Course>> {
    const query: FilterQuery<Course> = {};

    if (!filters) {
      return query;
    }

    if (filters.query?.trim()) {
      const searchRegex = this.createContainsRegex(filters.query);
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { "chapters.title": searchRegex },
        { "chapters.description": searchRegex },
        { "chapters.items.title": searchRegex },
        { "chapters.items.article": searchRegex },
      ];
    }

    if (filters.title?.trim()) {
      query.title = this.createContainsRegex(filters.title);
    }

    if (filters.description?.trim()) {
      query.description = this.createContainsRegex(filters.description);
    }

    if (typeof filters.isActive === "boolean") {
      query.isActive = filters.isActive;
    }

    const tagsAny = this.normalizeStringArray(filters.tagsAny);
    if (tagsAny.length > 0) {
      query.tags = { $in: tagsAny };
    }

    const tagsAll = this.normalizeStringArray(filters.tagsAll);
    if (tagsAll.length > 0) {
      query.tags = { ...(query.tags as object), $all: tagsAll };
    }

    if (
      typeof filters.minPriceIrt === "number" ||
      typeof filters.maxPriceIrt === "number"
    ) {
      query.priceIrt = {
        ...(typeof filters.minPriceIrt === "number" && {
          $gte: filters.minPriceIrt,
        }),
        ...(typeof filters.maxPriceIrt === "number" && {
          $lte: filters.maxPriceIrt,
        }),
      };
    }

    if (typeof filters.hasPrice === "boolean") {
      query.priceIrt = filters.hasPrice
        ? { ...(query.priceIrt as object), $type: "number" }
        : { $not: { $type: "number" } };
    }

    if (filters.releaseType) {
      this.addAndCondition(
        query,
        this.buildReleaseTypeFilter(filters.releaseType),
      );
    }

    if (filters.itemType) {
      this.addAndCondition(
        query,
        await this.buildContainsItemTypeFilter(filters.itemType),
      );
    }

    if (typeof filters.hasFreeChapter === "boolean") {
      this.addAndCondition(query, {
        chapters: {
          $elemMatch: {
            isFree: filters.hasFreeChapter,
          },
        },
      });
    }

    return query;
  }

  private buildReleaseTypeFilter(
    releaseType: CourseReleaseType,
  ): FilterQuery<Course> {
    const gradualChapterFilter = {
      chapters: {
        $elemMatch: {
          visibleAfterMinutes: { $type: "number" },
        },
      },
    };

    if (releaseType === CourseReleaseType.GRADUAL) {
      return gradualChapterFilter;
    }

    return {
      chapters: {
        $not: {
          $elemMatch: {
            visibleAfterMinutes: { $type: "number" },
          },
        },
      },
    };
  }

  private async buildContainsItemTypeFilter(
    itemType: CourseItemType,
  ): Promise<FilterQuery<Course>> {
    if (itemType === CourseItemType.ARTICLE) {
      return {
        chapters: {
          $elemMatch: {
            items: {
              $elemMatch: {
                $or: [{ fileId: { $exists: false } }, { fileId: null }],
              },
            },
          },
        },
      };
    }

    const fileIds = await this.findFileIdsByItemType(itemType);
    return {
      "chapters.items.fileId": { $in: fileIds },
    };
  }

  private async findFileIdsByItemType(
    itemType: Exclude<CourseItemType, CourseItemType.ARTICLE>,
  ): Promise<Types.ObjectId[]> {
    const mimeTypePrefixByItemType: Record<
      Exclude<CourseItemType, CourseItemType.ARTICLE>,
      string
    > = {
      [CourseItemType.VIDEO]: "video/",
      [CourseItemType.VOICE]: "audio/",
      [CourseItemType.IMAGE]: "image/",
    };

    return (await this.storedFileModel
      .distinct("_id", {
        mimeType: {
          $regex: `^${mimeTypePrefixByItemType[itemType]}`,
          $options: "i",
        },
      })
      .exec()) as Types.ObjectId[];
  }

  private async buildFileTypeLookup(
    courses: CourseDocument[],
  ): Promise<FileTypeLookup> {
    const fileIds = Array.from(
      new Set(
        courses.flatMap((course) =>
          (course.chapters || []).flatMap((chapter) =>
            (chapter.items || [])
              .map((item) => item.fileId?.toString())
              .filter((fileId): fileId is string => Boolean(fileId)),
          ),
        ),
      ),
    );

    if (fileIds.length === 0) {
      return new Map();
    }

    const files = await this.storedFileModel
      .find({ _id: { $in: fileIds } })
      .select({ mimeType: 1, name: 1, objectKey: 1, path: 1 })
      .exec();

    return new Map(
      files.map((file) => [
        file._id.toString(),
        this.classifyStoredFileAsItemType(file),
      ]),
    );
  }

  private async buildFileAccessUrlLookup(
    courses: CourseDocument[],
  ): Promise<Map<string, FileAccessUrlDescriptor>> {
    const fileIds = courses.flatMap((course) => {
      const courseObj = (course.toObject?.() ||
        course) as CourseFileReferenceSource;
      const ids: Array<Types.ObjectId | undefined> = [
        courseObj.coverImageFileId,
      ];

      for (const chapter of courseObj.chapters || []) {
        for (const item of chapter.items || []) {
          ids.push(item.fileId);
        }
      }

      return ids;
    });

    return this.fileService.getAccessUrlMap(fileIds);
  }

  private toListSummaryResponse(
    course: CourseDocument,
    fileTypeLookup: FileTypeLookup,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): CourseListSummaryGqlResponse {
    const courseObj = (course.toObject?.() || course) as PlainCourse;
    const chapters = courseObj.chapters || [];
    const itemTypes = Array.from(
      new Set(
        chapters.flatMap((chapter) =>
          (chapter.items || []).map((item) =>
            this.resolveItemType(item, fileTypeLookup),
          ),
        ),
      ),
    );
    const coverImageFileId = courseObj.coverImageFileId;

    return {
      id: course._id,
      title: courseObj.title,
      description: courseObj.description,
      coverImageAccessUrl: coverImageFileId
        ? fileAccessUrlMap?.get(coverImageFileId.toString())
        : undefined,
      priceIrt: courseObj.priceIrt,
      discount: courseObj.discount,
      isActive: courseObj.isActive,
      sortOrder: courseObj.sortOrder,
      tags: courseObj.tags || [],
      releaseType: this.calculateReleaseType(chapters),
      chapterCount: chapters.length,
      itemCount: chapters.reduce(
        (sum, chapter) => sum + (chapter.items || []).length,
        0,
      ),
      itemTypes,
    };
  }

  private toListResponse(
    course: CourseDocument,
    fileTypeLookup: FileTypeLookup,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): CourseListGqlResponse {
    const courseObj = (course.toObject?.() || course) as PlainCourse;
    const coverImageFileId = courseObj.coverImageFileId;

    return {
      id: course._id,
      title: courseObj.title,
      description: courseObj.description,
      coverImageAccessUrl: coverImageFileId
        ? fileAccessUrlMap?.get(coverImageFileId.toString())
        : undefined,
      priceIrt: courseObj.priceIrt,
      discount: courseObj.discount,
      isActive: courseObj.isActive,
      isReviewSubmissionEnabled: courseObj.isReviewSubmissionEnabled !== false,
      isReviewsSectionVisible: courseObj.isReviewsSectionVisible !== false,
      sortOrder: courseObj.sortOrder,
      tags: courseObj.tags || [],
      releaseType: this.calculateReleaseType(courseObj.chapters || []),
      chapters: (courseObj.chapters || []).map((chapter) =>
        this.toChapterResponse(chapter, fileTypeLookup, fileAccessUrlMap),
      ),
      createdAt: courseObj.audit?.createdAt,
      updatedAt: courseObj.audit?.updatedAt,
    };
  }

  private toChapterResponse(
    chapter: CourseChapter,
    fileTypeLookup: FileTypeLookup,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): CourseListChapterGqlResponse {
    return {
      title: chapter.title,
      description: chapter.description,
      visibleAfterMinutes: chapter.visibleAfterMinutes,
      isFree: chapter.isFree,
      sortOrder: chapter.sortOrder,
      items: (chapter.items || []).map((item) =>
        this.toItemResponse(item, fileTypeLookup, fileAccessUrlMap),
      ),
    };
  }

  private toItemResponse(
    item: CourseItem,
    fileTypeLookup: FileTypeLookup,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): CourseListItemGqlResponse {
    const fileId = item.fileId;

    return {
      title: item.title,
      sortOrder: item.sortOrder,
      fileAccessUrl: fileId
        ? fileAccessUrlMap?.get(fileId.toString())
        : undefined,
      article: item.article,
      type: fileId
        ? (fileTypeLookup.get(fileId.toString()) ?? CourseItemType.ARTICLE)
        : CourseItemType.ARTICLE,
    };
  }

  private calculateReleaseType(chapters: CourseChapter[]): CourseReleaseType {
    return chapters.some(
      (chapter) => typeof chapter.visibleAfterMinutes === "number",
    )
      ? CourseReleaseType.GRADUAL
      : CourseReleaseType.IMMEDIATE;
  }

  private async applyIncludeUserIdFilter(
    filterQuery: FilterQuery<Course>,
    includeUserId?: string,
  ): Promise<FilterQuery<Course>> {
    if (!includeUserId?.trim()) {
      return filterQuery;
    }

    if (!Types.ObjectId.isValid(includeUserId)) {
      return filterQuery;
    }

    const paidCourseIds = await this.userCourseModel
      .find({
        userId: new Types.ObjectId(includeUserId),
        "purchase.status": UserCoursePurchaseStatus.PAID,
      })
      .select({ courseId: 1 })
      .lean<Array<{ courseId: Types.ObjectId }>>()
      .exec();

    const purchasedCourseObjectIds = paidCourseIds.map(
      (entry) => entry.courseId,
    );

    return {
      $and: [filterQuery, { _id: { $nin: purchasedCourseObjectIds } }],
    };
  }

  private async applyUserCoursePurchaseFilter(
    filterQuery: FilterQuery<Course>,
    isPurchased: boolean | undefined,
    userId?: Types.ObjectId,
  ): Promise<FilterQuery<Course>> {
    if (typeof isPurchased !== "boolean") {
      return filterQuery;
    }

    if (!userId) {
      return isPurchased
        ? { $and: [filterQuery, { _id: { $in: [] } }] }
        : filterQuery;
    }

    const paidCourseIds = await this.userCourseModel
      .find({
        userId,
        "purchase.status": UserCoursePurchaseStatus.PAID,
      })
      .select({ courseId: 1 })
      .lean<Array<{ courseId: Types.ObjectId }>>()
      .exec();

    const purchasedCourseObjectIds = paidCourseIds.map(
      (entry) => entry.courseId,
    );

    return {
      $and: [
        filterQuery,
        isPurchased
          ? { _id: { $in: purchasedCourseObjectIds } }
          : { _id: { $nin: purchasedCourseObjectIds } },
      ],
    };
  }

  private async buildUserCourseLookup(
    userId: Types.ObjectId | undefined,
    courses: CourseDocument[],
  ): Promise<Map<string, UserCourseListRecord>> {
    if (!userId || courses.length === 0) {
      return new Map();
    }

    const userCourses = await this.userCourseModel
      .find({
        userId,
        courseId: { $in: courses.map((course) => course._id) },
      })
      .select({
        courseId: 1,
        purchase: 1,
        progress: 1,
      })
      .lean<UserCourseListRecord[]>()
      .exec();

    return new Map(
      userCourses.map((userCourse) => [
        userCourse.courseId.toString(),
        userCourse,
      ]),
    );
  }

  private toUserListResponse(
    course: CourseDocument,
    fileTypeLookup: FileTypeLookup,
    userCourse?: UserCourseListRecord,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): UserCourseListGqlResponse {
    const courseObj = (course.toObject?.() || course) as PlainCourse;
    const chapters = courseObj.chapters || [];
    const itemTypes = Array.from(
      new Set(
        chapters.flatMap((chapter) =>
          (chapter.items || []).map((item) =>
            this.resolveItemType(item, fileTypeLookup),
          ),
        ),
      ),
    );
    const coverImageFileId = courseObj.coverImageFileId;

    return {
      id: course._id,
      title: courseObj.title,
      description: courseObj.description,
      coverImageAccessUrl: coverImageFileId
        ? fileAccessUrlMap?.get(coverImageFileId.toString())
        : undefined,
      priceIrt: courseObj.priceIrt,
      discount: courseObj.discount,
      tags: courseObj.tags || [],
      releaseType: this.calculateReleaseType(chapters),
      chapterCount: chapters.length,
      itemCount: chapters.reduce(
        (sum, chapter) => sum + (chapter.items || []).length,
        0,
      ),
      itemTypes,
      isPurchased:
        userCourse?.purchase?.status === UserCoursePurchaseStatus.PAID,
    };
  }

  private toUserDetailResponse(
    course: CourseDocument,
    fileTypeLookup: FileTypeLookup,
    userCourse?: UserCourseListRecord,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): UserCourseDetailGqlResponse {
    const courseObj = (course.toObject?.() || course) as PlainCourse;
    const chapters = this.sortChaptersForDisplay(courseObj.chapters || []);
    const isFree = this.isCourseFree(courseObj);
    const purchaseStatus = userCourse?.purchase?.status;
    const isPurchased = purchaseStatus === UserCoursePurchaseStatus.PAID;
    const paidAt = userCourse?.purchase?.paidAt;
    const chapterAccessContext = {
      isCourseFree: isFree,
      isPurchased,
      paidAt,
    };
    const completedChapters = userCourse?.progress?.chapters || [];
    const progressCounts = this.calculateChapterProgressCounts(
      chapters,
      chapterAccessContext,
      completedChapters,
    );
    const coverImageFileId = courseObj.coverImageFileId;

    return {
      id: course._id,
      title: courseObj.title,
      description: courseObj.description,
      coverImageAccessUrl: coverImageFileId
        ? fileAccessUrlMap?.get(coverImageFileId.toString())
        : undefined,
      priceIrt: courseObj.priceIrt,
      discount: courseObj.discount,
      tags: courseObj.tags || [],
      releaseType: this.calculateReleaseType(chapters),
      isFree,
      isPurchased,
      purchaseStatus,
      completedChapterCount: progressCounts.completedChapterCount,
      accessibleChapterCount: progressCounts.accessibleChapterCount,
      isReviewSubmissionEnabled: courseObj.isReviewSubmissionEnabled !== false,
      isReviewsSectionVisible: courseObj.isReviewsSectionVisible !== false,
      chapters: chapters.map((chapter) => {
        const chapterProgress = this.resolveChapterProgress(
          chapter.key,
          completedChapters,
        );

        return this.toUserDetailChapterResponse(
          chapter,
          fileTypeLookup,
          chapterAccessContext,
          fileAccessUrlMap,
          chapterProgress.userCompletedAt,
        );
      }),
    };
  }

  private toUserDetailChapterResponse(
    chapter: CourseChapter,
    fileTypeLookup: FileTypeLookup,
    chapterAccessContext: {
      isCourseFree: boolean;
      isPurchased: boolean;
      paidAt?: Date;
    },
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
    userCompletedAt?: Date,
  ): UserCourseDetailChapterGqlResponse {
    const canAccessChapterContent = canAccessChapter(
      chapter,
      chapterAccessContext,
    );
    const unlocksAt = resolveChapterUnlocksAt(
      chapterAccessContext.paidAt,
      chapter.visibleAfterMinutes,
    );

    return {
      key: chapter.key,
      title: chapter.title,
      description: chapter.description,
      visibleAfterMinutes: chapter.visibleAfterMinutes,
      isFree: chapter.isFree,
      isLocked: !canAccessChapterContent,
      unlocksAt:
        !canAccessChapterContent &&
        chapterAccessContext.isPurchased &&
        unlocksAt
          ? unlocksAt
          : undefined,
      items: canAccessChapterContent
        ? this.sortItemsForDisplay(chapter.items || []).map((item) =>
            this.toUserDetailItemResponse(
              item,
              fileTypeLookup,
              fileAccessUrlMap,
            ),
          )
        : null,
      isCompleted: Boolean(userCompletedAt),
      userCompletedAt,
    };
  }

  private toUserDetailItemResponse(
    item: CourseItem,
    fileTypeLookup: FileTypeLookup,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): UserCourseDetailItemGqlResponse {
    const fileId = item.fileId;

    return {
      title: item.title,
      type: this.resolveItemType(item, fileTypeLookup),
      fileAccessUrl:
        fileId && fileAccessUrlMap
          ? fileAccessUrlMap.get(fileId.toString())
          : undefined,
      article: item.article,
    };
  }

  private isCourseFree(course: Course): boolean {
    const price = course.priceIrt ?? 0;
    if (price <= 0) {
      return true;
    }

    const discount = course.discount;
    if (!discount || discount.value <= 0) {
      return false;
    }

    if (discount.type === CourseDiscountType.PERCENTAGE) {
      return discount.value >= 100;
    }

    return discount.value >= price;
  }

  private validatePurchaseInputShape(
    input: CoursePurchaseSubmitGqlInput,
  ): void {
    if (!Types.ObjectId.isValid(input.courseId)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.COURSE_ID_INVALID);
    }

    if (
      ![
        UserCoursePaymentMethod.GATEWAY,
        UserCoursePaymentMethod.CARD_TO_CARD,
        UserCoursePaymentMethod.CRYPTOCURRENCY,
        UserCoursePaymentMethod.FREE,
      ].includes(input.paymentMethod)
    ) {
      throw new BadRequestException(EXCEPTION_CONSTANT.PAYMENT_METHOD_NOT_SUPPORTED);
    }

    if (input.paymentMethod === UserCoursePaymentMethod.CARD_TO_CARD) {
      const hasPaymentReference = Boolean(
        this.normalizeOptionalText(input.paymentReference),
      );
      const hasReceiptFile =
        Boolean(input.uploadedReceiptFileId) &&
        Types.ObjectId.isValid(input.uploadedReceiptFileId);

      if (!hasPaymentReference && !hasReceiptFile) {
        throw new BadRequestException(EXCEPTION_CONSTANT.CARD_TO_CARD_EVIDENCE_REQUIRED);
      }
    }

    if (
      input.paymentMethod === UserCoursePaymentMethod.CRYPTOCURRENCY &&
      !this.normalizeOptionalText(input.transactionId)
    ) {
      throw new BadRequestException(EXCEPTION_CONSTANT.TRANSACTION_ID_REQUIRED);
    }

    if (input.paymentMethod === UserCoursePaymentMethod.FREE) {
      if (
        this.normalizeOptionalText(input.paymentReference) ||
        this.normalizeOptionalText(input.transactionId) ||
        input.uploadedReceiptFileId
      ) {
        throw new BadRequestException(EXCEPTION_CONSTANT.FREE_PURCHASE_NO_EVIDENCE);
      }
    }

    if (input.paymentMethod === UserCoursePaymentMethod.GATEWAY) {
      if (
        this.normalizeOptionalText(input.paymentReference) ||
        this.normalizeOptionalText(input.transactionId) ||
        input.uploadedReceiptFileId
      ) {
        throw new BadRequestException(EXCEPTION_CONSTANT.GATEWAY_PURCHASE_NO_EVIDENCE);
      }
    }
  }

  private validateManualPaymentInputShape(
    input: CoursePaymentManualCreateGqlInput,
  ): void {
    if (!Types.ObjectId.isValid(input.userId)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.USER_ID_INVALID);
    }

    if (!Types.ObjectId.isValid(input.courseId)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.COURSE_ID_INVALID);
    }

    if (!Object.values(UserCoursePaymentMethod).includes(input.paymentMethod)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.PAYMENT_METHOD_NOT_SUPPORTED);
    }

    if (!Object.values(UserCoursePurchaseStatus).includes(input.status)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.PURCHASE_STATUS_NOT_SUPPORTED);
    }
  }

  private async requestZarinPalPayment(
    course: CourseDocument,
    user: UserDocument,
    finalAmountIrt: number,
  ): Promise<{ authority: string; paymentUrl: string }> {
    const zarinPalConfig = await this.resolveZarinPalConfig();
    const amountIrr = this.toZarinPalAmountIrr(
      finalAmountIrt,
      zarinPalConfig.minAmountIrr,
    );

    let data: ZarinPalRequestResponse;
    try {
      ({ data } = await axios.post<ZarinPalRequestResponse>(
        zarinPalConfig.requestUrl,
        {
          merchant_id: zarinPalConfig.merchantId,
          amount: amountIrr,
          callback_url: `${zarinPalConfig.callbackBaseUrl}/payment/zarinpal/callback?courseId=${course._id.toString()}`,
          description: `Demo purchase: ${course.title}`,
          metadata: {
            email: user.profile?.email,
            mobile: user.profile?.phoneNumber,
          },
        },
        {
          headers: { accept: "application/json" },
          timeout: 15000,
        },
      ));
    } catch (error) {
      throw new BadRequestException(EXCEPTION_CONSTANT.ZARINPAL_CONNECTION_FAILED);
    }

    const payment = data.data;
    if (!payment || payment.code !== 100 || !payment.authority) {
      throw new BadRequestException(EXCEPTION_CONSTANT.ZARINPAL_PAYMENT_FAILED);
    }

    return {
      authority: payment.authority,
      paymentUrl: `${zarinPalConfig.startPayUrl}/${payment.authority}`,
    };
  }

  private toZarinPalAmountIrr(amountIrt: number, minAmountIrr: number): number {
    return Math.max(minAmountIrr, Math.round(amountIrt * 10));
  }

  private async resolveZarinPalConfig(): Promise<ZarinPalConfig> {
    const parsedConfig =
      await this.appSettingsService.getActiveJsonSettingValue<StoredZarinPalConfig>(
        APP_SETTING_KEY.ZARINPAL_CONFIG,
      );

    if (!parsedConfig) {
      throw new BadRequestException(EXCEPTION_CONSTANT.ZARINPAL_CONFIG_ERROR);
    }

    if (Array.isArray(parsedConfig)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.ZARINPAL_CONFIG_ERROR);
    }

    const minAmountIrr = Number(parsedConfig.minAmountIrr);
    if (!Number.isFinite(minAmountIrr) || minAmountIrr <= 0) {
      throw new BadRequestException(EXCEPTION_CONSTANT.ZARINPAL_CONFIG_ERROR);
    }

    return {
      merchantId: this.resolveZarinPalMerchantId(parsedConfig.merchantId),
      requestUrl: this.resolveZarinPalConfigUrl(
        parsedConfig.requestUrl,
        "requestUrl",
      ),
      verifyUrl: this.resolveZarinPalConfigUrl(
        parsedConfig.verifyUrl,
        "verifyUrl",
      ),
      startPayUrl: this.resolveZarinPalConfigUrl(
        parsedConfig.startPayUrl,
        "startPayUrl",
      ),
      callbackBaseUrl: this.resolveAppUrlForZarinPalCallback(),
      minAmountIrr: Math.round(minAmountIrr),
    };
  }

  private resolveAppUrlForZarinPalCallback(): string {
    return this.resolveZarinPalConfigUrl(env.APP_URL, "APP_URL");
  }

  private resolveZarinPalConfigUrl(value: unknown, fieldName: string): string {
    if (typeof value !== "string" || !value.trim()) {
      throw new BadRequestException({
        key: EXCEPTION_CONSTANT.ZARINPAL_CONFIG_ERROR,
        params: { fieldName },
      });
    }

    return value.trim().replace(/\/+$/, "");
  }

  private resolveZarinPalMerchantId(value: unknown): string {
    const normalizedMerchantId =
      typeof value === "string" ? this.normalizeOptionalText(value) : undefined;
    if (!normalizedMerchantId) {
      throw new BadRequestException(EXCEPTION_CONSTANT.ZARINPAL_CONFIG_ERROR);
    }

    return normalizedMerchantId;
  }

  private extractZarinPalErrorMessage(error: unknown): string | undefined {
    if (typeof error === "object" && error !== null) {
      const axiosError = error as ZarinPalHttpError;
      return (
        this.extractZarinPalPayloadMessage(axiosError.response?.data) ||
        axiosError.response?.statusText ||
        axiosError.message
      );
    }

    return error instanceof Error ? error.message : undefined;
  }

  private extractZarinPalPayloadMessage(
    payload?: ZarinPalRequestResponse | ZarinPalVerifyResponse,
  ): string | undefined {
    if (payload?.data?.message) {
      return payload.data.message;
    }

    if (Array.isArray(payload?.errors)) {
      const firstError = payload.errors.find(
        (item): item is { message: string } =>
          typeof item === "object" &&
          item !== null &&
          "message" in item &&
          typeof (item as { message?: unknown }).message === "string",
      );

      return firstError?.message;
    }

    if (
      typeof payload?.errors === "object" &&
      payload.errors !== null &&
      "message" in payload.errors &&
      typeof (payload.errors as { message?: unknown }).message === "string"
    ) {
      return (payload.errors as { message: string }).message;
    }

    if (typeof payload?.errors === "object" && payload.errors !== null) {
      for (const value of Object.values(payload.errors)) {
        if (!Array.isArray(value)) {
          continue;
        }

        const message = value.find(
          (item): item is string => typeof item === "string",
        );
        if (message) {
          return message;
        }
      }
    }

    return undefined;
  }

  private async resolvePurchasePriceSummary(
    input: CoursePurchasePricingInput,
    course: CourseDocument,
    userId: Types.ObjectId,
  ): Promise<PurchasePriceSummary> {
    const couponCode = this.normalizeOptionalText(input.couponCode);
    if (couponCode) {
      const couponResult = await this.couponService.validateForCoursePurchase(
        {
          courseId: course._id,
          code: couponCode,
        },
        userId,
      );

      if (!couponResult.isValid) {
        throw new BadRequestException(couponResult.message || EXCEPTION_CONSTANT.COUPON_INVALID_FOR_PURCHASE);
      }

      if (
        !couponResult.couponId ||
        !couponResult.code ||
        !couponResult.discountType ||
        couponResult.discountValue == null ||
        couponResult.amountIrt == null ||
        couponResult.couponDiscountAmountIrt == null ||
        couponResult.finalAmountIrt == null
      ) {
        throw new BadRequestException(EXCEPTION_CONSTANT.COUPON_VALIDATION_INCOMPLETE);
      }

      return {
        amountIrt: couponResult.amountIrt,
        discountPercentage:
          couponResult.discountType === CouponDiscountType.PERCENTAGE
            ? couponResult.discountValue
            : undefined,
        discountAmountIrt: couponResult.couponDiscountAmountIrt,
        finalAmountIrt: couponResult.finalAmountIrt,
        couponSnapshot: {
          couponId: couponResult.couponId,
          code: couponResult.code,
          discountType: couponResult.discountType,
          discountValue: couponResult.discountValue,
        },
      };
    }

    const amountIrt = Math.max(0, course.priceIrt ?? 0);
    const discountAmountIrt = this.calculateCourseDiscountAmount(course);

    return {
      amountIrt,
      discountPercentage:
        course.discount?.type === CourseDiscountType.PERCENTAGE
          ? Math.min(course.discount.value, 100)
          : undefined,
      discountAmountIrt: discountAmountIrt > 0 ? discountAmountIrt : undefined,
      finalAmountIrt: Math.max(0, amountIrt - discountAmountIrt),
    };
  }

  private calculateCourseDiscountAmount(course: Course): number {
    const priceIrt = Math.max(0, course.priceIrt ?? 0);
    const discount = course.discount;

    if (!discount || discount.value <= 0 || priceIrt <= 0) {
      return 0;
    }

    if (discount.type === CourseDiscountType.PERCENTAGE) {
      return Math.min(
        priceIrt,
        Math.round(priceIrt * (Math.min(discount.value, 100) / 100)),
      );
    }

    return Math.min(priceIrt, discount.value);
  }

  private toManualFreePriceSummary(
    priceSummary: PurchasePriceSummary,
  ): PurchasePriceSummary {
    return {
      ...priceSummary,
      discountPercentage: priceSummary.amountIrt > 0 ? 100 : undefined,
      discountAmountIrt:
        priceSummary.amountIrt > 0 ? priceSummary.amountIrt : undefined,
      finalAmountIrt: 0,
    };
  }

  private validatePurchaseMethodAgainstPrice(
    input: CoursePurchaseSubmitGqlInput,
    finalAmountIrt: number,
  ): void {
    if (input.paymentMethod === UserCoursePaymentMethod.FREE) {
      if (finalAmountIrt > 0) {
        throw new BadRequestException(EXCEPTION_CONSTANT.FREE_PURCHASE_AMOUNT_MISMATCH);
      }

      return;
    }

    if (finalAmountIrt <= 0) {
      throw new BadRequestException(EXCEPTION_CONSTANT.FREE_PAYMENT_METHOD_REQUIRED);
    }
  }

  private async resolveReceiptFileId(
    input: CoursePurchaseSubmitGqlInput,
  ): Promise<Types.ObjectId | undefined> {
    if (
      input.paymentMethod !== UserCoursePaymentMethod.CARD_TO_CARD ||
      !input.uploadedReceiptFileId
    ) {
      return undefined;
    }

    const receiptFile = await this.storedFileModel
      .findById(input.uploadedReceiptFileId)
      .select({ _id: 1 })
      .exec();

    if (!receiptFile) {
      throw new NotFoundException(EXCEPTION_CONSTANT.RECEIPT_FILE_NOT_FOUND);
    }

    return receiptFile._id;
  }

  private async resolveManualPaymentReceiptFileId(
    uploadedReceiptFileId?: Types.ObjectId,
  ): Promise<Types.ObjectId | undefined> {
    if (!uploadedReceiptFileId) {
      return undefined;
    }

    const receiptFile = await this.storedFileModel
      .findById(uploadedReceiptFileId)
      .select({ _id: 1 })
      .exec();

    if (!receiptFile) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PAYMENT_EVIDENCE_NOT_FOUND);
    }

    return receiptFile._id;
  }

  private toUserCourseUserSnapshot(user: UserDocument): {
    fullName: string;
    username: string;
    email: string;
    phone?: string;
  } {
    const fullName = [
      this.normalizeOptionalText(user.profile?.firstName),
      this.normalizeOptionalText(user.profile?.lastName),
    ]
      .filter(Boolean)
      .join(" ");
    const username = user.username;

    return {
      fullName: fullName || username,
      username,
      email: user.profile?.email || `${username}@local.negin`,
      phone: user.profile?.phoneNumber,
    };
  }

  private buildPaymentListFilterQuery(
    filters?: CoursePaymentListGqlInput["filters"],
  ): FilterQuery<UserCourse> {
    const query: FilterQuery<UserCourse> = {
      $and: [
        {
          $or: [
            { "audit.deletedAt": null },
            { "audit.deletedAt": { $exists: false } },
          ],
        },
      ],
    };

    if (!filters) {
      return query;
    }

    if (filters.query?.trim()) {
      const searchRegex = this.createContainsRegex(filters.query);
      query.$and = [
        ...(Array.isArray(query.$and) ? query.$and : []),
        {
          $or: [
            { "userSnapshot.fullName": searchRegex },
            { "userSnapshot.username": searchRegex },
            { "userSnapshot.email": searchRegex },
            { "userSnapshot.phone": searchRegex },
            { "courseSnapshot.title": searchRegex },
            { "purchase.paymentProvider": searchRegex },
            { "purchase.paymentReference": searchRegex },
            { "purchase.transactionId": searchRegex },
            { "purchase.couponSnapshot.code": searchRegex },
          ],
        },
      ];
    }

    if (filters.id) {
      query._id = new Types.ObjectId(filters.id);
    }

    if (filters.userId) {
      query.userId = new Types.ObjectId(filters.userId);
    }

    if (filters.courseId) {
      query.courseId = new Types.ObjectId(filters.courseId);
    }

    this.addPaymentContainsFilter(
      query,
      "userSnapshot.fullName",
      filters.fullName ?? filters.userFullName,
    );
    this.addPaymentContainsFilter(
      query,
      "userSnapshot.username",
      filters.username,
    );
    this.addPaymentContainsFilter(
      query,
      "userSnapshot.email",
      filters.email ?? filters.userEmail,
    );
    this.addPaymentContainsFilter(
      query,
      "userSnapshot.phone",
      filters.mobilePhone ?? filters.userPhone,
    );
    this.addPaymentContainsFilter(
      query,
      "courseSnapshot.title",
      filters.courseTitle,
    );

    if (filters.status) {
      query["purchase.status"] = filters.status;
    }

    if (filters.paymentMethod) {
      query["purchase.paymentMethod"] = filters.paymentMethod;
    }

    if (filters.currency) {
      query["purchase.currency"] = filters.currency;
    }

    this.addPaymentContainsFilter(
      query,
      "purchase.paymentProvider",
      filters.paymentProvider,
    );
    this.addPaymentContainsFilter(
      query,
      "purchase.paymentReference",
      filters.paymentReference,
    );
    this.addPaymentContainsFilter(
      query,
      "purchase.transactionId",
      filters.transactionId,
    );
    this.addPaymentNumberRangeFilter(
      query,
      "purchase.amountIrt",
      filters.amountIrtMin,
      filters.amountIrtMax,
    );
    this.addPaymentNumberRangeFilter(
      query,
      "purchase.discountPercentage",
      filters.discountPercentageMin,
      filters.discountPercentageMax,
    );
    this.addPaymentNumberRangeFilter(
      query,
      "purchase.discountAmountIrt",
      filters.discountAmountIrtMin,
      filters.discountAmountIrtMax,
    );
    this.addPaymentNumberRangeFilter(
      query,
      "purchase.finalAmountIrt",
      filters.finalAmountIrtMin,
      filters.finalAmountIrtMax,
    );

    if (filters.isManualStatusChange != null) {
      query["purchase.isManualStatusChange"] = filters.isManualStatusChange;
    }

    if (filters.manualStatusChangedBy) {
      query["purchase.manualStatusChangedBy"] = new Types.ObjectId(
        filters.manualStatusChangedBy,
      );
    }

    this.addPaymentContainsFilter(
      query,
      "purchase.manualStatusChangedDescription",
      filters.manualStatusChangedDescription,
    );

    if (filters.uploadedReceiptFileId) {
      query["purchase.uploadedReceiptFileId"] = new Types.ObjectId(
        filters.uploadedReceiptFileId,
      );
    }

    if (filters.receiptUploadedBy) {
      query["purchase.receiptUploadedBy"] = new Types.ObjectId(
        filters.receiptUploadedBy,
      );
    }

    if (filters.couponId) {
      query["purchase.couponSnapshot.couponId"] = new Types.ObjectId(
        filters.couponId,
      );
    }

    this.addPaymentContainsFilter(
      query,
      "purchase.couponSnapshot.code",
      filters.couponCode,
    );

    if (filters.couponDiscountType) {
      query["purchase.couponSnapshot.discountType"] =
        filters.couponDiscountType;
    }

    this.addPaymentNumberRangeFilter(
      query,
      "purchase.couponSnapshot.discountValue",
      filters.couponDiscountValueMin,
      filters.couponDiscountValueMax,
    );
    this.addPaymentDateRangeFilter(
      query,
      "audit.createdAt",
      filters.createdAtFrom,
      filters.createdAtTo,
    );
    this.addPaymentDateRangeFilter(
      query,
      "audit.updatedAt",
      filters.updatedAtFrom,
      filters.updatedAtTo,
    );
    this.addPaymentDateRangeFilter(
      query,
      "purchase.pendingAt",
      filters.pendingAtFrom,
      filters.pendingAtTo,
    );
    this.addPaymentDateRangeFilter(
      query,
      "purchase.paidAt",
      filters.paidAtFrom,
      filters.paidAtTo,
    );
    this.addPaymentDateRangeFilter(
      query,
      "purchase.failedAt",
      filters.failedAtFrom,
      filters.failedAtTo,
    );
    this.addPaymentDateRangeFilter(
      query,
      "purchase.refundedAt",
      filters.refundedAtFrom,
      filters.refundedAtTo,
    );
    this.addPaymentDateRangeFilter(
      query,
      "purchase.cancelledAt",
      filters.cancelledAtFrom,
      filters.cancelledAtTo,
    );

    return query;
  }

  private addPaymentContainsFilter(
    query: FilterQuery<UserCourse>,
    path: string,
    value?: string,
  ): void {
    if (!value?.trim()) {
      return;
    }

    query[path] = this.createContainsRegex(value);
  }

  private addPaymentNumberRangeFilter(
    query: FilterQuery<UserCourse>,
    path: string,
    min?: number,
    max?: number,
  ): void {
    const range: Record<string, number> = {};

    if (typeof min === "number" && !Number.isNaN(min)) {
      range.$gte = min;
    }

    if (typeof max === "number" && !Number.isNaN(max)) {
      range.$lte = max;
    }

    if (Object.keys(range).length > 0) {
      query[path] = range;
    }
  }

  private addPaymentDateRangeFilter(
    query: FilterQuery<UserCourse>,
    path: string,
    from?: string,
    to?: string,
  ): void {
    const range: Record<string, Date> = {};
    const fromDate = this.parsePaymentFilterDate(from, false);
    const toDate = this.parsePaymentFilterDate(to, true);

    if (fromDate) {
      range.$gte = fromDate;
    }

    if (toDate) {
      range.$lte = toDate;
    }

    if (Object.keys(range).length > 0) {
      query[path] = range;
    }
  }

  private parsePaymentFilterDate(
    value: string | undefined,
    endOfDay: boolean,
  ): Date | undefined {
    if (!value?.trim()) {
      return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      date.setHours(23, 59, 59, 999);
    }

    return date;
  }

  private async buildCoursePaymentFileLookup(
    userCourses: CoursePaymentListRecord[],
  ): Promise<Map<string, CoursePaymentFileLookupRecord>> {
    const fileIds = new Set<string>();

    userCourses.forEach((userCourse) => {
      if (userCourse.purchase.uploadedReceiptFileId) {
        fileIds.add(userCourse.purchase.uploadedReceiptFileId.toString());
      }
    });

    const fileObjectIds = [...fileIds]
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (fileObjectIds.length === 0) {
      return new Map();
    }

    const files = await this.fileService.getFileSummariesByIds(fileObjectIds);

    return new Map(
      [...files.entries()].map(([id, file]) => [
        id,
        {
          name: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          path: file.path,
          accessUrl: file.accessUrl,
        },
      ]),
    );
  }

  private async buildCoursePaymentRelatedLookups(
    userCourses: CoursePaymentListRecord[],
  ): Promise<CoursePaymentRelatedLookups> {
    const userIds = new Set<string>();
    const fileIds = new Set<string>();

    userCourses.forEach((userCourse) => {
      if (userCourse.audit?.createdBy) {
        userIds.add(userCourse.audit.createdBy.toString());
      }
      const purchase = userCourse.purchase;
      if (purchase.receiptUploadedBy) {
        userIds.add(purchase.receiptUploadedBy.toString());
      }
      if (purchase.manualStatusChangedBy) {
        userIds.add(purchase.manualStatusChangedBy.toString());
      }
      if (purchase.uploadedReceiptFileId) {
        fileIds.add(purchase.uploadedReceiptFileId.toString());
      }
    });

    const userObjectIds = [...userIds]
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const fileObjectIds = [...fileIds]
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const [users, files] = await Promise.all([
      userObjectIds.length > 0
        ? this.userModel
            .find({ _id: { $in: userObjectIds } })
            .select({ _id: 1, username: 1, profile: 1 })
            .lean<CoursePaymentUserLookupRecord[]>()
            .exec()
        : Promise.resolve([]),
      fileObjectIds.length > 0
        ? this.fileService.getFileSummariesByIds(fileObjectIds)
        : Promise.resolve(new Map()),
    ]);

    return {
      usersById: new Map(users.map((user) => [user._id.toString(), user])),
      filesById: new Map(
        [...files.entries()].map(([id, file]) => [
          id,
          {
            name: file.name,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            path: file.path,
            accessUrl: file.accessUrl,
          },
        ]),
      ),
    };
  }

  private toCoursePaymentRelatedUserResponse(
    id?: Types.ObjectId,
    user?: CoursePaymentUserLookupRecord,
  ): CoursePaymentListGqlResponse["receiptUploader"] {
    if (!id) {
      return undefined;
    }

    const fullName = [
      this.normalizeOptionalText(user?.profile?.firstName),
      this.normalizeOptionalText(user?.profile?.lastName),
    ]
      .filter(Boolean)
      .join(" ");

    return {
      id,
      fullName: fullName || user?.username || id.toString(),
      username: user?.username,
      email: user?.profile?.email,
      phone: user?.profile?.phoneNumber,
    };
  }

  private toCoursePaymentStoredFileResponse(
    id?: Types.ObjectId,
    file?: CoursePaymentFileLookupRecord,
  ): CoursePaymentListGqlResponse["uploadedReceiptFile"] {
    if (!id) {
      return undefined;
    }

    return {
      name: file?.name,
      title: file?.name,
      mimeType: file?.mimeType,
      sizeBytes: file?.sizeBytes,
      path: file?.path,
      accessUrl:
        file?.accessUrl ?? this.fileService.createAccessUrlDescriptor(id),
    };
  }

  private toCoursePaymentListSummaryResponse(
    userCourse: CoursePaymentListRecord,
    filesById: Map<string, CoursePaymentFileLookupRecord>,
  ): CoursePaymentListSummaryGqlResponse {
    const purchase = userCourse.purchase;
    const uploadedReceiptFileId = purchase.uploadedReceiptFileId;
    const uploadedReceiptFile = uploadedReceiptFileId
      ? {
          accessUrl:
            filesById.get(uploadedReceiptFileId.toString())?.accessUrl ??
            this.fileService.createAccessUrlDescriptor(uploadedReceiptFileId),
        }
      : undefined;

    return {
      id: userCourse._id,
      userId: userCourse.userId,
      courseId: userCourse.courseId,
      user: {
        fullName: userCourse.userSnapshot.fullName,
        username: userCourse.userSnapshot.username,
        email: userCourse.userSnapshot.email,
        phone: userCourse.userSnapshot.phone,
        ...(userCourse.userSnapshot.phone
          ? { mobilePhone: userCourse.userSnapshot.phone }
          : {}),
      },
      course: {
        title: userCourse.courseSnapshot.title,
      },
      status: purchase.status,
      paymentMethod: purchase.paymentMethod,
      currency: purchase.currency,
      paymentProvider: purchase.paymentProvider,
      paymentReference: purchase.paymentReference,
      transactionId: purchase.transactionId,
      amountIrt: purchase.amountIrt,
      discountPercentage: purchase.discountPercentage,
      discountAmountIrt: purchase.discountAmountIrt,
      finalAmountIrt: purchase.finalAmountIrt,
      coupon: purchase.couponSnapshot
        ? {
            couponId: purchase.couponSnapshot.couponId,
            code: purchase.couponSnapshot.code,
            discountType: purchase.couponSnapshot.discountType,
            discountValue: purchase.couponSnapshot.discountValue,
          }
        : undefined,
      uploadedReceiptFile,
      receiptUploadedBy: purchase.receiptUploadedBy,
      isManualStatusChange: purchase.isManualStatusChange,
      manualStatusChangedBy: purchase.manualStatusChangedBy,
      manualStatusChangedDescription: purchase.manualStatusChangedDescription,
      createdAt: userCourse.audit?.createdAt,
      updatedAt: userCourse.audit?.updatedAt,
      pendingAt: purchase.pendingAt,
      paidAt: purchase.paidAt,
      failedAt: purchase.failedAt,
      refundedAt: purchase.refundedAt,
      cancelledAt: purchase.cancelledAt,
    };
  }

  private toCoursePaymentListResponse(
    userCourse: CoursePaymentListRecord,
    relatedLookups: CoursePaymentRelatedLookups,
  ): CoursePaymentListGqlResponse {
    const purchase = userCourse.purchase;
    const uploadedReceiptFile = this.toCoursePaymentStoredFileResponse(
      purchase.uploadedReceiptFileId,
      purchase.uploadedReceiptFileId
        ? relatedLookups.filesById.get(
            purchase.uploadedReceiptFileId.toString(),
          )
        : undefined,
    );
    const receiptUploader = this.toCoursePaymentRelatedUserResponse(
      purchase.receiptUploadedBy,
      purchase.receiptUploadedBy
        ? relatedLookups.usersById.get(purchase.receiptUploadedBy.toString())
        : undefined,
    );
    const manualStatusChanger = this.toCoursePaymentRelatedUserResponse(
      purchase.manualStatusChangedBy,
      purchase.manualStatusChangedBy
        ? relatedLookups.usersById.get(
            purchase.manualStatusChangedBy.toString(),
          )
        : undefined,
    );
    const createdByUser = this.toCoursePaymentRelatedUserResponse(
      userCourse.audit?.createdBy,
      userCourse.audit?.createdBy
        ? relatedLookups.usersById.get(userCourse.audit.createdBy.toString())
        : undefined,
    );

    return {
      id: userCourse._id,
      userId: userCourse.userId,
      courseId: userCourse.courseId,
      user: {
        id: userCourse.userId,
        fullName: userCourse.userSnapshot.fullName,
        username: userCourse.userSnapshot.username,
        email: userCourse.userSnapshot.email,
        phone: userCourse.userSnapshot.phone,
        ...(userCourse.userSnapshot.phone
          ? { mobilePhone: userCourse.userSnapshot.phone }
          : {}),
      },
      course: {
        id: userCourse.courseId,
        title: userCourse.courseSnapshot.title,
        description: userCourse.courseSnapshot.description,
        priceIrt: userCourse.courseSnapshot.priceIrt,
      },
      status: purchase.status,
      paymentMethod: purchase.paymentMethod,
      currency: purchase.currency,
      paymentProvider: purchase.paymentProvider,
      paymentReference: purchase.paymentReference,
      transactionId: purchase.transactionId,
      amountIrt: purchase.amountIrt,
      discountPercentage: purchase.discountPercentage,
      discountAmountIrt: purchase.discountAmountIrt,
      finalAmountIrt: purchase.finalAmountIrt,
      coupon: purchase.couponSnapshot
        ? {
            id: purchase.couponSnapshot.couponId,
            couponId: purchase.couponSnapshot.couponId,
            code: purchase.couponSnapshot.code,
            title: purchase.couponSnapshot.code,
            discountType: purchase.couponSnapshot.discountType,
            discountValue: purchase.couponSnapshot.discountValue,
          }
        : undefined,
      uploadedReceiptFile,
      receiptUploadedBy: purchase.receiptUploadedBy,
      receiptUploader,
      isManualStatusChange: purchase.isManualStatusChange,
      submittedInitiallyByAdmin: purchase.submittedInitiallyByAdmin === true,
      createdBy: userCourse.audit?.createdBy,
      createdByUser,
      manualStatusChangedBy: purchase.manualStatusChangedBy,
      manualStatusChanger,
      manualStatusChangedDescription: purchase.manualStatusChangedDescription,
      createdAt: userCourse.audit?.createdAt,
      updatedAt: userCourse.audit?.updatedAt,
      pendingAt: purchase.pendingAt,
      paidAt: purchase.paidAt,
      failedAt: purchase.failedAt,
      refundedAt: purchase.refundedAt,
      cancelledAt: purchase.cancelledAt,
    };
  }

  private setPurchaseStatusTimestamp(
    userCourse: UserCourseDocument,
    status: UserCoursePurchaseStatus,
    timestamp: Date,
  ): void {
    if (status === UserCoursePurchaseStatus.PENDING) {
      userCourse.purchase.pendingAt = timestamp;
      return;
    }

    if (status === UserCoursePurchaseStatus.PAID) {
      userCourse.purchase.paidAt = timestamp;
      return;
    }

    if (status === UserCoursePurchaseStatus.FAILED) {
      userCourse.purchase.failedAt = timestamp;
      return;
    }

    if (status === UserCoursePurchaseStatus.REFUNDED) {
      userCourse.purchase.refundedAt = timestamp;
      return;
    }

    if (status === UserCoursePurchaseStatus.CANCELLED) {
      userCourse.purchase.cancelledAt = timestamp;
    }
  }

  private resolveCoursePurchaseStatusNotificationContent(
    courseTitle: string,
    status: UserCoursePurchaseStatus,
    changedByInvestigationTeam: boolean,
  ):
    | {
        title: string;
        message: string;
        mode: NotificationMode;
        payload: Record<string, unknown>;
      }
    | null {
    switch (status) {
      case UserCoursePurchaseStatus.PAID:
        return {
          title: "دسترسی به دوره فعال شد",
          message: changedByInvestigationTeam
            ? `پرداخت دوره «${courseTitle}» توسط تیم بررسی تأیید شد و اکنون می‌توانید به محتوای دوره دسترسی داشته باشید.`
            : `خرید دوره «${courseTitle}» با موفقیت انجام شد.`,
          mode: NotificationMode.SUCCESS,
          payload: {
            purchaseStatus: status,
            ...(changedByInvestigationTeam
              ? {
                  approvedByInvestigationTeam: true,
                  changedByInvestigationTeam: true,
                }
              : {}),
          },
        };
      case UserCoursePurchaseStatus.FAILED:
        return {
          title: "پرداخت دوره تأیید نشد",
          message: `پرداخت دوره «${courseTitle}» تأیید نشد.`,
          mode: NotificationMode.ERROR,
          payload: {
            purchaseStatus: status,
            changedByInvestigationTeam: true,
          },
        };
      case UserCoursePurchaseStatus.REFUNDED:
        return {
          title: "بازپرداخت دوره ثبت شد",
          message: `بازپرداخت دوره «${courseTitle}» ثبت شد.`,
          mode: NotificationMode.WARNING,
          payload: {
            purchaseStatus: status,
            changedByInvestigationTeam: true,
          },
        };
      case UserCoursePurchaseStatus.CANCELLED:
        return {
          title: "پرداخت دوره لغو شد",
          message: `پرداخت دوره «${courseTitle}» لغو شد.`,
          mode: NotificationMode.WARNING,
          payload: {
            purchaseStatus: status,
            changedByInvestigationTeam: true,
          },
        };
      default:
        return null;
    }
  }

  private async notifyCoursePurchaseStatusChanged(
    userCourse: UserCourseDocument,
    previousStatus: UserCoursePurchaseStatus,
    options?: { changedByInvestigationTeam?: boolean },
  ): Promise<void> {
    const nextStatus = userCourse.purchase.status;

    if (previousStatus === nextStatus) {
      return;
    }

    if (nextStatus === UserCoursePurchaseStatus.PENDING) {
      return;
    }

    const changedByInvestigationTeam =
      options?.changedByInvestigationTeam === true;

    if (
      nextStatus !== UserCoursePurchaseStatus.PAID &&
      !changedByInvestigationTeam
    ) {
      return;
    }

    if (
      !changedByInvestigationTeam &&
      nextStatus === UserCoursePurchaseStatus.PAID &&
      previousStatus !== UserCoursePurchaseStatus.PENDING
    ) {
      return;
    }

    const courseId = userCourse.courseId.toString();
    const courseTitle =
      this.normalizeOptionalText(userCourse.courseSnapshot?.title) || "دوره";
    const notificationContent = this.resolveCoursePurchaseStatusNotificationContent(
      courseTitle,
      nextStatus,
      changedByInvestigationTeam,
    );

    if (!notificationContent) {
      return;
    }

    const { title, message, mode, payload } = notificationContent;
    const notificationPayload: Record<string, unknown> = {
      courseId,
      ...payload,
    };
    const subscriptionPayload: Record<string, unknown> = {
      ...notificationPayload,
      title,
      description: message,
      mode,
      isPushNotification: true,
    };

    const notification = await this.notificationService.createForEndUser({
      userId: userCourse.userId,
      source: NotificationSource.PAYMENT,
      mode,
      title,
      message,
      payload: notificationPayload,
    });

    await this.userSubscriptionService.publishToUser({
      userId: userCourse.userId.toString(),
      updateType: GeneralSubscriptionUpdateType.NOTIFICATION,
      targetId: notification._id.toString(),
      payload: subscriptionPayload,
    });
  }

  private toCoursePurchaseSubmitResponse(
    userCourse: UserCourseDocument,
    paymentUrl?: string,
  ): CoursePurchaseSubmitGqlResponse {
    const purchase = userCourse.purchase;

    return {
      id: userCourse._id,
      courseId: userCourse.courseId,
      status: purchase.status,
      paymentMethod: purchase.paymentMethod,
      currency: purchase.currency,
      amountIrt: purchase.amountIrt,
      discountAmountIrt: purchase.discountAmountIrt,
      finalAmountIrt: purchase.finalAmountIrt,
      couponCode: purchase.couponSnapshot?.code,
      paymentReference: purchase.paymentReference,
      transactionId: purchase.transactionId,
      paymentUrl,
      paymentAuthority:
        purchase.paymentMethod === UserCoursePaymentMethod.GATEWAY
          ? purchase.paymentReference
          : undefined,
      isPurchased: purchase.status === UserCoursePurchaseStatus.PAID,
    };
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    );
  }

  private sortChaptersForDisplay(chapters: CourseChapter[]): CourseChapter[] {
    return [...chapters].sort((first, second) =>
      this.compareBySortOrderThenTitle(first, second),
    );
  }

  private sortItemsForDisplay(items: CourseItem[]): CourseItem[] {
    return [...items].sort((first, second) =>
      this.compareBySortOrderThenTitle(first, second),
    );
  }

  private compareBySortOrderThenTitle(
    first: { sortOrder?: number; title: string },
    second: { sortOrder?: number; title: string },
  ): number {
    const firstSortOrder =
      typeof first.sortOrder === "number"
        ? first.sortOrder
        : Number.MAX_SAFE_INTEGER;
    const secondSortOrder =
      typeof second.sortOrder === "number"
        ? second.sortOrder
        : Number.MAX_SAFE_INTEGER;

    if (firstSortOrder !== secondSortOrder) {
      return firstSortOrder - secondSortOrder;
    }

    return first.title.localeCompare(second.title, "fa");
  }

  private resolveItemType(
    item: CourseItem,
    fileTypeLookup: FileTypeLookup,
  ): CourseItemType {
    return item.fileId
      ? (fileTypeLookup.get(item.fileId.toString()) ?? CourseItemType.ARTICLE)
      : CourseItemType.ARTICLE;
  }

  private classifyStoredFileAsItemType(
    storedFile: Pick<StoredFile, "mimeType" | "name" | "objectKey" | "path">,
  ): CourseItemType {
    const mimeType = storedFile.mimeType?.toLowerCase() || "";

    if (mimeType.startsWith("video/")) {
      return CourseItemType.VIDEO;
    }
    if (mimeType.startsWith("audio/")) {
      return CourseItemType.VOICE;
    }
    if (mimeType.startsWith("image/")) {
      return CourseItemType.IMAGE;
    }

    return this.classifyByExtension(
      storedFile.name || storedFile.objectKey || storedFile.path,
    );
  }

  private classifyByExtension(fileName?: string): CourseItemType {
    const extension = fileName?.split(".").pop()?.toLowerCase();

    if (!extension) {
      return CourseItemType.ARTICLE;
    }

    if (["mp4", "mov", "mkv", "webm", "avi"].includes(extension)) {
      return CourseItemType.VIDEO;
    }
    if (["mp3", "wav", "aac", "m4a", "ogg", "flac"].includes(extension)) {
      return CourseItemType.VOICE;
    }
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
      return CourseItemType.IMAGE;
    }

    return CourseItemType.ARTICLE;
  }

  private normalizeStringArray(values?: string[]): string[] {
    return (values || []).map((value) => value.trim()).filter(Boolean);
  }

  private normalizeTags(tags?: string[]): string[] {
    return Array.from(new Set(this.normalizeStringArray(tags)));
  }

  private normalizeOptionalText(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
  }

  private normalizeNullableText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized || null;
  }

  private addAndCondition(
    query: FilterQuery<Course>,
    condition: FilterQuery<Course>,
  ): void {
    query.$and = [...(Array.isArray(query.$and) ? query.$and : []), condition];
  }

  private createContainsRegex(value: string): {
    $regex: string;
    $options: "i";
  } {
    return {
      $regex: this.escapeRegex(value),
      $options: "i",
    };
  }

  private escapeRegex(value: string): string {
    return value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
