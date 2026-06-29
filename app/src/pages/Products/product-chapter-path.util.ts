import { getProductDetailPinnedTabsScrollOffset } from "./product-detail-section-scroll.util";

export function scrollToProductChapter(chapterKey: string): void {
  const target = document.getElementById(`product-chapter-${chapterKey}`);
  if (!target) {
    return;
  }

  const offset = getProductDetailPinnedTabsScrollOffset() + 8;
  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);

  window.scrollTo({
    top,
    behavior: "smooth",
  });
}

export function resolveActiveChapterKeyFromScroll(chapterKeys: readonly string[]): string | null {
  if (chapterKeys.length === 0) {
    return null;
  }

  const offset = getProductDetailPinnedTabsScrollOffset() + 24;
  let activeKey: string | null = chapterKeys[0] ?? null;

  for (const chapterKey of chapterKeys) {
    const target = document.getElementById(`product-chapter-${chapterKey}`);
    if (!target) {
      continue;
    }

    if (target.getBoundingClientRect().top <= offset) {
      activeKey = chapterKey;
    }
  }

  return activeKey;
}
