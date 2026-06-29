import { Args, Context, Query, Resolver } from "@nestjs/graphql";
import { ForbiddenException, UseGuards } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../../../constants/exception.constant";

import { UserRole } from "../../../../enums";
import { OptionalGqlAuthGuard } from "../../../auth";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { ProductService } from "../../product.service";
import { ProductListGqlInput } from "../inputs";
import {
  UserProductListGqlResponse,
  UserProductListPaginatedCursorGqlResponse,
} from "../responses";

@Resolver(() => UserProductListGqlResponse)
export class UserProductListQuery {
  constructor(private readonly productService: ProductService) {}

  @Query(() => UserProductListPaginatedCursorGqlResponse, {
    name: "userProductList",
    description:
      "Get active products for anonymous users and END_USER views with purchase state",
  })
  @UseGuards(OptionalGqlAuthGuard)
  async findUserProducts(
    @Args("input") input: ProductListGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserProductListPaginatedCursorGqlResponse> {
    const user = context.req?.user;
    const isEndUser = user?.roles?.includes(UserRole.END_USER) === true;

    if (user && !isEndUser) {
      throw new ForbiddenException(
        EXCEPTION_CONSTANT.END_USER_OR_ANONYMOUS_ONLY,
      );
    }

    return this.productService.listForUser(
      input,
      isEndUser ? user.userId : undefined,
    );
  }
}
