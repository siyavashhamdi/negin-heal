import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { FileAccessUrlGqlResponse } from "../../../file/graphql/responses";
import { PaginationOffsetResponse } from "../../../../common/pagination/response";
import {
  CouponDiscountType,
  UserProductPaymentMethod,
  UserProductPurchaseCurrency,
  UserProductPurchaseStatus,
  PurchaseStatusChangedBy,
} from "../../../../enums";

@ObjectType()
export class ProductPaymentUserSnapshotGqlResponse {
  @Field(() => ID, { description: "Buyer user ID" })
  id: Types.ObjectId;

  @Field({ description: "Buyer full name snapshot" })
  fullName: string;

  @Field({ description: "Buyer username snapshot" })
  username: string;

  @Field({ description: "Buyer email snapshot" })
  email: string;

  @Field({ nullable: true, description: "Buyer phone snapshot" })
  phone?: string;

  @Field({ nullable: true, description: "Buyer mobile phone snapshot" })
  mobilePhone?: string;
}

@ObjectType()
export class ProductPaymentProductSnapshotGqlResponse {
  @Field(() => ID, { description: "Product ID" })
  id: Types.ObjectId;

  @Field({ description: "Product title snapshot" })
  title: string;

  @Field({ nullable: true, description: "Product description snapshot" })
  description?: string;

  @Field(() => Float, { description: "Original product price in IRT" })
  priceIrt: number;
}

@ObjectType()
export class ProductCouponSnapshotGqlResponse {
  @Field(() => ID, { description: "Coupon ID" })
  id: Types.ObjectId;

  @Field(() => ID, { description: "Coupon ID" })
  couponId: Types.ObjectId;

  @Field({ description: "Coupon code" })
  code: string;

  @Field({ description: "Coupon display title" })
  title: string;

  @Field(() => CouponDiscountType, {
    description: "Coupon discount type",
  })
  discountType: CouponDiscountType;

  @Field(() => Float, {
    description:
      "Coupon discount value. Percentage or fixed amount based on discountType",
  })
  discountValue: number;
}

@ObjectType()
export class ProductPaymentRelatedUserGqlResponse {
  @Field(() => ID, { description: "Related user ID" })
  id: Types.ObjectId;

  @Field({ nullable: true, description: "Related user display name" })
  fullName?: string;

  @Field({ nullable: true, description: "Related username" })
  username?: string;

  @Field({ nullable: true, description: "Related user email" })
  email?: string;

  @Field({ nullable: true, description: "Related user phone" })
  phone?: string;
}

@ObjectType()
export class ProductPaymentStoredFileGqlResponse {
  @Field({ nullable: true, description: "Stored file name" })
  name?: string;

  @Field({ nullable: true, description: "Stored file display title" })
  title?: string;

  @Field({ nullable: true, description: "Stored file MIME type" })
  mimeType?: string;

  @Field(() => Float, {
    nullable: true,
    description: "Stored file size in bytes",
  })
  sizeBytes?: number;

  @Field({ nullable: true, description: "Stored file path" })
  path?: string;

  @Field(() => FileAccessUrlGqlResponse, {
    nullable: true,
    description: "Signed access descriptor for reading the stored file",
  })
  accessUrl?: FileAccessUrlGqlResponse;
}

@ObjectType()
export class ProductPaymentListUserSummaryGqlResponse {
  @Field({ description: "Buyer full name snapshot" })
  fullName: string;

  @Field({ description: "Buyer username snapshot" })
  username: string;

  @Field({ description: "Buyer email snapshot" })
  email: string;

  @Field({ nullable: true, description: "Buyer phone snapshot" })
  phone?: string;

  @Field({ nullable: true, description: "Buyer mobile phone snapshot" })
  mobilePhone?: string;
}

@ObjectType()
export class ProductPaymentListProductSummaryGqlResponse {
  @Field({ description: "Product title snapshot" })
  title: string;
}

@ObjectType()
export class ProductPaymentListCouponSummaryGqlResponse {
  @Field(() => ID, { description: "Coupon ID" })
  couponId: Types.ObjectId;

  @Field({ description: "Coupon code" })
  code: string;

  @Field(() => CouponDiscountType, {
    description: "Coupon discount type",
  })
  discountType: CouponDiscountType;

  @Field(() => Float, {
    description:
      "Coupon discount value. Percentage or fixed amount based on discountType",
  })
  discountValue: number;
}

@ObjectType()
export class ProductPaymentListReceiptFileSummaryGqlResponse {
  @Field(() => FileAccessUrlGqlResponse, {
    nullable: true,
    description: "Signed access descriptor for reading the stored receipt file",
  })
  accessUrl?: FileAccessUrlGqlResponse;
}

@ObjectType()
export class ProductPaymentListSummaryGqlResponse {
  @Field(() => ID, { description: "User-product purchase record ID" })
  id: Types.ObjectId;

  @Field(() => ID, { description: "Buyer user ID" })
  userId: Types.ObjectId;

  @Field(() => ID, { description: "Product ID" })
  productId: Types.ObjectId;

  @Field(() => ProductPaymentListUserSummaryGqlResponse, {
    description: "Buyer snapshot captured when the purchase was submitted",
  })
  user: ProductPaymentListUserSummaryGqlResponse;

  @Field(() => ProductPaymentListProductSummaryGqlResponse, {
    description: "Product snapshot captured when the purchase was submitted",
  })
  product: ProductPaymentListProductSummaryGqlResponse;

  @Field(() => UserProductPurchaseStatus, { description: "Payment status" })
  status: UserProductPurchaseStatus;

  @Field(() => UserProductPaymentMethod, { description: "Payment method" })
  paymentMethod: UserProductPaymentMethod;

  @Field(() => UserProductPurchaseCurrency, { description: "Payment currency" })
  currency: UserProductPurchaseCurrency;

  @Field({ nullable: true, description: "Payment provider, if any" })
  paymentProvider?: string;

  @Field({
    nullable: true,
    description: "Gateway authority or manual reference",
  })
  paymentReference?: string;

  @Field({
    nullable: true,
    description: "Gateway ref ID or crypto transaction ID",
  })
  transactionId?: string;

  @Field(() => Float, { description: "Original amount in IRT" })
  amountIrt: number;

  @Field(() => Float, {
    nullable: true,
    description: "Discount percentage applied by product discount",
  })
  discountPercentage?: number;

  @Field(() => Float, { nullable: true, description: "Discount amount in IRT" })
  discountAmountIrt?: number;

  @Field(() => Float, { description: "Final payable amount in IRT" })
  finalAmountIrt: number;

  @Field(() => ProductPaymentListCouponSummaryGqlResponse, {
    nullable: true,
    description: "Applied coupon snapshot, if any",
  })
  coupon?: ProductPaymentListCouponSummaryGqlResponse;

  @Field(() => ProductPaymentListReceiptFileSummaryGqlResponse, {
    nullable: true,
    description: "Uploaded receipt file metadata",
  })
  uploadedReceiptFile?: ProductPaymentListReceiptFileSummaryGqlResponse;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that uploaded the receipt",
  })
  receiptUploadedBy?: Types.ObjectId;

  @Field({ description: "Whether the payment status was changed manually" })
  isManualStatusChange: boolean;

  @Field(() => PurchaseStatusChangedBy, {
    nullable: true,
    description: "Actor that changed the payment status",
  })
  statusChangedBy?: PurchaseStatusChangedBy;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that manually changed the status",
  })
  manualStatusChangedBy?: Types.ObjectId;

  @Field({
    nullable: true,
    description: "Manual status-change description",
  })
  manualStatusChangedDescription?: string;

  @Field({ nullable: true, description: "Payment submitted date" })
  createdAt?: Date;

  @Field({ nullable: true, description: "Last payment update date" })
  updatedAt?: Date;

  @Field({ nullable: true, description: "Pending status date" })
  pendingAt?: Date;

  @Field({ nullable: true, description: "Gateway pending status date" })
  gatewayPendingAt?: Date;

  @Field({ nullable: true, description: "Paid status date" })
  paidAt?: Date;

  @Field({ nullable: true, description: "Failed status date" })
  failedAt?: Date;

  @Field({ nullable: true, description: "Refunded status date" })
  refundedAt?: Date;

  @Field({ nullable: true, description: "Cancelled status date" })
  cancelledAt?: Date;
}

@ObjectType()
export class ProductPaymentListGqlResponse {
  @Field(() => ID, { description: "User-product purchase record ID" })
  id: Types.ObjectId;

  @Field(() => ID, { description: "Buyer user ID" })
  userId: Types.ObjectId;

  @Field(() => ID, { description: "Product ID" })
  productId: Types.ObjectId;

  @Field(() => ProductPaymentUserSnapshotGqlResponse, {
    description: "Buyer snapshot captured when the purchase was submitted",
  })
  user: ProductPaymentUserSnapshotGqlResponse;

  @Field(() => ProductPaymentProductSnapshotGqlResponse, {
    description: "Product snapshot captured when the purchase was submitted",
  })
  product: ProductPaymentProductSnapshotGqlResponse;

  @Field(() => UserProductPurchaseStatus, { description: "Payment status" })
  status: UserProductPurchaseStatus;

  @Field(() => UserProductPaymentMethod, { description: "Payment method" })
  paymentMethod: UserProductPaymentMethod;

  @Field(() => UserProductPurchaseCurrency, { description: "Payment currency" })
  currency: UserProductPurchaseCurrency;

  @Field({ nullable: true, description: "Payment provider, if any" })
  paymentProvider?: string;

  @Field({
    nullable: true,
    description: "Gateway authority or manual reference",
  })
  paymentReference?: string;

  @Field({
    nullable: true,
    description: "Gateway ref ID or crypto transaction ID",
  })
  transactionId?: string;

  @Field(() => Float, { description: "Original amount in IRT" })
  amountIrt: number;

  @Field(() => Float, {
    nullable: true,
    description: "Discount percentage applied by product discount",
  })
  discountPercentage?: number;

  @Field(() => Float, { nullable: true, description: "Discount amount in IRT" })
  discountAmountIrt?: number;

  @Field(() => Float, { description: "Final payable amount in IRT" })
  finalAmountIrt: number;

  @Field(() => ProductCouponSnapshotGqlResponse, {
    nullable: true,
    description: "Applied coupon snapshot, if any",
  })
  coupon?: ProductCouponSnapshotGqlResponse;

  @Field(() => ProductPaymentStoredFileGqlResponse, {
    nullable: true,
    description: "Uploaded receipt file metadata",
  })
  uploadedReceiptFile?: ProductPaymentStoredFileGqlResponse;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that uploaded the receipt",
  })
  receiptUploadedBy?: Types.ObjectId;

  @Field(() => ProductPaymentRelatedUserGqlResponse, {
    nullable: true,
    description: "User that uploaded the receipt",
  })
  receiptUploader?: ProductPaymentRelatedUserGqlResponse;

  @Field({ description: "Whether the payment status was changed manually" })
  isManualStatusChange: boolean;

  @Field(() => PurchaseStatusChangedBy, {
    nullable: true,
    description: "Actor that changed the payment status",
  })
  statusChangedBy?: PurchaseStatusChangedBy;

  @Field({
    description:
      "Whether this payment record was initially submitted by an admin",
  })
  submittedInitiallyByAdmin: boolean;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that initially created the payment record",
  })
  createdBy?: Types.ObjectId;

  @Field(() => ProductPaymentRelatedUserGqlResponse, {
    nullable: true,
    description: "User that initially created the payment record",
  })
  createdByUser?: ProductPaymentRelatedUserGqlResponse;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that manually changed the status",
  })
  manualStatusChangedBy?: Types.ObjectId;

  @Field(() => ProductPaymentRelatedUserGqlResponse, {
    nullable: true,
    description: "User that manually changed the status",
  })
  manualStatusChanger?: ProductPaymentRelatedUserGqlResponse;

  @Field({
    nullable: true,
    description: "Manual status-change description",
  })
  manualStatusChangedDescription?: string;

  @Field({ nullable: true, description: "Payment submitted date" })
  createdAt?: Date;

  @Field({ nullable: true, description: "Last payment update date" })
  updatedAt?: Date;

  @Field({ nullable: true, description: "Pending status date" })
  pendingAt?: Date;

  @Field({ nullable: true, description: "Gateway pending status date" })
  gatewayPendingAt?: Date;

  @Field({ nullable: true, description: "Paid status date" })
  paidAt?: Date;

  @Field({ nullable: true, description: "Failed status date" })
  failedAt?: Date;

  @Field({ nullable: true, description: "Refunded status date" })
  refundedAt?: Date;

  @Field({ nullable: true, description: "Cancelled status date" })
  cancelledAt?: Date;
}

@ObjectType()
export class ProductPaymentListPaginatedOffsetGqlResponse {
  @Field(() => [ProductPaymentListSummaryGqlResponse], {
    description: "List of product payments",
  })
  items: ProductPaymentListSummaryGqlResponse[];

  @Field(() => PaginationOffsetResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationOffsetResponse;
}
