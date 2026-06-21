export type ParsedDisplayDateTime = {
  readonly date: Date;
  readonly dateLabel: string;
  readonly timeLabel: string;
};

export function parseDisplayDateTime(value?: string | Date | null): ParsedDisplayDateTime | null {
  if (value == null) {
    return null;
  }

  const rawValue = value instanceof Date ? value.toISOString() : value;
  if (!rawValue.trim()) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(rawValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    date,
    dateLabel: date.toLocaleDateString("fa-IR"),
    timeLabel: date.toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function formatAbsoluteDateTimeCaption(parsed: ParsedDisplayDateTime): string {
  return `${parsed.dateLabel} | ${parsed.timeLabel}`;
}
