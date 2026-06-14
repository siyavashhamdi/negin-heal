import { AuthGuard } from "@nestjs/passport";
import { GqlExecutionContext } from "@nestjs/graphql";
import { ExecutionContext, Injectable } from "@nestjs/common";

/**
 * JWT Authentication Guard for GraphQL
 * Extracts token from Authorization header and validates it
 */
@Injectable()
export class GqlAuthGuard extends AuthGuard("jwt") {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
