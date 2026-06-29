import type { ProductSectionTab } from "./product-section-tabs.shared";
import { PRODUCT_FORM_SECTION_TARGETS } from "./product-section-tabs.shared";

export function scrollToProductFormSection(section: ProductSectionTab): void {
  const targetId = PRODUCT_FORM_SECTION_TARGETS[section];
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}
