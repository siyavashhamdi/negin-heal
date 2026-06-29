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

import {
  APP_SETTING_KEY,
  PAGINATION_CONSTANT,
  EXCEPTION_CONSTANT,
} from "../../constants";
import {
  BadgeCountTriggerAction,
  BadgeCountTriggerSource,
  ProductDeleteDependencyImpact,
  ProductDiscountType,
  ProductItemType,
  ProductReleaseType,
  CouponDiscountType,
  GeneralSubscriptionUpdateType,
  NotificationMode,
  NotificationSource,
  UserRole,
  UserProductPaymentMethod,
  UserProductPurchaseCurrency,
  UserProductPurchaseStatus,
  PurchaseStatusChangedBy,
  UserStatus,
} from "../../enums";
import { SortingOrder } from "../../common/pagination/input";
import { buildSortOptions } from "../../common/pagination/utils";
import { env } from "../../config";
import {
  Product,
  ProductChapter,
  ProductDocument,
  ProductItem,
  ProductReview,
  ProductReviewDocument,
  Coupon,
  CouponDocument,
  StoredFile,
  StoredFileDocument,
  Notification,
  NotificationDocument,
  User,
  UserProduct,
  UserProductDocument,
  UserDocument,
} from "../../database/schemas";
import {
  ProductChapterGqlInput,
  ProductDiscountGqlInput,
  ProductItemGqlInput,
} from "./graphql/inputs/product-common.gql.input";
import { ProductCreateGqlInput } from "./graphql/inputs/product-create.gql.input";
import { ProductDetailGqlInput } from "./graphql/inputs/product-detail.gql.input";
import { ProductDeleteGqlInput } from "./graphql/inputs/product-delete.gql.input";
import { ProductListGqlInput } from "./graphql/inputs/product-list.gql.input";
import { ProductPaymentListGqlInput } from "./graphql/inputs/product-payment-list.gql.input";
import { ProductPaymentDetailGqlInput } from "./graphql/inputs/product-payment-detail.gql.input";
import { ProductPaymentManualCreateGqlInput } from "./graphql/inputs/product-payment-manual-create.gql.input";
import { ProductPaymentStatusUpdateGqlInput } from "./graphql/inputs/product-payment-status-update.gql.input";
import { ProductPurchaseSubmitGqlInput } from "./graphql/inputs/product-purchase-submit.gql.input";
import { ProductChapterCompleteGqlInput } from "./graphql/inputs/product-chapter-complete.gql.input";
import { ProductListSortOptionInput } from "./graphql/inputs/product-list-sort-option.gql.input";
import { ProductUpdateGqlInput } from "./graphql/inputs/product-update.gql.input";
import { UserProductDetailGqlInput } from "./graphql/inputs/user-product-detail.gql.input";
import { FileService, FileAccessUrlDescriptor } from "../file/file.service";
import {
  ProductListChapterGqlResponse,
  ProductListGqlResponse,
  ProductListItemGqlResponse,
  ProductListPaginatedCursorGqlResponse,
  ProductListSummaryGqlResponse,
} from "./graphql/responses/product-list.gql.response";
import {
  UserProductDetailChapterGqlResponse,
  UserProductDetailGqlResponse,
  UserProductDetailItemGqlResponse,
} from "./graphql/responses/user-product-detail.gql.response";
import {
  UserProductListGqlResponse,
  UserProductListPaginatedCursorGqlResponse,
} from "./graphql/responses/user-product-list.gql.response";
import {
  ProductPaymentListGqlResponse,
  ProductPaymentListPaginatedOffsetGqlResponse,
  ProductPaymentListSummaryGqlResponse,
} from "./graphql/responses/product-payment-list.gql.response";
import { ProductPurchaseSubmitGqlResponse } from "./graphql/responses/product-purchase-submit.gql.response";
import { ProductChapterCompleteGqlResponse } from "./graphql/responses/product-chapter-complete.gql.response";
import {
  ProductDeleteDependenciesGqlResponse,
  ProductDeleteDependencyBreakdownGqlResponse,
  ProductDeleteDependencyGroupGqlResponse,
} from "./graphql/responses/product-delete-dependencies.gql.response";
import { AppSettingsService } from "../app-settings";
import { BadgeService } from "../badge";
import { CouponService } from "../coupon";
import { NotificationService } from "../notification";
import { PushNotificationService } from "../push-notification";
import {
  resolveWebPushBody,
  resolveWebPushTitle,
} from "../push-notification/utils/resolve-web-push-content.util";
import { UserSubscriptionService } from "../user";
import { ZarinPalProxyService } from "../zarinpal-proxy";
import {
  canAccessChapter,
  resolveChapterUnlocksAt,
} from "./chapter-access.util";
import { hasRichTextContent } from "../../utils/rich-text-content.util";

type PlainProduct = Product & {
  _id: Types.ObjectId;
};

type FileTypeLookup = Map<string, ProductItemType>;
type ProductListSortField = Extract<keyof ProductListSortOptionInput, string>;
type ProductFileReferenceSource = {
  coverImageFileId?: Types.ObjectId;
  chapters: Array<{
    items: Array<{
      fileId?: Types.ObjectId;
    }>;
  }>;
};
type UserProductListRecord = Pick<
  UserProduct,
  "productId" | "purchase" | "progress"
> & {
  _id: Types.ObjectId;
};
type ProductPaymentListRecord = UserProduct & {
  _id: Types.ObjectId;
};
type ProductPaymentUserLookupRecord = Pick<User, "profile" | "username"> & {
  _id: Types.ObjectId;
};
type ProductPaymentFileLookupRecord = Pick<
  StoredFile,
  "mimeType" | "name" | "path" | "sizeBytes"
> & {
  accessUrl?: FileAccessUrlDescriptor;
};
type ProductPaymentRelatedLookups = {
  usersById: Map<string, ProductPaymentUserLookupRecord>;
  filesById: Map<string, ProductPaymentFileLookupRecord>;
};
type ProductPurchasePricingInput = {
  productId: Types.ObjectId;
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

type ProductDeleteDependencyCounts = {
  enrollmentsByStatus: Map<UserProductPurchaseStatus, number>;
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

const PRODUCT_DELETE_DEPENDENCY_SAMPLE_LIMIT = 4;

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(UserProduct.name)
    private readonly userProductModel: Model<UserProductDocument>,
    @InjectModel(ProductReview.name)
    private readonly productReviewModel: Model<ProductReviewDocument>,
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
    private readonly pushNotificationService: PushNotificationService,
    private readonly zarinPalProxyService: ZarinPalProxyService,
  ) {}

  async create(input: ProductCreateGqlInput): Promise<ProductListGqlResponse> {
    this.validateCreateInput(input);

    const normalizedInput = this.normalizeCreateInput(input);
    normalizedInput.sortOrder = await this.getNextProductSortOrder();
    await this.ensureReferencedFilesExist(normalizedInput);

    const product = await this.productModel.create(normalizedInput);
    await this.publishProductBadgeCountSignal(
      BadgeCountTriggerAction.CREATED,
      product._id,
      {
        includeStaffUsers: true,
        includeActiveSubscribedUsers: product.isActive,
      },
    );
    const fileTypeLookup = await this.buildFileTypeLookup([product]);
    const fileAccessUrlMap = await this.buildFileAccessUrlLookup([product]);

    return this.toListResponse(product, fileTypeLookup, fileAccessUrlMap);
  }

  async update(input: ProductUpdateGqlInput): Promise<ProductListGqlResponse> {
    this.validateCreateInput(input);

    const existingProduct = await this.productModel.findById(input.id).exec();
    if (!existingProduct) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND);
    }

    const oldFileIds = this.collectReferencedFileIds(existingProduct);
    const existingIsActive = existingProduct.isActive;
    const normalizedInput = this.normalizeCreateInput(input);
    await this.ensureReferencedFilesExist(normalizedInput);

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(input.id, normalizedInput, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND);
    }

    const newFileIds = this.collectReferencedFileIds(normalizedInput);
    const fileTypeLookup = await this.buildFileTypeLookup([updatedProduct]);
    const fileAccessUrlMap = await this.buildFileAccessUrlLookup([
      updatedProduct,
    ]);
    const response = this.toListResponse(
      updatedProduct,
      fileTypeLookup,
      fileAccessUrlMap,
    );

    if (existingIsActive !== updatedProduct.isActive) {
      await this.publishProductBadgeCountSignal(
        BadgeCountTriggerAction.UPDATED,
        updatedProduct._id,
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
    input: ProductDeleteGqlInput,
  ): Promise<ProductDeleteDependenciesGqlResponse> {
    const product = await this.productModel.findById(input.id).exec();
    if (!product) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND);
    }

    const counts = await this.collectProductDeleteDependencyCounts(
      input.id,
      product,
    );
    const groups = this.buildProductDeleteDependencyGroups(counts);
    const retainedCount = groups
      .filter(
        (group) => group.impact === ProductDeleteDependencyImpact.RETAINED,
      )
      .reduce((total, group) => total + group.totalCount, 0);
    const removedCount = groups
      .filter((group) => group.impact === ProductDeleteDependencyImpact.REMOVED)
      .reduce((total, group) => total + group.totalCount, 0);

    return {
      productId: product._id,
      productTitle: product.title,
      summary: {
        retainedCount,
        removedCount,
        hasRetainedDependencies: retainedCount > 0,
        hasRemovedDependencies: removedCount > 0,
      },
      groups,
    };
  }

  async delete(input: ProductDeleteGqlInput): Promise<void> {
    const existingProduct = await this.productModel.findById(input.id).exec();
    if (!existingProduct) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND);
    }

    const oldFileIds = this.collectReferencedFileIds(existingProduct);

    const deletedProduct = await this.productModel
      .findByIdAndDelete(input.id)
      .exec();
    if (!deletedProduct) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND);
    }

    await this.deleteProductRelatedNotifications(input.id);
    await this.publishProductBadgeCountSignal(
      BadgeCountTriggerAction.DELETED,
      deletedProduct._id,
      {
        includeStaffUsers: true,
        includeActiveSubscribedUsers: deletedProduct.isActive,
      },
    );
    await this.deleteDetachedFiles(input.id, oldFileIds, []);
  }

  async submitPurchase(
    input: ProductPurchaseSubmitGqlInput,
    userId: Types.ObjectId,
  ): Promise<ProductPurchaseSubmitGqlResponse> {
    this.validatePurchaseInputShape(input);

    const [product, user, existingUserProduct] = await Promise.all([
      this.productModel
        .findOne({ _id: input.productId, isActive: true })
        .exec(),
      this.userModel.findById(userId).exec(),
      this.userProductModel
        .findOne({
          productId: input.productId,
          userId,
        })
        .exec(),
    ]);

    if (!product) {
      throw new NotFoundException(
        EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND_OR_INACTIVE,
      );
    }

    if (!user) {
      throw new NotFoundException(EXCEPTION_CONSTANT.USER_NOT_FOUND);
    }

    if (
      existingUserProduct?.purchase.status === UserProductPurchaseStatus.PAID
    ) {
      throw new ConflictException(EXCEPTION_CONSTANT.PRODUCT_ALREADY_PURCHASED);
    }

    if (
      existingUserProduct?.purchase.status === UserProductPurchaseStatus.PENDING
    ) {
      throw new ConflictException(EXCEPTION_CONSTANT.PRODUCT_PENDING_PURCHASE);
    }

    const priceSummary = await this.resolvePurchasePriceSummary(
      input,
      product,
      userId,
    );
    this.validatePurchaseMethodAgainstPrice(input, priceSummary.finalAmountIrt);

    const uploadedReceiptFileId = await this.resolveReceiptFileId(input);
    const gatewayPayment =
      input.paymentMethod === UserProductPaymentMethod.GATEWAY
        ? await this.requestZarinPalPayment(
            product,
            user,
            priceSummary.finalAmountIrt,
          )
        : undefined;
    const now = new Date();
    const status =
      input.paymentMethod === UserProductPaymentMethod.FREE
        ? UserProductPurchaseStatus.PAID
        : input.paymentMethod === UserProductPaymentMethod.GATEWAY
          ? UserProductPurchaseStatus.PENDING_GATEWAY
          : UserProductPurchaseStatus.PENDING;
    const userProductPayload = {
      userId,
      productId: product._id,
      userSnapshot: this.toUserProductUserSnapshot(user),
      productSnapshot: {
        title: product.title,
        description: product.description,
        priceIrt: priceSummary.amountIrt,
        discount: product.discount
          ? {
              type: product.discount.type,
              value: product.discount.value,
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
          input.paymentMethod === UserProductPaymentMethod.CRYPTOCURRENCY
            ? UserProductPurchaseCurrency.USDT
            : UserProductPurchaseCurrency.IRT,
        paymentMethod: input.paymentMethod,
        paymentProvider:
          input.paymentMethod === UserProductPaymentMethod.GATEWAY
            ? "ZARINPAL"
            : undefined,
        paymentReference:
          gatewayPayment?.authority ??
          this.normalizeOptionalText(input.paymentReference),
        transactionId: this.normalizeOptionalText(input.transactionId),
        pendingAt:
          status === UserProductPurchaseStatus.PENDING ? now : undefined,
        gatewayPendingAt:
          status === UserProductPurchaseStatus.PENDING_GATEWAY
            ? now
            : undefined,
        paidAt: status === UserProductPurchaseStatus.PAID ? now : undefined,
        isManualStatusChange: false,
        uploadedReceiptFileId,
        receiptUploadedBy: uploadedReceiptFileId ? userId : undefined,
        couponSnapshot: priceSummary.couponSnapshot,
      },
      progress: { chapters: [] },
    };

    const previousStatus = existingUserProduct?.purchase.status;

    const userProduct =
      existingUserProduct ??
      new this.userProductModel({
        userId,
        productId: product._id,
      });

    userProduct.set(userProductPayload);

    try {
      await userProduct.save();
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(EXCEPTION_CONSTANT.PRODUCT_PURCHASE_EXISTS);
      }

      throw error;
    }

    const nextStatus = userProduct.purchase.status;

    await this.publishPaymentBadgeCountSignal({
      userProductId: userProduct._id,
      productId: userProduct.productId,
      action:
        previousStatus != null && previousStatus !== nextStatus
          ? BadgeCountTriggerAction.UPDATED
          : BadgeCountTriggerAction.CREATED,
      includeStaffUsersWhenPendingPaymentsExist: true,
      previousStatus,
      nextStatus,
    });

    return this.toProductPurchaseSubmitResponse(
      userProduct,
      gatewayPayment?.paymentUrl,
    );
  }

  async verifyZarinPalPurchase(
    authority?: string,
    status?: string,
  ): Promise<ZarinPalVerificationResult> {
    const normalizedAuthority = this.normalizeOptionalText(authority);

    if (!normalizedAuthority) {
      return {
        status: "failed",
        reason: EXCEPTION_CONSTANT.ZARINPAL_MISSING_AUTHORITY,
      };
    }

    const userProduct = await this.userProductModel
      .findOne({
        "purchase.paymentProvider": "ZARINPAL",
        "purchase.paymentReference": normalizedAuthority,
      })
      .exec();

    if (!userProduct) {
      return {
        status: "failed",
        reason: EXCEPTION_CONSTANT.ZARINPAL_PURCHASE_NOT_FOUND,
      };
    }

    const productId = userProduct.productId.toString();

    if (status !== "OK") {
      const previousStatus = userProduct.purchase.status;
      userProduct.purchase.status = UserProductPurchaseStatus.CANCELLED;
      userProduct.purchase.cancelledAt = new Date();
      await userProduct.save();
      await this.publishPaymentStatusChangeBadgeCountSignal({
        userProductId: userProduct._id,
        productId: userProduct.productId,
        previousStatus,
        nextStatus: UserProductPurchaseStatus.CANCELLED,
      });
      return { status: "cancelled", courseId: productId };
    }

    const amountIrt = userProduct.purchase.finalAmountIrt;

    try {
      const verification = (await this.zarinPalProxyService.isEnabled())
        ? await this.zarinPalProxyService.verifyPayment({
            authority: normalizedAuthority,
            amountIrt,
            status,
          })
        : await this.verifyZarinPalPaymentDirect(
            await this.resolveZarinPalConfig(),
            normalizedAuthority,
            amountIrt,
          );
      if (verification.status === "cancelled") {
        const previousStatus = userProduct.purchase.status;
        userProduct.purchase.status = UserProductPurchaseStatus.CANCELLED;
        userProduct.purchase.cancelledAt = new Date();
        await userProduct.save();
        await this.publishPaymentStatusChangeBadgeCountSignal({
          userProductId: userProduct._id,
          productId: userProduct.productId,
          previousStatus,
          nextStatus: UserProductPurchaseStatus.CANCELLED,
        });
        return { status: "cancelled", courseId: productId };
      }

      if (verification.status !== "success") {
        const previousStatus = userProduct.purchase.status;
        userProduct.purchase.status = UserProductPurchaseStatus.FAILED;
        userProduct.purchase.failedAt = new Date();
        await userProduct.save();
        await this.publishPaymentStatusChangeBadgeCountSignal({
          userProductId: userProduct._id,
          productId: userProduct.productId,
          previousStatus,
          nextStatus: UserProductPurchaseStatus.FAILED,
        });
        this.logger.warn(
          `ZarinPal verification failed for authority=${normalizedAuthority}: ${verification.message ?? "unknown"}`,
        );
        return {
          status: "failed",
          courseId: productId,
          reason: EXCEPTION_CONSTANT.ZARINPAL_VERIFICATION_FAILED,
        };
      }

      const previousStatus = userProduct.purchase.status;
      userProduct.purchase.status = UserProductPurchaseStatus.PAID;
      userProduct.purchase.paidAt = new Date();
      userProduct.purchase.transactionId = verification.refId;
      await userProduct.save();
      await this.publishPaymentStatusChangeBadgeCountSignal({
        userProductId: userProduct._id,
        productId: userProduct.productId,
        previousStatus,
        nextStatus: UserProductPurchaseStatus.PAID,
      });
      await this.notifyProductPurchaseStatusChanged(
        userProduct,
        previousStatus,
      );

      return {
        status: "success",
        courseId: productId,
        refId: verification.refId,
      };
    } catch (error) {
      this.logger.error(
        `ZarinPal verification error for authority=${normalizedAuthority}: ${this.extractZarinPalErrorMessage(error) || String(error)}`,
      );
      return {
        status: "failed",
        courseId: productId,
        reason: EXCEPTION_CONSTANT.ZARINPAL_VERIFICATION_ERROR,
      };
    }
  }

  async paymentDetail(
    input: ProductPaymentDetailGqlInput,
  ): Promise<ProductPaymentListGqlResponse> {
    const userProduct = await this.userProductModel.findById(input.id).exec();

    if (!userProduct) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PAYMENT_NOT_FOUND);
    }

    const relatedLookups = await this.buildProductPaymentRelatedLookups([
      userProduct.toObject() as ProductPaymentListRecord,
    ]);

    return this.toProductPaymentListResponse(userProduct, relatedLookups);
  }

  async listPayments(
    input: ProductPaymentListGqlInput,
  ): Promise<ProductPaymentListPaginatedOffsetGqlResponse> {
    const { filters, options } = input || {};
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_LIMIT;
    const skip = options?.skip ?? PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_SKIP;
    const filterQuery = this.buildPaymentListFilterQuery(filters);

    const [userProducts, total] = await Promise.all([
      this.userProductModel
        .aggregate<ProductPaymentListRecord>([
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
      this.userProductModel.countDocuments(filterQuery).exec(),
    ]);
    const relatedLookups =
      await this.buildProductPaymentFileLookup(userProducts);

    return {
      items: userProducts.map((userProduct) =>
        this.toProductPaymentListSummaryResponse(userProduct, relatedLookups),
      ),
      pagination: {
        limit,
        skip,
        total,
        count: userProducts.length,
      },
    };
  }

  async updatePaymentStatus(
    input: ProductPaymentStatusUpdateGqlInput,
    adminUserId: Types.ObjectId,
  ): Promise<ProductPaymentListGqlResponse> {
    const userProduct = await this.userProductModel.findById(input.id).exec();

    if (!userProduct) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PAYMENT_NOT_FOUND);
    }

    const previousStatus = userProduct.purchase.status;
    const now = new Date();
    userProduct.purchase.status = input.status;
    userProduct.purchase.isManualStatusChange = true;
    userProduct.purchase.statusChangedBy = PurchaseStatusChangedBy.ADMIN;
    userProduct.purchase.manualStatusChangedBy = adminUserId;
    userProduct.purchase.manualStatusChangedDescription =
      this.normalizeOptionalText(input.manualStatusChangedDescription) ??
      undefined;
    this.setPurchaseStatusTimestamp(userProduct, input.status, now);

    await userProduct.save();
    await this.publishPaymentStatusChangeBadgeCountSignal({
      userProductId: userProduct._id,
      productId: userProduct.productId,
      previousStatus,
      nextStatus: input.status,
    });
    await this.notifyProductPurchaseStatusChanged(userProduct, previousStatus, {
      changedByInvestigationTeam: true,
    });

    const relatedLookups = await this.buildProductPaymentRelatedLookups([
      userProduct.toObject() as ProductPaymentListRecord,
    ]);

    return this.toProductPaymentListResponse(userProduct, relatedLookups);
  }

  async createManualPayment(
    input: ProductPaymentManualCreateGqlInput,
    adminUserId: Types.ObjectId,
  ): Promise<ProductPaymentListGqlResponse> {
    this.validateManualPaymentInputShape(input);

    const [product, user, existingUserProduct] = await Promise.all([
      this.productModel
        .findOne({ _id: input.productId, isActive: true })
        .exec(),
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
      this.userProductModel
        .findOne({
          productId: input.productId,
          userId: input.userId,
        })
        .exec(),
    ]);

    if (!product) {
      throw new NotFoundException(
        EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND_OR_INACTIVE,
      );
    }

    if (this.isProductFree(product)) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.MANUAL_PAYMENT_PAID_PRODUCT_ONLY,
      );
    }

    if (!user) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.MANUAL_PAYMENT_END_USER_ONLY,
      );
    }

    if (
      existingUserProduct?.purchase.status === UserProductPurchaseStatus.PAID
    ) {
      throw new ConflictException(EXCEPTION_CONSTANT.USER_PRODUCT_ALREADY_PAID);
    }

    if (existingUserProduct) {
      throw new ConflictException(
        EXCEPTION_CONSTANT.USER_PRODUCT_PURCHASE_EXISTS,
      );
    }

    const priceSummary = await this.resolvePurchasePriceSummary(
      {
        productId: input.productId,
        couponCode: input.couponCode,
      },
      product,
      input.userId,
    );
    const manualPriceSummary =
      input.paymentMethod === UserProductPaymentMethod.FREE
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
    const userProduct = new this.userProductModel({
      userId: input.userId,
      productId: product._id,
      userSnapshot: this.toUserProductUserSnapshot(user),
      productSnapshot: {
        title: product.title,
        description: product.description,
        priceIrt: manualPriceSummary.amountIrt,
        discount: product.discount
          ? {
              type: product.discount.type,
              value: product.discount.value,
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
          input.paymentMethod === UserProductPaymentMethod.CRYPTOCURRENCY
            ? UserProductPurchaseCurrency.USDT
            : UserProductPurchaseCurrency.IRT,
        paymentMethod: input.paymentMethod,
        submittedInitiallyByAdmin: true,
        isManualStatusChange: false,
        uploadedReceiptFileId,
        receiptUploadedBy: uploadedReceiptFileId ? adminUserId : undefined,
        couponSnapshot: manualPriceSummary.couponSnapshot,
      },
      progress: { chapters: [] },
    });

    this.setPurchaseStatusTimestamp(userProduct, input.status, now);
    await userProduct.save();

    await this.publishPaymentBadgeCountSignal({
      userProductId: userProduct._id,
      productId: product._id,
      action: BadgeCountTriggerAction.CREATED,
      includeStaffUsersWhenPendingPaymentsExist: true,
      nextStatus: input.status,
    });

    const relatedLookups = await this.buildProductPaymentRelatedLookups([
      userProduct.toObject() as ProductPaymentListRecord,
    ]);

    return this.toProductPaymentListResponse(userProduct, relatedLookups);
  }

  async detail(input: ProductDetailGqlInput): Promise<ProductListGqlResponse> {
    const product = await this.productModel.findById(input.id).exec();
    if (!product) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND);
    }

    const fileTypeLookup = await this.buildFileTypeLookup([product]);
    const fileAccessUrlMap = await this.buildFileAccessUrlLookup([product]);

    return this.toListResponse(product, fileTypeLookup, fileAccessUrlMap);
  }

  async list(
    input: ProductListGqlInput,
  ): Promise<ProductListPaginatedCursorGqlResponse> {
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
    const sortFieldMap: Record<ProductListSortField, string> = {
      createdAt: "audit.createdAt",
      updatedAt: "audit.updatedAt",
      title: "title",
      priceIrt: "priceIrt",
      isActive: "isActive",
      sortOrder: "sortOrder",
    };
    const requestedSort = options?.sort ?? { createdAt: SortingOrder.DESC };
    const cursorSort = this.resolveProductCursorSort(requestedSort);
    const sortOptions = {
      ...buildSortOptions<ProductListSortField>(requestedSort, sortFieldMap),
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

    const [productsWithExtra, total] = await Promise.all([
      this.productModel
        .find(filterQuery)
        .sort(sortOptions)
        .limit(limit + 1)
        .exec(),
      this.productModel.countDocuments(baseFilterQuery).exec(),
    ]);
    const hasNextPage = productsWithExtra.length > limit;
    const products = productsWithExtra.slice(0, limit);

    const fileTypeLookup = await this.buildFileTypeLookup(products);
    const fileAccessUrlMap = await this.buildFileAccessUrlLookup(products);
    const firstProduct = products[0];
    const lastProduct = products[products.length - 1];

    return {
      items: products.map((product) =>
        this.toListSummaryResponse(product, fileTypeLookup, fileAccessUrlMap),
      ),
      pagination: {
        limit,
        total,
        count: products.length,
        startCursor: firstProduct?._id.toString(),
        endCursor: lastProduct?._id.toString(),
        hasNextPage,
        hasPreviousPage: Boolean(options?.startCursor),
      },
    };
  }

  async listForUser(
    input: ProductListGqlInput,
    userId?: Types.ObjectId,
  ): Promise<UserProductListPaginatedCursorGqlResponse> {
    const { filters, options } = input || {};
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.CURSOR_BASED.DEFAULT_LIMIT;
    const baseFilterQuery = await this.applyUserProductPurchaseFilter(
      await this.buildListFilterQuery({
        ...(filters ?? {}),
        isActive: true,
      }),
      filters?.isPurchased,
      userId,
    );
    const sortFieldMap: Record<ProductListSortField, string> = {
      createdAt: "audit.createdAt",
      updatedAt: "audit.updatedAt",
      title: "title",
      priceIrt: "priceIrt",
      isActive: "isActive",
      sortOrder: "sortOrder",
    };
    const requestedSort = options?.sort ?? { createdAt: SortingOrder.DESC };
    const cursorSort = this.resolveProductCursorSort(requestedSort);
    const sortOptions = {
      ...buildSortOptions<ProductListSortField>(requestedSort, sortFieldMap),
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

    const [productsWithExtra, total] = await Promise.all([
      this.productModel
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
      this.productModel.countDocuments(baseFilterQuery).exec(),
    ]);
    const hasNextPage = productsWithExtra.length > limit;
    const products = productsWithExtra.slice(0, limit);
    const [fileTypeLookup, userProductLookup] = await Promise.all([
      this.buildFileTypeLookup(products),
      this.buildUserProductLookup(userId, products),
    ]);
    const fileAccessUrlMap = await this.buildFileAccessUrlLookup(products);
    const firstProduct = products[0];
    const lastProduct = products[products.length - 1];

    return {
      items: products.map((product) =>
        this.toUserListResponse(
          product,
          fileTypeLookup,
          userProductLookup.get(product._id.toString()),
          fileAccessUrlMap,
        ),
      ),
      pagination: {
        limit,
        total,
        count: products.length,
        startCursor: firstProduct?._id.toString(),
        endCursor: lastProduct?._id.toString(),
        hasNextPage,
        hasPreviousPage: Boolean(options?.startCursor),
      },
    };
  }

  async detailForUser(
    input: UserProductDetailGqlInput,
    userId?: Types.ObjectId,
  ): Promise<UserProductDetailGqlResponse> {
    const product = await this.productModel
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
    if (!product) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND);
    }

    const [fileTypeLookup, userProductLookup] = await Promise.all([
      this.buildFileTypeLookup([product]),
      this.buildUserProductLookup(userId, [product]),
    ]);
    const fileAccessUrlMap = await this.buildFileAccessUrlLookup([product]);
    const userProduct = userProductLookup.get(product._id.toString());

    return this.toUserDetailResponse(
      product,
      fileTypeLookup,
      userProduct,
      fileAccessUrlMap,
    );
  }

  async completeChapter(
    input: ProductChapterCompleteGqlInput,
    userId: Types.ObjectId,
  ): Promise<ProductChapterCompleteGqlResponse> {
    const product = await this.productModel
      .findOne({ _id: input.productId, isActive: true })
      .select({ chapters: 1, priceIrt: 1, discount: 1 })
      .exec();
    if (!product) {
      throw new NotFoundException(EXCEPTION_CONSTANT.PRODUCT_NOT_FOUND);
    }

    const userProduct = await this.userProductModel
      .findOne({
        userId,
        productId: input.productId,
      })
      .exec();
    if (!userProduct) {
      throw new NotFoundException(
        EXCEPTION_CONSTANT.PRODUCT_ENROLLMENT_NOT_FOUND,
      );
    }

    if (userProduct.purchase.status !== UserProductPurchaseStatus.PAID) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.CHAPTER_COMPLETION_REQUIRES_PURCHASE,
      );
    }

    const chapters = this.sortChaptersForDisplay(
      ((product.toObject?.() || product) as PlainProduct).chapters || [],
    );
    const chapter = chapters.find(
      (entry) => entry.key === input.chapterKey.trim(),
    );
    if (!chapter) {
      throw new NotFoundException(EXCEPTION_CONSTANT.CHAPTER_NOT_FOUND);
    }

    const isProductFree = this.isProductFree(
      (product.toObject?.() || product) as PlainProduct,
    );
    const chapterAccessContext = {
      isProductFree,
      isPurchased: true,
      paidAt: userProduct.purchase.paidAt,
    };
    if (!canAccessChapter(chapter, chapterAccessContext)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.CHAPTER_LOCKED);
    }

    const existingProgress = (userProduct.progress?.chapters || []).find(
      (entry) => entry.key === chapter.key,
    );
    const progressCounts = this.calculateChapterProgressCounts(
      chapters,
      chapterAccessContext,
      userProduct.progress?.chapters || [],
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
    const updateResult = await this.userProductModel
      .updateOne(
        {
          _id: userProduct._id,
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
      const latestUserProduct = await this.userProductModel
        .findById(userProduct._id)
        .select({ progress: 1 })
        .lean<{ progress?: UserProduct["progress"] }>()
        .exec();
      const latestProgress = (latestUserProduct?.progress?.chapters || []).find(
        (entry) => entry.key === chapter.key,
      );
      if (!latestProgress) {
        throw new ConflictException(
          EXCEPTION_CONSTANT.CHAPTER_COMPLETION_FAILED,
        );
      }

      const latestCounts = this.calculateChapterProgressCounts(
        chapters,
        chapterAccessContext,
        latestUserProduct?.progress?.chapters || [],
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
    chapters: ProductChapter[],
    chapterAccessContext: {
      isProductFree: boolean;
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

  private resolveProductCursorSort(sort?: ProductListSortOptionInput): {
    field: ProductListSortField;
    path: string;
    direction: 1 | -1;
  } {
    const sortFieldMap: Record<ProductListSortField, string> = {
      createdAt: "audit.createdAt",
      updatedAt: "audit.updatedAt",
      title: "title",
      priceIrt: "priceIrt",
      isActive: "isActive",
      sortOrder: "sortOrder",
    };
    const sortEntries = Object.entries(sort ?? {}) as Array<
      [ProductListSortField, SortingOrder | undefined]
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
  ): Promise<FilterQuery<Product> | null> {
    if (!startCursor) {
      return null;
    }

    if (!Types.ObjectId.isValid(startCursor)) {
      return null;
    }

    const cursorId = new Types.ObjectId(startCursor);
    const cursorProduct = await this.productModel
      .findById(cursorId)
      .lean<{ _id: Types.ObjectId; sortOrder?: number | null }>()
      .exec();
    if (!cursorProduct) {
      return null;
    }

    const operator = direction === 1 ? "$gt" : "$lt";
    if (sortPath === "sortOrder") {
      const rawSortOrder =
        "sortOrder" in cursorProduct ? cursorProduct.sortOrder : undefined;
      return this.buildSortOrderCursorFilter(cursorId, rawSortOrder, direction);
    }

    const cursorValue = this.getProductValueByPath(cursorProduct, sortPath);

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
  ): FilterQuery<Product> {
    const missingSortOrder: FilterQuery<Product> = {
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

  private getProductValueByPath(
    product: { get?: (path: string) => unknown } | Record<string, unknown>,
    path: string,
  ): unknown {
    let value: unknown;
    if (
      typeof (product as { get?: (path: string) => unknown }).get === "function"
    ) {
      value = (product as { get: (path: string) => unknown }).get(path);
    } else {
      value = path.split(".").reduce<unknown>((current, key) => {
        if (current && typeof current === "object" && key in current) {
          return (current as Record<string, unknown>)[key];
        }
        return undefined;
      }, product);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }

    return value ?? null;
  }

  private async publishProductBadgeCountSignal(
    action: BadgeCountTriggerAction,
    productId: Types.ObjectId,
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
        source: BadgeCountTriggerSource.PRODUCT,
        action,
        productId: productId.toString(),
      },
    });
  }

  private async publishPaymentBadgeCountSignal(params: {
    userProductId: Types.ObjectId;
    productId: Types.ObjectId;
    action: BadgeCountTriggerAction;
    includeStaffUsers?: boolean;
    includeStaffUsersWhenPendingPaymentsExist?: boolean;
    previousStatus?: UserProductPurchaseStatus;
    nextStatus?: UserProductPurchaseStatus;
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
        productId: params.productId.toString(),
        userProductId: params.userProductId.toString(),
      },
    });
  }

  private async publishPaymentStatusChangeBadgeCountSignal(params: {
    userProductId: Types.ObjectId;
    productId: Types.ObjectId;
    previousStatus: UserProductPurchaseStatus;
    nextStatus: UserProductPurchaseStatus;
  }): Promise<void> {
    if (params.previousStatus === params.nextStatus) {
      return;
    }

    await this.publishPaymentBadgeCountSignal({
      userProductId: params.userProductId,
      productId: params.productId,
      action: BadgeCountTriggerAction.UPDATED,
      includeStaffUsersWhenPendingPaymentsExist: true,
      previousStatus: params.previousStatus,
      nextStatus: params.nextStatus,
    });
  }

  private async shouldPublishStaffPaymentBadgeCountSignal(
    previousStatus?: UserProductPurchaseStatus,
    nextStatus?: UserProductPurchaseStatus,
  ): Promise<boolean> {
    if (nextStatus === UserProductPurchaseStatus.PENDING) {
      return true;
    }

    if (await this.hasAnyPendingPayments()) {
      return true;
    }

    return previousStatus === UserProductPurchaseStatus.PENDING;
  }

  private async hasAnyPendingPayments(): Promise<boolean> {
    const pendingPurchase = await this.userProductModel
      .findOne({ "purchase.status": UserProductPurchaseStatus.PENDING })
      .select({ _id: 1 })
      .lean<{ _id: Types.ObjectId }>()
      .exec();

    return pendingPurchase != null;
  }

  private failProductValidation(
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

  private validateCreateInput(input: ProductCreateGqlInput): void {
    if (!input.title?.trim()) {
      this.failProductValidation(
        EXCEPTION_CONSTANT.PRODUCT_VALIDATION_TITLE_REQUIRED,
      );
    }

    if (input.priceIrt != null && input.priceIrt < 0) {
      this.failProductValidation(
        EXCEPTION_CONSTANT.PRODUCT_VALIDATION_PRICE_NEGATIVE,
      );
    }

    if (input.discount) {
      const priceIrt = input.priceIrt ?? 0;
      if (priceIrt > 0) {
        if (input.discount.value <= 0) {
          this.failProductValidation(
            EXCEPTION_CONSTANT.PRODUCT_VALIDATION_DISCOUNT_POSITIVE,
          );
        }
        if (
          input.discount.type === ProductDiscountType.PERCENTAGE &&
          input.discount.value > 100
        ) {
          this.failProductValidation(
            EXCEPTION_CONSTANT.PRODUCT_VALIDATION_DISCOUNT_PERCENTAGE_RANGE,
          );
        }
        if (
          input.discount.type === ProductDiscountType.FIXED_AMOUNT_IRT &&
          input.discount.value > priceIrt
        ) {
          this.failProductValidation(
            EXCEPTION_CONSTANT.PRODUCT_VALIDATION_DISCOUNT_FIXED_TOO_HIGH,
          );
        }
      }
    }

    if (!input.chapters?.length) {
      this.failProductValidation(EXCEPTION_CONSTANT.PRODUCT_CHAPTER_REQUIRED);
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
        this.failProductValidation(
          EXCEPTION_CONSTANT.PRODUCT_VALIDATION_CHAPTER_TITLE_REQUIRED,
          { chapterLabel },
        );
      }

      if (
        chapter.visibleAfterMinutes != null &&
        chapter.visibleAfterMinutes < 0
      ) {
        this.failProductValidation(
          EXCEPTION_CONSTANT.PRODUCT_VALIDATION_VISIBLE_AFTER_NEGATIVE,
          { chapterLabel },
        );
      }

      if (!chapter.items?.length) {
        this.failProductValidation(
          EXCEPTION_CONSTANT.PRODUCT_CHAPTER_ITEM_REQUIRED,
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
          this.failProductValidation(
            EXCEPTION_CONSTANT.PRODUCT_VALIDATION_CHAPTER_TITLE_REQUIRED,
            { chapterLabel: itemLabel },
          );
        }

        const hasFile = Boolean(item.fileId);
        const hasArticle = hasRichTextContent(item.article);

        if (hasFile && hasArticle) {
          this.failProductValidation(
            EXCEPTION_CONSTANT.PRODUCT_ITEM_FILE_AND_ARTICLE_BOTH,
            { itemLabel },
          );
        }

        if (!hasFile && !hasArticle) {
          this.failProductValidation(
            EXCEPTION_CONSTANT.PRODUCT_ITEM_CONTENT_REQUIRED,
            { itemLabel },
          );
        }
      }
    }
  }

  private normalizeCreateInput(
    input: ProductCreateGqlInput,
  ): ProductCreateGqlInput {
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

  private async getNextProductSortOrder(): Promise<number> {
    const lastProductBySortOrder = await this.productModel
      .findOne({ sortOrder: { $type: "number" } })
      .sort({ sortOrder: -1, _id: -1 })
      .select({ sortOrder: 1 })
      .lean<{ sortOrder?: number }>()
      .exec();

    return (lastProductBySortOrder?.sortOrder ?? 0) + 1;
  }

  private normalizeCreateChapterInput(
    chapter: ProductChapterGqlInput,
  ): ProductChapterGqlInput {
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
    item: ProductItemGqlInput,
  ): ProductItemGqlInput {
    return {
      title: item.title.trim(),
      sortOrder: item.sortOrder,
      fileId: item.fileId === null ? null : item.fileId,
      article: this.normalizeNullableText(item.article),
    };
  }

  private normalizeDiscountInput(
    discount?: ProductDiscountGqlInput | null,
  ): ProductDiscountGqlInput | null | undefined {
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
    input: ProductCreateGqlInput,
  ): Promise<void> {
    const fileIds = this.collectReferencedFileIds(input);
    if (fileIds.length === 0) {
      return;
    }

    const existingFileIds = await this.storedFileModel
      .distinct("_id", { _id: { $in: fileIds } })
      .exec();

    if (existingFileIds.length !== fileIds.length) {
      throw new NotFoundException(
        EXCEPTION_CONSTANT.PRODUCT_REFERENCED_FILE_NOT_FOUND,
      );
    }
  }

  private collectReferencedFileIds(
    input: ProductFileReferenceSource,
  ): Types.ObjectId[] {
    const fileIds = [
      input.coverImageFileId,
      ...input.chapters.flatMap((chapter) =>
        chapter.items.map((item) => item.fileId),
      ),
    ].filter((fileId): fileId is Types.ObjectId => Boolean(fileId));

    return this.collectUniqueFileIds(fileIds);
  }

  private async collectProductDeleteDependencyCounts(
    productId: Types.ObjectId,
    product: ProductDocument,
  ): Promise<ProductDeleteDependencyCounts> {
    const productIdString = productId.toString();
    const attachedFileIds = this.collectReferencedFileIds(product);
    const [
      enrollmentStatusRows,
      reviewAggregation,
      couponTotal,
      couponSamples,
      notificationTotal,
      notificationSourceRows,
      deletableFileIds,
    ] = await Promise.all([
      this.userProductModel
        .aggregate<{
          _id: UserProductPurchaseStatus;
          count: number;
        }>([
          { $match: { productId } },
          { $group: { _id: "$purchase.status", count: { $sum: 1 } } },
        ])
        .exec(),
      this.productReviewModel
        .aggregate<{
          reviewTotal: number;
          reviewRatingCount: number;
          reviewMessageCount: number;
        }>([
          { $match: { productId } },
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
      this.couponModel
        .countDocuments({ applicableProductIds: productId })
        .exec(),
      this.couponModel
        .find({ applicableProductIds: productId })
        .sort({ isActive: -1, code: 1 })
        .limit(PRODUCT_DELETE_DEPENDENCY_SAMPLE_LIMIT)
        .select({ code: 1, title: 1, isActive: 1 })
        .lean()
        .exec(),
      this.notificationModel
        .countDocuments({ "payload.productId": productIdString })
        .exec(),
      this.notificationModel
        .aggregate<{
          _id: NotificationSource;
          count: number;
        }>([
          { $match: { "payload.productId": productIdString } },
          { $group: { _id: "$source", count: { $sum: 1 } } },
        ])
        .exec(),
      this.findDeletableProductFileIds(productId, attachedFileIds),
    ]);

    const enrollmentsByStatus = new Map<UserProductPurchaseStatus, number>();
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

  private buildProductDeleteDependencyGroups(
    counts: ProductDeleteDependencyCounts,
  ): ProductDeleteDependencyGroupGqlResponse[] {
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

    const groups: ProductDeleteDependencyGroupGqlResponse[] = [
      {
        key: "enrollments",
        impact: ProductDeleteDependencyImpact.RETAINED,
        totalCount: enrollmentTotal,
        breakdown: enrollmentBreakdown,
        samples: [],
        hiddenSampleCount: 0,
      },
      {
        key: "reviews",
        impact: ProductDeleteDependencyImpact.RETAINED,
        totalCount: counts.reviewTotal,
        breakdown: reviewBreakdown,
        samples: [],
        hiddenSampleCount: 0,
      },
      {
        key: "coupons",
        impact: ProductDeleteDependencyImpact.RETAINED,
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
        impact: ProductDeleteDependencyImpact.REMOVED,
        totalCount: counts.notificationTotal,
        breakdown: notificationBreakdown,
        samples: [],
        hiddenSampleCount: 0,
      },
      {
        key: "files",
        impact: ProductDeleteDependencyImpact.REMOVED,
        totalCount: counts.deletableFileCount,
        breakdown: fileBreakdown,
        samples: [],
        hiddenSampleCount: 0,
      },
    ];

    return groups.filter((group) => group.totalCount > 0);
  }

  private buildPurchaseStatusBreakdown(
    enrollmentsByStatus: Map<UserProductPurchaseStatus, number>,
  ): ProductDeleteDependencyBreakdownGqlResponse[] {
    const orderedStatuses: UserProductPurchaseStatus[] = [
      UserProductPurchaseStatus.PAID,
      UserProductPurchaseStatus.PENDING,
      UserProductPurchaseStatus.PENDING_GATEWAY,
      UserProductPurchaseStatus.FAILED,
      UserProductPurchaseStatus.REFUNDED,
      UserProductPurchaseStatus.CANCELLED,
    ];

    return orderedStatuses
      .map((status) => ({
        key: status,
        count: enrollmentsByStatus.get(status) ?? 0,
      }))
      .filter((item) => item.count > 0);
  }

  private async findDeletableProductFileIds(
    productId: Types.ObjectId,
    attachedFileIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]> {
    if (attachedFileIds.length === 0) {
      return [];
    }

    const fileIdsStillUsedElsewhere =
      await this.findProductReferencedFileIdsOutsideProduct(
        productId,
        attachedFileIds,
      );
    const fileIdsStillUsedElsewhereSet = new Set(
      fileIdsStillUsedElsewhere.map((fileId) => fileId.toString()),
    );

    return attachedFileIds.filter(
      (fileId) => !fileIdsStillUsedElsewhereSet.has(fileId.toString()),
    );
  }

  private async deleteProductRelatedNotifications(
    productId: Types.ObjectId,
  ): Promise<void> {
    await this.notificationModel.deleteMany({
      "payload.productId": productId.toString(),
    });
  }

  private async deleteDetachedFiles(
    productId: Types.ObjectId,
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
      await this.findProductReferencedFileIdsOutsideProduct(
        productId,
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

  private async findProductReferencedFileIdsOutsideProduct(
    productId: Types.ObjectId,
    fileIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]> {
    const products = await this.productModel
      .find({
        _id: { $ne: productId },
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
      products.flatMap((product) => this.collectReferencedFileIds(product)),
    );
  }

  private collectUniqueFileIds(fileIds: Types.ObjectId[]): Types.ObjectId[] {
    return Array.from(
      new Map(fileIds.map((fileId) => [fileId.toString(), fileId])).values(),
    );
  }

  private async buildListFilterQuery(
    filters?: ProductListGqlInput["filters"],
  ): Promise<FilterQuery<Product>> {
    const query: FilterQuery<Product> = {};

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
      if (filters.hasPrice) {
        query.priceIrt = { ...(query.priceIrt as object), $gt: 0 };
      } else {
        this.addAndCondition(query, {
          $or: [
            { priceIrt: { $exists: false } },
            { priceIrt: null },
            { priceIrt: { $lte: 0 } },
          ],
        });
      }
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
    releaseType: ProductReleaseType,
  ): FilterQuery<Product> {
    const gradualChapterFilter = {
      chapters: {
        $elemMatch: {
          visibleAfterMinutes: { $type: "number" },
        },
      },
    };

    if (releaseType === ProductReleaseType.GRADUAL) {
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
    itemType: ProductItemType,
  ): Promise<FilterQuery<Product>> {
    if (itemType === ProductItemType.ARTICLE) {
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
    itemType: Exclude<ProductItemType, ProductItemType.ARTICLE>,
  ): Promise<Types.ObjectId[]> {
    const mimeTypePrefixByItemType: Record<
      Exclude<ProductItemType, ProductItemType.ARTICLE>,
      string
    > = {
      [ProductItemType.VIDEO]: "video/",
      [ProductItemType.VOICE]: "audio/",
      [ProductItemType.IMAGE]: "image/",
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
    products: ProductDocument[],
  ): Promise<FileTypeLookup> {
    const fileIds = Array.from(
      new Set(
        products.flatMap((product) =>
          (product.chapters || []).flatMap((chapter) =>
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
    products: ProductDocument[],
  ): Promise<Map<string, FileAccessUrlDescriptor>> {
    const fileIds = products.flatMap((product) => {
      const productObj = (product.toObject?.() ||
        product) as ProductFileReferenceSource;
      const ids: Array<Types.ObjectId | undefined> = [
        productObj.coverImageFileId,
      ];

      for (const chapter of productObj.chapters || []) {
        for (const item of chapter.items || []) {
          ids.push(item.fileId);
        }
      }

      return ids;
    });

    return this.fileService.getAccessUrlMap(fileIds);
  }

  private toListSummaryResponse(
    product: ProductDocument,
    fileTypeLookup: FileTypeLookup,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): ProductListSummaryGqlResponse {
    const productObj = (product.toObject?.() || product) as PlainProduct;
    const chapters = productObj.chapters || [];
    const itemTypes = Array.from(
      new Set(
        chapters.flatMap((chapter) =>
          (chapter.items || []).map((item) =>
            this.resolveItemType(item, fileTypeLookup),
          ),
        ),
      ),
    );
    const coverImageFileId = productObj.coverImageFileId;

    return {
      id: product._id,
      title: productObj.title,
      description: productObj.description,
      coverImageAccessUrl: coverImageFileId
        ? fileAccessUrlMap?.get(coverImageFileId.toString())
        : undefined,
      priceIrt: productObj.priceIrt,
      discount: productObj.discount,
      isActive: productObj.isActive,
      sortOrder: productObj.sortOrder,
      tags: productObj.tags || [],
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
    product: ProductDocument,
    fileTypeLookup: FileTypeLookup,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): ProductListGqlResponse {
    const productObj = (product.toObject?.() || product) as PlainProduct;
    const coverImageFileId = productObj.coverImageFileId;

    return {
      id: product._id,
      title: productObj.title,
      description: productObj.description,
      coverImageAccessUrl: coverImageFileId
        ? fileAccessUrlMap?.get(coverImageFileId.toString())
        : undefined,
      priceIrt: productObj.priceIrt,
      discount: productObj.discount,
      isActive: productObj.isActive,
      isReviewSubmissionEnabled: productObj.isReviewSubmissionEnabled !== false,
      isReviewsSectionVisible: productObj.isReviewsSectionVisible !== false,
      sortOrder: productObj.sortOrder,
      tags: productObj.tags || [],
      releaseType: this.calculateReleaseType(productObj.chapters || []),
      chapters: (productObj.chapters || []).map((chapter) =>
        this.toChapterResponse(chapter, fileTypeLookup, fileAccessUrlMap),
      ),
      createdAt: productObj.audit?.createdAt,
      updatedAt: productObj.audit?.updatedAt,
    };
  }

  private toChapterResponse(
    chapter: ProductChapter,
    fileTypeLookup: FileTypeLookup,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): ProductListChapterGqlResponse {
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
    item: ProductItem,
    fileTypeLookup: FileTypeLookup,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): ProductListItemGqlResponse {
    const fileId = item.fileId;

    return {
      title: item.title,
      sortOrder: item.sortOrder,
      fileAccessUrl: fileId
        ? fileAccessUrlMap?.get(fileId.toString())
        : undefined,
      article: item.article,
      type: fileId
        ? (fileTypeLookup.get(fileId.toString()) ?? ProductItemType.ARTICLE)
        : ProductItemType.ARTICLE,
    };
  }

  private calculateReleaseType(chapters: ProductChapter[]): ProductReleaseType {
    return chapters.some(
      (chapter) => typeof chapter.visibleAfterMinutes === "number",
    )
      ? ProductReleaseType.GRADUAL
      : ProductReleaseType.IMMEDIATE;
  }

  private async applyIncludeUserIdFilter(
    filterQuery: FilterQuery<Product>,
    includeUserId?: string,
  ): Promise<FilterQuery<Product>> {
    if (!includeUserId?.trim()) {
      return filterQuery;
    }

    if (!Types.ObjectId.isValid(includeUserId)) {
      return filterQuery;
    }

    const paidProductIds = await this.userProductModel
      .find({
        userId: new Types.ObjectId(includeUserId),
        "purchase.status": UserProductPurchaseStatus.PAID,
      })
      .select({ productId: 1 })
      .lean<Array<{ productId: Types.ObjectId }>>()
      .exec();

    const purchasedProductObjectIds = paidProductIds.map(
      (entry) => entry.productId,
    );

    return {
      $and: [filterQuery, { _id: { $nin: purchasedProductObjectIds } }],
    };
  }

  private async applyUserProductPurchaseFilter(
    filterQuery: FilterQuery<Product>,
    isPurchased: boolean | undefined,
    userId?: Types.ObjectId,
  ): Promise<FilterQuery<Product>> {
    if (typeof isPurchased !== "boolean") {
      return filterQuery;
    }

    if (!userId) {
      return isPurchased
        ? { $and: [filterQuery, { _id: { $in: [] } }] }
        : filterQuery;
    }

    const paidProductIds = await this.userProductModel
      .find({
        userId,
        "purchase.status": UserProductPurchaseStatus.PAID,
      })
      .select({ productId: 1 })
      .lean<Array<{ productId: Types.ObjectId }>>()
      .exec();

    const purchasedProductObjectIds = paidProductIds.map(
      (entry) => entry.productId,
    );

    return {
      $and: [
        filterQuery,
        isPurchased
          ? { _id: { $in: purchasedProductObjectIds } }
          : { _id: { $nin: purchasedProductObjectIds } },
      ],
    };
  }

  private async buildUserProductLookup(
    userId: Types.ObjectId | undefined,
    products: ProductDocument[],
  ): Promise<Map<string, UserProductListRecord>> {
    if (!userId || products.length === 0) {
      return new Map();
    }

    const userProducts = await this.userProductModel
      .find({
        userId,
        productId: { $in: products.map((product) => product._id) },
      })
      .select({
        productId: 1,
        purchase: 1,
        progress: 1,
      })
      .lean<UserProductListRecord[]>()
      .exec();

    return new Map(
      userProducts.map((userProduct) => [
        userProduct.productId.toString(),
        userProduct,
      ]),
    );
  }

  private toUserListResponse(
    product: ProductDocument,
    fileTypeLookup: FileTypeLookup,
    userProduct?: UserProductListRecord,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): UserProductListGqlResponse {
    const productObj = (product.toObject?.() || product) as PlainProduct;
    const chapters = productObj.chapters || [];
    const itemTypes = Array.from(
      new Set(
        chapters.flatMap((chapter) =>
          (chapter.items || []).map((item) =>
            this.resolveItemType(item, fileTypeLookup),
          ),
        ),
      ),
    );
    const coverImageFileId = productObj.coverImageFileId;

    return {
      id: product._id,
      title: productObj.title,
      description: productObj.description,
      coverImageAccessUrl: coverImageFileId
        ? fileAccessUrlMap?.get(coverImageFileId.toString())
        : undefined,
      priceIrt: productObj.priceIrt,
      discount: productObj.discount,
      tags: productObj.tags || [],
      releaseType: this.calculateReleaseType(chapters),
      chapterCount: chapters.length,
      itemCount: chapters.reduce(
        (sum, chapter) => sum + (chapter.items || []).length,
        0,
      ),
      itemTypes,
      isPurchased:
        userProduct?.purchase?.status === UserProductPurchaseStatus.PAID,
    };
  }

  private toUserDetailResponse(
    product: ProductDocument,
    fileTypeLookup: FileTypeLookup,
    userProduct?: UserProductListRecord,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): UserProductDetailGqlResponse {
    const productObj = (product.toObject?.() || product) as PlainProduct;
    const chapters = this.sortChaptersForDisplay(productObj.chapters || []);
    const isFree = this.isProductFree(productObj);
    const purchaseStatus = userProduct?.purchase?.status;
    const isPurchased = purchaseStatus === UserProductPurchaseStatus.PAID;
    const paidAt = userProduct?.purchase?.paidAt;
    const chapterAccessContext = {
      isProductFree: isFree,
      isPurchased,
      paidAt,
    };
    const completedChapters = userProduct?.progress?.chapters || [];
    const progressCounts = this.calculateChapterProgressCounts(
      chapters,
      chapterAccessContext,
      completedChapters,
    );
    const coverImageFileId = productObj.coverImageFileId;

    return {
      id: product._id,
      title: productObj.title,
      description: productObj.description,
      coverImageAccessUrl: coverImageFileId
        ? fileAccessUrlMap?.get(coverImageFileId.toString())
        : undefined,
      priceIrt: productObj.priceIrt,
      discount: productObj.discount,
      tags: productObj.tags || [],
      releaseType: this.calculateReleaseType(chapters),
      isFree,
      isPurchased,
      purchaseStatus,
      completedChapterCount: progressCounts.completedChapterCount,
      accessibleChapterCount: progressCounts.accessibleChapterCount,
      isReviewSubmissionEnabled: productObj.isReviewSubmissionEnabled !== false,
      isReviewsSectionVisible: productObj.isReviewsSectionVisible !== false,
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
    chapter: ProductChapter,
    fileTypeLookup: FileTypeLookup,
    chapterAccessContext: {
      isProductFree: boolean;
      isPurchased: boolean;
      paidAt?: Date;
    },
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
    userCompletedAt?: Date,
  ): UserProductDetailChapterGqlResponse {
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
    item: ProductItem,
    fileTypeLookup: FileTypeLookup,
    fileAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): UserProductDetailItemGqlResponse {
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

  private isProductFree(product: Product): boolean {
    const price = product.priceIrt ?? 0;
    if (price <= 0) {
      return true;
    }

    const discount = product.discount;
    if (!discount || discount.value <= 0) {
      return false;
    }

    if (discount.type === ProductDiscountType.PERCENTAGE) {
      return discount.value >= 100;
    }

    return discount.value >= price;
  }

  private validatePurchaseInputShape(
    input: ProductPurchaseSubmitGqlInput,
  ): void {
    if (!Types.ObjectId.isValid(input.productId)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.PRODUCT_ID_INVALID);
    }

    if (
      ![
        UserProductPaymentMethod.GATEWAY,
        UserProductPaymentMethod.CARD_TO_CARD,
        UserProductPaymentMethod.CRYPTOCURRENCY,
        UserProductPaymentMethod.FREE,
      ].includes(input.paymentMethod)
    ) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PAYMENT_METHOD_NOT_SUPPORTED,
      );
    }

    if (input.paymentMethod === UserProductPaymentMethod.CARD_TO_CARD) {
      const hasPaymentReference = Boolean(
        this.normalizeOptionalText(input.paymentReference),
      );
      const hasReceiptFile =
        Boolean(input.uploadedReceiptFileId) &&
        Types.ObjectId.isValid(input.uploadedReceiptFileId);

      if (!hasPaymentReference && !hasReceiptFile) {
        throw new BadRequestException(
          EXCEPTION_CONSTANT.CARD_TO_CARD_EVIDENCE_REQUIRED,
        );
      }
    }

    if (
      input.paymentMethod === UserProductPaymentMethod.CRYPTOCURRENCY &&
      !this.normalizeOptionalText(input.transactionId)
    ) {
      throw new BadRequestException(EXCEPTION_CONSTANT.TRANSACTION_ID_REQUIRED);
    }

    if (input.paymentMethod === UserProductPaymentMethod.FREE) {
      if (
        this.normalizeOptionalText(input.paymentReference) ||
        this.normalizeOptionalText(input.transactionId) ||
        input.uploadedReceiptFileId
      ) {
        throw new BadRequestException(
          EXCEPTION_CONSTANT.FREE_PURCHASE_NO_EVIDENCE,
        );
      }
    }

    if (input.paymentMethod === UserProductPaymentMethod.GATEWAY) {
      if (
        this.normalizeOptionalText(input.paymentReference) ||
        this.normalizeOptionalText(input.transactionId) ||
        input.uploadedReceiptFileId
      ) {
        throw new BadRequestException(
          EXCEPTION_CONSTANT.GATEWAY_PURCHASE_NO_EVIDENCE,
        );
      }
    }
  }

  private validateManualPaymentInputShape(
    input: ProductPaymentManualCreateGqlInput,
  ): void {
    if (!Types.ObjectId.isValid(input.userId)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.USER_ID_INVALID);
    }

    if (!Types.ObjectId.isValid(input.productId)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.PRODUCT_ID_INVALID);
    }

    if (
      !Object.values(UserProductPaymentMethod).includes(input.paymentMethod)
    ) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PAYMENT_METHOD_NOT_SUPPORTED,
      );
    }

    if (!Object.values(UserProductPurchaseStatus).includes(input.status)) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PURCHASE_STATUS_NOT_SUPPORTED,
      );
    }
  }

  private async requestZarinPalPayment(
    product: ProductDocument,
    user: UserDocument,
    finalAmountIrt: number,
  ): Promise<{ authority: string; paymentUrl: string }> {
    const callbackUrl = `${this.resolveAppUrlForZarinPalCallback()}/payment/zarinpal/callback?courseId=${product._id.toString()}`;
    const description = `Demo purchase: ${product.title}`;
    const metadata = this.buildZarinPalMetadata(product, user);

    if (await this.zarinPalProxyService.isEnabled()) {
      return this.zarinPalProxyService.requestPayment({
        amountIrt: finalAmountIrt,
        callbackUrl,
        description,
        metadata,
      });
    }

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
          callback_url: callbackUrl,
          description,
          metadata: {
            email: metadata.email || undefined,
            mobile: metadata.mobile || undefined,
          },
        },
        {
          headers: { accept: "application/json" },
          timeout: 15000,
        },
      ));
    } catch (error) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.ZARINPAL_CONNECTION_FAILED,
      );
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

  private async verifyZarinPalPaymentDirect(
    zarinPalConfig: ZarinPalConfig,
    authority: string,
    amountIrt: number,
  ): Promise<{
    status: "success" | "failed" | "cancelled";
    refId?: string;
    message?: string;
  }> {
    const amountIrr = this.toZarinPalAmountIrr(
      amountIrt,
      zarinPalConfig.minAmountIrr,
    );

    const { data } = await axios.post<ZarinPalVerifyResponse>(
      zarinPalConfig.verifyUrl,
      {
        merchant_id: zarinPalConfig.merchantId,
        amount: amountIrr,
        authority,
      },
      {
        headers: { accept: "application/json" },
        timeout: 15000,
      },
    );

    const verification = data.data;
    if (!verification || ![100, 101].includes(verification.code ?? 0)) {
      return {
        status: "failed",
        message: verification?.message,
      };
    }

    return {
      status: "success",
      refId: verification.ref_id?.toString(),
      message: verification.message,
    };
  }

  private buildZarinPalMetadata(
    product: ProductDocument,
    user: UserDocument,
  ): {
    email: string;
    mobile: string;
    productId: string;
    userId: string;
    username: string;
  } {
    return {
      email: this.normalizeOptionalText(user.profile?.email) ?? "",
      mobile: this.normalizeOptionalText(user.profile?.phoneNumber) ?? "",
      productId: product._id.toString(),
      userId: user._id.toString(),
      username: this.normalizeOptionalText(user.username) ?? "",
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
    input: ProductPurchasePricingInput,
    product: ProductDocument,
    userId: Types.ObjectId,
  ): Promise<PurchasePriceSummary> {
    const couponCode = this.normalizeOptionalText(input.couponCode);
    if (couponCode) {
      const couponResult = await this.couponService.validateForProductPurchase(
        {
          productId: product._id,
          code: couponCode,
        },
        userId,
      );

      if (!couponResult.isValid) {
        throw new BadRequestException(
          couponResult.message ||
            EXCEPTION_CONSTANT.COUPON_INVALID_FOR_PURCHASE,
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
          EXCEPTION_CONSTANT.COUPON_VALIDATION_INCOMPLETE,
        );
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

    const amountIrt = Math.max(0, product.priceIrt ?? 0);
    const discountAmountIrt = this.calculateProductDiscountAmount(product);

    return {
      amountIrt,
      discountPercentage:
        product.discount?.type === ProductDiscountType.PERCENTAGE
          ? Math.min(product.discount.value, 100)
          : undefined,
      discountAmountIrt: discountAmountIrt > 0 ? discountAmountIrt : undefined,
      finalAmountIrt: Math.max(0, amountIrt - discountAmountIrt),
    };
  }

  private calculateProductDiscountAmount(product: Product): number {
    const priceIrt = Math.max(0, product.priceIrt ?? 0);
    const discount = product.discount;

    if (!discount || discount.value <= 0 || priceIrt <= 0) {
      return 0;
    }

    if (discount.type === ProductDiscountType.PERCENTAGE) {
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
    input: ProductPurchaseSubmitGqlInput,
    finalAmountIrt: number,
  ): void {
    if (input.paymentMethod === UserProductPaymentMethod.FREE) {
      if (finalAmountIrt > 0) {
        throw new BadRequestException(
          EXCEPTION_CONSTANT.FREE_PURCHASE_AMOUNT_MISMATCH,
        );
      }

      return;
    }

    if (finalAmountIrt <= 0) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.FREE_PAYMENT_METHOD_REQUIRED,
      );
    }
  }

  private async resolveReceiptFileId(
    input: ProductPurchaseSubmitGqlInput,
  ): Promise<Types.ObjectId | undefined> {
    if (
      input.paymentMethod !== UserProductPaymentMethod.CARD_TO_CARD ||
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
      throw new NotFoundException(
        EXCEPTION_CONSTANT.PAYMENT_EVIDENCE_NOT_FOUND,
      );
    }

    return receiptFile._id;
  }

  private toUserProductUserSnapshot(user: UserDocument): {
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
    filters?: ProductPaymentListGqlInput["filters"],
  ): FilterQuery<UserProduct> {
    const query: FilterQuery<UserProduct> = {
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
            { "productSnapshot.title": searchRegex },
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

    if (filters.productId) {
      query.productId = new Types.ObjectId(filters.productId);
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
      "productSnapshot.title",
      filters.productTitle,
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
    query: FilterQuery<UserProduct>,
    path: string,
    value?: string,
  ): void {
    if (!value?.trim()) {
      return;
    }

    query[path] = this.createContainsRegex(value);
  }

  private addPaymentNumberRangeFilter(
    query: FilterQuery<UserProduct>,
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
    query: FilterQuery<UserProduct>,
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

  private async buildProductPaymentFileLookup(
    userProducts: ProductPaymentListRecord[],
  ): Promise<Map<string, ProductPaymentFileLookupRecord>> {
    const fileIds = new Set<string>();

    userProducts.forEach((userProduct) => {
      if (userProduct.purchase.uploadedReceiptFileId) {
        fileIds.add(userProduct.purchase.uploadedReceiptFileId.toString());
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

  private async buildProductPaymentRelatedLookups(
    userProducts: ProductPaymentListRecord[],
  ): Promise<ProductPaymentRelatedLookups> {
    const userIds = new Set<string>();
    const fileIds = new Set<string>();

    userProducts.forEach((userProduct) => {
      if (userProduct.audit?.createdBy) {
        userIds.add(userProduct.audit.createdBy.toString());
      }
      const purchase = userProduct.purchase;
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
            .lean<ProductPaymentUserLookupRecord[]>()
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

  private toProductPaymentRelatedUserResponse(
    id?: Types.ObjectId,
    user?: ProductPaymentUserLookupRecord,
  ): ProductPaymentListGqlResponse["receiptUploader"] {
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

  private toProductPaymentStoredFileResponse(
    id?: Types.ObjectId,
    file?: ProductPaymentFileLookupRecord,
  ): ProductPaymentListGqlResponse["uploadedReceiptFile"] {
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

  private toProductPaymentListSummaryResponse(
    userProduct: ProductPaymentListRecord,
    filesById: Map<string, ProductPaymentFileLookupRecord>,
  ): ProductPaymentListSummaryGqlResponse {
    const purchase = userProduct.purchase;
    const uploadedReceiptFileId = purchase.uploadedReceiptFileId;
    const uploadedReceiptFile = uploadedReceiptFileId
      ? {
          accessUrl:
            filesById.get(uploadedReceiptFileId.toString())?.accessUrl ??
            this.fileService.createAccessUrlDescriptor(uploadedReceiptFileId),
        }
      : undefined;

    return {
      id: userProduct._id,
      userId: userProduct.userId,
      productId: userProduct.productId,
      user: {
        fullName: userProduct.userSnapshot.fullName,
        username: userProduct.userSnapshot.username,
        email: userProduct.userSnapshot.email,
        phone: userProduct.userSnapshot.phone,
        ...(userProduct.userSnapshot.phone
          ? { mobilePhone: userProduct.userSnapshot.phone }
          : {}),
      },
      product: {
        title: userProduct.productSnapshot.title,
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
      statusChangedBy: purchase.statusChangedBy,
      manualStatusChangedBy: purchase.manualStatusChangedBy,
      manualStatusChangedDescription: purchase.manualStatusChangedDescription,
      createdAt: userProduct.audit?.createdAt,
      updatedAt: userProduct.audit?.updatedAt,
      pendingAt: purchase.pendingAt,
      gatewayPendingAt: purchase.gatewayPendingAt,
      paidAt: purchase.paidAt,
      failedAt: purchase.failedAt,
      refundedAt: purchase.refundedAt,
      cancelledAt: purchase.cancelledAt,
    };
  }

  private toProductPaymentListResponse(
    userProduct: ProductPaymentListRecord,
    relatedLookups: ProductPaymentRelatedLookups,
  ): ProductPaymentListGqlResponse {
    const purchase = userProduct.purchase;
    const uploadedReceiptFile = this.toProductPaymentStoredFileResponse(
      purchase.uploadedReceiptFileId,
      purchase.uploadedReceiptFileId
        ? relatedLookups.filesById.get(
            purchase.uploadedReceiptFileId.toString(),
          )
        : undefined,
    );
    const receiptUploader = this.toProductPaymentRelatedUserResponse(
      purchase.receiptUploadedBy,
      purchase.receiptUploadedBy
        ? relatedLookups.usersById.get(purchase.receiptUploadedBy.toString())
        : undefined,
    );
    const manualStatusChanger = this.toProductPaymentRelatedUserResponse(
      purchase.manualStatusChangedBy,
      purchase.manualStatusChangedBy
        ? relatedLookups.usersById.get(
            purchase.manualStatusChangedBy.toString(),
          )
        : undefined,
    );
    const createdByUser = this.toProductPaymentRelatedUserResponse(
      userProduct.audit?.createdBy,
      userProduct.audit?.createdBy
        ? relatedLookups.usersById.get(userProduct.audit.createdBy.toString())
        : undefined,
    );

    return {
      id: userProduct._id,
      userId: userProduct.userId,
      productId: userProduct.productId,
      user: {
        id: userProduct.userId,
        fullName: userProduct.userSnapshot.fullName,
        username: userProduct.userSnapshot.username,
        email: userProduct.userSnapshot.email,
        phone: userProduct.userSnapshot.phone,
        ...(userProduct.userSnapshot.phone
          ? { mobilePhone: userProduct.userSnapshot.phone }
          : {}),
      },
      product: {
        id: userProduct.productId,
        title: userProduct.productSnapshot.title,
        description: userProduct.productSnapshot.description,
        priceIrt: userProduct.productSnapshot.priceIrt,
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
      statusChangedBy: purchase.statusChangedBy,
      submittedInitiallyByAdmin: purchase.submittedInitiallyByAdmin === true,
      createdBy: userProduct.audit?.createdBy,
      createdByUser,
      manualStatusChangedBy: purchase.manualStatusChangedBy,
      manualStatusChanger,
      manualStatusChangedDescription: purchase.manualStatusChangedDescription,
      createdAt: userProduct.audit?.createdAt,
      updatedAt: userProduct.audit?.updatedAt,
      pendingAt: purchase.pendingAt,
      gatewayPendingAt: purchase.gatewayPendingAt,
      paidAt: purchase.paidAt,
      failedAt: purchase.failedAt,
      refundedAt: purchase.refundedAt,
      cancelledAt: purchase.cancelledAt,
    };
  }

  private setPurchaseStatusTimestamp(
    userProduct: UserProductDocument,
    status: UserProductPurchaseStatus,
    timestamp: Date,
  ): void {
    if (status === UserProductPurchaseStatus.PENDING) {
      userProduct.purchase.pendingAt = timestamp;
      return;
    }

    if (status === UserProductPurchaseStatus.PENDING_GATEWAY) {
      userProduct.purchase.gatewayPendingAt = timestamp;
      return;
    }

    if (status === UserProductPurchaseStatus.PAID) {
      userProduct.purchase.paidAt = timestamp;
      return;
    }

    if (status === UserProductPurchaseStatus.FAILED) {
      userProduct.purchase.failedAt = timestamp;
      return;
    }

    if (status === UserProductPurchaseStatus.REFUNDED) {
      userProduct.purchase.refundedAt = timestamp;
      return;
    }

    if (status === UserProductPurchaseStatus.CANCELLED) {
      userProduct.purchase.cancelledAt = timestamp;
    }
  }

  private resolveProductPurchaseStatusNotificationContent(
    productTitle: string,
    status: UserProductPurchaseStatus,
    changedByInvestigationTeam: boolean,
  ): {
    title: string;
    message: string;
    mode: NotificationMode;
    payload: Record<string, unknown>;
  } | null {
    switch (status) {
      case UserProductPurchaseStatus.PAID:
        return {
          title: "دسترسی به دوره فعال شد",
          message: changedByInvestigationTeam
            ? `پرداخت دوره «${productTitle}» توسط تیم بررسی تأیید شد و اکنون می‌توانید به محتوای دوره دسترسی داشته باشید.`
            : `خرید دوره «${productTitle}» با موفقیت انجام شد.`,
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
      case UserProductPurchaseStatus.FAILED:
        return {
          title: "پرداخت دوره تأیید نشد",
          message: `پرداخت دوره «${productTitle}» تأیید نشد.`,
          mode: NotificationMode.ERROR,
          payload: {
            purchaseStatus: status,
            changedByInvestigationTeam: true,
          },
        };
      case UserProductPurchaseStatus.REFUNDED:
        return {
          title: "بازپرداخت دوره ثبت شد",
          message: `بازپرداخت دوره «${productTitle}» ثبت شد.`,
          mode: NotificationMode.WARNING,
          payload: {
            purchaseStatus: status,
            changedByInvestigationTeam: true,
          },
        };
      case UserProductPurchaseStatus.CANCELLED:
        return {
          title: "پرداخت دوره لغو شد",
          message: `پرداخت دوره «${productTitle}» لغو شد.`,
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

  private async notifyProductPurchaseStatusChanged(
    userProduct: UserProductDocument,
    previousStatus: UserProductPurchaseStatus,
    options?: { changedByInvestigationTeam?: boolean },
  ): Promise<void> {
    const nextStatus = userProduct.purchase.status;

    if (previousStatus === nextStatus) {
      return;
    }

    if (nextStatus === UserProductPurchaseStatus.PENDING) {
      return;
    }

    const changedByInvestigationTeam =
      options?.changedByInvestigationTeam === true;

    if (
      nextStatus !== UserProductPurchaseStatus.PAID &&
      !changedByInvestigationTeam
    ) {
      return;
    }

    if (
      !changedByInvestigationTeam &&
      nextStatus === UserProductPurchaseStatus.PAID &&
      previousStatus !== UserProductPurchaseStatus.PENDING &&
      previousStatus !== UserProductPurchaseStatus.PENDING_GATEWAY
    ) {
      return;
    }

    const productId = userProduct.productId.toString();
    const productTitle =
      this.normalizeOptionalText(userProduct.productSnapshot?.title) || "دوره";
    const notificationContent =
      this.resolveProductPurchaseStatusNotificationContent(
        productTitle,
        nextStatus,
        changedByInvestigationTeam,
      );

    if (!notificationContent) {
      return;
    }

    const { title, message, mode, payload } = notificationContent;
    const notificationPayload: Record<string, unknown> = {
      productId,
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
      userId: userProduct.userId,
      source: NotificationSource.PAYMENT,
      mode,
      title,
      message,
      payload: notificationPayload,
    });

    await this.userSubscriptionService.publishToUser({
      userId: userProduct.userId.toString(),
      updateType: GeneralSubscriptionUpdateType.NOTIFICATION,
      targetId: notification._id.toString(),
      payload: subscriptionPayload,
    });

    void this.pushNotificationService.deliverToUser(
      userProduct.userId.toString(),
      {
        title: resolveWebPushTitle(subscriptionPayload, title),
        body: resolveWebPushBody(subscriptionPayload, message),
        notificationId: notification._id.toString(),
        payload: subscriptionPayload,
        tag: notification._id.toString(),
      },
    );
  }

  private toProductPurchaseSubmitResponse(
    userProduct: UserProductDocument,
    paymentUrl?: string,
  ): ProductPurchaseSubmitGqlResponse {
    const purchase = userProduct.purchase;

    return {
      id: userProduct._id,
      productId: userProduct.productId,
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
        purchase.paymentMethod === UserProductPaymentMethod.GATEWAY
          ? purchase.paymentReference
          : undefined,
      isPurchased: purchase.status === UserProductPurchaseStatus.PAID,
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

  private sortChaptersForDisplay(chapters: ProductChapter[]): ProductChapter[] {
    return [...chapters].sort((first, second) =>
      this.compareBySortOrderThenTitle(first, second),
    );
  }

  private sortItemsForDisplay(items: ProductItem[]): ProductItem[] {
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
    item: ProductItem,
    fileTypeLookup: FileTypeLookup,
  ): ProductItemType {
    return item.fileId
      ? (fileTypeLookup.get(item.fileId.toString()) ?? ProductItemType.ARTICLE)
      : ProductItemType.ARTICLE;
  }

  private classifyStoredFileAsItemType(
    storedFile: Pick<StoredFile, "mimeType" | "name" | "objectKey" | "path">,
  ): ProductItemType {
    const mimeType = storedFile.mimeType?.toLowerCase() || "";

    if (mimeType.startsWith("video/")) {
      return ProductItemType.VIDEO;
    }
    if (mimeType.startsWith("audio/")) {
      return ProductItemType.VOICE;
    }
    if (mimeType.startsWith("image/")) {
      return ProductItemType.IMAGE;
    }

    return this.classifyByExtension(
      storedFile.name || storedFile.objectKey || storedFile.path,
    );
  }

  private classifyByExtension(fileName?: string): ProductItemType {
    const extension = fileName?.split(".").pop()?.toLowerCase();

    if (!extension) {
      return ProductItemType.ARTICLE;
    }

    if (["mp4", "mov", "mkv", "webm", "avi"].includes(extension)) {
      return ProductItemType.VIDEO;
    }
    if (["mp3", "wav", "aac", "m4a", "ogg", "flac"].includes(extension)) {
      return ProductItemType.VOICE;
    }
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
      return ProductItemType.IMAGE;
    }

    return ProductItemType.ARTICLE;
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
    query: FilterQuery<Product>,
    condition: FilterQuery<Product>,
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
