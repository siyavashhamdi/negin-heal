import { Document, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SessionStatus } from "../../enums";

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true, type: Types.ObjectId, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String })
  deviceInfo?: string; // Device/browser information

  @Prop({ type: String })
  ipAddress?: string; // IP address of login

  @Prop({ required: true, type: Date })
  expiresAt: Date; // Token expiration time

  @Prop({ type: Date })
  revokedAt?: Date; // Set when token is revoked (logout or password change)

  @Prop({ type: Date, default: Date.now })
  lastActivityAt: Date; // Last time token was used

  @Prop({
    type: String,
    default: SessionStatus.ACTIVE,
    enum: Object.values(SessionStatus),
  })
  status: SessionStatus;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Indexes for efficient queries
SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired sessions
