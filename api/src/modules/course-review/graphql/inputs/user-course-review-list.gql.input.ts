import { Type } from "class-transformer";
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Field, ID, InputType, Int } from "@nestjs/graphql";

import {
  CursorPageOptionsParamsInput,
  PaginationCursorInput,
} from "../../../../common/pagination/input";
import { UserCourseReviewListSortOptionInput } from "./user-course-review-list-sort-option.gql.input";

@InputType()
export class UserCourseReviewListFilterInput {
  @Field(() => ID, { description: "Course ID to list reviews for" })
  @IsNotEmpty({ message: "Course ID is required" })
  @IsMongoId({ message: "Course ID must be a valid Mongo ID" })
  courseId: string;

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
}

@InputType()
export class UserCourseReviewListCursorPageOptionsParamsInput extends CursorPageOptionsParamsInput {
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
export class UserCourseReviewListGqlInput extends PaginationCursorInput<UserCourseReviewListFilterInput> {
  @Field(() => UserCourseReviewListFilterInput, {
    description: "Filter options for narrowing down the course review list",
  })
  @ValidateNested()
  @Type(() => UserCourseReviewListFilterInput)
  filters: UserCourseReviewListFilterInput;

  @Field(() => UserCourseReviewListCursorPageOptionsParamsInput, {
    nullable: true,
    description: "Cursor pagination and sorting options",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserCourseReviewListCursorPageOptionsParamsInput)
  options?: UserCourseReviewListCursorPageOptionsParamsInput;
}
