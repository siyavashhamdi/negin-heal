import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { NotificationMode, NotificationSource } from "../../enums";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";
import { timestampablePlugin } from "../plugins/timestampable.plugin";

export type NotificationDocument = Notification & Document;

@Schema({ collection: "notifications" })
export class Notification extends BaseIdTimestampableBlameableSchema {
  @Prop({ ref: "User", type: Types.ObjectId })
  userId?: Types.ObjectId;

  @Prop({ default: false, required: true, type: Boolean })
  isGlobalAnnouncement: boolean;

  @Prop({
    default: NotificationSource.OTHER,
    enum: Object.values(NotificationSource),
    required: true,
    type: String,
  })
  source: NotificationSource;

  @Prop({
    default: NotificationMode.INFO,
    enum: Object.values(NotificationMode),
    required: true,
    type: String,
  })
  mode: NotificationMode;

  @Prop({ trim: true, type: String })
  title?: string;

  @Prop({ required: true, trim: true, type: String })
  message: string;

  @Prop({ default: {}, type: MongooseSchema.Types.Mixed })
  payload: Record<string, unknown>;

  @Prop({ default: false, required: true, type: Boolean })
  isRead: boolean;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ type: Date })
  archivedAt?: Date;

  @Prop({ type: Date })
  visibleUntil?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.plugin(timestampablePlugin);
NotificationSchema.plugin(blameablePlugin);
NotificationSchema.plugin(softDeletePlugin);

NotificationSchema.pre("validate", function validateNotificationTarget(next) {
  const notification = this as NotificationDocument;

  if (notification.isGlobalAnnouncement) {
    notification.userId = undefined;
    next();
    return;
  }

  if (!notification.userId) {
    next(new Error("userId is required for non-global notifications"));
    return;
  }

  next();
});

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ isGlobalAnnouncement: 1, isRead: 1 });
NotificationSchema.index({ source: 1, isRead: 1 });
NotificationSchema.index({ visibleUntil: 1 });
NotificationSchema.index({ archivedAt: 1 });
NotificationSchema.index({ "audit.createdAt": -1 });
