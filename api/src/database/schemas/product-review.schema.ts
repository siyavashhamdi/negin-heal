import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { randomUUID } from "crypto";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ProductReviewVisibility } from "../../enums";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

export type ProductReviewUserSnapshot = {
  fullName: string;
  username: string;
  avatarFileId?: Types.ObjectId;
};

export type ProductReviewProductSnapshot = {
  title: string;
};

export type ProductReviewModeration = {
  visibility: ProductReviewVisibility;
  hiddenAt?: Date;
  hiddenBy?: Types.ObjectId;
  hiddenReason?: string;
};

export type ProductReviewRating = {
  stars: number;
  comment?: string;
  ratedAt: Date;
  updatedAt?: Date;
  moderation: ProductReviewModeration;
};

export type ProductReviewMessage = {
  key: string;
  body: string;
  senderUserId: Types.ObjectId;
  senderSnapshot: ProductReviewUserSnapshot;
  sentAt: Date;
  moderation: ProductReviewModeration;
};

export type ProductReviewDocument = ProductReview & Document;

export const ProductReviewUserSnapshotSchema = new MongooseSchema(
  {
    fullName: { required: true, trim: true, type: String },
    username: {
      lowercase: true,
      required: true,
      trim: true,
      type: String,
    },
    avatarFileId: { ref: "StoredFile", type: Types.ObjectId },
  },
  { _id: false },
);

export const ProductReviewProductSnapshotSchema = new MongooseSchema(
  {
    title: { required: true, trim: true, type: String },
  },
  { _id: false },
);

export const ProductReviewModerationSchema = new MongooseSchema(
  {
    visibility: {
      enum: Object.values(ProductReviewVisibility),
      required: true,
      type: String,
    },
    hiddenAt: { type: Date },
    hiddenBy: { ref: "User", type: Types.ObjectId },
    hiddenReason: { trim: true, type: String },
  },
  { _id: false },
);

export const ProductReviewRatingSchema = new MongooseSchema(
  {
    stars: {
      max: 5,
      min: 1,
      required: true,
      type: Number,
      validate: {
        message: "Rating stars must be a whole number between 1 and 5",
        validator: Number.isInteger,
      },
    },
    comment: { maxlength: 2000, trim: true, type: String },
    ratedAt: { required: true, type: Date },
    updatedAt: { type: Date },
    moderation: {
      default: () => ({
        visibility: ProductReviewVisibility.PUBLIC,
      }),
      required: true,
      type: ProductReviewModerationSchema,
    },
  },
  { _id: false },
);

export const ProductReviewMessageSchema = new MongooseSchema(
  {
    key: {
      default: randomUUID,
      immutable: true,
      required: true,
      type: String,
    },
    body: { maxlength: 5000, required: true, trim: true, type: String },
    senderUserId: { ref: "User", required: true, type: Types.ObjectId },
    senderSnapshot: {
      required: true,
      type: ProductReviewUserSnapshotSchema,
    },
    sentAt: { default: Date.now, required: true, type: Date },
    moderation: {
      default: () => ({
        visibility: ProductReviewVisibility.PRIVATE,
      }),
      required: true,
      type: ProductReviewModerationSchema,
    },
  },
  { _id: false },
);

@Schema({ collection: "product_reviews" })
export class ProductReview extends BaseIdTimestampableBlameableSchema {
  @Prop({ ref: "User", required: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ ref: "Product", required: true, type: Types.ObjectId })
  productId: Types.ObjectId;

  @Prop({ ref: "UserProduct", required: false, type: Types.ObjectId })
  userProductId?: Types.ObjectId;

  @Prop({ required: true, type: ProductReviewUserSnapshotSchema })
  userSnapshot: ProductReviewUserSnapshot;

  @Prop({ required: true, type: ProductReviewProductSnapshotSchema })
  productSnapshot: ProductReviewProductSnapshot;

  @Prop({
    default: () => ({
      visibility: ProductReviewVisibility.PUBLIC,
    }),
    required: true,
    type: ProductReviewModerationSchema,
  })
  moderation: ProductReviewModeration;

  @Prop({ type: ProductReviewRatingSchema })
  rating?: ProductReviewRating;

  @Prop({ default: [], type: [ProductReviewMessageSchema] })
  messages: ProductReviewMessage[];
}

export const ProductReviewSchema = SchemaFactory.createForClass(ProductReview);

ProductReviewSchema.plugin(timestampablePlugin);
ProductReviewSchema.plugin(blameablePlugin);
ProductReviewSchema.plugin(softDeletePlugin);

ProductReviewSchema.pre("validate", function validateHiddenModeration(next) {
  const review = this as ProductReviewDocument;

  const validateModeration = (
    moderation: ProductReviewModeration | undefined,
    pathPrefix: string,
  ): void => {
    if (!moderation) {
      return;
    }

    if (moderation.visibility === ProductReviewVisibility.HIDDEN) {
      if (!moderation.hiddenAt) {
        this.invalidate(
          `${pathPrefix}.hiddenAt`,
          "hiddenAt is required when visibility is HIDDEN",
        );
      }
      if (!moderation.hiddenBy) {
        this.invalidate(
          `${pathPrefix}.hiddenBy`,
          "hiddenBy is required when visibility is HIDDEN",
        );
      }
      return;
    }

    if (moderation.hiddenAt || moderation.hiddenBy || moderation.hiddenReason) {
      this.invalidate(
        `${pathPrefix}.visibility`,
        "hiddenAt, hiddenBy, and hiddenReason are only allowed when visibility is HIDDEN",
      );
    }
  };

  validateModeration(review.moderation, "moderation");
  validateModeration(review.rating?.moderation, "rating.moderation");

  review.messages?.forEach((message, index) => {
    validateModeration(message.moderation, `messages.${index}.moderation`);
  });

  next();
});

ProductReviewSchema.index(
  { userId: 1, productId: 1 },
  {
    partialFilterExpression: {
      $or: [
        { "audit.deletedAt": null },
        { "audit.deletedAt": { $exists: false } },
      ],
    },
    unique: true,
  },
);
ProductReviewSchema.index({ userId: 1, "audit.updatedAt": -1 });
ProductReviewSchema.index({ productId: 1, "audit.updatedAt": -1 });
ProductReviewSchema.index(
  { productId: 1, "moderation.visibility": 1, "audit.updatedAt": -1 },
  {
    partialFilterExpression: {
      "moderation.visibility": ProductReviewVisibility.PUBLIC,
    },
  },
);
ProductReviewSchema.index(
  { "moderation.visibility": 1, "moderation.hiddenAt": -1 },
  {
    partialFilterExpression: {
      "moderation.visibility": ProductReviewVisibility.HIDDEN,
    },
  },
);
ProductReviewSchema.index(
  { productId: 1, "rating.moderation.visibility": 1, "rating.ratedAt": -1 },
  {
    partialFilterExpression: {
      rating: { $exists: true, $ne: null },
      "rating.moderation.visibility": ProductReviewVisibility.PUBLIC,
    },
  },
);
ProductReviewSchema.index(
  { productId: 1, "rating.stars": 1 },
  {
    partialFilterExpression: {
      rating: { $exists: true, $ne: null },
      "rating.moderation.visibility": ProductReviewVisibility.PUBLIC,
    },
  },
);
ProductReviewSchema.index(
  { userProductId: 1 },
  {
    partialFilterExpression: {
      userProductId: { $exists: true, $ne: null },
      $or: [
        { "audit.deletedAt": null },
        { "audit.deletedAt": { $exists: false } },
      ],
    },
    unique: true,
  },
);
ProductReviewSchema.index(
  { "messages.key": 1 },
  { unique: true, sparse: true },
);
ProductReviewSchema.index(
  { "rating.moderation.visibility": 1, "rating.moderation.hiddenAt": -1 },
  {
    partialFilterExpression: {
      "rating.moderation.visibility": ProductReviewVisibility.HIDDEN,
    },
  },
);
ProductReviewSchema.index({ "messages.moderation.visibility": 1 });
ProductReviewSchema.index({
  "productSnapshot.title": "text",
  "messages.body": "text",
  "rating.comment": "text",
  "userSnapshot.fullName": "text",
});
ProductReviewSchema.index({ "audit.createdAt": -1 });
ProductReviewSchema.index({ "audit.updatedAt": -1 });
