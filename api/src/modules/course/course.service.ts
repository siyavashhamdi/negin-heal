import axios from "axios";
import { Model, FilterQuery, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { APP_SETTING_KEY, PAGINATION_CONSTANT } from "../../constants";
import {
  CourseDiscountType,
  CourseItemType,
  CourseReleaseType,
  PaymentCouponDiscountType,
  UserRole,
  UserCoursePaymentMethod,
  UserCoursePurchaseCurrency,
  UserCoursePurchaseStatus,
  UserStatus,
} from "../../enums";
import { SortingOrder } from "../../common/pagination/input";
import { buildSortOptions } from "../../common/pagination/utils";
import {
  CourseChapterItemRequiredException,
  CourseChapterRequiredException,
  CourseItemContentRequiredException,
  CourseNotFoundException,
  CourseReferencedFileNotFoundException,
} from "../../exceptions";
import {
  Course,
  CourseChapter,
  CourseDocument,
  CourseItem,
  StoredFile,
  StoredFileDocument,
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
import { CourseDeleteGqlInput } from "./graphql/inputs/course-delete.gql.input";
import { CourseListGqlInput } from "./graphql/inputs/course-list.gql.input";
import { CoursePaymentListGqlInput } from "./graphql/inputs/course-payment-list.gql.input";
import { CoursePaymentManualCreateGqlInput } from "./graphql/inputs/course-payment-manual-create.gql.input";
import { CoursePaymentStatusUpdateGqlInput } from "./graphql/inputs/course-payment-status-update.gql.input";
import { CoursePurchaseSubmitGqlInput } from "./graphql/inputs/course-purchase-submit.gql.input";
import { CourseListSortOptionInput } from "./graphql/inputs/course-list-sort-option.gql.input";
import { CourseUpdateGqlInput } from "./graphql/inputs/course-update.gql.input";
import { UserCourseDetailGqlInput } from "./graphql/inputs/user-course-detail.gql.input";
import { FileService } from "../file";
import {
  CourseListChapterGqlResponse,
  CourseListGqlResponse,
  CourseListItemGqlResponse,
  CourseListPaginatedCursorGqlResponse,
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
} from "./graphql/responses/course-payment-list.gql.response";
import { CoursePurchaseSubmitGqlResponse } from "./graphql/responses/course-purchase-submit.gql.response";
import { AppSettingsService } from "../app-settings";
import { PaymentCouponService } from "../payment-coupon";

type PlainCourse = Course & {
  _id: Types.ObjectId;
};

type FileTypeLookup = Map<string, CourseItemType>;
type CourseListSortField = Extract<keyof CourseListSortOptionInput, string>;
type CourseFileReferenceSource = {
  coverImageFileId?: Types.ObjectId;
  chapters: Array<{
    iconFileId?: Types.ObjectId;
    items: Array<{
      fileId?: Types.ObjectId;
    }>;
  }>;
};
type UserCourseListRecord = Pick<UserCourse, "courseId" | "purchase"> & {
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
  _id: Types.ObjectId;
  accessUrl?: string;
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
    discountType: PaymentCouponDiscountType;
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
  callbackBaseUrl?: unknown;
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

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourseDocument>,
    @InjectModel(StoredFile.name)
    private readonly storedFileModel: Model<StoredFileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly fileService: FileService,
    private readonly appSettingsService: AppSettingsService,
    private readonly paymentCouponService: PaymentCouponService,
  ) {}

  async create(input: CourseCreateGqlInput): Promise<CourseListGqlResponse> {
    this.validateCreateInput(input);

    const normalizedInput = this.normalizeCreateInput(input);
    normalizedInput.sortOrder = await this.getNextCourseSortOrder();
    await this.ensureReferencedFilesExist(normalizedInput);

    const course = await this.courseModel.create(normalizedInput);
    const fileTypeLookup = await this.buildFileTypeLookup([course]);

    return this.toListResponse(course, fileTypeLookup);
  }

  async update(input: CourseUpdateGqlInput): Promise<CourseListGqlResponse> {
    this.validateCreateInput(input);

    const existingCourse = await this.courseModel.findById(input.id).exec();
    if (!existingCourse) {
      throw new CourseNotFoundException();
    }

    const oldFileIds = this.collectReferencedFileIds(existingCourse);
    const normalizedInput = this.normalizeCreateInput(input);
    await this.ensureReferencedFilesExist(normalizedInput);

    const updatedCourse = await this.courseModel
      .findByIdAndUpdate(input.id, normalizedInput, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedCourse) {
      throw new CourseNotFoundException();
    }

    const newFileIds = this.collectReferencedFileIds(normalizedInput);
    const fileTypeLookup = await this.buildFileTypeLookup([updatedCourse]);
    const response = this.toListResponse(updatedCourse, fileTypeLookup);

    await this.deleteDetachedFiles(input.id, oldFileIds, newFileIds);

    return response;
  }

  async delete(input: CourseDeleteGqlInput): Promise<void> {
    const existingCourse = await this.courseModel.findById(input.id).exec();
    if (!existingCourse) {
      throw new CourseNotFoundException();
    }

    const oldFileIds = this.collectReferencedFileIds(existingCourse);

    // TODO: Add cascading cleanup for future dependent collections that reference courses.
    const deletedCourse = await this.courseModel
      .findByIdAndDelete(input.id)
      .exec();
    if (!deletedCourse) {
      throw new CourseNotFoundException();
    }

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
      throw new NotFoundException("Course not found or inactive");
    }

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (existingUserCourse?.purchase.status === UserCoursePurchaseStatus.PAID) {
      throw new ConflictException("You have already purchased this course");
    }

    if (
      existingUserCourse?.purchase.status === UserCoursePurchaseStatus.PENDING
    ) {
      throw new ConflictException(
        "You already have a pending purchase for this course",
      );
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
        throw new ConflictException(
          "You already have a purchase record for this course",
        );
      }

      throw error;
    }

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
      return { status: "failed", reason: "missing-authority" };
    }

    const userCourse = await this.userCourseModel
      .findOne({
        "purchase.paymentProvider": "ZARINPAL",
        "purchase.paymentReference": normalizedAuthority,
      })
      .exec();

    if (!userCourse) {
      return { status: "failed", reason: "purchase-not-found" };
    }

    const courseId = userCourse.courseId.toString();

    if (status !== "OK") {
      userCourse.purchase.status = UserCoursePurchaseStatus.CANCELLED;
      userCourse.purchase.cancelledAt = new Date();
      await userCourse.save();
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
        userCourse.purchase.status = UserCoursePurchaseStatus.FAILED;
        userCourse.purchase.failedAt = new Date();
        await userCourse.save();
        return {
          status: "failed",
          courseId,
          reason: verification?.message || "verification-failed",
        };
      }

      userCourse.purchase.status = UserCoursePurchaseStatus.PAID;
      userCourse.purchase.paidAt = new Date();
      userCourse.purchase.transactionId = verification.ref_id?.toString();
      await userCourse.save();

      return {
        status: "success",
        courseId,
        refId: verification.ref_id?.toString(),
      };
    } catch (error) {
      return {
        status: "failed",
        courseId,
        reason: this.extractZarinPalErrorMessage(error) || "verification-error",
      };
    }
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
    const relatedLookups =
      await this.buildCoursePaymentRelatedLookups(userCourses);

    return {
      items: userCourses.map((userCourse) =>
        this.toCoursePaymentListResponse(userCourse, relatedLookups),
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
      throw new NotFoundException("Payment record not found");
    }

    const now = new Date();
    userCourse.purchase.status = input.status;
    userCourse.purchase.isManualStatusChange = true;
    userCourse.purchase.manualStatusChangedBy = adminUserId;
    userCourse.purchase.manualStatusChangedDescription =
      this.normalizeOptionalText(input.manualStatusChangedDescription) ??
      undefined;
    this.setPurchaseStatusTimestamp(userCourse, input.status, now);

    await userCourse.save();

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
      this.userModel.findById(input.userId).exec(),
      this.userCourseModel
        .findOne({
          courseId: input.courseId,
          userId: input.userId,
        })
        .exec(),
    ]);

    if (!course) {
      throw new NotFoundException("Course not found or inactive");
    }

    if (this.isCourseFree(course)) {
      throw new BadRequestException(
        "Manual payment can only be created for active paid courses",
      );
    }

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(
        "Manual payment can only be created for active users",
      );
    }

    if (!user.roles?.includes(UserRole.END_USER)) {
      throw new BadRequestException(
        "Manual payment can only be created for END_USER accounts",
      );
    }

    if (existingUserCourse) {
      throw new ConflictException(
        "This user already has a course payment record for this course",
      );
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
    const manualStatusChangedDescription = this.normalizeOptionalText(
      input.manualStatusChangedDescription,
    );
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
        isManualStatusChange: true,
        manualStatusChangedBy: adminUserId,
        manualStatusChangedDescription,
        uploadedReceiptFileId,
        receiptUploadedBy: uploadedReceiptFileId ? adminUserId : undefined,
        couponSnapshot: manualPriceSummary.couponSnapshot,
      },
      progress: { chapters: [] },
    });

    this.setPurchaseStatusTimestamp(userCourse, input.status, now);
    await userCourse.save();

    const relatedLookups = await this.buildCoursePaymentRelatedLookups([
      userCourse.toObject() as CoursePaymentListRecord,
    ]);

    return this.toCoursePaymentListResponse(userCourse, relatedLookups);
  }

  async list(
    input: CourseListGqlInput,
  ): Promise<CourseListPaginatedCursorGqlResponse> {
    const { filters, options } = input || {};
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.CURSOR_BASED.DEFAULT_LIMIT;
    const baseFilterQuery = await this.buildListFilterQuery(filters);
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
    const firstCourse = courses[0];
    const lastCourse = courses[courses.length - 1];

    return {
      items: courses.map((course) =>
        this.toListResponse(course, fileTypeLookup),
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
    const baseFilterQuery = await this.buildListFilterQuery({
      ...(filters ?? {}),
      isActive: true,
    });
    const sortFieldMap: Record<CourseListSortField, string> = {
      createdAt: "audit.createdAt",
      updatedAt: "audit.updatedAt",
      title: "title",
      priceIrt: "priceIrt",
      isActive: "isActive",
      sortOrder: "sortOrder",
    };
    const requestedSort = options?.sort ?? { sortOrder: SortingOrder.ASC };
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
    const firstCourse = courses[0];
    const lastCourse = courses[courses.length - 1];

    return {
      items: courses.map((course) =>
        this.toUserListResponse(
          course,
          fileTypeLookup,
          userCourseLookup.get(course._id.toString()),
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
      })
      .exec();
    if (!course) {
      throw new CourseNotFoundException();
    }

    const [fileTypeLookup, userCourseLookup] = await Promise.all([
      this.buildFileTypeLookup([course]),
      this.buildUserCourseLookup(userId, [course]),
    ]);
    const userCourse = userCourseLookup.get(course._id.toString());

    return this.toUserDetailResponse(course, fileTypeLookup, userCourse);
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

  private validateCreateInput(input: CourseCreateGqlInput): void {
    if (!input.chapters?.length) {
      throw new CourseChapterRequiredException();
    }

    for (const chapter of input.chapters) {
      if (!chapter.items?.length) {
        throw new CourseChapterItemRequiredException();
      }

      for (const item of chapter.items) {
        if (!item.fileId && !this.hasMeaningfulText(item.article)) {
          throw new CourseItemContentRequiredException();
        }
      }
    }
  }

  private normalizeCreateInput(
    input: CourseCreateGqlInput,
  ): CourseCreateGqlInput {
    return {
      title: input.title.trim(),
      description: this.normalizeOptionalText(input.description),
      coverImageFileId: input.coverImageFileId,
      priceIrt: input.priceIrt,
      discount: this.normalizeDiscountInput(input.discount),
      isActive: input.isActive ?? true,
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
      description: this.normalizeOptionalText(chapter.description),
      iconFileId: chapter.iconFileId,
      visibleAfterMinutes: chapter.visibleAfterMinutes,
      isFree: chapter.isFree,
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
      fileId: item.fileId,
      article: this.normalizeNullableText(item.article),
    };
  }

  private normalizeDiscountInput(
    discount?: CourseDiscountGqlInput,
  ): CourseDiscountGqlInput | undefined {
    if (!discount) {
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
      throw new CourseReferencedFileNotFoundException();
    }
  }

  private collectReferencedFileIds(
    input: CourseFileReferenceSource,
  ): Types.ObjectId[] {
    const fileIds = [
      input.coverImageFileId,
      ...input.chapters.flatMap((chapter) => [
        chapter.iconFileId,
        ...chapter.items.map((item) => item.fileId),
      ]),
    ].filter((fileId): fileId is Types.ObjectId => Boolean(fileId));

    return this.collectUniqueFileIds(fileIds);
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
          { "chapters.iconFileId": { $in: fileIds } },
          { "chapters.items.fileId": { $in: fileIds } },
        ],
      })
      .select({
        coverImageFileId: 1,
        "chapters.iconFileId": 1,
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

  private toListResponse(
    course: CourseDocument,
    fileTypeLookup: FileTypeLookup,
  ): CourseListGqlResponse {
    const courseObj = (course.toObject?.() || course) as PlainCourse;

    return {
      id: course._id,
      title: courseObj.title,
      description: courseObj.description,
      coverImageFileId: courseObj.coverImageFileId,
      priceIrt: courseObj.priceIrt,
      discount: courseObj.discount,
      isActive: courseObj.isActive,
      sortOrder: courseObj.sortOrder,
      tags: courseObj.tags || [],
      releaseType: this.calculateReleaseType(courseObj.chapters || []),
      chapters: (courseObj.chapters || []).map((chapter) =>
        this.toChapterResponse(chapter, fileTypeLookup),
      ),
      createdAt: courseObj.audit?.createdAt,
      updatedAt: courseObj.audit?.updatedAt,
    };
  }

  private toChapterResponse(
    chapter: CourseChapter,
    fileTypeLookup: FileTypeLookup,
  ): CourseListChapterGqlResponse {
    return {
      title: chapter.title,
      description: chapter.description,
      iconFileId: chapter.iconFileId,
      visibleAfterMinutes: chapter.visibleAfterMinutes,
      isFree: chapter.isFree,
      sortOrder: chapter.sortOrder,
      items: (chapter.items || []).map((item) =>
        this.toItemResponse(item, fileTypeLookup),
      ),
    };
  }

  private toItemResponse(
    item: CourseItem,
    fileTypeLookup: FileTypeLookup,
  ): CourseListItemGqlResponse {
    return {
      title: item.title,
      sortOrder: item.sortOrder,
      fileId: item.fileId,
      article: item.article,
      type: item.fileId
        ? (fileTypeLookup.get(item.fileId.toString()) ?? CourseItemType.ARTICLE)
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

    return {
      id: course._id,
      title: courseObj.title,
      description: courseObj.description,
      coverImageFileId: courseObj.coverImageFileId,
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
  ): UserCourseDetailGqlResponse {
    const courseObj = (course.toObject?.() || course) as PlainCourse;
    const chapters = this.sortChaptersForDisplay(courseObj.chapters || []);
    const isFree = this.isCourseFree(courseObj);
    const purchaseStatus = userCourse?.purchase?.status;
    const isPurchased = purchaseStatus === UserCoursePurchaseStatus.PAID;
    const canAccessPaidContent = isFree || isPurchased;

    return {
      id: course._id,
      title: courseObj.title,
      description: courseObj.description,
      coverImageFileId: courseObj.coverImageFileId,
      priceIrt: courseObj.priceIrt,
      discount: courseObj.discount,
      tags: courseObj.tags || [],
      releaseType: this.calculateReleaseType(chapters),
      isFree,
      isPurchased,
      purchaseStatus,
      chapters: chapters.map((chapter) =>
        this.toUserDetailChapterResponse(
          chapter,
          fileTypeLookup,
          canAccessPaidContent || chapter.isFree,
        ),
      ),
    };
  }

  private toUserDetailChapterResponse(
    chapter: CourseChapter,
    fileTypeLookup: FileTypeLookup,
    canAccessChapter: boolean,
  ): UserCourseDetailChapterGqlResponse {
    return {
      key: chapter.key,
      title: chapter.title,
      description: chapter.description,
      iconFileId: chapter.iconFileId,
      visibleAfterMinutes: chapter.visibleAfterMinutes,
      isFree: chapter.isFree,
      isLocked: !canAccessChapter,
      items: this.sortItemsForDisplay(chapter.items || []).map((item) =>
        this.toUserDetailItemResponse(item, fileTypeLookup, canAccessChapter),
      ),
    };
  }

  private toUserDetailItemResponse(
    item: CourseItem,
    fileTypeLookup: FileTypeLookup,
    canAccessItem: boolean,
  ): UserCourseDetailItemGqlResponse {
    return {
      title: item.title,
      type: this.resolveItemType(item, fileTypeLookup),
      isLocked: !canAccessItem,
      fileId: canAccessItem ? item.fileId : undefined,
      article: canAccessItem ? item.article : undefined,
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
      throw new BadRequestException("Course ID is invalid");
    }

    if (
      ![
        UserCoursePaymentMethod.GATEWAY,
        UserCoursePaymentMethod.CARD_TO_CARD,
        UserCoursePaymentMethod.CRYPTOCURRENCY,
        UserCoursePaymentMethod.FREE,
      ].includes(input.paymentMethod)
    ) {
      throw new BadRequestException("Payment method is not supported");
    }

    if (input.paymentMethod === UserCoursePaymentMethod.CARD_TO_CARD) {
      if (!this.normalizeOptionalText(input.paymentReference)) {
        throw new BadRequestException(
          "Payment reference is required for card-to-card purchases",
        );
      }

      if (
        !input.uploadedReceiptFileId ||
        !Types.ObjectId.isValid(input.uploadedReceiptFileId)
      ) {
        throw new BadRequestException(
          "Uploaded receipt file ID is required for card-to-card purchases",
        );
      }
    }

    if (
      input.paymentMethod === UserCoursePaymentMethod.CRYPTOCURRENCY &&
      !this.normalizeOptionalText(input.transactionId)
    ) {
      throw new BadRequestException(
        "Transaction ID is required for cryptocurrency purchases",
      );
    }

    if (input.paymentMethod === UserCoursePaymentMethod.FREE) {
      if (
        this.normalizeOptionalText(input.paymentReference) ||
        this.normalizeOptionalText(input.transactionId) ||
        input.uploadedReceiptFileId
      ) {
        throw new BadRequestException(
          "Free purchases cannot include manual payment evidence",
        );
      }
    }

    if (input.paymentMethod === UserCoursePaymentMethod.GATEWAY) {
      if (
        this.normalizeOptionalText(input.paymentReference) ||
        this.normalizeOptionalText(input.transactionId) ||
        input.uploadedReceiptFileId
      ) {
        throw new BadRequestException(
          "Gateway purchases cannot include manual payment evidence",
        );
      }
    }
  }

  private validateManualPaymentInputShape(
    input: CoursePaymentManualCreateGqlInput,
  ): void {
    if (!Types.ObjectId.isValid(input.userId)) {
      throw new BadRequestException("User ID is invalid");
    }

    if (!Types.ObjectId.isValid(input.courseId)) {
      throw new BadRequestException("Course ID is invalid");
    }

    if (!Object.values(UserCoursePaymentMethod).includes(input.paymentMethod)) {
      throw new BadRequestException("Payment method is not supported");
    }

    if (!Object.values(UserCoursePurchaseStatus).includes(input.status)) {
      throw new BadRequestException("Purchase status is not supported");
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
      throw new BadRequestException(
        this.extractZarinPalErrorMessage(error) ||
          "Unable to connect to ZarinPal",
      );
    }

    const payment = data.data;
    if (!payment || payment.code !== 100 || !payment.authority) {
      throw new BadRequestException(
        payment?.message || "ZarinPal payment request failed",
      );
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
      throw new BadRequestException("ZarinPal config is not configured");
    }

    if (Array.isArray(parsedConfig)) {
      throw new BadRequestException("ZarinPal config is invalid");
    }

    const minAmountIrr = Number(parsedConfig.minAmountIrr);
    if (!Number.isFinite(minAmountIrr) || minAmountIrr <= 0) {
      throw new BadRequestException("ZarinPal min amount is not configured");
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
      callbackBaseUrl: this.resolveZarinPalConfigUrl(
        parsedConfig.callbackBaseUrl,
        "callbackBaseUrl",
      ).replace(/\/+$/, ""),
      minAmountIrr: Math.round(minAmountIrr),
    };
  }

  private resolveZarinPalConfigUrl(value: unknown, fieldName: string): string {
    if (typeof value !== "string" || !value.trim()) {
      throw new BadRequestException(`ZarinPal ${fieldName} is not configured`);
    }

    return value.trim().replace(/\/+$/, "");
  }

  private resolveZarinPalMerchantId(value: unknown): string {
    const normalizedMerchantId =
      typeof value === "string" ? this.normalizeOptionalText(value) : undefined;
    if (!normalizedMerchantId) {
      throw new BadRequestException("ZarinPal merchant ID is not configured");
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
      const couponResult =
        await this.paymentCouponService.validateForCoursePurchase(
          {
            courseId: course._id,
            code: couponCode,
          },
          userId,
        );

      if (!couponResult.isValid) {
        throw new BadRequestException(
          couponResult.message || "Coupon is not valid for this purchase",
        );
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
        throw new BadRequestException(
          "Coupon validation response is incomplete",
        );
      }

      return {
        amountIrt: couponResult.amountIrt,
        discountPercentage:
          couponResult.discountType === PaymentCouponDiscountType.PERCENTAGE
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
        throw new BadRequestException(
          "Free purchase is only available when the final amount is zero",
        );
      }

      return;
    }

    if (finalAmountIrt <= 0) {
      throw new BadRequestException(
        "Use FREE payment method when the final amount is zero",
      );
    }
  }

  private async resolveReceiptFileId(
    input: CoursePurchaseSubmitGqlInput,
  ): Promise<Types.ObjectId | undefined> {
    if (input.paymentMethod !== UserCoursePaymentMethod.CARD_TO_CARD) {
      return undefined;
    }

    const receiptFile = await this.storedFileModel
      .findById(input.uploadedReceiptFileId)
      .select({ _id: 1 })
      .exec();

    if (!receiptFile) {
      throw new NotFoundException("Uploaded receipt file not found");
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
      throw new NotFoundException("Uploaded payment evidence file not found");
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

  private async buildCoursePaymentRelatedLookups(
    userCourses: CoursePaymentListRecord[],
  ): Promise<CoursePaymentRelatedLookups> {
    const userIds = new Set<string>();
    const fileIds = new Set<string>();

    userCourses.forEach((userCourse) => {
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
        ? Promise.all(
            fileObjectIds.map(
              async (
                fileId,
              ): Promise<CoursePaymentFileLookupRecord | undefined> => {
                try {
                  const file = await this.fileService.findById(fileId.toString());
                  return {
                    _id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    sizeBytes: file.sizeBytes,
                    path: file.path,
                    accessUrl: file.accessUrl,
                  };
                } catch {
                  return undefined;
                }
              },
            ),
          ).then((files) =>
            files.filter(
              (file): file is CoursePaymentFileLookupRecord => file != null,
            ),
          )
        : Promise.resolve([]),
    ]);

    return {
      usersById: new Map(users.map((user) => [user._id.toString(), user])),
      filesById: new Map(files.map((file) => [file._id.toString(), file])),
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
      id,
      name: file?.name,
      title: file?.name,
      mimeType: file?.mimeType,
      sizeBytes: file?.sizeBytes,
      path: file?.path,
      accessUrl: file?.accessUrl,
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
        ? relatedLookups.filesById.get(purchase.uploadedReceiptFileId.toString())
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
        ? relatedLookups.usersById.get(purchase.manualStatusChangedBy.toString())
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
      uploadedReceiptFileId: purchase.uploadedReceiptFileId,
      uploadedReceiptFile,
      receiptUploadedBy: purchase.receiptUploadedBy,
      receiptUploader,
      isManualStatusChange: purchase.isManualStatusChange,
      submittedInitiallyByAdmin: purchase.submittedInitiallyByAdmin === true,
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
      uploadedReceiptFileId: purchase.uploadedReceiptFileId,
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

  private hasMeaningfulText(value?: string | null): boolean {
    return Boolean(value?.trim());
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
