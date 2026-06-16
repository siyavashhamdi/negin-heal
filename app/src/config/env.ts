/**
 * Environment Configuration
 * Centralized configuration for environment variables
 */

export const API_CONFIG = {
  // Application Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,

  // Build Metadata
  DEPLOY_HASH: import.meta.env.VITE_DEPLOY_HASH,
  DEPLOY_DATE_TIME: import.meta.env.VITE_DEPLOY_DATE_TIME,

  // Others
  NODE_ENV: import.meta.env.VITE_NODE_ENV,

  /** When false, login captcha UI is hidden and a bypass token is sent. */
  CAPTCHA_ENABLED: import.meta.env.VITE_CAPTCHA_ENABLED !== "false",

  /** When true, the app shows a full-screen under-construction page instead of the dashboard. */
  UNDER_CONSTRUCTION: import.meta.env.VITE_UNDER_CONSTRUCTION === "true",
} as const;
