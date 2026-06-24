import {
  EXCEPTION_CONSTANT,
  type ExceptionKey,
} from "../constants/exception.constant";

export interface KeyedExceptionBody {
  readonly key: ExceptionKey | string;
  readonly params?: Record<string, unknown>;
}

const KNOWN_EXCEPTION_KEYS = new Set<string>(Object.values(EXCEPTION_CONSTANT));

function isExceptionKey(value: string): boolean {
  return KNOWN_EXCEPTION_KEYS.has(value);
}

export function isKeyedExceptionBody(
  value: unknown,
): value is KeyedExceptionBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "key" in value &&
    typeof (value as KeyedExceptionBody).key === "string"
  );
}

export function extractKeyedExceptionBody(
  response: unknown,
): KeyedExceptionBody | undefined {
  if (typeof response === "string") {
    if (isExceptionKey(response)) {
      return { key: response };
    }

    return undefined;
  }

  if (isKeyedExceptionBody(response)) {
    return {
      key: response.key,
      ...(response.params ? { params: response.params } : {}),
    };
  }

  if (typeof response !== "object" || response === null) {
    return undefined;
  }

  const responseObject = response as {
    key?: string;
    params?: Record<string, unknown>;
    message?: unknown;
  };

  if (typeof responseObject.key === "string") {
    return {
      key: responseObject.key,
      ...(responseObject.params ? { params: responseObject.params } : {}),
    };
  }

  if ("message" in responseObject) {
    return extractKeyedExceptionBody(responseObject.message);
  }

  return undefined;
}
