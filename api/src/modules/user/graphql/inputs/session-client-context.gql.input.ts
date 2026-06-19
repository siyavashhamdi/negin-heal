import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { Field, Float, InputType, Int } from "@nestjs/graphql";

@InputType()
export class SessionClientContextGqlInput {
  @Field({
    nullable: true,
    description: "browser | ios_app | android_app | installed_pwa",
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  clientType?: string;

  @Field({ nullable: true, description: "Human-readable device name" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceName?: string;

  @Field({ nullable: true, description: "Device model when available" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceModel?: string;

  @Field({ nullable: true, description: "mobile | tablet | desktop | unknown" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  deviceCategory?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  osName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  osVersion?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  browserName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  browserVersion?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  engineName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  architecture?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  bitness?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  platform?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  screenResolution?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  viewportSize?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  devicePixelRatio?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  language?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  languages?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  timezoneOffset?: string;

  @Field({ nullable: true, description: "dark | light | no-preference" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  colorScheme?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  touchInput?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxTouchPoints?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  connectionType?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  downlinkMbps?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  rttMs?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  saveData?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  cpuCores?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  deviceMemoryGb?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  cookiesEnabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  pdfViewerEnabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  appVersion?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  pageUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  referrer?: string;
}
