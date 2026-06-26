import { NodeEnv } from "../enums";

const rawMinioEndpoint = process.env.MINIO_ENDPOINT?.replace(
  /^https?:\/\//,
  "",
)?.split("/")[0];
const rawMinioPort = parseInt(process.env.MINIO_PORT || "9000", 10);
const rawMinioUseSSL = process.env.MINIO_USE_SSL === true.toString();
const shouldUseConsoleHostMapping =
  rawMinioEndpoint?.startsWith("minio.") && rawMinioPort === 443;

export const env = {
  // Application Configuration
  NODE_ENV: process.env.NODE_ENV as NodeEnv,
  PORT: parseInt(process.env.PORT || "3000", 10),
  API_PREFIX: process.env.API_PREFIX || "api/v1",
  BASE_URL: process.env.BASE_URL,
  APP_URL: process.env.APP_URL,

  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DATABASE: process.env.MONGODB_DATABASE,

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
  CAPTCHA_ENABLED: process.env.CAPTCHA_ENABLED !== "false",
  CAPTCHA_TTL_SECONDS: parseInt(process.env.CAPTCHA_TTL_SECONDS || "120", 10),
  CAPTCHA_MAX_ATTEMPTS: parseInt(process.env.CAPTCHA_MAX_ATTEMPTS || "5", 10),

  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  LOG_FILE: process.env.LOG_FILE || "logs/app.log",

  // Rate Limiting
  RATE_LIMIT_TTL: parseInt(process.env.RATE_LIMIT_TTL || "60", 10),
  RATE_LIMIT_LIMIT: parseInt(process.env.RATE_LIMIT_LIMIT || "100", 10),

  // GraphQL Configuration
  GRAPHQL_PLAYGROUND: process.env.GRAPHQL_PLAYGROUND === true.toString(),
  GRAPHQL_INTROSPECTION: process.env.GRAPHQL_INTROSPECTION === true.toString(),

  // MinIO Configuration
  // minio.<domain>:443 is the Console endpoint; S3 API is available on <domain>:9000
  // This keeps local envs simple when users set MINIO_ENDPOINT=https://minio.<domain>.
  MINIO_ENDPOINT: shouldUseConsoleHostMapping
    ? rawMinioEndpoint.replace(/^minio\./, "")
    : rawMinioEndpoint,
  MINIO_PORT: shouldUseConsoleHostMapping ? 9000 : rawMinioPort,
  MINIO_USE_SSL: shouldUseConsoleHostMapping ? false : rawMinioUseSSL,
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
  MINIO_BUCKET: process.env.MINIO_BUCKET,

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,

  // Firebase Cloud Messaging (native Android push + launcher badge sync)
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
} as const;
