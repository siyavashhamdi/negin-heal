export type DurationParts = {
  readonly hours: string;
  readonly minutes: string;
  readonly seconds: string;
};

export const EMPTY_DURATION_PARTS: DurationParts = {
  hours: "",
  minutes: "",
  seconds: "",
};

export function splitSecondsToDurationParts(totalSeconds: number): DurationParts {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return EMPTY_DURATION_PARTS;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const remainderAfterHours = totalSeconds - hours * 3600;
  const minutes = Math.floor(remainderAfterHours / 60);
  const seconds = remainderAfterHours - minutes * 60;
  const roundedSeconds = Math.round(seconds * 10) / 10;

  return {
    hours: hours > 0 ? String(hours) : "",
    minutes: minutes > 0 || hours > 0 ? String(minutes) : "",
    seconds:
      roundedSeconds > 0 || minutes > 0 || hours > 0
        ? String(roundedSeconds)
        : totalSeconds > 0
          ? String(roundedSeconds)
          : "",
  };
}

export function durationPartsToSeconds(parts: DurationParts): number | null {
  const hasHours = parts.hours.trim().length > 0;
  const hasMinutes = parts.minutes.trim().length > 0;
  const hasSeconds = parts.seconds.trim().length > 0;

  if (!hasHours && !hasMinutes && !hasSeconds) {
    return null;
  }

  const hours = hasHours ? Number(parts.hours) : 0;
  const minutes = hasMinutes ? Number(parts.minutes) : 0;
  const seconds = hasSeconds ? Number(parts.seconds) : 0;

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    hours < 0 ||
    minutes < 0 ||
    seconds < 0
  ) {
    throw new Error("زمان واردشده معتبر نیست.");
  }

  if (minutes >= 60) {
    throw new Error("دقیقه باید کمتر از ۶۰ باشد.");
  }

  if (seconds >= 60) {
    throw new Error("ثانیه باید کمتر از ۶۰ باشد.");
  }

  return hours * 3600 + minutes * 60 + seconds;
}

export function formatDurationFriendly(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds)) {
    return "—";
  }

  const parts = splitSecondsToDurationParts(totalSeconds);
  const hours = parts.hours ? Number(parts.hours) : 0;
  const minutes = parts.minutes ? Number(parts.minutes) : 0;
  const seconds = parts.seconds ? Number(parts.seconds) : 0;
  const segments: string[] = [];

  if (hours > 0) {
    segments.push(`${hours} ساعت`);
  }
  if (minutes > 0) {
    segments.push(`${minutes} دقیقه`);
  }
  if (seconds > 0 || segments.length === 0) {
    segments.push(`${seconds} ثانیه`);
  }

  return segments.join(" و ");
}
