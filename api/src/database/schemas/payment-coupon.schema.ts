import { Document, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { PaymentCouponDiscountType } from "../../enums";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

export type PaymentCouponDocument = PaymentCoupon & Document;

@Schema({ collection: "payment_coupons" })
export class PaymentCoupon extends BaseIdTimestampableBlameableSchema {
  @Prop({
    required: true,
    set: (value: string) => value.trim().toUpperCase(),
    trim: true,
    type: String,
    unique: true,
  })
  code: string;

  @Prop({ required: true, trim: true, type: String })
  title: string;

  @Prop({ trim: true, type: String })
  description?: string;

  @Prop({
    enum: Object.values(PaymentCouponDiscountType),
    required: true,
    type: String,
  })
  discountType: PaymentCouponDiscountType;

  @Prop({ min: 0, required: true, type: Number })
  discountValue: number;

  @Prop({ type: Date })
  startsAt?: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ min: 1, type: Number })
  totalUsageLimit?: number;

  @Prop({ min: 1, type: Number })
  perUserUsageLimit?: number;

  @Prop({ default: [], ref: "Course", type: [Types.ObjectId] })
  applicableCourseIds?: Types.ObjectId[];

  @Prop({ default: false, required: true, type: Boolean })
  isFirstPurchaseOnly: boolean;

  @Prop({ default: true, required: true, type: Boolean })
  isActive: boolean;
}

export const PaymentCouponSchema = SchemaFactory.createForClass(PaymentCoupon);

PaymentCouponSchema.plugin(timestampablePlugin);
PaymentCouponSchema.plugin(blameablePlugin);
PaymentCouponSchema.plugin(softDeletePlugin);

PaymentCouponSchema.index({ code: 1 }, { unique: true });
PaymentCouponSchema.index({ isActive: 1 });
PaymentCouponSchema.index({ startsAt: 1, expiresAt: 1 });
PaymentCouponSchema.index({ applicableCourseIds: 1 });
PaymentCouponSchema.index({ "audit.createdAt": -1 });
PaymentCouponSchema.index({ "audit.updatedAt": -1 });
