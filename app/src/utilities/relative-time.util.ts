import { toPersianDigits } from "./persian-digits.util";

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 60 * MINUTE_SECONDS;
const DAY_SECONDS = 24 * HOUR_SECONDS;
const WEEK_SECONDS = 7 * DAY_SECONDS;

/**
 * Human-readable relative time label in Persian for notification timestamps.
 */
export const formatRelativeTimeLabel = (value?: string | Date | null): string => {
  if (!value) {
    return "نامشخص";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "نامشخص";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSeconds < MINUTE_SECONDS) {
    return "همین الان";
  }

  if (diffSeconds < HOUR_SECONDS) {
    const minutes = Math.floor(diffSeconds / MINUTE_SECONDS);
    return `${toPersianDigits(minutes)} دقیقه پیش`;
  }

  if (diffSeconds < DAY_SECONDS) {
    const hours = Math.floor(diffSeconds / HOUR_SECONDS);
    return `${toPersianDigits(hours)} ساعت پیش`;
  }

  if (diffSeconds < WEEK_SECONDS) {
    const days = Math.floor(diffSeconds / DAY_SECONDS);
    return `${toPersianDigits(days)} روز پیش`;
  }

  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
