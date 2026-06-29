import { Document, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { CouponDiscountType } from "../../enums";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

export type CouponDocument = Coupon & Document;

@Schema({ collection: "coupons" })
export class Coupon extends BaseIdTimestampableBlameableSchema {
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
    enum: Object.values(CouponDiscountType),
    required: true,
    type: String,
  })
  discountType: CouponDiscountType;

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

  @Prop({ default: [], ref: "Product", type: [Types.ObjectId] })
  applicableProductIds?: Types.ObjectId[];

  @Prop({ default: false, required: true, type: Boolean })
  isFirstPurchaseOnly: boolean;

  @Prop({ default: true, required: true, type: Boolean })
  isActive: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

CouponSchema.plugin(timestampablePlugin);
CouponSchema.plugin(blameablePlugin);
CouponSchema.plugin(softDeletePlugin);

CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1 });
CouponSchema.index({ startsAt: 1, expiresAt: 1 });
CouponSchema.index({ applicableProductIds: 1 });
CouponSchema.index({ "audit.createdAt": -1 });
CouponSchema.index({ "audit.updatedAt": -1 });
