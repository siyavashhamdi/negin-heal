import { Document } from "mongoose";

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { BaseIdSchema } from "./base.schema";
import { MigrationStatus } from "../../enums";

export type MigrationDocument = Migration & Document;

@Schema()
export class Migration extends BaseIdSchema {
  @Prop({ required: true, unique: true, type: Number })
  version: number;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({
    required: true,
    enum: Object.values(MigrationStatus),
    type: String,
  })
  status: MigrationStatus;

  @Prop({ type: String })
  error?: string;

  @Prop({ type: Date })
  startedAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Number })
  executionTimeMs?: number;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const MigrationSchema = SchemaFactory.createForClass(Migration);

// Create indexes for better performance
// Note: version index is created automatically by unique: true in @Prop decorator
MigrationSchema.index({ status: 1 });
