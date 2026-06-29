import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductReviewService } from "../../product-review.service";
import { ProductReviewSubmitGqlInput } from "../inputs";
import { ProductReviewSubmitGqlResponse } from "../responses";

@Resolver(() => ProductReviewSubmitGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.END_USER, UserRole.SUPER_ADMIN)
export class ProductReviewSubmitMutation {
  constructor(private readonly productReviewService: ProductReviewService) {}

  @Mutation(() => ProductReviewSubmitGqlResponse, {
    name: "productReviewSubmit",
    description:
      "Create or update a product star rating and optionally append a follow-up comment",
  })
  async submitProductReview(
    @Args("input") input: ProductReviewSubmitGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<ProductReviewSubmitGqlResponse> {
    const user = context.req.user!;

    return this.productReviewService.submitReview(
      input,
      user.userId,
      user.roles ?? [],
    );
  }
}
