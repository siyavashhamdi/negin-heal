import { ForbiddenException, UseGuards } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../../../constants/exception.constant";
import { Args, Context, Query, Resolver } from "@nestjs/graphql";
import { Types } from "mongoose";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { OptionalGqlAuthGuard } from "../../../auth";
import { ProductReviewService } from "../../product-review.service";
import { UserProductReviewListGqlInput } from "../inputs";
import {
  UserProductReviewListGqlResponse,
  UserProductReviewListPaginatedCursorGqlResponse,
} from "../responses";

@Resolver(() => UserProductReviewListGqlResponse)
export class UserProductReviewListQuery {
  constructor(private readonly productReviewService: ProductReviewService) {}

  @Query(() => UserProductReviewListPaginatedCursorGqlResponse, {
    name: "userProductReviewList",
    description:
      "Get a cursor-paginated list of public product reviews for anonymous users and END_USER accounts",
  })
  @UseGuards(OptionalGqlAuthGuard)
  async findUserProductReviews(
    @Args("input") input: UserProductReviewListGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserProductReviewListPaginatedCursorGqlResponse> {
    const user = context.req?.user;
    const isEndUser = user?.roles?.includes(UserRole.END_USER) === true;

    if (user && !isEndUser) {
      throw new ForbiddenException(
        EXCEPTION_CONSTANT.END_USER_OR_ANONYMOUS_ONLY,
      );
    }

    return this.productReviewService.listForEndUser(
      input,
      isEndUser ? new Types.ObjectId(user.userId) : undefined,
    );
  }
}
