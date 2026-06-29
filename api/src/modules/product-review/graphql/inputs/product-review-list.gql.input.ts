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

import { ProductReviewVisibility } from "../../../../enums";
import {
  CursorPageOptionsParamsInput,
  PaginationCursorInput,
} from "../../../../common/pagination/input";
import { UserProductReviewListSortOptionInput } from "./user-product-review-list-sort-option.gql.input";

@InputType()
export class ProductReviewListFilterInput {
  @Field({
    nullable: true,
    description:
      "Search query that matches rating comment, message body, user snapshot, or product title",
  })
  @IsOptional()
  @IsString({ message: "Query filter must be a string" })
  query?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter reviews by product ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Product ID must be a valid Mongo ID" })
  productId?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter reviews by review owner user ID",
  })
  @IsOptional()
  @IsMongoId({ message: "User ID must be a valid Mongo ID" })
  userId?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter reviews by linked user product enrollment ID",
  })
  @IsOptional()
  @IsMongoId({ message: "User product ID must be a valid Mongo ID" })
  userProductId?: string;

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

  @Field(() => ProductReviewVisibility, {
    nullable: true,
    description: "Filter reviews by rating moderation visibility",
  })
  @IsOptional()
  @IsEnum(ProductReviewVisibility, {
    message: "Rating visibility filter must be valid",
  })
  ratingVisibility?: ProductReviewVisibility;

  @Field(() => ProductReviewVisibility, {
    nullable: true,
    description: "Filter reviews by review thread moderation visibility",
  })
  @IsOptional()
  @IsEnum(ProductReviewVisibility, {
    message: "Review visibility filter must be valid",
  })
  reviewVisibility?: ProductReviewVisibility;

  @Field(() => ProductReviewVisibility, {
    nullable: true,
    description:
      "Filter reviews containing at least one message with this visibility",
  })
  @IsOptional()
  @IsEnum(ProductReviewVisibility, {
    message: "Message visibility filter must be valid",
  })
  messageVisibility?: ProductReviewVisibility;

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
export class ProductReviewListCursorPageOptionsParamsInput extends CursorPageOptionsParamsInput {
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
export class ProductReviewListGqlInput extends PaginationCursorInput<ProductReviewListFilterInput> {
  @Field(() => ProductReviewListFilterInput, {
    nullable: true,
    description: "Filter options for narrowing down the product review list",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductReviewListFilterInput)
  filters?: ProductReviewListFilterInput;

  @Field(() => ProductReviewListCursorPageOptionsParamsInput, {
    nullable: true,
    description: "Cursor pagination and sorting options",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductReviewListCursorPageOptionsParamsInput)
  options?: ProductReviewListCursorPageOptionsParamsInput;
}
