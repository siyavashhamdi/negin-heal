import { Document, Schema as MongooseSchema } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { AppSettingValueType } from "../../enums";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

export type AppSettingDocument = AppSetting & Document;

@Schema({ collection: "app_settings" })
export class AppSetting extends BaseIdTimestampableBlameableSchema {
  @Prop({ required: true, trim: true, type: String, unique: true })
  key: string;

  @Prop({ required: true, trim: true, type: String })
  label: string;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  value: unknown;

  @Prop({
    enum: Object.values(AppSettingValueType),
    required: true,
    type: String,
  })
  valueType: AppSettingValueType;

  @Prop({ trim: true, type: String })
  description?: string;

  @Prop({ default: true, required: true, type: Boolean })
  isActive: boolean;
}

export const AppSettingSchema = SchemaFactory.createForClass(AppSetting);

AppSettingSchema.plugin(timestampablePlugin);
AppSettingSchema.plugin(blameablePlugin);
AppSettingSchema.plugin(softDeletePlugin);

AppSettingSchema.index({ key: 1 }, { unique: true });
AppSettingSchema.index({ isActive: 1 });
AppSettingSchema.index({ valueType: 1 });
AppSettingSchema.index({ "audit.createdAt": -1 });
AppSettingSchema.index({ "audit.updatedAt": -1 });
