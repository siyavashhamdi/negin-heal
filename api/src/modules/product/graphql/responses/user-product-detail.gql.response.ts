import {
  Field,
  Float,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
} from "@nestjs/graphql";
import { Types } from "mongoose";

import { FileAccessUrlGqlResponse } from "../../../file/graphql/responses";
import {
  ProductDiscountType,
  ProductItemType,
  ProductReleaseType,
  UserProductPurchaseStatus,
} from "../../../../enums";
import { UserProductListDiscountGqlResponse } from "./user-product-list.gql.response";

@ObjectType()
export class UserProductDetailItemGqlResponse {
  @Field({ description: "Product item title" })
  title: string;

  @Field(() => ProductItemType, {
    description: "Calculated item content type",
  })
  type: ProductItemType;

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
export class UserProductDetailChapterGqlResponse {
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

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description:
      "When this chapter becomes available for a paid viewer under gradual release",
  })
  unlocksAt?: Date;

  @Field(() => [UserProductDetailItemGqlResponse], {
    nullable: true,
    description:
      "Chapter items. Null when the chapter is locked for the current viewer.",
  })
  items?: UserProductDetailItemGqlResponse[] | null;

  @Field({
    description:
      "Whether the authenticated learner has confirmed completion of this chapter",
  })
  isCompleted: boolean;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: "When the learner confirmed completion of this chapter",
  })
  userCompletedAt?: Date;
}

@ObjectType()
export class UserProductDetailGqlResponse {
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
  discount?: {
    type: ProductDiscountType;
    value: number;
  };

  @Field(() => [String], { description: "Product tags" })
  tags: string[];

  @Field(() => ProductReleaseType, {
    description:
      "Calculated release strategy. GRADUAL means at least one chapter has visibleAfterMinutes.",
  })
  releaseType: ProductReleaseType;

  @Field({ description: "Whether this product is free to access" })
  isFree: boolean;

  @Field({
    description:
      "Whether the current END_USER has a paid purchase for this product",
  })
  isPurchased: boolean;

  @Field(() => UserProductPurchaseStatus, {
    nullable: true,
    description: "Current END_USER purchase status for this product, if any",
  })
  purchaseStatus?: UserProductPurchaseStatus;

  @Field(() => [UserProductDetailChapterGqlResponse], {
    description: "Product chapters with locked content redacted",
  })
  chapters: UserProductDetailChapterGqlResponse[];

  @Field(() => Int, {
    description:
      "Number of unlocked chapters the learner has confirmed complete",
  })
  completedChapterCount: number;

  @Field(() => Int, {
    description:
      "Number of chapters currently unlocked and eligible for completion",
  })
  accessibleChapterCount: number;

  @Field({
    description: "Whether learners can submit reviews for this product",
  })
  isReviewSubmissionEnabled: boolean;

  @Field({
    description:
      "Whether the reviews section is visible on the product detail page",
  })
  isReviewsSectionVisible: boolean;
}
