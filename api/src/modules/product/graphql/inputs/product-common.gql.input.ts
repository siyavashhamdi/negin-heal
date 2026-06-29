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

import { ProductDiscountType } from "../../../../enums";
import { toNullableObjectId } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class ProductItemGqlInput {
  @Field({ description: "Product item title" })
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
export class ProductChapterGqlInput {
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

  @Field(() => [ProductItemGqlInput], {
    description: "Chapter items",
  })
  @IsArray({ message: "Chapter items must be an array" })
  @ArrayMinSize(1, { message: "Each chapter must contain at least one item" })
  @ValidateNested({ each: true })
  @Type(() => ProductItemGqlInput)
  items: ProductItemGqlInput[];
}

@InputType()
export class ProductDiscountGqlInput {
  @Field(() => ProductDiscountType, {
    description: "Discount calculation type",
  })
  @IsEnum(ProductDiscountType, {
    message: "Discount type must be PERCENTAGE or FIXED_AMOUNT_IRT",
  })
  type: ProductDiscountType;

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
export class ProductWriteGqlInput {
  @Field({ description: "Product title" })
  @IsString({ message: "Product title must be a string" })
  @IsNotEmpty({ message: "Product title is required" })
  title: string;

  @Field({ nullable: true, description: "Product description" })
  @IsOptional()
  @IsString({ message: "Product description must be a string" })
  description?: string | null;

  @Field(() => ID, {
    nullable: true,
    description: "Stored file ID used as the product cover image",
  })
  @IsOptional()
  @IsObjectId({
    message: "Cover image file ID must be a valid MongoDB ObjectId",
  })
  @Transform(toNullableObjectId)
  coverImageFileId?: Types.ObjectId | null;

  @Field(() => Float, {
    nullable: true,
    description: "Product price in IRT",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Product price must be a number" })
  @Min(0)
  priceIrt?: number;

  @Field(() => ProductDiscountGqlInput, {
    nullable: true,
    description: "Optional product discount",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDiscountGqlInput)
  discount?: ProductDiscountGqlInput | null;

  @Field(() => Boolean, {
    nullable: true,
    description: "Whether the product is active",
  })
  @IsOptional()
  @IsBoolean({ message: "Product isActive must be a boolean" })
  isActive?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: "Whether learners can submit reviews for this product",
  })
  @IsOptional()
  @IsBoolean({ message: "Product isReviewSubmissionEnabled must be a boolean" })
  isReviewSubmissionEnabled?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description:
      "Whether the reviews section is visible on the product detail page",
  })
  @IsOptional()
  @IsBoolean({ message: "Product isReviewsSectionVisible must be a boolean" })
  isReviewsSectionVisible?: boolean;

  @Field(() => Float, {
    nullable: true,
    description: "Product display rank used for manual ordering",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Product sort order must be a number" })
  sortOrder?: number;

  @Field(() => [String], {
    nullable: true,
    description: "Product tags",
  })
  @IsOptional()
  @IsArray({ message: "Product tags must be an array" })
  @IsString({ each: true, message: "Each product tag must be a string" })
  tags?: string[];

  @Field(() => [ProductChapterGqlInput], {
    description: "Product chapters",
  })
  @IsArray({ message: "Product chapters must be an array" })
  @ArrayMinSize(1, { message: "At least one product chapter is required" })
  @ValidateNested({ each: true })
  @Type(() => ProductChapterGqlInput)
  chapters: ProductChapterGqlInput[];
}
