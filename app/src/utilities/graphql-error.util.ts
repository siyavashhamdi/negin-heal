import i18n from "i18next";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";

export interface GraphQLErrorExtensions {
  code?: string;
  payload?: Record<string, unknown>;
  exception?: {
    message?: string | string[];
    statusCode?: number;
    code?: string;
    payload?: Record<string, unknown>;
  };
  originalError?: {
    message?: string | string[];
  };
  response?: {
    message?: string | string[];
  };
}

export interface ApolloErrorLike {
  graphQLErrors?: Array<{
    message: string;
    code?: string;
    payload?: Record<string, unknown>;
    extensions?: GraphQLErrorExtensions;
  }>;
  networkError?: Error & { statusCode?: number };
  message: string;
}

interface RawGraphQLErrorItem {
  message?: string;
  code?: string;
  payload?: Record<string, unknown>;
  extensions?: GraphQLErrorExtensions;
}

interface RawGraphQLErrorResponse {
  errors?: RawGraphQLErrorItem[];
  message?: string;
}

function isLegacyApolloErrorShape(error: unknown): error is ApolloErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    ("graphQLErrors" in error || "networkError" in error)
  );
}

function isRawGraphQLErrorResponse(error: unknown): error is RawGraphQLErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as { errors?: unknown }).errors)
  );
}

function isApolloHandledError(error: unknown): boolean {
  return (
    CombinedGraphQLErrors.is(error) || ServerError.is(error) || isLegacyApolloErrorShape(error)
  );
}

function looksLikeUnreachableNetwork(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed")
  );
}

function formatTranslatedMessage(message: string, payload?: Record<string, unknown>): string {
  if (!payload || typeof payload !== "object") {
    return message;
  }

  const payloadValues = Object.values(payload);
  let valueIndex = 0;

  return message.replace(/%([sdfo]|{(\w+)}|.)/g, (match, typeOrField, fieldName) => {
    if (match.startsWith("%{") && fieldName) {
      const value = payload[fieldName];
      return value !== undefined && value !== null ? String(value) : match;
    }

    if (["s", "d", "f", "o"].includes(typeOrField)) {
      if (valueIndex < payloadValues.length) {
        const value = payloadValues[valueIndex];
        valueIndex++;
        return value !== undefined && value !== null ? String(value) : match;
      }
      return match;
    }

    if (valueIndex < payloadValues.length) {
      const value = payloadValues[valueIndex];
      valueIndex++;
      return value !== undefined && value !== null ? String(value) : match;
    }

    return match;
  });
}

function joinMessageParts(value: string | string[]): string {
  return Array.isArray(value) ? value.join(", ") : value;
}

const GENERIC_EXCEPTION_CODES = new Set([
  "INTERNAL_SERVER_ERROR",
  "UNKNOWN_ERROR_OCCURRED",
]);

const GENERIC_BACKEND_ERROR_MESSAGES = new Set([
  "An internal server error occurred!",
  "An internal server error occurred",
  "An unknown error occurred!",
  "An unknown error occurred",
  "Internal server error",
  "Internal Server Error",
]);

function isGenericBackendErrorMessage(message: string): boolean {
  const normalized = message.trim();
  if (!normalized) {
    return true;
  }

  return GENERIC_BACKEND_ERROR_MESSAGES.has(normalized);
}

function getExceptionTranslation(
  code: string | undefined,
  payload?: Record<string, unknown>,
): string {
  if (!code) {
    return "";
  }

  const translationKey = `errors.exceptions.${code}`;
  const translatedMessage = i18n.t(translationKey, { defaultValue: "" });
  if (!translatedMessage || translatedMessage === translationKey) {
    return "";
  }

  return formatTranslatedMessage(translatedMessage, payload);
}

function shouldPreferExceptionTranslation(code: string | undefined): boolean {
  return Boolean(code && !GENERIC_EXCEPTION_CODES.has(code));
}

function extractBackendGraphQLErrorMessage(
  error?: RawGraphQLErrorItem,
): string {
  const extensions = error?.extensions;
  if (extensions?.exception?.message) {
    return joinMessageParts(extensions.exception.message);
  }
  if (extensions?.originalError?.message) {
    return joinMessageParts(extensions.originalError.message);
  }
  if (extensions?.response?.message) {
    return joinMessageParts(extensions.response.message);
  }
  return error?.message ?? "";
}

type AccessDeniedGraphQLErrorInput = {
  readonly message: string;
  readonly code?: string;
  readonly extensions?: GraphQLErrorExtensions;
};

export function isAccessDeniedGraphQLError(error: AccessDeniedGraphQLErrorInput): boolean {
  const errorCode =
    error.code ?? error.extensions?.code ?? error.extensions?.exception?.code;

  if (errorCode === "UNAUTHENTICATED" || errorCode === "FORBIDDEN") {
    return true;
  }

  const backendMessage = extractBackendGraphQLErrorMessage(error);
  return /access denied/i.test(backendMessage) || /access denied/i.test(error.message);
}

function resolveGraphQLErrorFieldMessage(
  error?: RawGraphQLErrorItem,
): string {
  const backendMessage = extractBackendGraphQLErrorMessage(error);
  const exceptionCode =
    error?.code || error?.extensions?.code || error?.extensions?.exception?.code;
  const payload = (error?.payload ||
    error?.extensions?.payload ||
    error?.extensions?.exception?.payload) as Record<string, unknown> | undefined;

  if (
    isAccessDeniedGraphQLError({
      message: error?.message ?? backendMessage,
      code: exceptionCode,
      extensions: error?.extensions,
    })
  ) {
    return i18n.t("errors.network.accessDenied");
  }

  if (shouldPreferExceptionTranslation(exceptionCode)) {
    const translatedMessage = getExceptionTranslation(exceptionCode, payload);
    if (translatedMessage) {
      return translatedMessage;
    }
  }

  if (backendMessage && !isGenericBackendErrorMessage(backendMessage)) {
    return backendMessage;
  }

  if (exceptionCode && GENERIC_EXCEPTION_CODES.has(exceptionCode)) {
    const translatedMessage = getExceptionTranslation(exceptionCode, payload);
    if (translatedMessage) {
      return translatedMessage;
    }
  }

  return backendMessage;
}

export const extractGraphQLErrorMessage = (error: unknown): string => {
  if (!error) {
    return i18n.t("errors.unknown");
  }

  if (CombinedGraphQLErrors.is(error)) {
    const first = error.errors[0];
    if (!first) {
      return error.message || i18n.t("errors.unknown");
    }
    const ge = first as {
      readonly message: string;
      readonly code?: string;
      readonly payload?: Record<string, unknown>;
      readonly extensions?: GraphQLErrorExtensions;
    };
    return resolveGraphQLErrorFieldMessage({
      message: ge.message,
      code: ge.code,
      payload: ge.payload,
      extensions: ge.extensions,
    });
  }

  if (isRawGraphQLErrorResponse(error)) {
    const first = error.errors?.[0];
    const resolvedMessage = resolveGraphQLErrorFieldMessage(first);
    return resolvedMessage || error.message || i18n.t("errors.graphql.generalMessage");
  }

  if (ServerError.is(error)) {
    return extractGraphQLErrorMessage({
      message: error.message,
      networkError: error,
    });
  }

  if (isLegacyApolloErrorShape(error)) {
    const topLevelMessage = error.message || "";
    if (looksLikeUnreachableNetwork(topLevelMessage)) {
      return i18n.t("errors.network.failedToFetch");
    }

    if (error.networkError) {
      const networkError = error.networkError;
      const networkMessage = networkError.message || "";
      if (looksLikeUnreachableNetwork(networkMessage)) {
        return i18n.t("errors.network.failedToFetch");
      }

      if ("statusCode" in networkError) {
        const statusCode = (networkError as { statusCode?: number }).statusCode;
        if (statusCode === 401) {
          return i18n.t("errors.network.authenticationFailed");
        }
        if (statusCode === 403) {
          return i18n.t("errors.network.accessDenied");
        }
        if (statusCode === 404) {
          return i18n.t("errors.network.notFound");
        }
        if (statusCode === 500) {
          return i18n.t("errors.network.serverError");
        }
      }
      return networkError.message || i18n.t("errors.network.message");
    }

    const first = error.graphQLErrors?.[0];
    if (first) {
      const resolvedMessage = resolveGraphQLErrorFieldMessage(first);
      if (resolvedMessage) {
        return resolvedMessage;
      }
    }

    return error.message || i18n.t("errors.graphql.generalMessage");
  }

  let errorMessage = "";
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    errorMessage = (error as { message: string }).message;
  }
  if (looksLikeUnreachableNetwork(errorMessage)) {
    return i18n.t("errors.network.failedToFetch");
  }

  return errorMessage || i18n.t("errors.unknown");
};

export function showErrorIfNotQueued(
  showError: (message: string, duration?: number) => void,
  error: unknown,
): void {
  if (!isApolloHandledError(error)) {
    showError(extractGraphQLErrorMessage(error));
  }
}
