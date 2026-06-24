import { resolve } from "path";

export const BACKUP_CONSTANT = {
  /** Project-local backup workspace; resolved from the API process cwd. */
  DIR: resolve(process.cwd(), "tmp/backups"),
  /** Max duration for a single backup run before timing out. */
  RUN_TIMEOUT_MS: 10 * 60 * 1000,
  /** RAR multi-volume size passed to `rar -v` (kept below Telegram's 50 MB limit). */
  RAR_VOLUME_SIZE: "49m",
  /** RAR compression level: 1 = fastest, 5 = best compression. */
  RAR_COMPRESSION_LEVEL: 1,
  /** Collections at or below this size are exported in one in-memory pass. */
  MONGODB_EXPORT_IN_MEMORY_MAX_DOCUMENTS: 50_000,
  /** Cursor batch size for large MongoDB collection exports. */
  MONGODB_EXPORT_BATCH_SIZE: 1_000,
  /** Telegram Bot API max document upload size. */
  TELEGRAM_MAX_DOCUMENT_BYTES: 50 * 1024 * 1024,
  /** IANA timezone for scheduled backup crons (daily / weekly midnight). */
  CRON_TIMEZONE: "Asia/Tehran",
  /** Max wait when a weekly backup needs another scheduled run to finish first. */
  CRON_WAIT_FOR_IDLE_MS: 15 * 60 * 1000,
  /** Poll interval while waiting for an in-progress backup run. */
  CRON_WAIT_POLL_INTERVAL_MS: 30_000,
} as const;
