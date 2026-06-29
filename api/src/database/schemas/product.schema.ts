import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { randomUUID } from "crypto";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ProductDiscountType } from "../../enums";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

export type ProductItem = {
  title: string;
  sortOrder?: number;
  fileId?: Types.ObjectId;
  article?: string | null;
};

export type ProductChapter = {
  key: string;
  title: string;
  description?: string;
  visibleAfterMinutes?: number;
  isFree: boolean;
  sortOrder?: number;
  items: ProductItem[];
};

export type ProductDiscount = {
  type: ProductDiscountType;
  value: number;
};

export type ProductDocument = Product & Document;

export const ProductItemSchema = new MongooseSchema(
  {
    title: { type: String, required: true, trim: true },
    sortOrder: { type: Number },
    fileId: { type: Types.ObjectId, ref: "StoredFile" },
    article: { type: String, default: null },
  },
  { _id: false },
);

export const ProductChapterSchema = new MongooseSchema(
  {
    key: {
      type: String,
      required: true,
      default: randomUUID,
      immutable: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    visibleAfterMinutes: { type: Number, min: 0 },
    isFree: { type: Boolean, required: true, default: false },
    sortOrder: { type: Number },
    items: { type: [ProductItemSchema], default: [] },
  },
  { _id: false },
);

export const ProductDiscountSchema = new MongooseSchema(
  {
    type: {
      enum: Object.values(ProductDiscountType),
      required: true,
      type: String,
    },
    value: {
      min: 0,
      required: true,
      type: Number,
      validate: {
        message: "Percentage discount value cannot be greater than 100",
        validator(this: ProductDiscount, value: number): boolean {
          return this.type !== ProductDiscountType.PERCENTAGE || value <= 100;
        },
      },
    },
  },
  { _id: false },
);

@Schema({ collection: "products" })
export class Product extends BaseIdTimestampableBlameableSchema {
  @Prop({ required: true, trim: true, type: String })
  title: string;

  @Prop({ trim: true, type: String })
  description?: string;

  @Prop({ ref: "StoredFile", type: Types.ObjectId })
  coverImageFileId?: Types.ObjectId;

  @Prop({ min: 0, type: Number })
  priceIrt?: number;

  @Prop({ type: ProductDiscountSchema })
  discount?: ProductDiscount;

  @Prop({ default: true, required: true, type: Boolean })
  isActive: boolean;

  @Prop({ default: true, required: true, type: Boolean })
  isReviewSubmissionEnabled: boolean;

  @Prop({ default: true, required: true, type: Boolean })
  isReviewsSectionVisible: boolean;

  @Prop({ default: 0, type: Number })
  sortOrder?: number;

  @Prop({ default: [], trim: true, type: [String] })
  tags?: string[];

  @Prop({ default: [], type: [ProductChapterSchema] })
  chapters: ProductChapter[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.plugin(timestampablePlugin);
ProductSchema.plugin(blameablePlugin);
ProductSchema.plugin(softDeletePlugin);

ProductSchema.index({ isActive: 1 });
ProductSchema.index({ sortOrder: 1 });
ProductSchema.index({ title: 1 });
ProductSchema.index({ priceIrt: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ "chapters.key": 1 }, { unique: true, sparse: true });
ProductSchema.index({ "chapters.visibleAfterMinutes": 1 });
ProductSchema.index({ "chapters.items.fileId": 1 });
ProductSchema.index({ "audit.createdAt": -1 });
ProductSchema.index({ "audit.updatedAt": -1 });
