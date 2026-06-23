import { env } from "../config";
import { NodeEnv } from "../enums";

type InfrastructureService = "mongodb" | "minio";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function collectErrorSignals(error: unknown, depth = 0): Set<string> {
  const signals = new Set<string>();

  if (depth > 6 || error == null || typeof error !== "object") {
    return signals;
  }

  const current = error as {
    code?: string | number;
    name?: string;
    message?: string;
    cause?: unknown;
  };

  if (typeof current.code === "string") {
    signals.add(current.code);
  }

  if (current.name) {
    signals.add(current.name);
  }

  const message = current.message?.toLowerCase() ?? "";
  if (message.includes("econnrefused")) {
    signals.add("ECONNREFUSED");
  }
  if (message.includes("enotfound")) {
    signals.add("ENOTFOUND");
  }
  if (message.includes("etimedout") || message.includes("timed out")) {
    signals.add("ETIMEDOUT");
  }
  if (message.includes("mongoserverselectionerror")) {
    signals.add("MongoServerSelectionError");
  }

  if (current.cause != null) {
    for (const signal of collectErrorSignals(current.cause, depth + 1)) {
      signals.add(signal);
    }
  }

  return signals;
}

function describeMongoTarget(): string {
  const uri = env.MONGODB_URI ?? "MONGODB_URI (not set)";
  const database = env.MONGODB_DATABASE ?? "(default)";
  return `${uri} [database: ${database}]`;
}

function describeMinioTarget(): string {
  const protocol = env.MINIO_USE_SSL ? "https" : "http";
  const endpoint = env.MINIO_ENDPOINT ?? "MINIO_ENDPOINT (not set)";
  const port = env.MINIO_PORT ?? 9000;
  const bucket = env.MINIO_BUCKET ?? "MINIO_BUCKET (not set)";
  return `${protocol}://${endpoint}:${port} [bucket: ${bucket}]`;
}

function appendDevHints(lines: string[], service: InfrastructureService): void {
  if (env.NODE_ENV === NodeEnv.PRODUCTION) {
    return;
  }

  if (service === "mongodb") {
    lines.push("   Hint: brew services start mongodb-community");
    lines.push(
      "   Or: docker run -d -p 27017:27017 --name negin-heal-mongo mongo:7.0",
    );
    return;
  }

  lines.push(`   Hint: start MinIO on port ${env.MINIO_PORT ?? 9000}`);
}

export function formatInfrastructureConnectionError(
  service: InfrastructureService,
  error: unknown,
): string {
  const label = service === "mongodb" ? "MongoDB" : "MinIO";
  const target =
    service === "mongodb" ? describeMongoTarget() : describeMinioTarget();
  const signals = collectErrorSignals(error);
  const rawMessage = extractErrorMessage(error);
  const lines = [`❌ ${label} is not available.`];

  if (!env.MONGODB_URI && service === "mongodb") {
    lines.push("   MONGODB_URI is not configured.");
  } else if (
    (!env.MINIO_ENDPOINT || !env.MINIO_ACCESS_KEY || !env.MINIO_SECRET_KEY) &&
    service === "minio"
  ) {
    lines.push(
      "   MinIO environment variables are missing or incomplete (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET).",
    );
  } else if (signals.has("ECONNREFUSED")) {
    lines.push(`   Connection refused at ${target}.`);
    lines.push(`   Start ${label} and restart the API.`);
  } else if (signals.has("ENOTFOUND")) {
    lines.push(`   Host could not be resolved for ${target}.`);
    lines.push(
      `   Check your ${service === "mongodb" ? "MONGODB_URI" : "MINIO_ENDPOINT"} setting.`,
    );
  } else if (
    signals.has("ETIMEDOUT") ||
    signals.has("MongoServerSelectionError")
  ) {
    lines.push(`   Timed out while connecting to ${target}.`);
    lines.push(`   Ensure ${label} is running and reachable.`);
  } else {
    lines.push(`   Target: ${target}`);
    lines.push(`   Details: ${rawMessage}`);
  }

  appendDevHints(lines, service);
  return lines.join("\n");
}

export function resolveInfrastructureConnectionFailure(
  error: unknown,
): string | null {
  const message = extractErrorMessage(error).toLowerCase();
  const name = error instanceof Error ? error.name : "";
  const signals = collectErrorSignals(error);

  const isMongoFailure =
    name.includes("Mongo") ||
    signals.has("MongoServerSelectionError") ||
    message.includes("mongodb") ||
    message.includes("mongo is not available") ||
    (signals.has("ECONNREFUSED") && message.includes("27017"));

  if (isMongoFailure) {
    return formatInfrastructureConnectionError("mongodb", error);
  }

  const minioPort = String(env.MINIO_PORT ?? 9000);
  const isMinioFailure =
    message.includes("minio") ||
    message.includes("minio is not available") ||
    (signals.has("ECONNREFUSED") && message.includes(minioPort));

  if (isMinioFailure) {
    return formatInfrastructureConnectionError("minio", error);
  }

  return null;
}

export function logInfrastructureStartupFailure(error: unknown): void {
  const infrastructureMessage = resolveInfrastructureConnectionFailure(error);

  if (infrastructureMessage) {
    console.error(infrastructureMessage);
    return;
  }

  if (error instanceof Error) {
    console.error(`❌ Application failed to start: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return;
  }

  console.error("❌ Application failed to start:", error);
}
