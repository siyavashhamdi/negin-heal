import { ForbiddenException, UseGuards } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../../../constants/exception.constant";
import { Args, Context, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { OptionalGqlAuthGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { UserProductDetailGqlInput } from "../inputs";
import { UserProductDetailGqlResponse } from "../responses";

@Resolver(() => UserProductDetailGqlResponse)
export class UserProductDetailQuery {
  constructor(private readonly productService: ProductService) {}

  @Query(() => UserProductDetailGqlResponse, {
    name: "userProductDetail",
    description:
      "Get active product details for anonymous users and END_USER accounts with locked content redacted",
  })
  @UseGuards(OptionalGqlAuthGuard)
  async findUserProductDetail(
    @Args("input") input: UserProductDetailGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserProductDetailGqlResponse> {
    const user = context.req?.user;
    const isEndUser = user?.roles?.includes(UserRole.END_USER) === true;

    if (user && !isEndUser) {
      throw new ForbiddenException(
        EXCEPTION_CONSTANT.END_USER_OR_ANONYMOUS_ONLY,
      );
    }

    return this.productService.detailForUser(
      input,
      isEndUser ? user.userId : undefined,
    );
  }
}
