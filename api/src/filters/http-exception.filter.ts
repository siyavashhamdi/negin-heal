import { Response } from "express";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { NodeEnv } from "../enums";

/**
 * Exception filter for REST endpoints only
 * Formats HTTP exceptions into consistent error responses
 * GraphQL errors are handled by GraphQL's formatError
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<Response>();

    // Verify response is a valid Express Response
    if (!response || typeof response.status !== "function") {
      throw exception;
    }

    // Check if this is a GraphQL request
    // Check if this is a GraphQL request
    // GraphQL requests go to /graphql and should be handled by GraphQL's formatError
    const isGraphQLRequest =
      request?.url?.includes("/graphql") ||
      request?.path?.includes("/graphql") ||
      request?.body?.query; // GraphQL POST requests have a query in body

    if (isGraphQLRequest) {
      // This is a GraphQL request - re-throw to let GraphQL's formatError handle it
      // Apollo Server will catch it and use the formatError function
      throw exception;
    }

    // This is a REST endpoint - format the error response

    let status: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      // NestJS HTTP Exception
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
        error = exception.constructor.name;
      } else if (typeof exceptionResponse === "object") {
        const responseObj = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.constructor.name;

        // Handle validation errors (array of messages)
        if (Array.isArray(message)) {
          message = message;
        }
      } else {
        message = exception.message;
        error = exception.constructor.name;
      }
    } else {
      // Handle Mongoose validation errors
      const exceptionObj = exception as {
        name?: string;
        errors?: Record<string, { message?: string }>;
        code?: number;
        keyPattern?: Record<string, unknown>;
        message?: string;
        stack?: string;
      };
      if (exceptionObj?.name === "ValidationError" && exceptionObj?.errors) {
        status = HttpStatus.BAD_REQUEST;
        error = "ValidationError";
        const validationMessages: string[] = [];

        // Extract Mongoose validation error messages
        for (const key in exceptionObj.errors) {
          const err = exceptionObj.errors[key];
          if (err?.message) {
            validationMessages.push(`${key}: ${err.message}`);
          }
        }

        message =
          validationMessages.length > 0
            ? validationMessages
            : "Validation failed";
      } else if (
        exceptionObj?.name === "MongoServerError" &&
        exceptionObj?.code === 11000
      ) {
        // Mongoose duplicate key error
        status = HttpStatus.CONFLICT;
        error = "ConflictError";
        const field = Object.keys(exceptionObj.keyPattern || {})[0] || "field";
        message = `${field} already exists`;
      } else {
        // Unknown error - internal server error
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        // Don't leak internal error details in production
        if (process.env.NODE_ENV === NodeEnv.PRODUCTION) {
          message = "An internal server error occurred";
          error = "InternalServerError";
        } else {
          message = exceptionObj?.message || "Internal server error";
          error = "InternalServerError";
        }

        // Always log the actual error for debugging (server-side only)
        this.logger.error(
          `Unhandled exception: ${exceptionObj?.message || String(exception)}`,
          exceptionObj?.stack,
        );
      }
    }

    // Format error response
    const errorResponse = {
      success: false,
      error: {
        statusCode: status,
        message: Array.isArray(message) ? message : [message],
        error,
        timestamp: new Date().toISOString(),
        path: request?.url || request?.path || "unknown",
      },
    };

    // Include stack trace in development mode
    if (
      process.env.NODE_ENV !== "production" &&
      (exception as { stack?: string })?.stack
    ) {
      errorResponse.error["stack"] = (exception as { stack: string }).stack;
    }

    response.status(status).json(errorResponse);
  }
}
