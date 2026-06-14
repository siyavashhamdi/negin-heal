import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { randomUUID } from "crypto";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { CourseDiscountType } from "../../enums";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

export type CourseItem = {
  title: string;
  sortOrder?: number;
  fileId?: Types.ObjectId;
  article?: string | null;
};

export type CourseChapter = {
  key: string;
  title: string;
  description?: string;
  iconFileId?: Types.ObjectId;
  visibleAfterMinutes?: number;
  isFree: boolean;
  sortOrder?: number;
  items: CourseItem[];
};

export type CourseDiscount = {
  type: CourseDiscountType;
  value: number;
};

export type CourseDocument = Course & Document;

export const CourseItemSchema = new MongooseSchema(
  {
    title: { type: String, required: true, trim: true },
    sortOrder: { type: Number },
    fileId: { type: Types.ObjectId, ref: "StoredFile" },
    article: { type: String, default: null },
  },
  { _id: false },
);

export const CourseChapterSchema = new MongooseSchema(
  {
    key: {
      type: String,
      required: true,
      default: randomUUID,
      immutable: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    iconFileId: { type: Types.ObjectId, ref: "StoredFile" },
    visibleAfterMinutes: { type: Number, min: 0 },
    isFree: { type: Boolean, required: true, default: false },
    sortOrder: { type: Number },
    items: { type: [CourseItemSchema], default: [] },
  },
  { _id: false },
);

export const CourseDiscountSchema = new MongooseSchema(
  {
    type: {
      enum: Object.values(CourseDiscountType),
      required: true,
      type: String,
    },
    value: {
      min: 0,
      required: true,
      type: Number,
      validate: {
        message: "Percentage discount value cannot be greater than 100",
        validator(this: CourseDiscount, value: number): boolean {
          return this.type !== CourseDiscountType.PERCENTAGE || value <= 100;
        },
      },
    },
  },
  { _id: false },
);

@Schema({ collection: "courses" })
export class Course extends BaseIdTimestampableBlameableSchema {
  @Prop({ required: true, trim: true, type: String })
  title: string;

  @Prop({ trim: true, type: String })
  description?: string;

  @Prop({ ref: "StoredFile", type: Types.ObjectId })
  coverImageFileId?: Types.ObjectId;

  @Prop({ min: 0, type: Number })
  priceIrt?: number;

  @Prop({ type: CourseDiscountSchema })
  discount?: CourseDiscount;

  @Prop({ default: true, required: true, type: Boolean })
  isActive: boolean;

  @Prop({ default: 0, type: Number })
  sortOrder?: number;

  @Prop({ default: [], trim: true, type: [String] })
  tags?: string[];

  @Prop({ default: [], type: [CourseChapterSchema] })
  chapters: CourseChapter[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);

CourseSchema.plugin(timestampablePlugin);
CourseSchema.plugin(blameablePlugin);
CourseSchema.plugin(softDeletePlugin);

CourseSchema.index({ isActive: 1 });
CourseSchema.index({ sortOrder: 1 });
CourseSchema.index({ title: 1 });
CourseSchema.index({ priceIrt: 1 });
CourseSchema.index({ tags: 1 });
CourseSchema.index({ "chapters.key": 1 }, { unique: true, sparse: true });
CourseSchema.index({ "chapters.visibleAfterMinutes": 1 });
CourseSchema.index({ "chapters.items.fileId": 1 });
CourseSchema.index({ "audit.createdAt": -1 });
CourseSchema.index({ "audit.updatedAt": -1 });
