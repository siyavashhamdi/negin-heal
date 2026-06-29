import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductReviewService } from "../../product-review.service";
import { ProductReviewModerationUpdateGqlInput } from "../inputs/product-review-moderation-update.gql.input";
import { ProductReviewListGqlResponse } from "../responses";

@Resolver(() => ProductReviewListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ProductReviewModerationUpdateMutation {
  constructor(private readonly productReviewService: ProductReviewService) {}

  @Mutation(() => ProductReviewListGqlResponse, {
    name: "productReviewModerationUpdate",
    description:
      "Update product review moderation visibility for the review thread, rating, or a single message",
  })
  async updateProductReviewModeration(
    @Args("input") input: ProductReviewModerationUpdateGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<ProductReviewListGqlResponse> {
    const user = context.req.user!;

    return this.productReviewService.updateModeration(input, user.userId);
  }
}
