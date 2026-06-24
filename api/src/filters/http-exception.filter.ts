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
import { EXCEPTION_CONSTANT } from "../constants/exception.constant";
import { extractKeyedExceptionBody } from "../utils/keyed-exception.util";
import {
  logUserFacingHttpError,
  resolveUserFacingHttpError,
} from "../utils/resolve-user-facing-error.util";

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

    if (!response || typeof response.status !== "function") {
      throw exception;
    }

    const isGraphQLRequest =
      request?.url?.includes("/graphql") ||
      request?.path?.includes("/graphql") ||
      request?.body?.query;

    if (isGraphQLRequest) {
      throw exception;
    }

    let status: number;
    let originalMessage: string | string[];
    let errorName: string;
    let responseCode: string | undefined;
    let keyedBody: ReturnType<typeof extractKeyedExceptionBody>;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        originalMessage = exceptionResponse;
        keyedBody = extractKeyedExceptionBody(exceptionResponse);
        errorName = exception.constructor.name;
        responseCode = keyedBody?.key;
      } else if (typeof exceptionResponse === "object") {
        const responseObj = exceptionResponse as {
          message?: string | string[];
          error?: string;
          code?: string;
          key?: string;
        };
        keyedBody = extractKeyedExceptionBody(exceptionResponse);
        originalMessage = responseObj.message || exception.message;
        errorName = responseObj.error || exception.constructor.name;
        responseCode = keyedBody?.key || responseObj.key || responseObj.code;
      } else {
        originalMessage = exception.message;
        errorName = exception.constructor.name;
      }
    } else {
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
        errorName = "ValidationError";
        const validationMessages: string[] = [];

        for (const key in exceptionObj.errors) {
          const err = exceptionObj.errors[key];
          if (err?.message) {
            validationMessages.push(`${key}: ${err.message}`);
          }
        }

        originalMessage =
          validationMessages.length > 0
            ? validationMessages
            : "Validation failed";
      } else if (
        exceptionObj?.name === "MongoServerError" &&
        exceptionObj?.code === 11000
      ) {
        status = HttpStatus.CONFLICT;
        errorName = "ConflictError";
        keyedBody = { key: EXCEPTION_CONSTANT.DUPLICATE_KEY };
        originalMessage = "Duplicate key";
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        errorName = "InternalServerError";
        originalMessage =
          process.env.NODE_ENV === NodeEnv.PRODUCTION
            ? "An internal server error occurred"
            : exceptionObj?.message || "Internal server error";
      }
    }

    const resolved = resolveUserFacingHttpError({
      statusCode: status,
      message: originalMessage,
      errorName,
      rawCode: responseCode,
      keyedBody,
    });

    logUserFacingHttpError(this.logger, originalMessage, resolved, {
      stack: (exception as { stack?: string })?.stack,
      statusCode: status,
      errorName,
      request: {
        method: request?.method,
        url: request?.url || request?.path,
      },
      exception,
    });

    const errorResponse = {
      success: false,
      error: {
        statusCode: status,
        code: resolved.code,
        ...(resolved.params ? { params: resolved.params } : {}),
        error: errorName,
        timestamp: new Date().toISOString(),
        path: request?.url || request?.path || "unknown",
      },
    };

    response.status(status).json(errorResponse);
  }
}
