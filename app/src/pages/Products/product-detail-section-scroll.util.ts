import type { ProductSectionTab } from "./product-section-tabs.shared";
import { PRODUCT_DETAIL_SECTION_TARGETS } from "./product-section-tabs.shared";

export type ProductDetailSectionTab = ProductSectionTab;

export { PRODUCT_DETAIL_SECTION_TARGETS };

const MOBILE_PINNED_TABS_OFFSET_QUERY = "(max-width: 37.4375rem)";

export function getProductDetailPinnedTabsScrollOffset(): number {
  if (!window.matchMedia(MOBILE_PINNED_TABS_OFFSET_QUERY).matches) {
    return 12;
  }

  const tabsShell = document.querySelector<HTMLElement>("[data-product-detail-tabs]");
  if (!tabsShell) {
    return 72;
  }

  const styles = window.getComputedStyle(tabsShell);
  const stickyTop = Number.parseFloat(styles.top) || 0;
  return stickyTop + tabsShell.offsetHeight + 8;
}

export function scrollToProductDetailSection(section: ProductDetailSectionTab): void {
  const targetId = PRODUCT_DETAIL_SECTION_TARGETS[section];
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  const offset = getProductDetailPinnedTabsScrollOffset();
  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);

  window.scrollTo({
    top,
    behavior: "smooth",
  });
}

/** Picks the last section whose top has passed the pinned-tabs offset (scroll-spy). */
export function resolveProductDetailSectionFromScroll(
  visibleTabs: readonly ProductDetailSectionTab[]
): ProductDetailSectionTab {
  const offset = getProductDetailPinnedTabsScrollOffset() + 8;
  let activeTab: ProductDetailSectionTab = visibleTabs[0] ?? "intro";

  for (const tab of visibleTabs) {
    const target = document.getElementById(PRODUCT_DETAIL_SECTION_TARGETS[tab]);
    if (!target) {
      continue;
    }

    if (target.getBoundingClientRect().top <= offset) {
      activeTab = tab;
    }
  }

  return activeTab;
}
