import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { PaginationCursorResponse } from "../../../../common/pagination/response";
import {
  CourseDiscountType,
  CourseItemType,
  CourseReleaseType,
} from "../../../../enums";

@ObjectType()
export class UserCourseListDiscountGqlResponse {
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
export class UserCourseListGqlResponse {
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

  @Field(() => UserCourseListDiscountGqlResponse, {
    nullable: true,
    description: "Optional public course discount",
  })
  discount?: UserCourseListDiscountGqlResponse;

  @Field(() => [String], { description: "Course tags" })
  tags: string[];

  @Field(() => CourseReleaseType, {
    description:
      "Calculated release strategy. GRADUAL means at least one chapter has visibleAfterMinutes.",
  })
  releaseType: CourseReleaseType;

  @Field(() => Int, { description: "Number of chapters in the course" })
  chapterCount: number;

  @Field(() => Int, { description: "Number of items in the course" })
  itemCount: number;

  @Field(() => [CourseItemType], {
    description: "Calculated content types available in this course",
  })
  itemTypes: CourseItemType[];

  @Field({
    description:
      "Whether the current END_USER has a paid purchase for this course",
  })
  isPurchased: boolean;
}

@ObjectType()
export class UserCourseListPaginatedCursorGqlResponse {
  @Field(() => [UserCourseListGqlResponse], {
    description: "List of courses for anonymous and end-user views",
  })
  items: UserCourseListGqlResponse[];

  @Field(() => PaginationCursorResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationCursorResponse;
}
