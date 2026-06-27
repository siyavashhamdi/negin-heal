import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { CourseDiscountType, CouponDiscountType } from "../../enums";
import { UserCoursePaymentMethod } from "../../enums/user-course-payment-method.enum";
import { UserCoursePurchaseCurrency } from "../../enums/user-course-purchase-currency.enum";
import { UserCoursePurchaseStatus } from "../../enums/user-course-purchase-status.enum";
import { PurchaseStatusChangedBy } from "../../enums/purchase-status-changed-by.enum";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

export type UserCourseUserSnapshot = {
  fullName: string;
  username: string;
  email: string;
  phone?: string;
};

export type UserCourseSnapshot = {
  title: string;
  description?: string;
  priceIrt: number;
  discount?: UserCourseDiscountSnapshot;
};

export type UserCourseDiscountSnapshot = {
  type: CourseDiscountType;
  value: number;
};

export type UserCoursePurchase = {
  status: UserCoursePurchaseStatus;
  amountIrt: number;
  discountPercentage?: number;
  discountAmountIrt?: number;
  finalAmountIrt: number;
  currency: UserCoursePurchaseCurrency;
  paymentMethod: UserCoursePaymentMethod;
  paymentProvider?: string;
  paymentReference?: string;
  transactionId?: string;
  pendingAt?: Date;
  gatewayPendingAt?: Date;
  paidAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
  cancelledAt?: Date;
  submittedInitiallyByAdmin: boolean;
  isManualStatusChange: boolean;
  statusChangedBy?: PurchaseStatusChangedBy;
  manualStatusChangedBy?: Types.ObjectId;
  manualStatusChangedDescription?: string;
  uploadedReceiptFileId?: Types.ObjectId;
  receiptUploadedBy?: Types.ObjectId;
  couponSnapshot?: UserCoursePurchaseCouponSnapshot;
};

export type UserCoursePurchaseCouponSnapshot = {
  couponId: Types.ObjectId;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
};

export type UserCourseProgressChapter = {
  key: string;
  titleSnapshot: string;
  userCompletedAt: Date;
};

export type UserCourseProgress = {
  chapters: UserCourseProgressChapter[];
};

export type UserCourseChapterReleaseNotification = {
  key: string;
  titleSnapshot: string;
  notificationSentAt: Date;
  notificationId?: Types.ObjectId;
};

export type UserCourseChapterReleaseNotifications = {
  chapters: UserCourseChapterReleaseNotification[];
};

export type UserCourseDocument = UserCourse & Document;

export const UserCourseUserSnapshotSchema = new MongooseSchema(
  {
    fullName: { required: true, trim: true, type: String },
    username: {
      lowercase: true,
      required: true,
      trim: true,
      type: String,
    },
    email: {
      lowercase: true,
      required: true,
      trim: true,
      type: String,
    },
    phone: { trim: true, type: String },
  },
  { _id: false },
);

export const UserCourseSnapshotSchema = new MongooseSchema(
  {
    title: { required: true, trim: true, type: String },
    description: { trim: true, type: String },
    priceIrt: { min: 0, required: true, type: Number },
    discount: {
      type: new MongooseSchema(
        {
          type: {
            enum: Object.values(CourseDiscountType),
            required: true,
            type: String,
          },
          value: { min: 0, required: true, type: Number },
        },
        { _id: false },
      ),
    },
  },
  { _id: false },
);

export const UserCoursePurchaseCouponSnapshotSchema = new MongooseSchema(
  {
    couponId: { ref: "Coupon", required: true, type: Types.ObjectId },
    code: {
      required: true,
      set: (value: string) => value.trim().toUpperCase(),
      trim: true,
      type: String,
    },
    discountType: {
      enum: Object.values(CouponDiscountType),
      required: true,
      type: String,
    },
    discountValue: { min: 0, required: true, type: Number },
  },
  { _id: false },
);

export const UserCoursePurchaseSchema = new MongooseSchema(
  {
    status: {
      default: UserCoursePurchaseStatus.PENDING,
      enum: Object.values(UserCoursePurchaseStatus),
      required: true,
      type: String,
    },
    amountIrt: { min: 0, required: true, type: Number },
    discountPercentage: { max: 100, min: 0, type: Number },
    discountAmountIrt: { min: 0, type: Number },
    finalAmountIrt: { min: 0, required: true, type: Number },
    currency: {
      default: UserCoursePurchaseCurrency.IRT,
      enum: Object.values(UserCoursePurchaseCurrency),
      required: true,
      type: String,
    },
    paymentMethod: {
      enum: Object.values(UserCoursePaymentMethod),
      required: true,
      type: String,
    },
    paymentProvider: { trim: true, type: String },
    paymentReference: { trim: true, type: String },
    transactionId: { trim: true, type: String },
    pendingAt: { type: Date },
    gatewayPendingAt: { type: Date },
    paidAt: { type: Date },
    failedAt: { type: Date },
    refundedAt: { type: Date },
    cancelledAt: { type: Date },
    submittedInitiallyByAdmin: {
      default: false,
      required: true,
      type: Boolean,
    },
    isManualStatusChange: { default: false, required: true, type: Boolean },
    statusChangedBy: {
      enum: Object.values(PurchaseStatusChangedBy),
      type: String,
    },
    manualStatusChangedBy: { ref: "User", type: Types.ObjectId },
    manualStatusChangedDescription: { trim: true, type: String },
    uploadedReceiptFileId: { ref: "StoredFile", type: Types.ObjectId },
    receiptUploadedBy: { ref: "User", type: Types.ObjectId },
    couponSnapshot: { type: UserCoursePurchaseCouponSnapshotSchema },
  },
  { _id: false },
);

export const UserCourseProgressChapterSchema = new MongooseSchema(
  {
    key: { required: true, trim: true, type: String },
    titleSnapshot: { required: true, trim: true, type: String },
    userCompletedAt: { required: true, type: Date },
  },
  { _id: false },
);

export const UserCourseProgressSchema = new MongooseSchema(
  {
    chapters: { default: [], type: [UserCourseProgressChapterSchema] },
  },
  { _id: false },
);

export const UserCourseChapterReleaseNotificationSchema = new MongooseSchema(
  {
    key: { required: true, trim: true, type: String },
    titleSnapshot: { required: true, trim: true, type: String },
    notificationSentAt: { required: true, type: Date },
    notificationId: { ref: "Notification", type: Types.ObjectId },
  },
  { _id: false },
);

export const UserCourseChapterReleaseNotificationsSchema = new MongooseSchema(
  {
    chapters: {
      default: [],
      type: [UserCourseChapterReleaseNotificationSchema],
    },
  },
  { _id: false },
);

@Schema({ collection: "user_courses" })
export class UserCourse extends BaseIdTimestampableBlameableSchema {
  @Prop({ ref: "User", required: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ ref: "Course", required: true, type: Types.ObjectId })
  courseId: Types.ObjectId;

  @Prop({ required: true, type: UserCourseUserSnapshotSchema })
  userSnapshot: UserCourseUserSnapshot;

  @Prop({ required: true, type: UserCourseSnapshotSchema })
  courseSnapshot: UserCourseSnapshot;

  @Prop({ required: true, type: UserCoursePurchaseSchema })
  purchase: UserCoursePurchase;

  @Prop({ default: () => ({ chapters: [] }), type: UserCourseProgressSchema })
  progress: UserCourseProgress;

  @Prop({
    default: () => ({ chapters: [] }),
    type: UserCourseChapterReleaseNotificationsSchema,
  })
  chapterReleaseNotifications: UserCourseChapterReleaseNotifications;
}

export const UserCourseSchema = SchemaFactory.createForClass(UserCourse);

UserCourseSchema.plugin(timestampablePlugin);
UserCourseSchema.plugin(blameablePlugin);
UserCourseSchema.plugin(softDeletePlugin);

UserCourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });
UserCourseSchema.index({ userId: 1 });
UserCourseSchema.index({ courseId: 1 });
UserCourseSchema.index({ "purchase.status": 1 });
UserCourseSchema.index({ "purchase.transactionId": 1 }, { sparse: true });
UserCourseSchema.index({ "purchase.paymentReference": 1 }, { sparse: true });
UserCourseSchema.index(
  { "purchase.couponSnapshot.couponId": 1 },
  { sparse: true },
);
UserCourseSchema.index({ "purchase.couponSnapshot.code": 1 }, { sparse: true });
UserCourseSchema.index({ "purchase.paidAt": -1 });
UserCourseSchema.index({ "progress.chapters.key": 1 });
UserCourseSchema.index({ "chapterReleaseNotifications.chapters.key": 1 });
UserCourseSchema.index({ "audit.createdAt": -1 });
UserCourseSchema.index({ "audit.updatedAt": -1 });
