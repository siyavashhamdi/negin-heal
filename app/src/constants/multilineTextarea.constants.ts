/** Unified visible row count for multiline fields. */
export const MULTILINE_TEXTAREA_MIN_ROWS = 4;

/** Caps growth so multiline fields stay the same height and scroll internally. */
export const MULTILINE_TEXTAREA_MAX_ROWS = 4;

/** Row height used by min/max height calculations (px). */
export const MULTILINE_TEXTAREA_ROW_HEIGHT_PX = 23;

/** Total vertical padding for outlined multiline inputs (~16.5px × 2). */
export const MULTILINE_TEXTAREA_PADDING_BLOCK_PX = 33;

export function multilineTextareaHeightPx(rows: number = MULTILINE_TEXTAREA_MIN_ROWS): number {
  return rows * MULTILINE_TEXTAREA_ROW_HEIGHT_PX + MULTILINE_TEXTAREA_PADDING_BLOCK_PX;
}

/** CSS length for fixed multiline field height (min and max). */
export const MULTILINE_TEXTAREA_MIN_HEIGHT_CSS = `${multilineTextareaHeightPx()}px`;

export const MULTILINE_TEXTAREA_MAX_HEIGHT_CSS = `${multilineTextareaHeightPx(MULTILINE_TEXTAREA_MAX_ROWS)}px`;

/** @deprecated Use MULTILINE_TEXTAREA_MIN_HEIGHT_CSS */
export function multilineTextareaMinHeightPx(rows: number = MULTILINE_TEXTAREA_MIN_ROWS): number {
  return multilineTextareaHeightPx(rows);
}
