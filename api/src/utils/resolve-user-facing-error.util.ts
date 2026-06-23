import { Logger } from "@nestjs/common";
import { GraphQLError } from "graphql";

import { EXCEPTION_CONSTANT } from "../constants/exception.constant";
import { resolveErrorCodeFromMessage } from "../constants/user-facing-error-message-map.constant";
import { ExceptionRegistry } from "../exceptions/exception.registry";

export interface UserFacingErrorResponse {
  readonly code: string;
  readonly message: string;
  readonly payload?: Record<string, unknown>;
}

const SENSITIVE_PAYLOAD_KEYS = new Set([
  "username",
  "email",
  "mobile",
  "password",
  "token",
  "otp",
  "code",
  "stack",
  "stacktrace",
]);

function isKnownErrorCode(code: string | undefined): code is string {
  if (!code) {
    return false;
  }

  return Object.values(EXCEPTION_CONSTANT).some((entry) => entry.code === code);
}

function getPublicMessage(code: string): string {
  const entry = Object.values(EXCEPTION_CONSTANT).find((item) => item.code === code);
  return entry?.message ?? EXCEPTION_CONSTANT.INTERNAL_SERVER_ERROR.message;
}

function sanitizePayload(
  payload?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const safeEntries = Object.entries(payload).filter(
    ([key]) => !SENSITIVE_PAYLOAD_KEYS.has(key.toLowerCase()),
  );

  const filteredEntries = safeEntries.filter(([key]) => key !== "message");

  if (filteredEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(filteredEntries);
}

function joinMessages(value: string | string[] | undefined): string {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value.join(", ") : value;
}

function extractRawGraphQLErrorDetails(error: GraphQLError): {
  rawMessage: string;
  rawCode?: string;
  exceptionName?: string;
  payload?: Record<string, unknown>;
} {
  const extensions = error.extensions as
    | {
        code?: string;
        payload?: Record<string, unknown>;
        exception?: {
          code?: string;
          message?: string | string[];
          payload?: Record<string, unknown>;
          response?: { message?: string | string[] };
        };
        response?: { message?: string | string[] };
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
      ? (extensions.exception.response as {
          message?: string | string[];
          code?: string;
        })
      : undefined;

  const rawMessage =
    joinMessages(responseObject?.message) ||
    joinMessages(extensions?.exception?.message) ||
    joinMessages(extensions?.exception?.response?.message) ||
    joinMessages(extensions?.response?.message) ||
    joinMessages(extensions?.originalError?.message) ||
    error.message;

  const extractedMessage =
    rawMessage.match(/Unexpected error value:\s*"([^"]+)"/)?.[1] || rawMessage;

  return {
    rawMessage: extractedMessage,
    rawCode:
      (error as { code?: string }).code ||
      responseObject?.code ||
      extensions?.code ||
      extensions?.exception?.code,
    exceptionName: exceptionName || undefined,
    payload:
      (error as { payload?: Record<string, unknown> }).payload ||
      extensions?.payload ||
      extensions?.exception?.payload,
  };
}

export function resolveUserFacingError(input: {
  rawMessage: string;
  rawCode?: string;
  exceptionName?: string;
  payload?: Record<string, unknown>;
}): UserFacingErrorResponse {
  if (input.exceptionName) {
    const exception = ExceptionRegistry.createException(
      input.exceptionName,
      input.rawMessage,
    );

    if (exception) {
      let code = exception.getCode();
      if (code === EXCEPTION_CONSTANT.COURSE_VALIDATION_FAILED.code) {
        const specificCode = resolveErrorCodeFromMessage(exception.getMessage());
        if (specificCode) {
          code = specificCode;
        }
      }

      const payload = sanitizePayload({
        ...(exception.payload as Record<string, unknown> | undefined),
        ...(input.payload ?? {}),
      });

      return {
        code,
        message: getPublicMessage(code),
        ...(payload ? { payload } : {}),
      };
    }
  }

  if (isKnownErrorCode(input.rawCode)) {
    return {
      code: input.rawCode,
      message: getPublicMessage(input.rawCode),
      ...(sanitizePayload(input.payload) ? { payload: sanitizePayload(input.payload) } : {}),
    };
  }

  const mappedCode = resolveErrorCodeFromMessage(input.rawMessage);
  if (mappedCode) {
    return {
      code: mappedCode,
      message: getPublicMessage(mappedCode),
      ...(sanitizePayload(input.payload) ? { payload: sanitizePayload(input.payload) } : {}),
    };
  }

  if (input.rawCode === "UNAUTHENTICATED" || input.rawCode === "FORBIDDEN") {
    return {
      code: input.rawCode,
      message: getPublicMessage(input.rawCode),
    };
  }

  return {
    code: EXCEPTION_CONSTANT.INTERNAL_SERVER_ERROR.code,
    message: getPublicMessage(EXCEPTION_CONSTANT.INTERNAL_SERVER_ERROR.code),
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
    `public="${context.resolved.message}"`,
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
    publicCode: context.resolved.code,
    publicMessage: context.resolved.message,
    publicPayload: context.resolved.payload,
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
  const resolved = resolveUserFacingError(details);

  logTechnicalError(logger, {
    channel: "graphql",
    resolved,
    rawMessage: details.rawMessage,
    exceptionName: details.exceptionName,
    stack:
      (error.extensions?.stacktrace as string[] | undefined)?.join("\n") ||
      (error.originalError instanceof Error ? error.originalError.stack : undefined),
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
}): UserFacingErrorResponse {
  const rawMessage = joinMessages(
    Array.isArray(input.message) ? input.message : [input.message],
  );

  const resolved = resolveUserFacingError({
    rawMessage,
    rawCode:
      input.rawCode ||
      (input.statusCode === 401
        ? EXCEPTION_CONSTANT.UNAUTHENTICATED.code
        : input.statusCode === 403
          ? EXCEPTION_CONSTANT.FORBIDDEN.code
          : undefined),
    exceptionName: input.errorName,
  });

  return resolved;
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
