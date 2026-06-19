import { Document, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SessionStatus } from "../../enums";
import {
  SessionClientContext,
  SessionClientContextSchema,
} from "./session-client-context.schema";

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true, type: Types.ObjectId, index: true })
  userId: Types.ObjectId;

  @Prop({ type: SessionClientContextSchema })
  clientContext?: SessionClientContext;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ type: Date })
  revokedAt?: Date;

  @Prop({ type: Date, default: Date.now })
  lastActivityAt: Date;

  @Prop({
    type: String,
    default: SessionStatus.ACTIVE,
    enum: Object.values(SessionStatus),
  })
  status: SessionStatus;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
