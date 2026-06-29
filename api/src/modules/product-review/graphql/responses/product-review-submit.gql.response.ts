import {
  Field,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
} from "@nestjs/graphql";
import { Types } from "mongoose";

import { UserMinimalGqlResponse } from "../../../user/graphql/responses/common";

@ObjectType()
export class ProductReviewSubmitRatingGqlResponse {
  @Field(() => Int, { description: "Star rating from 1 to 5" })
  stars: number;

  @Field({ nullable: true, description: "Optional review comment" })
  comment?: string;

  @Field(() => GraphQLISODateTime, {
    description: "Date when the rating was first submitted",
  })
  ratedAt: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: "Date when the rating was last updated",
  })
  updatedAt?: Date;
}

@ObjectType()
export class ProductReviewSubmitGqlResponse {
  @Field(() => ID, { description: "Product review thread ID" })
  id: Types.ObjectId;

  @Field(() => ID, { description: "Reviewed product ID" })
  productId: Types.ObjectId;

  @Field(() => ID, {
    nullable: true,
    description: "Review owner user ID; returned to staff only",
  })
  userId?: Types.ObjectId;

  @Field(() => UserMinimalGqlResponse, {
    nullable: true,
    description: "Minimal review owner information; returned to staff only",
  })
  user?: UserMinimalGqlResponse;

  @Field(() => ProductReviewSubmitRatingGqlResponse, {
    nullable: true,
    description: "Submitted rating, if any",
  })
  rating?: ProductReviewSubmitRatingGqlResponse;

  @Field({
    description: "Whether this call created the rating for the first time",
  })
  isNewRating: boolean;
}
