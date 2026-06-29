import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Field, Float, ID, InputType } from "@nestjs/graphql";

import {
  CouponDiscountType,
  UserProductPaymentMethod,
  UserProductPurchaseCurrency,
  UserProductPurchaseStatus,
} from "../../../../enums";
import {
  OffsetPageOptionsParamsInput,
  PaginationOffsetInput,
} from "../../../../common/pagination/input";

@InputType()
export class ProductPaymentListFilterInput {
  @Field({
    nullable: true,
    description:
      "Search query that matches buyer, product, payment reference, or transaction ID",
  })
  @IsOptional()
  @IsString({ message: "Query filter must be a string" })
  query?: string;

  @Field({ nullable: true, description: "Filter by buyer full name snapshot" })
  @IsOptional()
  @IsString({ message: "Full name filter must be a string" })
  fullName?: string;

  @Field({ nullable: true, description: "Filter by buyer email snapshot" })
  @IsOptional()
  @IsString({ message: "Email filter must be a string" })
  email?: string;

  @Field({
    nullable: true,
    description: "Filter by buyer mobile phone snapshot",
  })
  @IsOptional()
  @IsString({ message: "Mobile phone filter must be a string" })
  mobilePhone?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter by user-product purchase record ID",
  })
  @IsOptional()
  @IsMongoId({ message: "ID filter must be a valid Mongo ID" })
  id?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter payments by buyer ID",
  })
  @IsOptional()
  @IsMongoId({ message: "User ID filter must be a valid Mongo ID" })
  userId?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter payments by product ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Product ID filter must be a valid Mongo ID" })
  productId?: string;

  @Field({ nullable: true, description: "Filter by buyer full name snapshot" })
  @IsOptional()
  @IsString({ message: "Full name filter must be a string" })
  userFullName?: string;

  @Field({ nullable: true, description: "Filter by buyer username snapshot" })
  @IsOptional()
  @IsString({ message: "Username filter must be a string" })
  username?: string;

  @Field({ nullable: true, description: "Filter by buyer email snapshot" })
  @IsOptional()
  @IsString({ message: "Email filter must be a string" })
  userEmail?: string;

  @Field({ nullable: true, description: "Filter by buyer phone snapshot" })
  @IsOptional()
  @IsString({ message: "Phone filter must be a string" })
  userPhone?: string;

  @Field({ nullable: true, description: "Filter by product title snapshot" })
  @IsOptional()
  @IsString({ message: "Product title filter must be a string" })
  productTitle?: string;

  @Field(() => UserProductPurchaseStatus, {
    nullable: true,
    description: "Filter payments by purchase status",
  })
  @IsOptional()
  @IsEnum(UserProductPurchaseStatus, {
    message: "Status filter must be a valid purchase status",
  })
  status?: UserProductPurchaseStatus;

  @Field(() => UserProductPaymentMethod, {
    nullable: true,
    description: "Filter payments by method",
  })
  @IsOptional()
  @IsEnum(UserProductPaymentMethod, {
    message: "Payment method filter must be valid",
  })
  paymentMethod?: UserProductPaymentMethod;

  @Field(() => UserProductPurchaseCurrency, {
    nullable: true,
    description: "Filter payments by currency",
  })
  @IsOptional()
  @IsEnum(UserProductPurchaseCurrency, {
    message: "Currency filter must be valid",
  })
  currency?: UserProductPurchaseCurrency;

  @Field({ nullable: true, description: "Filter by payment provider" })
  @IsOptional()
  @IsString({ message: "Payment provider filter must be a string" })
  paymentProvider?: string;

  @Field({ nullable: true, description: "Filter by payment reference" })
  @IsOptional()
  @IsString({ message: "Payment reference filter must be a string" })
  paymentReference?: string;

  @Field({ nullable: true, description: "Filter by transaction ID" })
  @IsOptional()
  @IsString({ message: "Transaction ID filter must be a string" })
  transactionId?: string;

  @Field(() => Float, {
    nullable: true,
    description: "Minimum original amount in IRT",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Minimum amount filter must be a number" })
  amountIrtMin?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Maximum original amount in IRT",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Maximum amount filter must be a number" })
  amountIrtMax?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Minimum discount percentage",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    { message: "Minimum discount percentage filter must be a number" },
  )
  discountPercentageMin?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Maximum discount percentage",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    { message: "Maximum discount percentage filter must be a number" },
  )
  discountPercentageMax?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Minimum discount amount in IRT",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Minimum discount amount filter must be a number" })
  discountAmountIrtMin?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Maximum discount amount in IRT",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Maximum discount amount filter must be a number" })
  discountAmountIrtMax?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Minimum final amount in IRT",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Minimum final amount filter must be a number" })
  finalAmountIrtMin?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Maximum final amount in IRT",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Maximum final amount filter must be a number" })
  finalAmountIrtMax?: number;

  @Field(() => Boolean, {
    nullable: true,
    description: "Filter by manual status-change flag",
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "Manual status-change filter must be boolean" })
  isManualStatusChange?: boolean;

  @Field(() => ID, {
    nullable: true,
    description: "Filter by manual status changer user ID",
  })
  @IsOptional()
  @IsMongoId({
    message: "Manual status changed by filter must be a valid Mongo ID",
  })
  manualStatusChangedBy?: string;

  @Field({
    nullable: true,
    description: "Filter by manual status-change description",
  })
  @IsOptional()
  @IsString({ message: "Manual status description filter must be a string" })
  manualStatusChangedDescription?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter by uploaded receipt file ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Receipt file filter must be a valid Mongo ID" })
  uploadedReceiptFileId?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter by receipt uploader user ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Receipt uploader filter must be a valid Mongo ID" })
  receiptUploadedBy?: string;

  @Field(() => ID, { nullable: true, description: "Filter by coupon ID" })
  @IsOptional()
  @IsMongoId({ message: "Coupon ID filter must be a valid Mongo ID" })
  couponId?: string;

  @Field({ nullable: true, description: "Filter by coupon code" })
  @IsOptional()
  @IsString({ message: "Coupon code filter must be a string" })
  couponCode?: string;

  @Field(() => CouponDiscountType, {
    nullable: true,
    description: "Filter by coupon discount type",
  })
  @IsOptional()
  @IsEnum(CouponDiscountType, {
    message: "Coupon discount type filter must be valid",
  })
  couponDiscountType?: CouponDiscountType;

  @Field(() => Float, {
    nullable: true,
    description: "Minimum coupon discount value",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    { message: "Minimum coupon discount value filter must be a number" },
  )
  couponDiscountValueMin?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Maximum coupon discount value",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    { message: "Maximum coupon discount value filter must be a number" },
  )
  couponDiscountValueMax?: number;

  @Field({
    nullable: true,
    description: "Filter records created from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created from filter must be an ISO date" })
  createdAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter records created until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created to filter must be an ISO date" })
  createdAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter records updated from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated from filter must be an ISO date" })
  updatedAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter records updated until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated to filter must be an ISO date" })
  updatedAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter pending payments from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Pending from filter must be an ISO date" })
  pendingAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter pending payments until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Pending to filter must be an ISO date" })
  pendingAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter paid payments from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Paid from filter must be an ISO date" })
  paidAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter paid payments until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Paid to filter must be an ISO date" })
  paidAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter failed payments from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Failed from filter must be an ISO date" })
  failedAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter failed payments until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Failed to filter must be an ISO date" })
  failedAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter refunded payments from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Refunded from filter must be an ISO date" })
  refundedAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter refunded payments until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Refunded to filter must be an ISO date" })
  refundedAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter cancelled payments from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Cancelled from filter must be an ISO date" })
  cancelledAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter cancelled payments until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Cancelled to filter must be an ISO date" })
  cancelledAtTo?: string;
}

@InputType()
export class ProductPaymentListGqlInput extends PaginationOffsetInput<ProductPaymentListFilterInput> {
  @Field(() => ProductPaymentListFilterInput, {
    nullable: true,
    description: "Filter options for narrowing down the product payment list",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductPaymentListFilterInput)
  filters?: ProductPaymentListFilterInput;

  @Field(() => OffsetPageOptionsParamsInput, {
    nullable: true,
    description: "Pagination options",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OffsetPageOptionsParamsInput)
  options?: OffsetPageOptionsParamsInput;
}
