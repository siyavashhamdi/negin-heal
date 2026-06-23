import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Field, ID, InputType, Int } from "@nestjs/graphql";

import { CourseReviewVisibility } from "../../../../enums";
import {
  CursorPageOptionsParamsInput,
  PaginationCursorInput,
} from "../../../../common/pagination/input";
import { UserCourseReviewListSortOptionInput } from "./user-course-review-list-sort-option.gql.input";

@InputType()
export class CourseReviewListFilterInput {
  @Field({
    nullable: true,
    description:
      "Search query that matches rating comment, message body, user snapshot, or course title",
  })
  @IsOptional()
  @IsString({ message: "Query filter must be a string" })
  query?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter reviews by course ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Course ID must be a valid Mongo ID" })
  courseId?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter reviews by review owner user ID",
  })
  @IsOptional()
  @IsMongoId({ message: "User ID must be a valid Mongo ID" })
  userId?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter reviews by linked user course enrollment ID",
  })
  @IsOptional()
  @IsMongoId({ message: "User course ID must be a valid Mongo ID" })
  userCourseId?: string;

  @Field(() => Int, {
    nullable: true,
    description: "Filter reviews by exact star rating",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Stars filter must be an integer" })
  @Min(1, { message: "Stars filter must be at least 1" })
  @Max(5, { message: "Stars filter cannot be greater than 5" })
  stars?: number;

  @Field(() => CourseReviewVisibility, {
    nullable: true,
    description: "Filter reviews by rating moderation visibility",
  })
  @IsOptional()
  @IsEnum(CourseReviewVisibility, {
    message: "Rating visibility filter must be valid",
  })
  ratingVisibility?: CourseReviewVisibility;

  @Field(() => CourseReviewVisibility, {
    nullable: true,
    description: "Filter reviews by review thread moderation visibility",
  })
  @IsOptional()
  @IsEnum(CourseReviewVisibility, {
    message: "Review visibility filter must be valid",
  })
  reviewVisibility?: CourseReviewVisibility;

  @Field(() => CourseReviewVisibility, {
    nullable: true,
    description: "Filter reviews containing at least one message with this visibility",
  })
  @IsOptional()
  @IsEnum(CourseReviewVisibility, {
    message: "Message visibility filter must be valid",
  })
  messageVisibility?: CourseReviewVisibility;

  @Field(() => Boolean, {
    nullable: true,
    description: "Filter reviews that include a rating",
  })
  @IsOptional()
  @IsBoolean({ message: "hasRating filter must be a boolean" })
  hasRating?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: "Filter reviews that include at least one message",
  })
  @IsOptional()
  @IsBoolean({ message: "hasMessages filter must be a boolean" })
  hasMessages?: boolean;
}

@InputType()
export class CourseReviewListCursorPageOptionsParamsInput extends CursorPageOptionsParamsInput {
  @Field(() => UserCourseReviewListSortOptionInput, {
    nullable: true,
    description: "Sort options as a map of field names to sort order",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserCourseReviewListSortOptionInput)
  sort?: UserCourseReviewListSortOptionInput;
}

@InputType()
export class CourseReviewListGqlInput extends PaginationCursorInput<CourseReviewListFilterInput> {
  @Field(() => CourseReviewListFilterInput, {
    nullable: true,
    description: "Filter options for narrowing down the course review list",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CourseReviewListFilterInput)
  filters?: CourseReviewListFilterInput;

  @Field(() => CourseReviewListCursorPageOptionsParamsInput, {
    nullable: true,
    description: "Cursor pagination and sorting options",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CourseReviewListCursorPageOptionsParamsInput)
  options?: CourseReviewListCursorPageOptionsParamsInput;
}
