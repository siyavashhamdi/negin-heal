import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ArrayMinSize,
  ValidateNested,
} from "class-validator";
import { Field, Float, ID, InputType, Int } from "@nestjs/graphql";
import { Types } from "mongoose";

import { CourseDiscountType } from "../../../../enums";
import { toNullableObjectId } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class CourseItemGqlInput {
  @Field({ description: "Course item title" })
  @IsString({ message: "Item title must be a string" })
  @IsNotEmpty({ message: "Item title is required" })
  title: string;

  @Field(() => Int, {
    nullable: true,
    description: "Optional item sort order inside its chapter",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Item sort order must be a number" })
  sortOrder?: number;

  @Field(() => ID, {
    nullable: true,
    description: "Stored file ID attached to this item",
  })
  @IsOptional()
  @IsObjectId({ message: "Item file ID must be a valid MongoDB ObjectId" })
  @Transform(toNullableObjectId)
  fileId?: Types.ObjectId | null;

  @Field({
    nullable: true,
    description: "Article body when this item is text-based",
  })
  @IsOptional()
  @IsString({ message: "Item article must be a string" })
  article?: string | null;
}

@InputType()
export class CourseChapterGqlInput {
  @Field({ description: "Chapter title" })
  @IsString({ message: "Chapter title must be a string" })
  @IsNotEmpty({ message: "Chapter title is required" })
  title: string;

  @Field({ nullable: true, description: "Chapter description" })
  @IsOptional()
  @IsString({ message: "Chapter description must be a string" })
  description?: string | null;

  @Field(() => Int, {
    nullable: true,
    description: "Number of minutes after purchase/enrollment when visible",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "visibleAfterMinutes must be a number" })
  @Min(0)
  visibleAfterMinutes?: number | null;

  @Field({ description: "Whether the chapter is free to access" })
  @IsBoolean({ message: "Chapter isFree must be a boolean" })
  isFree: boolean;

  @Field(() => Int, {
    nullable: true,
    description: "Optional chapter sort order",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Chapter sort order must be a number" })
  sortOrder?: number;

  @Field(() => [CourseItemGqlInput], {
    description: "Chapter items",
  })
  @IsArray({ message: "Chapter items must be an array" })
  @ArrayMinSize(1, { message: "Each chapter must contain at least one item" })
  @ValidateNested({ each: true })
  @Type(() => CourseItemGqlInput)
  items: CourseItemGqlInput[];
}

@InputType()
export class CourseDiscountGqlInput {
  @Field(() => CourseDiscountType, {
    description: "Discount calculation type",
  })
  @IsEnum(CourseDiscountType, {
    message: "Discount type must be PERCENTAGE or FIXED_AMOUNT_IRT",
  })
  type: CourseDiscountType;

  @Field(() => Float, {
    description:
      "Discount value. Percentage for PERCENTAGE, IRT amount for FIXED_AMOUNT_IRT",
  })
  @Type(() => Number)
  @IsNumber({}, { message: "Discount value must be a number" })
  @Min(0)
  value: number;
}

@InputType({ isAbstract: true })
export class CourseWriteGqlInput {
  @Field({ description: "Course title" })
  @IsString({ message: "Course title must be a string" })
  @IsNotEmpty({ message: "Course title is required" })
  title: string;

  @Field({ nullable: true, description: "Course description" })
  @IsOptional()
  @IsString({ message: "Course description must be a string" })
  description?: string | null;

  @Field(() => ID, {
    nullable: true,
    description: "Stored file ID used as the course cover image",
  })
  @IsOptional()
  @IsObjectId({
    message: "Cover image file ID must be a valid MongoDB ObjectId",
  })
  @Transform(toNullableObjectId)
  coverImageFileId?: Types.ObjectId | null;

  @Field(() => Float, {
    nullable: true,
    description: "Course price in IRT",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Course price must be a number" })
  @Min(0)
  priceIrt?: number;

  @Field(() => CourseDiscountGqlInput, {
    nullable: true,
    description: "Optional course discount",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CourseDiscountGqlInput)
  discount?: CourseDiscountGqlInput | null;

  @Field(() => Boolean, {
    nullable: true,
    description: "Whether the course is active",
  })
  @IsOptional()
  @IsBoolean({ message: "Course isActive must be a boolean" })
  isActive?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: "Whether learners can submit reviews for this course",
  })
  @IsOptional()
  @IsBoolean({ message: "Course isReviewSubmissionEnabled must be a boolean" })
  isReviewSubmissionEnabled?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description:
      "Whether the reviews section is visible on the course detail page",
  })
  @IsOptional()
  @IsBoolean({ message: "Course isReviewsSectionVisible must be a boolean" })
  isReviewsSectionVisible?: boolean;

  @Field(() => Float, {
    nullable: true,
    description: "Course display rank used for manual ordering",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Course sort order must be a number" })
  sortOrder?: number;

  @Field(() => [String], {
    nullable: true,
    description: "Course tags",
  })
  @IsOptional()
  @IsArray({ message: "Course tags must be an array" })
  @IsString({ each: true, message: "Each course tag must be a string" })
  tags?: string[];

  @Field(() => [CourseChapterGqlInput], {
    description: "Course chapters",
  })
  @IsArray({ message: "Course chapters must be an array" })
  @ArrayMinSize(1, { message: "At least one course chapter is required" })
  @ValidateNested({ each: true })
  @Type(() => CourseChapterGqlInput)
  chapters: CourseChapterGqlInput[];
}
