import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { toPersianDigits, toWesternDigits } from "./persian-digits.util";

/** Compact Jalali stored in dbo.Parvaneh_Param date fields (dbo.s2m input). */
export function formatJalaliParamDate(value: DateObject | null | undefined): string {
  if (!value) {
    return "";
  }
  const y = String(value.year).padStart(4, "0");
  const m = String(value.month.number).padStart(2, "0");
  const d = String(value.day).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function parseJalaliParamDate(value: string | null | undefined): DateObject | null {
  const western = toWesternDigits((value ?? "").trim()).replace(/\D/g, "");
  if (western.length !== 8) {
    return null;
  }
  const year = Number(western.slice(0, 4));
  const month = Number(western.slice(4, 6));
  const day = Number(western.slice(6, 8));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  try {
    return new DateObject({
      year,
      month,
      day,
      calendar: persian,
      locale: persian_fa,
    });
  } catch {
    return null;
  }
}

export function formatJalaliParamDateDisplay(value: string | null | undefined): string {
  const parsed = parseJalaliParamDate(value);
  if (!parsed) {
    return "";
  }
  const y = String(parsed.year).padStart(4, "0");
  const m = String(parsed.month.number).padStart(2, "0");
  const d = String(parsed.day).padStart(2, "0");
  return toPersianDigits(`${y}/${m}/${d}`);
}

/** Normalize ISO, Jalali compact, or display text to Jalali YYYYMMDD when possible. */
export function dateInputToJalaliParam(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (trimmed === "") {
    return "";
  }
  const parsed = parseJalaliParamDate(trimmed);
  if (parsed) {
    return formatJalaliParamDate(parsed);
  }
  const asDate = new Date(trimmed);
  if (!Number.isNaN(asDate.getTime())) {
    return formatJalaliParamDate(
      new DateObject({
        date: asDate,
        calendar: persian,
        locale: persian_fa,
      })
    );
  }
  const digits = toWesternDigits(trimmed).replace(/\D/g, "");
  return digits.length === 8 ? digits : trimmed;
}

/** Client-side column filter: picker value vs row raw/display date strings. */
export function jalaliDateColumnFilterMatch(
  filterValue: string,
  ...rawValues: (string | null | undefined)[]
): boolean {
  const query = filterValue.trim();
  if (query === "") {
    return true;
  }
  const queryCompact = dateInputToJalaliParam(query);
  const queryDisplay = formatJalaliParamDateDisplay(queryCompact);

  for (const raw of rawValues) {
    const trimmed = (raw ?? "").trim();
    if (trimmed === "") {
      continue;
    }
    const rawCompact = dateInputToJalaliParam(trimmed);
    if (queryCompact !== "" && rawCompact !== "" && queryCompact === rawCompact) {
      return true;
    }
    const blob = [trimmed, rawCompact, formatJalaliParamDateDisplay(rawCompact)]
      .join(" ")
      .toLowerCase();
    if (blob.includes(query.toLowerCase())) {
      return true;
    }
    if (queryDisplay !== "" && blob.includes(queryDisplay.toLowerCase())) {
      return true;
    }
  }
  return false;
}
