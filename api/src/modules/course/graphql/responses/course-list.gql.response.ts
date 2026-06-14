import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import {
  CourseDiscountType,
  CourseItemType,
  CourseReleaseType,
} from "../../../../enums";
import { PaginationCursorResponse } from "../../../../common/pagination/response";

@ObjectType()
export class CourseListItemGqlResponse {
  @Field({ description: "Course item title" })
  title: string;

  @Field(() => Int, {
    nullable: true,
    description: "Optional item sort order inside its chapter",
  })
  sortOrder?: number;

  @Field(() => ID, {
    nullable: true,
    description: "Stored file ID attached to this item",
  })
  fileId?: Types.ObjectId;

  @Field({
    nullable: true,
    description: "Article body when this item is text-based",
  })
  article?: string | null;

  @Field(() => CourseItemType, {
    description:
      "Calculated item type. File-backed items are resolved from stored file MIME type; items without fileId are ARTICLE.",
  })
  type: CourseItemType;
}

@ObjectType()
export class CourseListChapterGqlResponse {
  @Field({ description: "Chapter title" })
  title: string;

  @Field({ nullable: true, description: "Chapter description" })
  description?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Stored file ID used as the chapter icon",
  })
  iconFileId?: Types.ObjectId;

  @Field(() => Int, {
    nullable: true,
    description: "Number of minutes after purchase/enrollment when visible",
  })
  visibleAfterMinutes?: number;

  @Field({ description: "Whether the chapter is free to access" })
  isFree: boolean;

  @Field(() => Int, {
    nullable: true,
    description: "Optional chapter sort order",
  })
  sortOrder?: number;

  @Field(() => [CourseListItemGqlResponse], {
    description: "Chapter items",
  })
  items: CourseListItemGqlResponse[];
}

@ObjectType()
export class CourseListDiscountGqlResponse {
  @Field(() => CourseDiscountType, {
    description: "Discount calculation type",
  })
  type: CourseDiscountType;

  @Field(() => Float, {
    description:
      "Discount value. Percentage for PERCENTAGE, IRT amount for FIXED_AMOUNT_IRT",
  })
  value: number;
}

@ObjectType()
export class CourseListGqlResponse {
  @Field(() => ID, { description: "Course ID" })
  id: Types.ObjectId;

  @Field({ description: "Course title" })
  title: string;

  @Field({ nullable: true, description: "Course description" })
  description?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Stored file ID used as the course cover image",
  })
  coverImageFileId?: Types.ObjectId;

  @Field(() => Float, {
    nullable: true,
    description: "Course price in IRT",
  })
  priceIrt?: number;

  @Field(() => CourseListDiscountGqlResponse, {
    nullable: true,
    description: "Optional course discount",
  })
  discount?: CourseListDiscountGqlResponse;

  @Field({ description: "Whether the course is active" })
  isActive: boolean;

  @Field(() => Float, {
    nullable: true,
    description: "Course display rank used for manual ordering",
  })
  sortOrder?: number;

  @Field(() => [String], { description: "Course tags" })
  tags: string[];

  @Field(() => CourseReleaseType, {
    description:
      "Calculated release strategy. GRADUAL means at least one chapter has visibleAfterMinutes.",
  })
  releaseType: CourseReleaseType;

  @Field(() => [CourseListChapterGqlResponse], {
    description: "Course chapters",
  })
  chapters: CourseListChapterGqlResponse[];

  @Field({ nullable: true, description: "Date when the course was created" })
  createdAt?: Date;

  @Field({
    nullable: true,
    description: "Date when the course was last updated",
  })
  updatedAt?: Date;
}

@ObjectType()
export class CourseListPaginatedCursorGqlResponse {
  @Field(() => [CourseListGqlResponse], {
    description: "List of courses",
  })
  items: CourseListGqlResponse[];

  @Field(() => PaginationCursorResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationCursorResponse;
}
