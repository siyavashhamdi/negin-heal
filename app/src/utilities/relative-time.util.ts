import { toPersianDigits } from "./persian-digits.util";

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 60 * MINUTE_SECONDS;
const DAY_SECONDS = 24 * HOUR_SECONDS;

const MINUTE_MS = MINUTE_SECONDS * 1000;
const HOUR_MS = HOUR_SECONDS * 1000;
const DAY_MS = DAY_SECONDS * 1000;

export const RELATIVE_TIME_THRESHOLD_SECONDS = 7 * DAY_SECONDS;

const RELATIVE_TIME_THRESHOLD_MS = RELATIVE_TIME_THRESHOLD_SECONDS * 1000;

/** Smallest setTimeout delay — avoids 0 ms tight loops only. */
const MIN_TIMEOUT_MS = 1;

export type RelativeTimePeriod =
  | "just_now"
  | "minutes"
  | "hours"
  | "yesterday"
  | "days"
  | "expired";

function getStartOfNextLocalDay(from: Date): Date {
  const nextDay = new Date(from);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);
  return nextDay;
}

function isCalendarYesterday(date: Date, now = new Date()): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

function getDiffMs(date: Date, now: number): number {
  return Math.max(0, now - date.getTime());
}

/**
 * Which relative label bucket `date` is in — kept in sync with `formatRelativeTimeLabel`.
 */
export function getRelativeTimePeriod(date: Date, now = Date.now()): RelativeTimePeriod {
  const diffSeconds = Math.floor(getDiffMs(date, now) / 1000);

  if (diffSeconds >= RELATIVE_TIME_THRESHOLD_SECONDS) {
    return "expired";
  }

  if (diffSeconds < MINUTE_SECONDS) {
    return "just_now";
  }

  if (diffSeconds < HOUR_SECONDS) {
    return "minutes";
  }

  if (diffSeconds < DAY_SECONDS) {
    return "hours";
  }

  if (isCalendarYesterday(date, new Date(now))) {
    return "yesterday";
  }

  return "days";
}

export function shouldUseRelativeTimeLabel(
  value?: string | Date | null,
  now = Date.now()
): boolean {
  if (!value) {
    return false;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return getRelativeTimePeriod(date, now) !== "expired";
}

/**
 * Milliseconds until the relative label for `date` would next change.
 *
 * Polling cadence follows the active bucket (not a fixed 1-minute interval):
 * - `just_now` / `minutes` → next minute boundary
 * - `hours` → next hour boundary
 * - `yesterday` → next local midnight (calendar day change)
 * - `days` → next 24 h boundary from the event time
 * - always includes the 7-day relative-window exit
 *
 * Returns `Infinity` when the date is outside the relative-time window.
 */
export function getRelativeTimeNextTickMs(date: Date, now = Date.now()): number {
  const period = getRelativeTimePeriod(date, now);
  if (period === "expired") {
    return Infinity;
  }

  const diffMs = getDiffMs(date, now);
  const ticks: number[] = [RELATIVE_TIME_THRESHOLD_MS - diffMs];

  switch (period) {
    case "just_now":
      // «همین الان» → first minute label at the 60 s mark; then minute cadence.
      ticks.push(MINUTE_MS - diffMs);
      break;
    case "minutes":
      ticks.push(MINUTE_MS - (diffMs % MINUTE_MS));
      break;
    case "hours":
      ticks.push(HOUR_MS - (diffMs % HOUR_MS));
      break;
    case "yesterday":
      // «دیروز» → next calendar day (may become «N روز پیش»).
      ticks.push(getStartOfNextLocalDay(new Date(now)).getTime() - now);
      break;
    case "days":
      // «N روز پیش» → next day count from the event timestamp.
      ticks.push(DAY_MS - (diffMs % DAY_MS));
      break;
    default:
      break;
  }

  const nextTickMs = Math.min(...ticks.filter((tick) => tick > 0));
  return Math.max(nextTickMs, MIN_TIMEOUT_MS);
}

/**
 * Human-readable relative time label in Persian for notification timestamps.
 */
export const formatRelativeTimeLabel = (value?: string | Date | null, now = Date.now()): string => {
  if (!value) {
    return "نامشخص";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "نامشخص";
  }

  switch (getRelativeTimePeriod(date, now)) {
    case "just_now":
      return "همین الان";
    case "minutes": {
      const minutes = Math.floor(getDiffMs(date, now) / MINUTE_MS);
      return `${toPersianDigits(minutes)} دقیقه پیش`;
    }
    case "hours": {
      const hours = Math.floor(getDiffMs(date, now) / HOUR_MS);
      return `${toPersianDigits(hours)} ساعت پیش`;
    }
    case "yesterday":
      return "دیروز";
    case "days": {
      const days = Math.floor(getDiffMs(date, now) / DAY_MS);
      return `${toPersianDigits(days)} روز پیش`;
    }
    default:
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
  }
};
