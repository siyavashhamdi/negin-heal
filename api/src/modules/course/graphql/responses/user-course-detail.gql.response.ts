import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { FileAccessUrlGqlResponse } from "../../../file/graphql/responses";
import {
  CourseDiscountType,
  CourseItemType,
  CourseReleaseType,
  UserCoursePurchaseStatus,
} from "../../../../enums";
import { UserCourseListDiscountGqlResponse } from "./user-course-list.gql.response";

@ObjectType()
export class UserCourseDetailItemGqlResponse {
  @Field({ description: "Course item title" })
  title: string;

  @Field(() => CourseItemType, {
    description: "Calculated item content type",
  })
  type: CourseItemType;

  @Field({
    description: "Whether this item content is hidden from the current viewer",
  })
  isLocked: boolean;

  @Field(() => FileAccessUrlGqlResponse, {
    nullable: true,
    description: "Signed access descriptor for an unlocked file-backed item",
  })
  fileAccessUrl?: FileAccessUrlGqlResponse;

  @Field({
    nullable: true,
    description: "Article body for unlocked text-based items",
  })
  article?: string | null;
}

@ObjectType()
export class UserCourseDetailChapterGqlResponse {
  @Field({ description: "Stable chapter key" })
  key: string;

  @Field({ description: "Chapter title" })
  title: string;

  @Field({ nullable: true, description: "Chapter description" })
  description?: string;

  @Field(() => Int, {
    nullable: true,
    description: "Number of minutes after purchase/enrollment when visible",
  })
  visibleAfterMinutes?: number;

  @Field({ description: "Whether this chapter is free to access" })
  isFree: boolean;

  @Field({
    description:
      "Whether this chapter content is hidden from the current viewer",
  })
  isLocked: boolean;

  @Field(() => [UserCourseDetailItemGqlResponse], {
    description:
      "Chapter items. Locked chapters return item metadata with protected content redacted.",
  })
  items: UserCourseDetailItemGqlResponse[];
}

@ObjectType()
export class UserCourseDetailGqlResponse {
  @Field(() => ID, { description: "Course ID" })
  id: Types.ObjectId;

  @Field({ description: "Course title" })
  title: string;

  @Field({ nullable: true, description: "Course description" })
  description?: string;

  @Field(() => FileAccessUrlGqlResponse, {
    nullable: true,
    description: "Signed access descriptor for the course cover image",
  })
  coverImageAccessUrl?: FileAccessUrlGqlResponse;

  @Field(() => Float, {
    nullable: true,
    description: "Course price in IRT",
  })
  priceIrt?: number;

  @Field(() => UserCourseListDiscountGqlResponse, {
    nullable: true,
    description: "Optional public course discount",
  })
  discount?: {
    type: CourseDiscountType;
    value: number;
  };

  @Field(() => [String], { description: "Course tags" })
  tags: string[];

  @Field(() => CourseReleaseType, {
    description:
      "Calculated release strategy. GRADUAL means at least one chapter has visibleAfterMinutes.",
  })
  releaseType: CourseReleaseType;

  @Field({ description: "Whether this course is free to access" })
  isFree: boolean;

  @Field({
    description:
      "Whether the current END_USER has a paid purchase for this course",
  })
  isPurchased: boolean;

  @Field(() => UserCoursePurchaseStatus, {
    nullable: true,
    description: "Current END_USER purchase status for this course, if any",
  })
  purchaseStatus?: UserCoursePurchaseStatus;

  @Field(() => [UserCourseDetailChapterGqlResponse], {
    description: "Course chapters with locked content redacted",
  })
  chapters: UserCourseDetailChapterGqlResponse[];
}
