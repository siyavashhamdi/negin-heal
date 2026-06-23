import { Request } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

import { GqlExecutionContext } from "@nestjs/graphql";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { AuthenticatedRequest } from "../types/graphql-context.types";

function resolveGraphQLLoggedUserId(
  gqlContext: GqlExecutionContext,
): string | undefined {
  const ctx = gqlContext.getContext<{
    req?: AuthenticatedRequest;
    user?: AuthenticatedRequest["user"];
  }>();
  const userId = (ctx?.user || ctx?.req?.user)?.userId;
  return userId?.toString();
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Check if this is a GraphQL request
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();

    if (info) {
      const operationName = info.fieldName || "GraphQL";
      const userId = resolveGraphQLLoggedUserId(gqlContext);
      const userSuffix = userId ? ` userId=${userId}` : "";

      const now = Date.now();
      this.logger.log(`Incoming GraphQL: ${operationName}${userSuffix}`);

      return next.handle().pipe(
        tap(() => {
          this.logger.log(
            `Outgoing GraphQL: ${operationName}${userSuffix} - ${Date.now() - now}ms`,
          );
        }),
      );
    }

    // HTTP request
    const request = context.switchToHttp().getRequest<Request>();
    if (!request) {
      // Fallback if request is not available
      return next.handle();
    }

    const { method, url, body, query, params } = request;
    const userAgent = request.get("User-Agent") || "";
    const ip = request.ip || "";

    const now = Date.now();

    this.logger.log(`Incoming Request: ${method} ${url} - ${userAgent} ${ip}`);

    if (body && Object.keys(body).length > 0) {
      this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
    }

    if (query && Object.keys(query).length > 0) {
      this.logger.debug(`Query Params: ${JSON.stringify(query)}`);
    }

    if (params && Object.keys(params).length > 0) {
      this.logger.debug(`Route Params: ${JSON.stringify(params)}`);
    }

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        if (response) {
          const { statusCode } = response;
          const contentLength = response.get("content-length");

          this.logger.log(
            `Outgoing Response: ${method} ${url} ${statusCode} ${contentLength} - ${Date.now() - now}ms`,
          );
        }
      }),
    );
  }
}
