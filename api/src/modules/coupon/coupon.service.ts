import { FilterQuery, Model, Types } from "mongoose";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import {
  Product,
  ProductDocument,
  Coupon,
  CouponDocument,
  UserProduct,
  UserProductDocument,
} from "../../database/schemas";
import {
  ProductDiscountType,
  CouponDiscountType,
  UserProductPurchaseStatus,
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
  UserProductPurchaseStatus.PENDING,
  UserProductPurchaseStatus.PENDING_GATEWAY,
  UserProductPurchaseStatus.PAID,
];

type ProductWithId = Product & { _id: Types.ObjectId };
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
  applicableProductIds?: Types.ObjectId[];
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
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(UserProduct.name)
    private readonly userProductModel: Model<UserProductDocument>,
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
      throw new NotFoundException(EXCEPTION_CONSTANT.COUPON_NOT_FOUND);
    }

    const usageCountsByCouponId = await this.buildCouponUsageCountsByCouponId([
      coupon._id,
    ]);

    return this.toCouponListResponse(coupon, usageCountsByCouponId);
  }

  async create(input: CouponCreateGqlInput): Promise<CouponListGqlResponse> {
    const createData = await this.buildCreateData(input);
    const existingCoupon = await this.couponModel
      .findOne({ code: createData.code })
      .lean()
      .exec();

    if (existingCoupon) {
      throw new ConflictException(EXCEPTION_CONSTANT.COUPON_CODE_EXISTS);
    }

    const coupon = await this.couponModel.create(createData);

    return this.toCouponListResponse(
      coupon.toObject() as CouponListRecord,
      new Map(),
    );
  }

  async update(input: CouponUpdateGqlInput): Promise<CouponListGqlResponse> {
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
      throw new NotFoundException(EXCEPTION_CONSTANT.COUPON_NOT_FOUND);
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
      throw new NotFoundException(EXCEPTION_CONSTANT.COUPON_NOT_FOUND);
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
      throw new NotFoundException(EXCEPTION_CONSTANT.COUPON_NOT_FOUND);
    }
  }

  async validateForProductPurchase(
    input: CouponValidateGqlInput,
    userId: Types.ObjectId,
  ): Promise<CouponValidateGqlResponse> {
    const normalizedCode = this.normalizeCode(input.code);
    if (!normalizedCode) {
      return this.invalid(EXCEPTION_CONSTANT.COUPON_CODE_EMPTY);
    }

    const product = await this.productModel
      .findOne({ _id: input.productId, isActive: true })
      .lean<ProductWithId>()
      .exec();

    if (!product) {
      return this.invalid(EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND_OR_INACTIVE);
    }

    const existingUserProduct = await this.userProductModel
      .findOne({
        productId: product._id,
        userId,
        "purchase.status": { $in: COMMITTED_PURCHASE_STATUSES },
      })
      .lean()
      .exec();

    if (existingUserProduct) {
      return this.invalid(EXCEPTION_CONSTANT.PRODUCT_ALREADY_PURCHASED);
    }

    const priceSummary = this.calculateProductPriceSummary(product);
    if (priceSummary.payableAmountBeforeCouponIrt <= 0) {
      return this.invalid(
        EXCEPTION_CONSTANT.COUPON_NOT_NEEDED_FOR_FREE_PRODUCT,
      );
    }

    const coupon = await this.couponModel
      .findOne({ code: normalizedCode })
      .lean<CouponWithId>()
      .exec();

    const invalidCouponReason = await this.getInvalidCouponReason(
      coupon,
      product._id,
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
      return this.invalid(EXCEPTION_CONSTANT.COUPON_NO_DISCOUNT_APPLIED);
    }

    return {
      isValid: true,
      couponId: coupon._id,
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      amountIrt: priceSummary.amountIrt,
      productDiscountAmountIrt: priceSummary.productDiscountAmountIrt,
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
    productId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<string | null> {
    if (!coupon) {
      return EXCEPTION_CONSTANT.COUPON_INVALID;
    }

    if (!coupon.isActive) {
      return EXCEPTION_CONSTANT.COUPON_INACTIVE;
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return EXCEPTION_CONSTANT.COUPON_NOT_STARTED;
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      return EXCEPTION_CONSTANT.COUPON_EXPIRED;
    }

    if (!this.isCouponApplicableToProduct(coupon, productId)) {
      return EXCEPTION_CONSTANT.COUPON_NOT_APPLICABLE_TO_PRODUCT;
    }

    if (coupon.totalUsageLimit) {
      const totalUsageCount = await this.countCouponUsage(coupon._id);
      if (totalUsageCount >= coupon.totalUsageLimit) {
        return EXCEPTION_CONSTANT.COUPON_USAGE_LIMIT_REACHED;
      }
    }

    if (coupon.perUserUsageLimit) {
      const userUsageCount = await this.countCouponUsage(coupon._id, userId);
      if (userUsageCount >= coupon.perUserUsageLimit) {
        return EXCEPTION_CONSTANT.COUPON_USER_LIMIT_REACHED;
      }
    }

    if (coupon.isFirstPurchaseOnly) {
      const userPurchaseCount = await this.userProductModel.countDocuments({
        userId,
        "purchase.status": { $in: COMMITTED_PURCHASE_STATUSES },
      });

      if (userPurchaseCount > 0) {
        return EXCEPTION_CONSTANT.COUPON_FIRST_PURCHASE_ONLY;
      }
    }

    return null;
  }

  private countCouponUsage(
    couponId: Types.ObjectId,
    userId?: Types.ObjectId,
  ): Promise<number> {
    return this.userProductModel.countDocuments({
      ...(userId ? { userId } : {}),
      "purchase.couponSnapshot.couponId": couponId,
      "purchase.status": { $in: COMMITTED_PURCHASE_STATUSES },
    });
  }

  private isCouponApplicableToProduct(
    coupon: CouponWithId,
    productId: Types.ObjectId,
  ): boolean {
    if (!coupon.applicableProductIds?.length) {
      return true;
    }

    return coupon.applicableProductIds.some((applicableProductId) =>
      applicableProductId.equals(productId),
    );
  }

  private calculateProductPriceSummary(product: Product): {
    amountIrt: number;
    productDiscountAmountIrt: number;
    payableAmountBeforeCouponIrt: number;
  } {
    const amountIrt = Math.max(0, product.priceIrt ?? 0);
    const productDiscountAmountIrt =
      this.calculateProductDiscountAmount(product);

    return {
      amountIrt,
      productDiscountAmountIrt,
      payableAmountBeforeCouponIrt: Math.max(
        0,
        amountIrt - productDiscountAmountIrt,
      ),
    };
  }

  private calculateProductDiscountAmount(product: Product): number {
    const priceIrt = Math.max(0, product.priceIrt ?? 0);
    const discount = product.discount;

    if (!discount || discount.value <= 0 || priceIrt <= 0) {
      return 0;
    }

    if (discount.type === ProductDiscountType.PERCENTAGE) {
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
    const applicableProductIds = this.normalizeObjectIdArray(
      input.applicableProductIds,
    );

    if (!code) {
      throw new BadRequestException(EXCEPTION_CONSTANT.COUPON_CODE_REQUIRED);
    }

    this.validateCouponDiscount(input.discountType, input.discountValue);
    this.validateCouponDateRange(startsAt, expiresAt);
    await this.ensureApplicableProductsExist(applicableProductIds);

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
      ...(applicableProductIds.length > 0 ? { applicableProductIds } : {}),
      isFirstPurchaseOnly: input.isFirstPurchaseOnly ?? false,
      isActive: input.isActive ?? true,
    };
  }

  private validateCouponDiscount(
    discountType: CouponDiscountType,
    discountValue: number,
  ): void {
    if (discountValue <= 0) {
      throw new BadRequestException(EXCEPTION_CONSTANT.COUPON_DISCOUNT_INVALID);
    }

    if (discountType === CouponDiscountType.PERCENTAGE && discountValue > 100) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.COUPON_PERCENTAGE_INVALID,
      );
    }
  }

  private validateCouponDateRange(startsAt?: Date, expiresAt?: Date): void {
    if (startsAt && expiresAt && startsAt > expiresAt) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.COUPON_DATE_RANGE_INVALID,
      );
    }
  }

  private async ensureApplicableProductsExist(
    applicableProductIds: Types.ObjectId[],
  ): Promise<void> {
    if (applicableProductIds.length === 0) {
      return;
    }

    const existingProductCount = await this.productModel
      .countDocuments({
        _id: { $in: applicableProductIds },
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      })
      .exec();

    if (existingProductCount !== applicableProductIds.length) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.COUPON_PRODUCT_IDS_INVALID,
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
        throw new BadRequestException(EXCEPTION_CONSTANT.COUPON_FIELD_NULL);
      }

      const code = this.normalizeCode(input.code);
      if (!code) {
        throw new BadRequestException(EXCEPTION_CONSTANT.COUPON_CODE_REQUIRED);
      }

      await this.ensureCouponCodeIsAvailable(code, input.id);
      set.code = code;
    }

    if (this.hasOwnInputField(input, "title")) {
      if (input.title == null) {
        throw new BadRequestException(EXCEPTION_CONSTANT.COUPON_FIELD_NULL);
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
        throw new BadRequestException(EXCEPTION_CONSTANT.COUPON_FIELD_NULL);
      }

      set.discountType = input.discountType;
    }

    if (this.hasOwnInputField(input, "discountValue")) {
      if (input.discountValue == null) {
        throw new BadRequestException(EXCEPTION_CONSTANT.COUPON_FIELD_NULL);
      }

      set.discountValue = input.discountValue;
    }

    this.applyNullableDateUpdate(input, "startsAt", set, unset);
    this.applyNullableDateUpdate(input, "expiresAt", set, unset);
    this.applyNullableNumberUpdate(input, "totalUsageLimit", set, unset);
    this.applyNullableNumberUpdate(input, "perUserUsageLimit", set, unset);

    if (this.hasOwnInputField(input, "applicableProductIds")) {
      const applicableProductIds = this.normalizeObjectIdArray(
        input.applicableProductIds,
      );
      await this.ensureApplicableProductsExist(applicableProductIds);
      set.applicableProductIds = applicableProductIds;
    }

    if (this.hasOwnInputField(input, "isFirstPurchaseOnly")) {
      if (input.isFirstPurchaseOnly == null) {
        throw new BadRequestException(EXCEPTION_CONSTANT.COUPON_FIELD_NULL);
      }

      set.isFirstPurchaseOnly = input.isFirstPurchaseOnly;
    }

    if (this.hasOwnInputField(input, "isActive")) {
      if (input.isActive == null) {
        throw new BadRequestException(EXCEPTION_CONSTANT.COUPON_FIELD_NULL);
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
      throw new ConflictException(EXCEPTION_CONSTANT.COUPON_CODE_EXISTS);
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
      throw new BadRequestException(EXCEPTION_CONSTANT.COUPON_FIELD_NULL);
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

    if (filters.applicableProductId) {
      query.applicableProductIds = new Types.ObjectId(
        filters.applicableProductId,
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

    const usageCounts = await this.userProductModel
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
      applicableProductIds: coupon.applicableProductIds ?? [],
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
      throw new BadRequestException({
        key: EXCEPTION_CONSTANT.VALIDATION_FAILED,
        params: { fieldName },
      });
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
