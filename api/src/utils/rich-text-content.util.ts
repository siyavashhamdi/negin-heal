const HTML_TAG_PATTERN = /<[^>]*>/g;
const NBSP_PATTERN = /&nbsp;/gi;
const ZERO_WIDTH_NON_JOINER_PATTERN = /\u200c/g;

export function extractRichTextPlainContent(value: string): string {
  return value
    .replace(HTML_TAG_PATTERN, "")
    .replace(NBSP_PATTERN, "")
    .replace(ZERO_WIDTH_NON_JOINER_PATTERN, "")
    .trim();
}

export function hasRichTextContent(value?: string | null): boolean {
  if (!value?.trim()) {
    return false;
  }

  return extractRichTextPlainContent(value).length > 0;
}
