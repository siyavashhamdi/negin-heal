import { FilterQuery, Model, Types } from "mongoose";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import {
  Course,
  CourseDocument,
  Coupon,
  CouponDocument,
  UserCourse,
  UserCourseDocument,
} from "../../database/schemas";
import {
  CourseDiscountType,
  CouponDiscountType,
  UserCoursePurchaseStatus,
} from "../../enums";
import { PAGINATION_CONSTANT } from "../../constants";
import { EXCEPTION_CONSTANT } from "../../constants/exception.constant";
import { SortingOrder } from "../../common/pagination/input";
import { buildSortOptions } from "../../common/pagination/utils";
import {
  CouponCreateGqlInput,
  CouponDeleteGqlInput,
  CouponDetailGqlInput,
  CouponListGqlInput,
  CouponListSortOptionInput,
  CouponUpdateGqlInput,
  CouponValidateGqlInput,
} from "./graphql/inputs";
import {
  CouponListGqlResponse,
  CouponListPaginatedOffsetGqlResponse,
  CouponListSummaryGqlResponse,
  CouponValidateGqlResponse,
} from "./graphql/responses";

const COMMITTED_PURCHASE_STATUSES = [
  UserCoursePurchaseStatus.PENDING,
  UserCoursePurchaseStatus.PAID,
];

type CourseWithId = Course & { _id: Types.ObjectId };
type CouponWithId = Coupon & { _id: Types.ObjectId };
type CouponListRecord = Coupon & { _id: Types.ObjectId };
type CouponListSortField =
  | "createdAt"
  | "updatedAt"
  | "code"
  | "title"
  | "discountType"
  | "discountValue"
  | "startsAt"
  | "expiresAt"
  | "totalUsageLimit"
  | "perUserUsageLimit"
  | "isFirstPurchaseOnly"
  | "isActive";
type CouponUsageCountRecord = {
  _id: Types.ObjectId;
  totalUsageCount: number;
};
type CouponCreateData = {
  code: string;
  title: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  startsAt?: Date;
  expiresAt?: Date;
  totalUsageLimit?: number;
  perUserUsageLimit?: number;
  applicableCourseIds?: Types.ObjectId[];
  isFirstPurchaseOnly: boolean;
  isActive: boolean;
};
type CouponUpdateOperation = {
  $set?: Record<string, unknown>;
  $unset?: Record<string, 1>;
};

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourseDocument>,
  ) {}

  async list(
    input: CouponListGqlInput,
  ): Promise<CouponListPaginatedOffsetGqlResponse> {
    const { filters, options } = input || {};
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_LIMIT;
    const skip = options?.skip ?? PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_SKIP;
    const filterQuery = this.buildListFilterQuery(filters);
    const sortOptions = this.resolveCouponListSortOptions(options?.sort);

    const [coupons, total] = await Promise.all([
      this.couponModel
        .find(filterQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean<CouponListRecord[]>()
        .exec(),
      this.couponModel.countDocuments(filterQuery).exec(),
    ]);
    const usageCountsByCouponId = await this.buildCouponUsageCountsByCouponId(
      coupons.map((coupon) => coupon._id),
    );

    return {
      items: coupons.map((coupon) =>
        this.toCouponListSummaryResponse(coupon, usageCountsByCouponId),
      ),
      pagination: {
        limit,
        skip,
        total,
        count: coupons.length,
      },
    };
  }

  async detail(input: CouponDetailGqlInput): Promise<CouponListGqlResponse> {
    const coupon = await this.couponModel
      .findOne({
        _id: input.id,
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      })
      .lean<CouponListRecord>()
      .exec();

    if (!coupon) {
      throw new NotFoundException("Coupon not found");
    }

    const usageCountsByCouponId = await this.buildCouponUsageCountsByCouponId([
      coupon._id,
    ]);

    return this.toCouponListResponse(coupon, usageCountsByCouponId);
  }

  async create(
    input: CouponCreateGqlInput,
  ): Promise<CouponListGqlResponse> {
    const createData = await this.buildCreateData(input);
    const existingCoupon = await this.couponModel
      .findOne({ code: createData.code })
      .lean()
      .exec();

    if (existingCoupon) {
      throw new ConflictException("Coupon code already exists");
    }

    const coupon = await this.couponModel.create(createData);

    return this.toCouponListResponse(
      coupon.toObject() as CouponListRecord,
      new Map(),
    );
  }

  async update(
    input: CouponUpdateGqlInput,
  ): Promise<CouponListGqlResponse> {
    const existingCoupon = await this.couponModel
      .findOne({
        _id: input.id,
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      })
      .exec();

    if (!existingCoupon) {
      throw new NotFoundException("Coupon not found");
    }

    const updateOperation = await this.buildUpdateOperation(
      input,
      existingCoupon.toObject() as CouponListRecord,
    );

    if (!updateOperation.$set && !updateOperation.$unset) {
      const usageCountsByCouponId = await this.buildCouponUsageCountsByCouponId(
        [existingCoupon._id],
      );

      return this.toCouponListResponse(
        existingCoupon.toObject() as CouponListRecord,
        usageCountsByCouponId,
      );
    }

    const updatedCoupon = await this.couponModel
      .findByIdAndUpdate(input.id, updateOperation, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedCoupon) {
      throw new NotFoundException("Coupon not found");
    }

    const usageCountsByCouponId = await this.buildCouponUsageCountsByCouponId([
      updatedCoupon._id,
    ]);

    return this.toCouponListResponse(
      updatedCoupon.toObject() as CouponListRecord,
      usageCountsByCouponId,
    );
  }

  async delete(input: CouponDeleteGqlInput): Promise<void> {
    const deletedCoupon = await this.couponModel
      .findByIdAndDelete(input.id)
      .exec();

    if (!deletedCoupon) {
      throw new NotFoundException("Coupon not found");
    }
  }

  async validateForCoursePurchase(
    input: CouponValidateGqlInput,
    userId: Types.ObjectId,
  ): Promise<CouponValidateGqlResponse> {
    const normalizedCode = this.normalizeCode(input.code);
    if (!normalizedCode) {
      return this.invalid(EXCEPTION_CONSTANT.COUPON_CODE_EMPTY.code);
    }

    const course = await this.courseModel
      .findOne({ _id: input.courseId, isActive: true })
      .lean<CourseWithId>()
      .exec();

    if (!course) {
      return this.invalid(EXCEPTION_CONSTANT.COURSE_NOT_FOUND_OR_INACTIVE.code);
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
      return this.invalid(EXCEPTION_CONSTANT.COURSE_ALREADY_PURCHASED.code);
    }

    const priceSummary = this.calculateCoursePriceSummary(course);
    if (priceSummary.payableAmountBeforeCouponIrt <= 0) {
      return this.invalid(EXCEPTION_CONSTANT.COUPON_NOT_NEEDED_FOR_FREE_COURSE.code);
    }

    const coupon = await this.couponModel
      .findOne({ code: normalizedCode })
      .lean<CouponWithId>()
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
      return this.invalid(EXCEPTION_CONSTANT.COUPON_NO_DISCOUNT_APPLIED.code);
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
    coupon: CouponWithId | null,
    courseId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<string | null> {
    if (!coupon) {
      return EXCEPTION_CONSTANT.COUPON_INVALID.code;
    }

    if (!coupon.isActive) {
      return EXCEPTION_CONSTANT.COUPON_INACTIVE.code;
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return EXCEPTION_CONSTANT.COUPON_NOT_STARTED.code;
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      return EXCEPTION_CONSTANT.COUPON_EXPIRED.code;
    }

    if (!this.isCouponApplicableToCourse(coupon, courseId)) {
      return EXCEPTION_CONSTANT.COUPON_NOT_APPLICABLE_TO_COURSE.code;
    }

    if (coupon.totalUsageLimit) {
      const totalUsageCount = await this.countCouponUsage(coupon._id);
      if (totalUsageCount >= coupon.totalUsageLimit) {
        return EXCEPTION_CONSTANT.COUPON_USAGE_LIMIT_REACHED.code;
      }
    }

    if (coupon.perUserUsageLimit) {
      const userUsageCount = await this.countCouponUsage(coupon._id, userId);
      if (userUsageCount >= coupon.perUserUsageLimit) {
        return EXCEPTION_CONSTANT.COUPON_USER_LIMIT_REACHED.code;
      }
    }

    if (coupon.isFirstPurchaseOnly) {
      const userPurchaseCount = await this.userCourseModel.countDocuments({
        userId,
        "purchase.status": { $in: COMMITTED_PURCHASE_STATUSES },
      });

      if (userPurchaseCount > 0) {
        return EXCEPTION_CONSTANT.COUPON_FIRST_PURCHASE_ONLY.code;
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
    coupon: CouponWithId,
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
    coupon: Coupon,
    amountIrt: number,
  ): number {
    if (coupon.discountType === CouponDiscountType.PERCENTAGE) {
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

  private invalid(code: string): CouponValidateGqlResponse {
    return {
      isValid: false,
      message: code,
    };
  }

  private async buildCreateData(
    input: CouponCreateGqlInput,
  ): Promise<CouponCreateData> {
    const code = this.normalizeCode(input.code);
    const title = this.normalizeRequiredText(input.title, "Coupon title");
    const description = this.normalizeOptionalText(input.description);
    const startsAt = this.parseOptionalInputDate(input.startsAt);
    const expiresAt = this.parseOptionalInputDate(input.expiresAt);
    const applicableCourseIds = this.normalizeObjectIdArray(
      input.applicableCourseIds,
    );

    if (!code) {
      throw new BadRequestException("Coupon code is required");
    }

    this.validateCouponDiscount(input.discountType, input.discountValue);
    this.validateCouponDateRange(startsAt, expiresAt);
    await this.ensureApplicableCoursesExist(applicableCourseIds);

    return {
      code,
      title,
      ...(description ? { description } : {}),
      discountType: input.discountType,
      discountValue: input.discountValue,
      ...(startsAt ? { startsAt } : {}),
      ...(expiresAt ? { expiresAt } : {}),
      ...(input.totalUsageLimit
        ? { totalUsageLimit: input.totalUsageLimit }
        : {}),
      ...(input.perUserUsageLimit
        ? { perUserUsageLimit: input.perUserUsageLimit }
        : {}),
      ...(applicableCourseIds.length > 0 ? { applicableCourseIds } : {}),
      isFirstPurchaseOnly: input.isFirstPurchaseOnly ?? false,
      isActive: input.isActive ?? true,
    };
  }

  private validateCouponDiscount(
    discountType: CouponDiscountType,
    discountValue: number,
  ): void {
    if (discountValue <= 0) {
      throw new BadRequestException(
        "Coupon discount value must be greater than 0",
      );
    }

    if (
      discountType === CouponDiscountType.PERCENTAGE &&
      discountValue > 100
    ) {
      throw new BadRequestException(
        "Percentage coupon discount value cannot be greater than 100",
      );
    }
  }

  private validateCouponDateRange(startsAt?: Date, expiresAt?: Date): void {
    if (startsAt && expiresAt && startsAt > expiresAt) {
      throw new BadRequestException(
        "Coupon start date cannot be later than expiration date",
      );
    }
  }

  private async ensureApplicableCoursesExist(
    applicableCourseIds: Types.ObjectId[],
  ): Promise<void> {
    if (applicableCourseIds.length === 0) {
      return;
    }

    const existingCourseCount = await this.courseModel
      .countDocuments({
        _id: { $in: applicableCourseIds },
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      })
      .exec();

    if (existingCourseCount !== applicableCourseIds.length) {
      throw new BadRequestException(
        "One or more applicable course IDs do not exist",
      );
    }
  }

  private async buildUpdateOperation(
    input: CouponUpdateGqlInput,
    existingCoupon: CouponListRecord,
  ): Promise<CouponUpdateOperation> {
    const set: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};

    if (this.hasOwnInputField(input, "code")) {
      if (input.code == null) {
        throw new BadRequestException("Coupon code cannot be null");
      }

      const code = this.normalizeCode(input.code);
      if (!code) {
        throw new BadRequestException("Coupon code is required");
      }

      await this.ensureCouponCodeIsAvailable(code, input.id);
      set.code = code;
    }

    if (this.hasOwnInputField(input, "title")) {
      if (input.title == null) {
        throw new BadRequestException("Coupon title cannot be null");
      }

      set.title = this.normalizeRequiredText(input.title, "Coupon title");
    }

    if (this.hasOwnInputField(input, "description")) {
      const description = this.normalizeOptionalText(input.description);
      if (description) {
        set.description = description;
      } else {
        unset.description = 1;
      }
    }

    if (this.hasOwnInputField(input, "discountType")) {
      if (input.discountType == null) {
        throw new BadRequestException("Coupon discount type cannot be null");
      }

      set.discountType = input.discountType;
    }

    if (this.hasOwnInputField(input, "discountValue")) {
      if (input.discountValue == null) {
        throw new BadRequestException("Coupon discount value cannot be null");
      }

      set.discountValue = input.discountValue;
    }

    this.applyNullableDateUpdate(input, "startsAt", set, unset);
    this.applyNullableDateUpdate(input, "expiresAt", set, unset);
    this.applyNullableNumberUpdate(input, "totalUsageLimit", set, unset);
    this.applyNullableNumberUpdate(input, "perUserUsageLimit", set, unset);

    if (this.hasOwnInputField(input, "applicableCourseIds")) {
      const applicableCourseIds = this.normalizeObjectIdArray(
        input.applicableCourseIds,
      );
      await this.ensureApplicableCoursesExist(applicableCourseIds);
      set.applicableCourseIds = applicableCourseIds;
    }

    if (this.hasOwnInputField(input, "isFirstPurchaseOnly")) {
      if (input.isFirstPurchaseOnly == null) {
        throw new BadRequestException(
          "First-purchase-only flag cannot be null",
        );
      }

      set.isFirstPurchaseOnly = input.isFirstPurchaseOnly;
    }

    if (this.hasOwnInputField(input, "isActive")) {
      if (input.isActive == null) {
        throw new BadRequestException("Active status cannot be null");
      }

      set.isActive = input.isActive;
    }

    this.validateUpdatedCouponState(input, existingCoupon);

    return {
      ...(Object.keys(set).length > 0 ? { $set: set } : {}),
      ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
    };
  }

  private async ensureCouponCodeIsAvailable(
    code: string,
    currentCouponId: Types.ObjectId,
  ): Promise<void> {
    const existingCoupon = await this.couponModel
      .findOne({
        _id: { $ne: currentCouponId },
        code,
      })
      .lean()
      .exec();

    if (existingCoupon) {
      throw new ConflictException("Coupon code already exists");
    }
  }

  private validateUpdatedCouponState(
    input: CouponUpdateGqlInput,
    existingCoupon: CouponListRecord,
  ): void {
    const nextDiscountType = input.discountType ?? existingCoupon.discountType;
    const nextDiscountValue = this.hasOwnInputField(input, "discountValue")
      ? input.discountValue
      : existingCoupon.discountValue;
    const nextStartsAt = this.resolveUpdatedDateValue(
      input,
      "startsAt",
      existingCoupon.startsAt,
    );
    const nextExpiresAt = this.resolveUpdatedDateValue(
      input,
      "expiresAt",
      existingCoupon.expiresAt,
    );

    if (nextDiscountValue == null) {
      throw new BadRequestException("Coupon discount value cannot be null");
    }

    this.validateCouponDiscount(nextDiscountType, nextDiscountValue);
    this.validateCouponDateRange(nextStartsAt, nextExpiresAt);
  }

  private applyNullableDateUpdate(
    input: CouponUpdateGqlInput,
    field: "startsAt" | "expiresAt",
    set: Record<string, unknown>,
    unset: Record<string, 1>,
  ): void {
    if (!this.hasOwnInputField(input, field)) {
      return;
    }

    const value = input[field];
    if (value == null) {
      unset[field] = 1;
      return;
    }

    set[field] = this.parseOptionalInputDate(value);
  }

  private applyNullableNumberUpdate(
    input: CouponUpdateGqlInput,
    field: "totalUsageLimit" | "perUserUsageLimit",
    set: Record<string, unknown>,
    unset: Record<string, 1>,
  ): void {
    if (!this.hasOwnInputField(input, field)) {
      return;
    }

    const value = input[field];
    if (value == null) {
      unset[field] = 1;
      return;
    }

    set[field] = value;
  }

  private resolveUpdatedDateValue(
    input: CouponUpdateGqlInput,
    field: "startsAt" | "expiresAt",
    existingValue?: Date,
  ): Date | undefined {
    if (!this.hasOwnInputField(input, field)) {
      return existingValue;
    }

    const value = input[field];
    if (value == null) {
      return undefined;
    }

    return this.parseOptionalInputDate(value);
  }

  private buildListFilterQuery(
    filters?: CouponListGqlInput["filters"],
  ): FilterQuery<Coupon> {
    const query: FilterQuery<Coupon> = {
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
      this.addListOrFilter(query, [
        { code: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
      ]);
    }

    if (filters.id) {
      query._id = new Types.ObjectId(filters.id);
    }

    this.addListContainsFilter(query, "code", filters.code);
    this.addListContainsFilter(query, "title", filters.title);

    if (filters.discountType) {
      query.discountType = filters.discountType;
    }

    this.addListNumberRangeFilter(
      query,
      "discountValue",
      filters.discountValueMin,
      filters.discountValueMax,
    );
    this.addListDateRangeFilter(
      query,
      "startsAt",
      filters.startsAtFrom,
      filters.startsAtTo,
    );
    this.addListDateRangeFilter(
      query,
      "expiresAt",
      filters.expiresAtFrom,
      filters.expiresAtTo,
    );
    this.addListNumberRangeFilter(
      query,
      "totalUsageLimit",
      filters.totalUsageLimitMin,
      filters.totalUsageLimitMax,
    );
    this.addListNumberRangeFilter(
      query,
      "perUserUsageLimit",
      filters.perUserUsageLimitMin,
      filters.perUserUsageLimitMax,
    );

    if (filters.applicableCourseId) {
      query.applicableCourseIds = new Types.ObjectId(
        filters.applicableCourseId,
      );
    }

    if (typeof filters.isFirstPurchaseOnly === "boolean") {
      query.isFirstPurchaseOnly = filters.isFirstPurchaseOnly;
    }

    if (typeof filters.isActive === "boolean") {
      query.isActive = filters.isActive;
    }

    if (filters.createdBy) {
      query["audit.createdBy"] = new Types.ObjectId(filters.createdBy);
    }

    if (filters.updatedBy) {
      query["audit.updatedBy"] = new Types.ObjectId(filters.updatedBy);
    }

    this.addListDateRangeFilter(
      query,
      "audit.createdAt",
      filters.createdAtFrom,
      filters.createdAtTo,
    );
    this.addListDateRangeFilter(
      query,
      "audit.updatedAt",
      filters.updatedAtFrom,
      filters.updatedAtTo,
    );

    return query;
  }

  private resolveCouponListSortOptions(
    sort?: CouponListSortOptionInput,
  ): Record<string, 1 | -1> {
    const sortOptions = buildSortOptions<CouponListSortField>(
      sort ?? {},
      {
        createdAt: "audit.createdAt",
        updatedAt: "audit.updatedAt",
        code: "code",
        title: "title",
        discountType: "discountType",
        discountValue: "discountValue",
        startsAt: "startsAt",
        expiresAt: "expiresAt",
        totalUsageLimit: "totalUsageLimit",
        perUserUsageLimit: "perUserUsageLimit",
        isFirstPurchaseOnly: "isFirstPurchaseOnly",
        isActive: "isActive",
      },
      { createdAt: SortingOrder.DESC },
    );

    sortOptions._id = Object.values(sortOptions)[0] ?? -1;

    return sortOptions;
  }

  private async buildCouponUsageCountsByCouponId(
    couponIds: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    if (couponIds.length === 0) {
      return new Map();
    }

    const usageCounts = await this.userCourseModel
      .aggregate<CouponUsageCountRecord>([
        {
          $match: {
            "purchase.couponSnapshot.couponId": { $in: couponIds },
            "purchase.status": { $in: COMMITTED_PURCHASE_STATUSES },
          },
        },
        {
          $group: {
            _id: "$purchase.couponSnapshot.couponId",
            totalUsageCount: { $sum: 1 },
          },
        },
      ])
      .exec();

    return new Map(
      usageCounts.map((usageCount) => [
        usageCount._id.toString(),
        usageCount.totalUsageCount,
      ]),
    );
  }

  private toCouponListSummaryResponse(
    coupon: CouponListRecord,
    usageCountsByCouponId: Map<string, number>,
  ): CouponListSummaryGqlResponse {
    const totalUsageCount =
      usageCountsByCouponId.get(coupon._id.toString()) ?? 0;

    return {
      id: coupon._id,
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      startsAt: coupon.startsAt,
      expiresAt: coupon.expiresAt,
      isFirstPurchaseOnly: coupon.isFirstPurchaseOnly,
      isActive: coupon.isActive,
      totalUsageCount,
      remainingTotalUsageCount:
        coupon.totalUsageLimit != null
          ? Math.max(0, coupon.totalUsageLimit - totalUsageCount)
          : undefined,
      createdAt: coupon.audit?.createdAt,
      updatedAt: coupon.audit?.updatedAt,
    };
  }

  private toCouponListResponse(
    coupon: CouponListRecord,
    usageCountsByCouponId: Map<string, number>,
  ): CouponListGqlResponse {
    const totalUsageCount =
      usageCountsByCouponId.get(coupon._id.toString()) ?? 0;

    return {
      id: coupon._id,
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      startsAt: coupon.startsAt,
      expiresAt: coupon.expiresAt,
      totalUsageLimit: coupon.totalUsageLimit,
      perUserUsageLimit: coupon.perUserUsageLimit,
      applicableCourseIds: coupon.applicableCourseIds ?? [],
      isFirstPurchaseOnly: coupon.isFirstPurchaseOnly,
      isActive: coupon.isActive,
      totalUsageCount,
      remainingTotalUsageCount:
        coupon.totalUsageLimit != null
          ? Math.max(0, coupon.totalUsageLimit - totalUsageCount)
          : undefined,
      createdBy: coupon.audit?.createdBy,
      updatedBy: coupon.audit?.updatedBy,
      createdAt: coupon.audit?.createdAt,
      updatedAt: coupon.audit?.updatedAt,
    };
  }

  private addListContainsFilter(
    query: FilterQuery<Coupon>,
    path: string,
    value?: string,
  ): void {
    if (value?.trim()) {
      query[path] = this.createContainsRegex(value);
    }
  }

  private addListOrFilter(
    query: FilterQuery<Coupon>,
    conditions: FilterQuery<Coupon>[],
  ): void {
    query.$and = [
      ...(Array.isArray(query.$and) ? query.$and : []),
      { $or: conditions },
    ];
  }

  private addListDateRangeFilter(
    query: FilterQuery<Coupon>,
    path: string,
    from?: string,
    to?: string,
  ): void {
    const range: Record<string, Date> = {};
    const fromDate = this.parseListFilterDate(from, false);
    const toDate = this.parseListFilterDate(to, true);

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

  private addListNumberRangeFilter(
    query: FilterQuery<Coupon>,
    path: string,
    min?: number,
    max?: number,
  ): void {
    const range: Record<string, number> = {};

    if (typeof min === "number") {
      range.$gte = min;
    }

    if (typeof max === "number") {
      range.$lte = max;
    }

    if (Object.keys(range).length > 0) {
      query[path] = range;
    }
  }

  private parseListFilterDate(
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

  private parseOptionalInputDate(value?: string): Date | undefined {
    if (!value?.trim()) {
      return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return date;
  }

  private normalizeRequiredText(value: string, fieldName: string): string {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return normalizedValue;
  }

  private normalizeOptionalText(value?: unknown): string {
    return typeof value === "string" ? value.trim() : "";
  }

  private normalizeObjectIdArray(
    value?: Types.ObjectId[] | null,
  ): Types.ObjectId[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) =>
      item instanceof Types.ObjectId ? item : new Types.ObjectId(item),
    );
  }

  private hasOwnInputField<T extends object>(
    input: T,
    field: keyof T,
  ): boolean {
    return Object.prototype.hasOwnProperty.call(input, field);
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
