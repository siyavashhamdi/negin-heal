import { ForbiddenException, UseGuards } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../../../constants/exception.constant";
import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { ProductChapterCompleteGqlInput } from "../inputs";
import { ProductChapterCompleteGqlResponse } from "../responses";

@Resolver(() => ProductChapterCompleteGqlResponse)
@UseGuards(GqlAuthGuard)
export class ProductChapterCompleteMutation {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => ProductChapterCompleteGqlResponse, {
    name: "productChapterComplete",
    description:
      "Confirm completion of an unlocked product chapter for the authenticated learner",
  })
  async completeProductChapter(
    @Args("input") input: ProductChapterCompleteGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<ProductChapterCompleteGqlResponse> {
    const user = context.req.user;
    const isEndUser = user?.roles?.includes(UserRole.END_USER) === true;

    if (!user || !isEndUser) {
      throw new ForbiddenException(EXCEPTION_CONSTANT.END_USER_ONLY);
    }

    return this.productService.completeChapter(input, user.userId);
  }
}
