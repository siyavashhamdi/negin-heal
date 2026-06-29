import { Args, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductReviewService } from "../../product-review.service";
import { ProductReviewListGqlInput } from "../inputs";
import {
  ProductReviewListGqlResponse,
  ProductReviewListPaginatedCursorGqlResponse,
} from "../responses";

@Resolver(() => ProductReviewListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ProductReviewListQuery {
  constructor(private readonly productReviewService: ProductReviewService) {}

  @Query(() => ProductReviewListPaginatedCursorGqlResponse, {
    name: "productReviewList",
    description:
      "Get a cursor-paginated, filterable, sortable staff list of product reviews with full data",
  })
  async findAllProductReviews(
    @Args("input") input: ProductReviewListGqlInput,
  ): Promise<ProductReviewListPaginatedCursorGqlResponse> {
    return this.productReviewService.listForSuperAdmin(input);
  }
}
