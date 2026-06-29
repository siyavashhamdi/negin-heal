import i18n from "i18next";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";

export interface GraphQLErrorExtensions {
  code?: string;
  params?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  exception?: {
    message?: string | string[] | { key?: string; params?: Record<string, unknown> };
    statusCode?: number;
    code?: string;
    params?: Record<string, unknown>;
    payload?: Record<string, unknown>;
    response?: {
      message?: string | string[] | { key?: string; params?: Record<string, unknown> };
      code?: string;
      key?: string;
      params?: Record<string, unknown>;
    };
  };
  response?: {
    message?: string | string[] | { key?: string; params?: Record<string, unknown> };
    code?: string;
    key?: string;
    params?: Record<string, unknown>;
  };
  originalError?: {
    message?: string | string[];
  };
}

export interface ApolloErrorLike {
  graphQLErrors?: Array<{
    message: string;
    code?: string;
    params?: Record<string, unknown>;
    payload?: Record<string, unknown>;
    extensions?: GraphQLErrorExtensions;
  }>;
  networkError?: Error & { statusCode?: number };
  message: string;
}

interface RawGraphQLErrorItem {
  message?: string;
  code?: string;
  params?: Record<string, unknown>;
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

function formatTranslatedMessage(message: string, params?: Record<string, unknown>): string {
  if (!params || typeof params !== "object") {
    return message;
  }

  let formatted = message.replace(/@@@(\w+)@@@/g, (match, fieldName: string) => {
    const value = params[fieldName];
    return value !== undefined && value !== null ? String(value) : match;
  });

  const payloadValues = Object.values(params);
  let valueIndex = 0;

  formatted = formatted.replace(/%([sdfo]|{(\w+)}|.)/g, (match, typeOrField, fieldName) => {
    if (match.startsWith("%{") && fieldName) {
      const value = params[fieldName];
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

  return formatted;
}

function extractKeyedBodyFromExtensions(
  extensions?: GraphQLErrorExtensions
): { key?: string; params?: Record<string, unknown> } | undefined {
  const candidates: unknown[] = [
    extensions?.exception?.response,
    extensions?.response,
    extensions?.exception?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      if (/^[A-Z][A-Z0-9_]+$/.test(candidate.trim())) {
        return { key: candidate.trim() };
      }
      continue;
    }

    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    if ("key" in candidate && typeof (candidate as { key?: unknown }).key === "string") {
      const keyed = candidate as {
        key: string;
        params?: Record<string, unknown>;
      };
      return { key: keyed.key, params: keyed.params };
    }

    if ("message" in candidate) {
      const nested = extractKeyedBodyFromExtensions({
        exception: {
          message: (candidate as { message?: unknown }).message as string | string[] | undefined,
        },
      });
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

function resolveErrorParams(error?: RawGraphQLErrorItem): Record<string, unknown> | undefined {
  const keyedParams = extractKeyedBodyFromExtensions(error?.extensions)?.params;
  if (keyedParams && typeof keyedParams === "object") {
    return keyedParams;
  }

  const params = (error?.params ||
    error?.extensions?.params ||
    error?.extensions?.exception?.params ||
    error?.payload ||
    error?.extensions?.payload ||
    error?.extensions?.exception?.payload) as Record<string, unknown> | undefined;

  return params && typeof params === "object" ? params : undefined;
}

function joinMessageParts(value: string | string[]): string {
  return Array.isArray(value) ? value.join(", ") : value;
}

const GENERIC_EXCEPTION_CODES = new Set(["INTERNAL_SERVER_ERROR", "UNKNOWN_ERROR_OCCURRED"]);

const SUPPRESSED_USER_FACING_EXCEPTION_CODES = new Set([
  "INTERNAL_SERVER_ERROR",
  "UNKNOWN_ERROR_OCCURRED",
  "FORBIDDEN",
  "UNAUTHENTICATED",
]);

const SUPPRESSED_USER_FACING_I18N_KEYS = [
  "errors.network.failedToFetch",
  "errors.network.serverError",
] as const;

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

function translateUserFacingError(key: string): string {
  if (
    SUPPRESSED_USER_FACING_I18N_KEYS.includes(
      key as (typeof SUPPRESSED_USER_FACING_I18N_KEYS)[number]
    )
  ) {
    return "";
  }

  return i18n.t(key);
}

/** True when an error message should be logged/handled but not shown in the UI. */
export function isSuppressedUserFacingErrorMessage(message: string): boolean {
  const normalized = message.trim();
  if (!normalized) {
    return true;
  }

  if (isGenericBackendErrorMessage(normalized) || looksLikeUnreachableNetwork(normalized)) {
    return true;
  }

  for (const key of SUPPRESSED_USER_FACING_I18N_KEYS) {
    const translated = i18n.t(key, { defaultValue: "" }).trim();
    if (translated && normalized === translated) {
      return true;
    }
  }

  for (const code of SUPPRESSED_USER_FACING_EXCEPTION_CODES) {
    const translated = i18n.t(`errors.exceptions.${code}`, { defaultValue: "" }).trim();
    if (translated && normalized === translated) {
      return true;
    }
  }

  if (normalized.startsWith("ارتباط برقرار نشد") || normalized.startsWith("خطای داخلی سرور")) {
    return true;
  }

  return false;
}

function getExceptionTranslation(
  code: string | undefined,
  params?: Record<string, unknown>
): string {
  if (!code) {
    return "";
  }

  if (SUPPRESSED_USER_FACING_EXCEPTION_CODES.has(code)) {
    return "";
  }

  const translationKey = `errors.exceptions.${code}`;
  const translatedMessage = i18n.t(translationKey, { defaultValue: "" });
  if (!translatedMessage || translatedMessage === translationKey) {
    return "";
  }

  return formatTranslatedMessage(translatedMessage, params);
}

function shouldPreferExceptionTranslation(code: string | undefined): boolean {
  return Boolean(code && !GENERIC_EXCEPTION_CODES.has(code));
}

function inferExceptionCodeFromMessage(message: string): string | undefined {
  const normalized = message.trim();
  if (!normalized) {
    return undefined;
  }

  if (/^[A-Z][A-Z0-9_]+$/.test(normalized)) {
    return normalized;
  }

  const lowered = normalized.toLowerCase();

  if (lowered.includes("captcha has expired")) {
    return "CAPTCHA_EXPIRED";
  }

  if (lowered.includes("captcha value is incorrect")) {
    return "CAPTCHA_INVALID";
  }

  if (lowered.includes("captcha is required")) {
    return "CAPTCHA_REQUIRED";
  }

  return undefined;
}

function resolveExceptionCode(
  error?: RawGraphQLErrorItem,
  backendMessage = ""
): string | undefined {
  const keyedCode = extractKeyedBodyFromExtensions(error?.extensions)?.key;
  if (keyedCode) {
    return keyedCode;
  }

  const explicitCode = error?.code || error?.extensions?.code || error?.extensions?.exception?.code;
  if (explicitCode) {
    return explicitCode;
  }

  return inferExceptionCodeFromMessage(backendMessage || error?.message || "");
}

function extractBackendGraphQLErrorMessage(error?: RawGraphQLErrorItem): string {
  const keyedCode = extractKeyedBodyFromExtensions(error?.extensions)?.key;
  if (keyedCode) {
    return keyedCode;
  }

  const extensions = error?.extensions;
  if (extensions?.exception?.message) {
    const message = extensions.exception.message;
    if (typeof message === "string") {
      return message;
    }
    if (Array.isArray(message)) {
      return joinMessageParts(message);
    }
    if (
      typeof message === "object" &&
      message !== null &&
      "key" in message &&
      typeof (message as { key?: unknown }).key === "string"
    ) {
      return (message as { key: string }).key;
    }
  }
  if (extensions?.originalError?.message) {
    return joinMessageParts(extensions.originalError.message);
  }
  if (extensions?.response?.message) {
    const message = extensions.response.message;
    if (
      typeof message === "object" &&
      message !== null &&
      !Array.isArray(message) &&
      "key" in message &&
      typeof (message as { key?: unknown }).key === "string"
    ) {
      return (message as { key: string }).key;
    }

    return joinMessageParts(message as string | string[]);
  }
  return error?.message ?? "";
}

type AccessDeniedGraphQLErrorInput = {
  readonly message: string;
  readonly code?: string;
  readonly extensions?: GraphQLErrorExtensions;
};

export function isAccessDeniedGraphQLError(error: AccessDeniedGraphQLErrorInput): boolean {
  const errorCode = error.code ?? error.extensions?.code ?? error.extensions?.exception?.code;

  if (errorCode === "UNAUTHENTICATED" || errorCode === "FORBIDDEN") {
    return true;
  }

  const backendMessage = extractBackendGraphQLErrorMessage(error);
  return /access denied/i.test(backendMessage) || /access denied/i.test(error.message);
}

/** True when the session is invalid and the user should be signed out (not mere role restrictions). */
export function isAuthSessionInvalidGraphQLError(error: AccessDeniedGraphQLErrorInput): boolean {
  const errorCode = error.code ?? error.extensions?.code ?? error.extensions?.exception?.code;

  return errorCode === "UNAUTHENTICATED";
}

function resolveGraphQLErrorFieldMessage(error?: RawGraphQLErrorItem): string {
  const backendMessage = extractBackendGraphQLErrorMessage(error);
  const exceptionCode = resolveExceptionCode(error, backendMessage);
  const params = resolveErrorParams(error);

  if (
    isAccessDeniedGraphQLError({
      message: error?.message ?? backendMessage,
      code: exceptionCode,
      extensions: error?.extensions,
    })
  ) {
    return "";
  }

  if (shouldPreferExceptionTranslation(exceptionCode)) {
    const translatedMessage = getExceptionTranslation(exceptionCode, params);
    if (translatedMessage) {
      return translatedMessage;
    }
  }

  if (exceptionCode && GENERIC_EXCEPTION_CODES.has(exceptionCode)) {
    if (SUPPRESSED_USER_FACING_EXCEPTION_CODES.has(exceptionCode)) {
      return "";
    }

    const translatedMessage = getExceptionTranslation(exceptionCode, params);
    if (translatedMessage) {
      return translatedMessage;
    }
  }

  if (isGenericBackendErrorMessage(backendMessage)) {
    return "";
  }

  return i18n.t("errors.unknown");
}

function getGraphQLErrorCodeFromItem(error?: {
  readonly message?: string;
  readonly code?: string;
  readonly extensions?: GraphQLErrorExtensions;
}): string | undefined {
  const backendMessage = extractBackendGraphQLErrorMessage(error);
  return resolveExceptionCode(error, backendMessage);
}

export function extractGraphQLErrorCode(error: unknown): string | undefined {
  if (CombinedGraphQLErrors.is(error)) {
    return getGraphQLErrorCodeFromItem(
      error.errors[0] as { code?: string; extensions?: GraphQLErrorExtensions }
    );
  }

  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const graphQLErrors =
    (error as { errors?: Array<{ code?: string; extensions?: GraphQLErrorExtensions }> }).errors ??
    (error as { graphQLErrors?: Array<{ code?: string; extensions?: GraphQLErrorExtensions }> })
      .graphQLErrors;

  return getGraphQLErrorCodeFromItem(graphQLErrors?.[0]);
}

export const extractGraphQLErrorMessage = (error: unknown): string => {
  if (!error) {
    return i18n.t("errors.unknown");
  }

  if (CombinedGraphQLErrors.is(error)) {
    const first = error.errors[0];
    if (!first) {
      const fallback = error.message || i18n.t("errors.unknown");
      return isSuppressedUserFacingErrorMessage(fallback) ? "" : fallback;
    }
    const ge = first as {
      readonly message: string;
      readonly code?: string;
      readonly params?: Record<string, unknown>;
      readonly payload?: Record<string, unknown>;
      readonly extensions?: GraphQLErrorExtensions;
    };
    return resolveGraphQLErrorFieldMessage({
      message: ge.message,
      code: ge.code,
      params: ge.params,
      payload: ge.payload,
      extensions: ge.extensions,
    });
  }

  if (isRawGraphQLErrorResponse(error)) {
    const first = error.errors?.[0];
    const resolvedMessage = resolveGraphQLErrorFieldMessage(first);
    return resolvedMessage;
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
      return translateUserFacingError("errors.network.failedToFetch");
    }

    if (error.networkError) {
      const networkError = error.networkError;
      const networkMessage = networkError.message || "";
      if (looksLikeUnreachableNetwork(networkMessage)) {
        return translateUserFacingError("errors.network.failedToFetch");
      }

      if ("statusCode" in networkError) {
        const statusCode = (networkError as { statusCode?: number }).statusCode;
        if (statusCode === 401) {
          return i18n.t("errors.network.authenticationFailed");
        }
        if (statusCode === 403) {
          return "";
        }
        if (statusCode === 404) {
          return i18n.t("errors.network.notFound");
        }
        if (statusCode === 500) {
          return translateUserFacingError("errors.network.serverError");
        }
      }
      const rawNetworkMessage =
        networkError.message || translateUserFacingError("errors.network.message");
      return isSuppressedUserFacingErrorMessage(rawNetworkMessage) ? "" : rawNetworkMessage;
    }

    const first = error.graphQLErrors?.[0];
    if (first) {
      const resolvedMessage = resolveGraphQLErrorFieldMessage(first);
      if (resolvedMessage) {
        return resolvedMessage;
      }
    }

    return "";
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
    return translateUserFacingError("errors.network.failedToFetch");
  }

  const unknownMessage = i18n.t("errors.unknown");
  return isSuppressedUserFacingErrorMessage(unknownMessage) ? "" : unknownMessage;
};

export function resolveErrorMessageFromCode(
  code: string | null | undefined,
  params?: Record<string, unknown>
): string {
  if (!code?.trim()) {
    return i18n.t("errors.unknown");
  }

  const normalizedCode = code.trim();
  if (SUPPRESSED_USER_FACING_EXCEPTION_CODES.has(normalizedCode)) {
    return "";
  }

  const translatedMessage = getExceptionTranslation(normalizedCode, params);
  return translatedMessage || i18n.t("errors.unknown");
}

export function showErrorIfNotQueued(
  showError: (message: string, duration?: number) => void,
  error: unknown
): void {
  if (!isApolloHandledError(error)) {
    const message = extractGraphQLErrorMessage(error);
    if (message.trim() && !isSuppressedUserFacingErrorMessage(message)) {
      showError(message);
    }
  }
}
