import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { randomUUID } from "crypto";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { CourseReviewVisibility } from "../../enums";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

export type CourseReviewUserSnapshot = {
  fullName: string;
  username: string;
  avatarFileId?: Types.ObjectId;
};

export type CourseReviewCourseSnapshot = {
  title: string;
};

export type CourseReviewModeration = {
  visibility: CourseReviewVisibility;
  hiddenAt?: Date;
  hiddenBy?: Types.ObjectId;
  hiddenReason?: string;
};

export type CourseReviewRating = {
  stars: number;
  comment?: string;
  ratedAt: Date;
  updatedAt?: Date;
  moderation: CourseReviewModeration;
};

export type CourseReviewMessage = {
  key: string;
  body: string;
  senderUserId: Types.ObjectId;
  senderSnapshot: CourseReviewUserSnapshot;
  sentAt: Date;
  moderation: CourseReviewModeration;
};

export type CourseReviewDocument = CourseReview & Document;

export const CourseReviewUserSnapshotSchema = new MongooseSchema(
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

export const CourseReviewCourseSnapshotSchema = new MongooseSchema(
  {
    title: { required: true, trim: true, type: String },
  },
  { _id: false },
);

export const CourseReviewModerationSchema = new MongooseSchema(
  {
    visibility: {
      enum: Object.values(CourseReviewVisibility),
      required: true,
      type: String,
    },
    hiddenAt: { type: Date },
    hiddenBy: { ref: "User", type: Types.ObjectId },
    hiddenReason: { trim: true, type: String },
  },
  { _id: false },
);

export const CourseReviewRatingSchema = new MongooseSchema(
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
        visibility: CourseReviewVisibility.PUBLIC,
      }),
      required: true,
      type: CourseReviewModerationSchema,
    },
  },
  { _id: false },
);

export const CourseReviewMessageSchema = new MongooseSchema(
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
      type: CourseReviewUserSnapshotSchema,
    },
    sentAt: { default: Date.now, required: true, type: Date },
    moderation: {
      default: () => ({
        visibility: CourseReviewVisibility.PRIVATE,
      }),
      required: true,
      type: CourseReviewModerationSchema,
    },
  },
  { _id: false },
);

@Schema({ collection: "course_reviews" })
export class CourseReview extends BaseIdTimestampableBlameableSchema {
  @Prop({ ref: "User", required: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ ref: "Course", required: true, type: Types.ObjectId })
  courseId: Types.ObjectId;

  @Prop({ ref: "UserCourse", required: false, type: Types.ObjectId })
  userCourseId?: Types.ObjectId;

  @Prop({ required: true, type: CourseReviewUserSnapshotSchema })
  userSnapshot: CourseReviewUserSnapshot;

  @Prop({ required: true, type: CourseReviewCourseSnapshotSchema })
  courseSnapshot: CourseReviewCourseSnapshot;

  @Prop({
    default: () => ({
      visibility: CourseReviewVisibility.PUBLIC,
    }),
    required: true,
    type: CourseReviewModerationSchema,
  })
  moderation: CourseReviewModeration;

  @Prop({ type: CourseReviewRatingSchema })
  rating?: CourseReviewRating;

  @Prop({ default: [], type: [CourseReviewMessageSchema] })
  messages: CourseReviewMessage[];
}

export const CourseReviewSchema = SchemaFactory.createForClass(CourseReview);

CourseReviewSchema.plugin(timestampablePlugin);
CourseReviewSchema.plugin(blameablePlugin);
CourseReviewSchema.plugin(softDeletePlugin);

CourseReviewSchema.pre("validate", function validateHiddenModeration(next) {
  const review = this as CourseReviewDocument;

  const validateModeration = (
    moderation: CourseReviewModeration | undefined,
    pathPrefix: string,
  ): void => {
    if (!moderation) {
      return;
    }

    if (moderation.visibility === CourseReviewVisibility.HIDDEN) {
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

CourseReviewSchema.index(
  { userId: 1, courseId: 1 },
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
CourseReviewSchema.index({ userId: 1, "audit.updatedAt": -1 });
CourseReviewSchema.index({ courseId: 1, "audit.updatedAt": -1 });
CourseReviewSchema.index(
  { courseId: 1, "moderation.visibility": 1, "audit.updatedAt": -1 },
  {
    partialFilterExpression: {
      "moderation.visibility": CourseReviewVisibility.PUBLIC,
    },
  },
);
CourseReviewSchema.index(
  { "moderation.visibility": 1, "moderation.hiddenAt": -1 },
  {
    partialFilterExpression: {
      "moderation.visibility": CourseReviewVisibility.HIDDEN,
    },
  },
);
CourseReviewSchema.index(
  { courseId: 1, "rating.moderation.visibility": 1, "rating.ratedAt": -1 },
  {
    partialFilterExpression: {
      rating: { $exists: true, $ne: null },
      "rating.moderation.visibility": CourseReviewVisibility.PUBLIC,
    },
  },
);
CourseReviewSchema.index(
  { courseId: 1, "rating.stars": 1 },
  {
    partialFilterExpression: {
      rating: { $exists: true, $ne: null },
      "rating.moderation.visibility": CourseReviewVisibility.PUBLIC,
    },
  },
);
CourseReviewSchema.index(
  { userCourseId: 1 },
  {
    partialFilterExpression: {
      userCourseId: { $exists: true, $ne: null },
      $or: [
        { "audit.deletedAt": null },
        { "audit.deletedAt": { $exists: false } },
      ],
    },
    unique: true,
  },
);
CourseReviewSchema.index({ "messages.key": 1 }, { unique: true, sparse: true });
CourseReviewSchema.index(
  { "rating.moderation.visibility": 1, "rating.moderation.hiddenAt": -1 },
  {
    partialFilterExpression: {
      "rating.moderation.visibility": CourseReviewVisibility.HIDDEN,
    },
  },
);
CourseReviewSchema.index({ "messages.moderation.visibility": 1 });
CourseReviewSchema.index({
  "courseSnapshot.title": "text",
  "messages.body": "text",
  "rating.comment": "text",
  "userSnapshot.fullName": "text",
});
CourseReviewSchema.index({ "audit.createdAt": -1 });
CourseReviewSchema.index({ "audit.updatedAt": -1 });
