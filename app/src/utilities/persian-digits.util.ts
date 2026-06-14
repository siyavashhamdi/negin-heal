const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;

/** Arabic‑Indic digits (U+0660–U+0669). */
const ARABIC_INDIC_DIGIT = /[\u0660-\u0669]/g;

/** Extended Arabic‑Indic / Persian digits (U+06F0–U+06F9). */
const EXTENDED_ARABIC_INDIC_DIGIT = /[\u06f0-\u06f9]/gi;

const ARABIC_INDIC_BASE = 0x0660;
const EXTENDED_ARABIC_INDIC_BASE = 0x06f0;

/**
 * Converts Western (0–9) and Arabic‑Indic (٠–٩) digits to Persian (۰–۹) for display.
 */
export const toPersianDigits = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "";
  }
  let s = String(value);
  s = s.replace(
    ARABIC_INDIC_DIGIT,
    (ch) => PERSIAN_DIGITS[ch.charCodeAt(0) - ARABIC_INDIC_BASE] ?? ch
  );
  s = s.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
  return s;
};

/** Persian digits for table cells — no thousands grouping. */
export const formatTableCellNumber = (value: number | string | null | undefined): string =>
  toPersianDigits(value);

/** Like {@link formatTableCellNumber} with a fallback for null/undefined. */
export const formatNullableTableCellNumber = (
  value: number | null | undefined,
  empty: string
): string => (value === null || value === undefined ? empty : formatTableCellNumber(value));

/**
 * Normalizes Persian (۰–۹) and Arabic‑Indic (٠–٩) digits to Western ASCII (0–9).
 */
export const toWesternDigits = (value: string): string =>
  value
    .replace(EXTENDED_ARABIC_INDIC_DIGIT, (ch) =>
      String(ch.charCodeAt(0) - EXTENDED_ARABIC_INDIC_BASE)
    )
    .replace(ARABIC_INDIC_DIGIT, (ch) => String(ch.charCodeAt(0) - ARABIC_INDIC_BASE));
