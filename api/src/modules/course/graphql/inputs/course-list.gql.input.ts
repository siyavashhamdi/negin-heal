import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Field, Float, InputType } from "@nestjs/graphql";

import { CourseItemType, CourseReleaseType } from "../../../../enums";
import {
  CursorPageOptionsParamsInput,
  PaginationCursorInput,
} from "../../../../common/pagination/input";
import { CourseListSortOptionInput } from "./course-list-sort-option.gql.input";

@InputType()
export class CourseListFilterInput {
  @Field({
    nullable: true,
    description:
      "Search query that matches title, description, tags, chapter titles, item titles, and article text",
  })
  @IsOptional()
  @IsString({ message: "Query filter must be a string" })
  query?: string;

  @Field({ nullable: true, description: "Filter courses by title" })
  @IsOptional()
  @IsString({ message: "Title filter must be a string" })
  title?: string;

  @Field({ nullable: true, description: "Filter courses by description" })
  @IsOptional()
  @IsString({ message: "Description filter must be a string" })
  description?: string;

  @Field(() => Boolean, {
    nullable: true,
    description: "Filter by active state",
  })
  @IsOptional()
  @IsBoolean({ message: "isActive filter must be a boolean" })
  isActive?: boolean;

  @Field(() => [String], {
    nullable: true,
    description: "Return courses that contain at least one of these tags",
  })
  @IsOptional()
  @IsArray({ message: "tagsAny filter must be an array" })
  @IsString({ each: true, message: "Each tag must be a string" })
  tagsAny?: string[];

  @Field(() => [String], {
    nullable: true,
    description: "Return courses that contain every tag in this list",
  })
  @IsOptional()
  @IsArray({ message: "tagsAll filter must be an array" })
  @IsString({ each: true, message: "Each tag must be a string" })
  tagsAll?: string[];

  @Field(() => Float, {
    nullable: true,
    description: "Minimum price in IRT",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Minimum price must be a number" })
  @Min(0)
  minPriceIrt?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Maximum price in IRT",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Maximum price must be a number" })
  @Min(0)
  maxPriceIrt?: number;

  @Field(() => Boolean, {
    nullable: true,
    description: "Filter courses by whether a price is set",
  })
  @IsOptional()
  @IsBoolean({ message: "hasPrice filter must be a boolean" })
  hasPrice?: boolean;

  @Field(() => CourseReleaseType, {
    nullable: true,
    description:
      "Filter by calculated release type. GRADUAL means at least one chapter has visibleAfterMinutes.",
  })
  @IsOptional()
  @IsEnum(CourseReleaseType, {
    message: "Release type filter must be IMMEDIATE or GRADUAL",
  })
  releaseType?: CourseReleaseType;

  @Field(() => CourseItemType, {
    nullable: true,
    description:
      "Filter courses containing at least one calculated item type. ARTICLE means an item without fileId.",
  })
  @IsOptional()
  @IsEnum(CourseItemType, {
    message: "Item type filter must be ARTICLE, VIDEO, VOICE, or IMAGE",
  })
  itemType?: CourseItemType;

  @Field(() => Boolean, {
    nullable: true,
    description:
      "Filter by whether the current user has purchased the course. Used by userCourseList.",
  })
  @IsOptional()
  @IsBoolean({ message: "isPurchased filter must be a boolean" })
  isPurchased?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: "Filter courses that contain at least one free chapter",
  })
  @IsOptional()
  @IsBoolean({ message: "hasFreeChapter filter must be a boolean" })
  hasFreeChapter?: boolean;
}

@InputType()
export class CourseListCursorPageOptionsParamsInput extends CursorPageOptionsParamsInput {
  @Field(() => CourseListSortOptionInput, {
    nullable: true,
    description: "Sort options as a map of field names to sort order",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CourseListSortOptionInput)
  sort?: CourseListSortOptionInput;
}

@InputType()
export class CourseListGqlInput extends PaginationCursorInput<CourseListFilterInput> {
  @Field(() => CourseListFilterInput, {
    nullable: true,
    description: "Filter options for narrowing down the course list",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CourseListFilterInput)
  filters?: CourseListFilterInput;

  @Field(() => CourseListCursorPageOptionsParamsInput, {
    nullable: true,
    description: "Pagination and sorting options",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CourseListCursorPageOptionsParamsInput)
  options?: CourseListCursorPageOptionsParamsInput;
}
