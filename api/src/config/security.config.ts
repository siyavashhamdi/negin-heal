import { env } from "./env";
import { NodeEnv } from "../enums";

/**
 * Security configuration validator
 * Validates and provides secure defaults for security-related settings
 */
export class SecurityConfig {
  /**
   * Validates JWT secret is set and secure
   */
  static validateJwtSecret(): string {
    const secret = env.JWT_SECRET;
    if (!secret || secret === "your-secret-key-change-in-production") {
      if (env.NODE_ENV === NodeEnv.PRODUCTION) {
        throw new Error(
          "JWT_SECRET must be set to a secure random string in production",
        );
      }
      // Development fallback - warn but allow
      console.warn(
        "⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable for production!",
      );
      return "your-secret-key-change-in-production";
    }

    if (secret.length < 32) {
      throw new Error(
        "JWT_SECRET must be at least 32 characters long for security",
      );
    }

    return secret;
  }

  /**
   * Get allowed CORS origins
   */
  static getAllowedOrigins(): string[] | boolean {
    return true; // Let's allow all origins for now

    const allowedOrigins = process.env.CORS_ORIGINS;

    if (!allowedOrigins) {
      if (env.NODE_ENV === NodeEnv.PRODUCTION) {
        throw new Error(
          "CORS_ORIGINS must be set in production. Set to comma-separated list of allowed origins.",
        );
      }
      // Development: allow localhost origins
      return [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
      ];
    }

    // Parse comma-separated origins
    const origins = allowedOrigins.split(",").map((origin) => origin.trim());
    return origins;
  }

  /**
   * Get max request size in bytes.
   * Default supports up to 50MB binary file uploads.
   */
  static getMaxRequestSize(): number {
    const maxSize = process.env.MAX_REQUEST_SIZE;
    if (maxSize) {
      const parsed = parseInt(maxSize, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return 50 * 1024 * 1024;
  }

  /**
   * Get rate limit configuration
   */
  static getRateLimitConfig() {
    return {
      windowMs: (env.RATE_LIMIT_TTL || 60) * 1000, // Convert to milliseconds
      max: env.RATE_LIMIT_LIMIT || 100,
    };
  }
}
