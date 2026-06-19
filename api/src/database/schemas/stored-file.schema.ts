import { Document } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

export type StoredFileDocument = StoredFile & Document;

@Schema({ collection: "files" })
export class StoredFile extends BaseIdTimestampableBlameableSchema {
  @Prop({ required: true, trim: true, type: String })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, type: String })
  mimeType: string;

  @Prop({ required: true, min: 0, type: Number })
  sizeBytes: number;

  @Prop({ required: true, trim: true, type: String })
  path: string;

  @Prop({ required: true, trim: true, type: String })
  bucket: string;

  @Prop({ required: true, trim: true, type: String })
  objectKey: string;

  @Prop({ type: Date })
  uploadedAt?: Date;

  @Prop({ type: Boolean })
  isSystemOrphanCleanup?: boolean;
}

export const StoredFileSchema = SchemaFactory.createForClass(StoredFile);

StoredFileSchema.plugin(timestampablePlugin);
StoredFileSchema.plugin(blameablePlugin);
StoredFileSchema.plugin(softDeletePlugin);

StoredFileSchema.index({ bucket: 1, objectKey: 1 }, { unique: true });
StoredFileSchema.index({ path: 1 });
StoredFileSchema.index({ mimeType: 1 });
StoredFileSchema.index({ "audit.createdAt": -1 });
