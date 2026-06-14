import {
  GraphQLContext,
  AuthenticatedUser,
} from "../types/graphql-context.types";
import { UserNotFoundException } from "@/exceptions";

export class GraphQLContextUtil {
  static getUser(
    context: GraphQLContext,
    throwIfNotFound = true,
  ): AuthenticatedUser {
    const user = context.req?.user || context.user;

    if (!user?.userId) {
      if (throwIfNotFound) {
        throw new UserNotFoundException({ username: user.username });
      }

      return null;
    }

    return user;
  }
}
