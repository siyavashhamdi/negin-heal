import type { ProductDetailChapter, ProductDetailItem } from "./product-detail.api";

export function buildProductItemPreviewId(chapterKey: string, itemIndex: number): string {
  return `${chapterKey}:${itemIndex}`;
}

export function findProductDetailItemByPreviewId(
  chapters: readonly ProductDetailChapter[],
  previewId: string
): { chapterKey: string; itemIndex: number; item: ProductDetailItem } | null {
  const match = /^([^:]+):(\d+)$/.exec(previewId.trim());
  if (!match) {
    return null;
  }

  const chapterKey = match[1];
  const itemIndex = Number(match[2]);
  if (!Number.isInteger(itemIndex) || itemIndex < 0) {
    return null;
  }

  const chapter = chapters.find((entry) => entry.key === chapterKey);
  const item = chapter?.items?.[itemIndex];
  if (!item) {
    return null;
  }

  return { chapterKey, itemIndex, item };
}
