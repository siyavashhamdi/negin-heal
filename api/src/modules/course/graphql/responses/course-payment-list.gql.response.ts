import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { FileAccessUrlGqlResponse } from "../../../file/graphql/responses";
import { PaginationOffsetResponse } from "../../../../common/pagination/response";
import {
  CouponDiscountType,
  UserCoursePaymentMethod,
  UserCoursePurchaseCurrency,
  UserCoursePurchaseStatus,
} from "../../../../enums";

@ObjectType()
export class CoursePaymentUserSnapshotGqlResponse {
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
export class CoursePaymentCourseSnapshotGqlResponse {
  @Field(() => ID, { description: "Course ID" })
  id: Types.ObjectId;

  @Field({ description: "Course title snapshot" })
  title: string;

  @Field({ nullable: true, description: "Course description snapshot" })
  description?: string;

  @Field(() => Float, { description: "Original course price in IRT" })
  priceIrt: number;
}

@ObjectType()
export class CourseCouponSnapshotGqlResponse {
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
export class CoursePaymentRelatedUserGqlResponse {
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
export class CoursePaymentStoredFileGqlResponse {
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
export class CoursePaymentListGqlResponse {
  @Field(() => ID, { description: "User-course purchase record ID" })
  id: Types.ObjectId;

  @Field(() => ID, { description: "Buyer user ID" })
  userId: Types.ObjectId;

  @Field(() => ID, { description: "Course ID" })
  courseId: Types.ObjectId;

  @Field(() => CoursePaymentUserSnapshotGqlResponse, {
    description: "Buyer snapshot captured when the purchase was submitted",
  })
  user: CoursePaymentUserSnapshotGqlResponse;

  @Field(() => CoursePaymentCourseSnapshotGqlResponse, {
    description: "Course snapshot captured when the purchase was submitted",
  })
  course: CoursePaymentCourseSnapshotGqlResponse;

  @Field(() => UserCoursePurchaseStatus, { description: "Payment status" })
  status: UserCoursePurchaseStatus;

  @Field(() => UserCoursePaymentMethod, { description: "Payment method" })
  paymentMethod: UserCoursePaymentMethod;

  @Field(() => UserCoursePurchaseCurrency, { description: "Payment currency" })
  currency: UserCoursePurchaseCurrency;

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
    description: "Discount percentage applied by course discount",
  })
  discountPercentage?: number;

  @Field(() => Float, { nullable: true, description: "Discount amount in IRT" })
  discountAmountIrt?: number;

  @Field(() => Float, { description: "Final payable amount in IRT" })
  finalAmountIrt: number;

  @Field(() => CourseCouponSnapshotGqlResponse, {
    nullable: true,
    description: "Applied coupon snapshot, if any",
  })
  coupon?: CourseCouponSnapshotGqlResponse;

  @Field(() => CoursePaymentStoredFileGqlResponse, {
    nullable: true,
    description: "Uploaded receipt file metadata",
  })
  uploadedReceiptFile?: CoursePaymentStoredFileGqlResponse;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that uploaded the receipt",
  })
  receiptUploadedBy?: Types.ObjectId;

  @Field(() => CoursePaymentRelatedUserGqlResponse, {
    nullable: true,
    description: "User that uploaded the receipt",
  })
  receiptUploader?: CoursePaymentRelatedUserGqlResponse;

  @Field({ description: "Whether the payment status was changed manually" })
  isManualStatusChange: boolean;

  @Field({
    description:
      "Whether this payment record was initially submitted by an admin",
  })
  submittedInitiallyByAdmin: boolean;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that manually changed the status",
  })
  manualStatusChangedBy?: Types.ObjectId;

  @Field(() => CoursePaymentRelatedUserGqlResponse, {
    nullable: true,
    description: "User that manually changed the status",
  })
  manualStatusChanger?: CoursePaymentRelatedUserGqlResponse;

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
export class CoursePaymentListPaginatedOffsetGqlResponse {
  @Field(() => [CoursePaymentListGqlResponse], {
    description: "List of course payments",
  })
  items: CoursePaymentListGqlResponse[];

  @Field(() => PaginationOffsetResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationOffsetResponse;
}
