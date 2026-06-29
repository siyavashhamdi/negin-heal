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
import { UserProductReviewListSortOptionInput } from "./user-product-review-list-sort-option.gql.input";

@InputType()
export class UserProductReviewListFilterInput {
  @Field(() => ID, { description: "Product ID to list reviews for" })
  @IsNotEmpty({ message: "Product ID is required" })
  @IsMongoId({ message: "Product ID must be a valid Mongo ID" })
  productId: string;

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
export class UserProductReviewListCursorPageOptionsParamsInput extends CursorPageOptionsParamsInput {
  @Field(() => UserProductReviewListSortOptionInput, {
    nullable: true,
    description: "Sort options as a map of field names to sort order",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserProductReviewListSortOptionInput)
  sort?: UserProductReviewListSortOptionInput;
}

@InputType()
export class UserProductReviewListGqlInput extends PaginationCursorInput<UserProductReviewListFilterInput> {
  @Field(() => UserProductReviewListFilterInput, {
    description: "Filter options for narrowing down the product review list",
  })
  @ValidateNested()
  @Type(() => UserProductReviewListFilterInput)
  filters: UserProductReviewListFilterInput;

  @Field(() => UserProductReviewListCursorPageOptionsParamsInput, {
    nullable: true,
    description: "Cursor pagination and sorting options",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserProductReviewListCursorPageOptionsParamsInput)
  options?: UserProductReviewListCursorPageOptionsParamsInput;
}
