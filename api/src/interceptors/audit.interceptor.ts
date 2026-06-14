import { Types } from "mongoose";
import { Observable } from "rxjs";

import { GqlExecutionContext } from "@nestjs/graphql";
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";

import { runWithBlameableContext } from "../database/plugins/blameable.plugin";

interface AuthenticatedUser {
  userId?: Types.ObjectId;
}

/**
 * Extract userId from request context (GraphQL or REST)
 */
function extractUserId(context: ExecutionContext): Types.ObjectId {
  const gqlContext = GqlExecutionContext.create(context);
  const gqlInfo = gqlContext.getInfo();

  if (gqlInfo) {
    // GraphQL request - check both ctx.user and ctx.req.user
    const ctx = gqlContext.getContext();
    const user = (ctx?.user || ctx?.req?.user) as AuthenticatedUser;
    return user?.userId;
  }

  // REST/HTTP request
  const request = context.switchToHttp().getRequest();
  const user = request?.user as AuthenticatedUser;
  return user?.userId;
}

/**
 * Interceptor that extracts the authenticated user from the request context
 * and establishes AsyncLocalStorage context for Mongoose hooks to use.
 *
 * This enables the blameable plugin to automatically set createdBy, updatedBy, and deletedBy fields.
 * If no userId is found, the blameable plugin will not set any blameable fields.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const userId = extractUserId(context);

    // Wrap the Observable chain in AsyncLocalStorage context
    // This makes userId available to Mongoose hooks during save/update/delete operations
    return runWithBlameableContext({ userId: userId }, () => {
      return next.handle();
    });
  }
}
