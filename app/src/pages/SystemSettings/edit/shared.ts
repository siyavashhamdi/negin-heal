import {
  MULTILINE_TEXTAREA_MIN_ROWS,
  MULTILINE_TEXTAREA_MAX_ROWS,
} from "../../../constants/multilineTextarea.constants";

export type TextFieldConfig<T extends string> = {
  readonly key: T;
  readonly label: string;
  readonly multiline?: boolean;
  readonly type?: "text" | "number" | "password" | "email" | "url";
};

/** @deprecated Use MULTILINE_TEXTAREA_MIN_ROWS from constants. */
export const COMMON_TEXTAREA_ROWS = MULTILINE_TEXTAREA_MIN_ROWS;

/** @deprecated Use MULTILINE_TEXTAREA_MIN_ROWS from constants. */
export const HTML_TEXTAREA_ROWS = MULTILINE_TEXTAREA_MIN_ROWS;

export { MULTILINE_TEXTAREA_MIN_ROWS, MULTILINE_TEXTAREA_MAX_ROWS };

export function replaceAt<T>(items: T[], index: number, value: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}

export function removeAt<T>(items: T[], index: number, fallback: T): T[] {
  const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
  return nextItems.length > 0 ? nextItems : [fallback];
}
