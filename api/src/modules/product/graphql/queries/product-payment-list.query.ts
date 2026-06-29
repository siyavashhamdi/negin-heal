import { Args, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { ProductPaymentListGqlInput } from "../inputs";
import {
  ProductPaymentListSummaryGqlResponse,
  ProductPaymentListPaginatedOffsetGqlResponse,
} from "../responses";

@Resolver(() => ProductPaymentListSummaryGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ProductPaymentListQuery {
  constructor(private readonly productService: ProductService) {}

  @Query(() => ProductPaymentListPaginatedOffsetGqlResponse, {
    name: "productPaymentList",
    description:
      "Get paginated list of all product payments from user-product purchase records",
  })
  async findProductPayments(
    @Args("input") input: ProductPaymentListGqlInput,
  ): Promise<ProductPaymentListPaginatedOffsetGqlResponse> {
    return this.productService.listPayments(input);
  }
}
