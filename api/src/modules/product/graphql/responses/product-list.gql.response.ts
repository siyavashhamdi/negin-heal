import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { FileAccessUrlGqlResponse } from "../../../file/graphql/responses";
import {
  ProductDiscountType,
  ProductItemType,
  ProductReleaseType,
} from "../../../../enums";
import { PaginationCursorResponse } from "../../../../common/pagination/response";

@ObjectType()
export class ProductListItemGqlResponse {
  @Field({ description: "Product item title" })
  title: string;

  @Field(() => Int, {
    nullable: true,
    description: "Optional item sort order inside its chapter",
  })
  sortOrder?: number;

  @Field(() => FileAccessUrlGqlResponse, {
    nullable: true,
    description: "Signed access descriptor for the file attached to this item",
  })
  fileAccessUrl?: FileAccessUrlGqlResponse;

  @Field({
    nullable: true,
    description: "Article body when this item is text-based",
  })
  article?: string | null;

  @Field(() => ProductItemType, {
    description:
      "Calculated item type. File-backed items are resolved from stored file MIME type; items without fileId are ARTICLE.",
  })
  type: ProductItemType;
}

@ObjectType()
export class ProductListChapterGqlResponse {
  @Field({ description: "Chapter title" })
  title: string;

  @Field({ nullable: true, description: "Chapter description" })
  description?: string;

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

  @Field(() => [ProductListItemGqlResponse], {
    description: "Chapter items",
  })
  items: ProductListItemGqlResponse[];
}

@ObjectType()
export class ProductListDiscountGqlResponse {
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
export class ProductListSummaryGqlResponse {
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

  @Field(() => ProductListDiscountGqlResponse, {
    nullable: true,
    description: "Optional product discount",
  })
  discount?: ProductListDiscountGqlResponse;

  @Field({ description: "Whether the product is active" })
  isActive: boolean;

  @Field(() => Float, {
    nullable: true,
    description: "Product display rank used for manual ordering",
  })
  sortOrder?: number;

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
}

@ObjectType()
export class ProductListGqlResponse {
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

  @Field(() => ProductListDiscountGqlResponse, {
    nullable: true,
    description: "Optional product discount",
  })
  discount?: ProductListDiscountGqlResponse;

  @Field({ description: "Whether the product is active" })
  isActive: boolean;

  @Field({
    description: "Whether learners can submit reviews for this product",
  })
  isReviewSubmissionEnabled: boolean;

  @Field({
    description:
      "Whether the reviews section is visible on the product detail page",
  })
  isReviewsSectionVisible: boolean;

  @Field(() => Float, {
    nullable: true,
    description: "Product display rank used for manual ordering",
  })
  sortOrder?: number;

  @Field(() => [String], { description: "Product tags" })
  tags: string[];

  @Field(() => ProductReleaseType, {
    description:
      "Calculated release strategy. GRADUAL means at least one chapter has visibleAfterMinutes.",
  })
  releaseType: ProductReleaseType;

  @Field(() => [ProductListChapterGqlResponse], {
    description: "Product chapters",
  })
  chapters: ProductListChapterGqlResponse[];

  @Field({ nullable: true, description: "Date when the product was created" })
  createdAt?: Date;

  @Field({
    nullable: true,
    description: "Date when the product was last updated",
  })
  updatedAt?: Date;
}

@ObjectType()
export class ProductListPaginatedCursorGqlResponse {
  @Field(() => [ProductListSummaryGqlResponse], {
    description: "List of products",
  })
  items: ProductListSummaryGqlResponse[];

  @Field(() => PaginationCursorResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationCursorResponse;
}
