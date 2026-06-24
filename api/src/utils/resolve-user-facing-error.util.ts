import { Logger } from "@nestjs/common";
import { GraphQLError } from "graphql";

import { EXCEPTION_CONSTANT } from "../constants/exception.constant";
import {
  extractKeyedExceptionBody,
  isKeyedExceptionBody,
  type KeyedExceptionBody,
} from "./keyed-exception.util";

export interface UserFacingErrorResponse {
  readonly code: string;
  readonly params?: Record<string, unknown>;
}

function isKnownErrorCode(code: string | undefined): code is string {
  if (!code) {
    return false;
  }

  return Object.values(EXCEPTION_CONSTANT).includes(
    code as (typeof EXCEPTION_CONSTANT)[keyof typeof EXCEPTION_CONSTANT],
  );
}

function joinMessages(
  value: string | string[] | KeyedExceptionBody | undefined,
): string {
  if (!value) {
    return "";
  }

  if (typeof value === "object" && "key" in value) {
    return "";
  }

  return Array.isArray(value) ? value.join(", ") : value;
}

function extractRawGraphQLErrorDetails(error: GraphQLError): {
  rawMessage: string;
  rawCode?: string;
  exceptionName?: string;
  keyedBody?: ReturnType<typeof extractKeyedExceptionBody>;
} {
  const extensions = error.extensions as
    | {
        code?: string;
        params?: Record<string, unknown>;
        payload?: Record<string, unknown>;
        exception?: {
          code?: string;
          message?: string | string[] | KeyedExceptionBody;
          params?: Record<string, unknown>;
          payload?: Record<string, unknown>;
          response?: {
            message?: string | string[] | KeyedExceptionBody;
            code?: string;
            key?: string;
            params?: Record<string, unknown>;
          };
        };
        response?: {
          message?: string | string[] | KeyedExceptionBody;
          code?: string;
          key?: string;
          params?: Record<string, unknown>;
        };
        originalError?: { message?: string | string[] };
      }
    | undefined;

  const exceptionName =
    extensions?.exception &&
    typeof extensions.exception === "object" &&
    "name" in extensions.exception
      ? String((extensions.exception as { name?: string }).name ?? "")
      : error.extensions?.stacktrace?.[0]?.match(/^(\w+Exception):/)?.[1];

  const responseObject =
    extensions?.exception?.response &&
    typeof extensions.exception.response === "object"
      ? extensions.exception.response
      : extensions?.response && typeof extensions.response === "object"
        ? extensions.response
        : undefined;

  const keyedBody =
    extractKeyedExceptionBody(responseObject) ||
    extractKeyedExceptionBody(extensions?.exception?.message) ||
    extractKeyedExceptionBody(extensions?.exception?.response?.message) ||
    extractKeyedExceptionBody(extensions?.response?.message) ||
    extractKeyedExceptionBody(error.message);

  const rawMessage =
    joinMessages(
      keyedBody
        ? undefined
        : typeof responseObject?.message === "string" ||
            Array.isArray(responseObject?.message)
          ? responseObject.message
          : undefined,
    ) ||
    joinMessages(
      typeof extensions?.exception?.message === "string" ||
        Array.isArray(extensions?.exception?.message)
        ? extensions.exception.message
        : undefined,
    ) ||
    joinMessages(extensions?.exception?.response?.message) ||
    joinMessages(extensions?.response?.message) ||
    joinMessages(extensions?.originalError?.message) ||
    error.message;

  const extractedMessage =
    rawMessage.match(/Unexpected error value:\s*"([^"]+)"/)?.[1] || rawMessage;

  return {
    rawMessage: extractedMessage,
    rawCode:
      keyedBody?.key ||
      (error as { code?: string }).code ||
      responseObject?.key ||
      responseObject?.code ||
      extensions?.code ||
      extensions?.exception?.code,
    exceptionName: exceptionName || undefined,
    keyedBody,
  };
}

export function resolveUserFacingError(input: {
  rawMessage: string;
  rawCode?: string;
  exceptionName?: string;
  keyedBody?: ReturnType<typeof extractKeyedExceptionBody>;
  params?: Record<string, unknown>;
}): UserFacingErrorResponse {
  if (input.keyedBody?.key) {
    return {
      code: input.keyedBody.key,
      ...(input.keyedBody.params ? { params: input.keyedBody.params } : {}),
    };
  }

  if (isKnownErrorCode(input.rawCode)) {
    return {
      code: input.rawCode,
      ...(input.params ? { params: input.params } : {}),
    };
  }

  if (input.rawCode === "UNAUTHENTICATED" || input.rawCode === "FORBIDDEN") {
    return { code: input.rawCode };
  }

  if (isKnownErrorCode(input.rawMessage)) {
    return { code: input.rawMessage };
  }

  return {
    code: EXCEPTION_CONSTANT.INTERNAL_SERVER_ERROR,
  };
}

function safeSerializeForLogging(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...(value.cause ? { cause: safeSerializeForLogging(value.cause) } : {}),
    };
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  const seen = new WeakSet<object>();

  const replacer = (_key: string, current: unknown): unknown => {
    if (current instanceof Error) {
      return {
        name: current.name,
        message: current.message,
        stack: current.stack,
      };
    }

    if (typeof current === "object" && current !== null) {
      if (seen.has(current)) {
        return "[Circular]";
      }

      seen.add(current);
    }

    return current;
  };

  try {
    return JSON.parse(JSON.stringify(value, replacer));
  } catch {
    return String(value);
  }
}

function formatTechnicalErrorDetails(details: Record<string, unknown>): string {
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

export interface TechnicalErrorLogContext {
  channel: "http" | "graphql";
  resolved: UserFacingErrorResponse;
  rawMessage: string;
  exceptionName?: string;
  statusCode?: number;
  stack?: string;
  request?: {
    method?: string;
    url?: string;
  };
  graphql?: {
    path?: readonly (string | number)[];
    locations?: ReadonlyArray<{ line: number; column: number }>;
    extensions?: unknown;
    originalError?: unknown;
  };
  exception?: unknown;
}

export function logTechnicalError(
  logger: Logger,
  context: TechnicalErrorLogContext,
): void {
  const summary = [
    `[${context.channel.toUpperCase()}]`,
    `code=${context.resolved.code}`,
    context.resolved.params
      ? `params=${JSON.stringify(context.resolved.params)}`
      : null,
    `raw="${context.rawMessage}"`,
    context.exceptionName ? `exception=${context.exceptionName}` : null,
    context.statusCode != null ? `status=${context.statusCode}` : null,
    context.request?.method && context.request?.url
      ? `request=${context.request.method} ${context.request.url}`
      : null,
    context.graphql?.path?.length
      ? `path=${context.graphql.path.join(".")}`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  logger.error(summary, context.stack);

  const technicalDetails = formatTechnicalErrorDetails({
    channel: context.channel,
    code: context.resolved.code,
    params: context.resolved.params,
    rawMessage: context.rawMessage,
    exceptionName: context.exceptionName,
    statusCode: context.statusCode,
    stack: context.stack,
    request: context.request,
    graphql: context.graphql
      ? {
          path: context.graphql.path,
          locations: context.graphql.locations,
          extensions: safeSerializeForLogging(context.graphql.extensions),
          originalError: safeSerializeForLogging(context.graphql.originalError),
        }
      : undefined,
    exception: safeSerializeForLogging(context.exception),
  });

  logger.error(`Technical error details:\n${technicalDetails}`);
}

export function formatUserFacingGraphQLError(
  error: GraphQLError,
  logger: Logger,
  includeDebugExtensions: boolean,
): UserFacingErrorResponse & { extensions?: GraphQLError["extensions"] } {
  const details = extractRawGraphQLErrorDetails(error);
  const resolved = resolveUserFacingError({
    rawMessage: details.rawMessage,
    rawCode: details.rawCode,
    exceptionName: details.exceptionName,
    keyedBody: details.keyedBody,
  });

  logTechnicalError(logger, {
    channel: "graphql",
    resolved,
    rawMessage: details.rawMessage,
    exceptionName: details.exceptionName,
    stack:
      (error.extensions?.stacktrace as string[] | undefined)?.join("\n") ||
      (error.originalError instanceof Error
        ? error.originalError.stack
        : undefined),
    graphql: {
      path: error.path,
      locations: error.locations?.map((location) => ({
        line: location.line,
        column: location.column,
      })),
      extensions: error.extensions,
      originalError: error.originalError,
    },
    exception: error,
  });

  return {
    ...resolved,
    ...(includeDebugExtensions ? { extensions: error.extensions } : {}),
  };
}

export function resolveUserFacingHttpError(input: {
  statusCode: number;
  message: string | string[];
  errorName?: string;
  rawCode?: string;
  keyedBody?: ReturnType<typeof extractKeyedExceptionBody>;
}): UserFacingErrorResponse {
  const rawMessage = joinMessages(
    Array.isArray(input.message) ? input.message : [input.message],
  );

  const keyedBody =
    input.keyedBody ||
    (isKeyedExceptionBody(input.message) ? input.message : undefined) ||
    extractKeyedExceptionBody(rawMessage);

  return resolveUserFacingError({
    rawMessage,
    rawCode:
      keyedBody?.key ||
      input.rawCode ||
      (input.statusCode === 401
        ? EXCEPTION_CONSTANT.UNAUTHENTICATED
        : input.statusCode === 403
          ? EXCEPTION_CONSTANT.FORBIDDEN
          : undefined),
    exceptionName: input.errorName,
    keyedBody,
    params: keyedBody?.params,
  });
}

export function logUserFacingHttpError(
  logger: Logger,
  originalMessage: string | string[],
  resolved: UserFacingErrorResponse,
  options: {
    stack?: string;
    statusCode?: number;
    errorName?: string;
    request?: {
      method?: string;
      url?: string;
    };
    exception?: unknown;
  } = {},
): void {
  logTechnicalError(logger, {
    channel: "http",
    resolved,
    rawMessage: joinMessages(originalMessage),
    exceptionName: options.errorName,
    statusCode: options.statusCode,
    stack: options.stack,
    request: options.request,
    exception: options.exception,
  });
}
