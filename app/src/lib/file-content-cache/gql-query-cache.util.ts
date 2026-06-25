function stableStringifyValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringifyValue(entry)).join(",")}]`;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringifyValue(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function stableStringifyVariables(
  variables: Record<string, unknown> | null | undefined
): string {
  return stableStringifyValue(variables ?? {});
}

export function hashVariablesKey(variablesJson: string): string {
  let hash = 5381;

  for (let index = 0; index < variablesJson.length; index += 1) {
    hash = ((hash << 5) + hash) ^ variablesJson.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

export function normalizeOperationName(operationName: string | null | undefined): string | null {
  const trimmed = operationName?.trim();
  return trimmed ? trimmed : null;
}
