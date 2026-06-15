export type TextFieldConfig<T extends string> = {
  readonly key: T;
  readonly label: string;
  readonly multiline?: boolean;
  readonly type?: "text" | "number" | "password" | "email" | "url";
};

export const COMMON_TEXTAREA_ROWS = 4;
export const HTML_TEXTAREA_ROWS = 10;

export const TECHNICAL_VALUE_INPUT_SX = {
  "& .MuiInputBase-input": {
    direction: "ltr",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    textAlign: "left",
    unicodeBidi: "plaintext",
  },
} as const;

export function replaceAt<T>(items: T[], index: number, value: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}

export function removeAt<T>(items: T[], index: number, fallback: T): T[] {
  const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
  return nextItems.length > 0 ? nextItems : [fallback];
}
