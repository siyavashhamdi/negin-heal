import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { ProductPaymentManualCreateGqlInput } from "../inputs";
import { ProductPaymentListGqlResponse } from "../responses";

@Resolver(() => ProductPaymentListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ProductPaymentManualCreateMutation {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => ProductPaymentListGqlResponse, {
    name: "productPaymentManualCreate",
    description:
      "Create a manual product payment record for an active paid product as a super admin",
  })
  async createManualProductPayment(
    @Args("input") input: ProductPaymentManualCreateGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<ProductPaymentListGqlResponse> {
    return this.productService.createManualPayment(
      input,
      context.req.user!.userId,
    );
  }
}
