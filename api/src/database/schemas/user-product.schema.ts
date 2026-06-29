import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ProductDiscountType, CouponDiscountType } from "../../enums";
import { UserProductPaymentMethod } from "../../enums/user-product-payment-method.enum";
import { UserProductPurchaseCurrency } from "../../enums/user-product-purchase-currency.enum";
import { UserProductPurchaseStatus } from "../../enums/user-product-purchase-status.enum";
import { PurchaseStatusChangedBy } from "../../enums/purchase-status-changed-by.enum";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

export type UserProductUserSnapshot = {
  fullName: string;
  username: string;
  email: string;
  phone?: string;
};

export type UserProductSnapshot = {
  title: string;
  description?: string;
  priceIrt: number;
  discount?: UserProductDiscountSnapshot;
};

export type UserProductDiscountSnapshot = {
  type: ProductDiscountType;
  value: number;
};

export type UserProductPurchase = {
  status: UserProductPurchaseStatus;
  amountIrt: number;
  discountPercentage?: number;
  discountAmountIrt?: number;
  finalAmountIrt: number;
  currency: UserProductPurchaseCurrency;
  paymentMethod: UserProductPaymentMethod;
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
  couponSnapshot?: UserProductPurchaseCouponSnapshot;
};

export type UserProductPurchaseCouponSnapshot = {
  couponId: Types.ObjectId;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
};

export type UserProductProgressChapter = {
  key: string;
  titleSnapshot: string;
  userCompletedAt: Date;
};

export type UserProductProgress = {
  chapters: UserProductProgressChapter[];
};

export type UserProductChapterReleaseNotification = {
  key: string;
  titleSnapshot: string;
  notificationSentAt: Date;
  notificationId?: Types.ObjectId;
};

export type UserProductChapterReleaseNotifications = {
  chapters: UserProductChapterReleaseNotification[];
};

export type UserProductDocument = UserProduct & Document;

export const UserProductUserSnapshotSchema = new MongooseSchema(
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

export const UserProductSnapshotSchema = new MongooseSchema(
  {
    title: { required: true, trim: true, type: String },
    description: { trim: true, type: String },
    priceIrt: { min: 0, required: true, type: Number },
    discount: {
      type: new MongooseSchema(
        {
          type: {
            enum: Object.values(ProductDiscountType),
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

export const UserProductPurchaseCouponSnapshotSchema = new MongooseSchema(
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

export const UserProductPurchaseSchema = new MongooseSchema(
  {
    status: {
      default: UserProductPurchaseStatus.PENDING,
      enum: Object.values(UserProductPurchaseStatus),
      required: true,
      type: String,
    },
    amountIrt: { min: 0, required: true, type: Number },
    discountPercentage: { max: 100, min: 0, type: Number },
    discountAmountIrt: { min: 0, type: Number },
    finalAmountIrt: { min: 0, required: true, type: Number },
    currency: {
      default: UserProductPurchaseCurrency.IRT,
      enum: Object.values(UserProductPurchaseCurrency),
      required: true,
      type: String,
    },
    paymentMethod: {
      enum: Object.values(UserProductPaymentMethod),
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
    couponSnapshot: { type: UserProductPurchaseCouponSnapshotSchema },
  },
  { _id: false },
);

export const UserProductProgressChapterSchema = new MongooseSchema(
  {
    key: { required: true, trim: true, type: String },
    titleSnapshot: { required: true, trim: true, type: String },
    userCompletedAt: { required: true, type: Date },
  },
  { _id: false },
);

export const UserProductProgressSchema = new MongooseSchema(
  {
    chapters: { default: [], type: [UserProductProgressChapterSchema] },
  },
  { _id: false },
);

export const UserProductChapterReleaseNotificationSchema = new MongooseSchema(
  {
    key: { required: true, trim: true, type: String },
    titleSnapshot: { required: true, trim: true, type: String },
    notificationSentAt: { required: true, type: Date },
    notificationId: { ref: "Notification", type: Types.ObjectId },
  },
  { _id: false },
);

export const UserProductChapterReleaseNotificationsSchema = new MongooseSchema(
  {
    chapters: {
      default: [],
      type: [UserProductChapterReleaseNotificationSchema],
    },
  },
  { _id: false },
);

@Schema({ collection: "user_products" })
export class UserProduct extends BaseIdTimestampableBlameableSchema {
  @Prop({ ref: "User", required: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ ref: "Product", required: true, type: Types.ObjectId })
  productId: Types.ObjectId;

  @Prop({ required: true, type: UserProductUserSnapshotSchema })
  userSnapshot: UserProductUserSnapshot;

  @Prop({ required: true, type: UserProductSnapshotSchema })
  productSnapshot: UserProductSnapshot;

  @Prop({ required: true, type: UserProductPurchaseSchema })
  purchase: UserProductPurchase;

  @Prop({ default: () => ({ chapters: [] }), type: UserProductProgressSchema })
  progress: UserProductProgress;

  @Prop({
    default: () => ({ chapters: [] }),
    type: UserProductChapterReleaseNotificationsSchema,
  })
  chapterReleaseNotifications: UserProductChapterReleaseNotifications;
}

export const UserProductSchema = SchemaFactory.createForClass(UserProduct);

UserProductSchema.plugin(timestampablePlugin);
UserProductSchema.plugin(blameablePlugin);
UserProductSchema.plugin(softDeletePlugin);

UserProductSchema.index({ userId: 1, productId: 1 }, { unique: true });
UserProductSchema.index({ userId: 1 });
UserProductSchema.index({ productId: 1 });
UserProductSchema.index({ "purchase.status": 1 });
UserProductSchema.index({ "purchase.transactionId": 1 }, { sparse: true });
UserProductSchema.index({ "purchase.paymentReference": 1 }, { sparse: true });
UserProductSchema.index(
  { "purchase.couponSnapshot.couponId": 1 },
  { sparse: true },
);
UserProductSchema.index(
  { "purchase.couponSnapshot.code": 1 },
  { sparse: true },
);
UserProductSchema.index({ "purchase.paidAt": -1 });
UserProductSchema.index({ "progress.chapters.key": 1 });
UserProductSchema.index({ "chapterReleaseNotifications.chapters.key": 1 });
UserProductSchema.index({ "audit.createdAt": -1 });
UserProductSchema.index({ "audit.updatedAt": -1 });
