import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { GqlExecutionContext } from "@nestjs/graphql";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  path: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    // Check if this is a GraphQL request
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();

    // If getInfo() returns a truthy value, it's a GraphQL request
    if (info) {
      return next.handle();
    }

    // HTTP request - transform the response
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const path = request?.url || request?.path || "unknown";

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        message: "Request processed successfully",
        timestamp: new Date().toISOString(),
        path,
      })),
    );
  }
}
