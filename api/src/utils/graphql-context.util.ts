import { NotFoundException } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../constants/exception.constant";
import {
  GraphQLContext,
  AuthenticatedUser,
} from "../types/graphql-context.types";

export class GraphQLContextUtil {
  static getUser(
    context: GraphQLContext,
    throwIfNotFound = true,
  ): AuthenticatedUser {
    const user = context.req?.user || context.user;

    if (!user?.userId) {
      if (throwIfNotFound) {
        throw new NotFoundException(EXCEPTION_CONSTANT.UNAUTHENTICATED);
      }

      return null;
    }

    return user;
  }
}
