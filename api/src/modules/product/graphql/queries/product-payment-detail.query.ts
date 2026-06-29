import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { ProductPaymentDetailGqlInput } from "../inputs";
import { ProductPaymentListGqlResponse } from "../responses";

@Resolver(() => ProductPaymentListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ProductPaymentDetailQuery {
  constructor(private readonly productService: ProductService) {}

  @Query(() => ProductPaymentListGqlResponse, {
    name: "productPaymentDetail",
    description:
      "Get full product payment data for SUPER_ADMIN, including receipt and audit fields for review",
  })
  async findProductPaymentDetail(
    @Args("input") input: ProductPaymentDetailGqlInput,
  ): Promise<ProductPaymentListGqlResponse> {
    return this.productService.paymentDetail(input);
  }
}
