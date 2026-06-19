import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {
  TicketCategory,
  TicketClosedBy,
  TicketPriority,
  TicketStatus,
} from "../../enums";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

export type TicketMessage = {
  body: string;
  attachmentFileIds: Types.ObjectId[];
  senderUserId?: Types.ObjectId;
  sentAt?: Date;
};

export type TicketDocument = Ticket & Document;

export const TicketMessageSchema = new MongooseSchema(
  {
    body: { type: String, required: true, trim: true },
    attachmentFileIds: {
      default: [],
      ref: "StoredFile",
      type: [Types.ObjectId],
    },
    senderUserId: { ref: "User", type: Types.ObjectId },
    sentAt: { type: Date },
  },
  { _id: false },
);

@Schema({ collection: "tickets" })
export class Ticket extends BaseIdTimestampableBlameableSchema {
  @Prop({ required: true, trim: true, type: String })
  title: string;

  @Prop({
    enum: Object.values(TicketCategory),
    required: true,
    type: String,
  })
  category: TicketCategory;

  @Prop({
    default: TicketPriority.MEDIUM,
    enum: Object.values(TicketPriority),
    required: true,
    type: String,
  })
  priority: TicketPriority;

  @Prop({
    default: TicketStatus.OPEN,
    enum: Object.values(TicketStatus),
    required: true,
    type: String,
  })
  status: TicketStatus;

  @Prop({
    enum: Object.values(TicketClosedBy),
    type: String,
  })
  closedBy?: TicketClosedBy;

  @Prop({ ref: "User", type: Types.ObjectId })
  closedByUserId?: Types.ObjectId;

  @Prop({ type: Date })
  closedAt?: Date;

  @Prop({ default: [], type: [TicketMessageSchema] })
  messages: TicketMessage[];
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

TicketSchema.plugin(timestampablePlugin);
TicketSchema.plugin(blameablePlugin);
TicketSchema.plugin(softDeletePlugin);

TicketSchema.index({ status: 1, priority: 1 });
TicketSchema.index({ status: 1, "audit.updatedAt": 1 });
TicketSchema.index({ category: 1 });
TicketSchema.index({ closedByUserId: 1 });
TicketSchema.index({ "audit.createdBy": 1, status: 1 });
TicketSchema.index({ "audit.updatedBy": 1 });
TicketSchema.index({ "audit.createdAt": -1 });
TicketSchema.index({ "audit.updatedAt": -1 });
TicketSchema.index({ closedAt: -1 });
TicketSchema.index({ "messages.attachmentFileIds": 1 });
TicketSchema.index({ title: "text", "messages.body": "text" });
