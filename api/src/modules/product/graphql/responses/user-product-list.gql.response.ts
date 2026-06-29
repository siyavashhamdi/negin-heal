import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { FileAccessUrlGqlResponse } from "../../../file/graphql/responses";
import { PaginationCursorResponse } from "../../../../common/pagination/response";
import {
  ProductDiscountType,
  ProductItemType,
  ProductReleaseType,
} from "../../../../enums";

@ObjectType()
export class UserProductListDiscountGqlResponse {
  @Field(() => ProductDiscountType, {
    description: "Discount calculation type",
  })
  type: ProductDiscountType;

  @Field(() => Float, {
    description:
      "Discount value. Percentage for PERCENTAGE, IRT amount for FIXED_AMOUNT_IRT",
  })
  value: number;
}

@ObjectType()
export class UserProductListGqlResponse {
  @Field(() => ID, { description: "Product ID" })
  id: Types.ObjectId;

  @Field({ description: "Product title" })
  title: string;

  @Field({ nullable: true, description: "Product description" })
  description?: string;

  @Field(() => FileAccessUrlGqlResponse, {
    nullable: true,
    description: "Signed access descriptor for the product cover image",
  })
  coverImageAccessUrl?: FileAccessUrlGqlResponse;

  @Field(() => Float, {
    nullable: true,
    description: "Product price in IRT",
  })
  priceIrt?: number;

  @Field(() => UserProductListDiscountGqlResponse, {
    nullable: true,
    description: "Optional public product discount",
  })
  discount?: UserProductListDiscountGqlResponse;

  @Field(() => [String], { description: "Product tags" })
  tags: string[];

  @Field(() => ProductReleaseType, {
    description:
      "Calculated release strategy. GRADUAL means at least one chapter has visibleAfterMinutes.",
  })
  releaseType: ProductReleaseType;

  @Field(() => Int, { description: "Number of chapters in the product" })
  chapterCount: number;

  @Field(() => Int, { description: "Number of items in the product" })
  itemCount: number;

  @Field(() => [ProductItemType], {
    description: "Calculated content types available in this product",
  })
  itemTypes: ProductItemType[];

  @Field({
    description:
      "Whether the current END_USER has a paid purchase for this product",
  })
  isPurchased: boolean;
}

@ObjectType()
export class UserProductListPaginatedCursorGqlResponse {
  @Field(() => [UserProductListGqlResponse], {
    description: "List of products for anonymous and end-user views",
  })
  items: UserProductListGqlResponse[];

  @Field(() => PaginationCursorResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationCursorResponse;
}
