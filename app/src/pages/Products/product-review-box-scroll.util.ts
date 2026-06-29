function findScrollableAncestor(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null;

  while (node) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return node;
    }

    node = node.parentElement;
  }

  return null;
}

export function scrollToProductReviewBoxEnd(
  anchor: HTMLElement | null,
  options?: { delayMs?: number }
): void {
  if (!anchor) {
    return;
  }

  const scroll = (): void => {
    const scrollParent = findScrollableAncestor(anchor);
    if (scrollParent) {
      const anchorRect = anchor.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();
      scrollParent.scrollTo({
        top: scrollParent.scrollTop + (anchorRect.bottom - parentRect.bottom) + 8,
        behavior: "smooth",
      });
      return;
    }

    anchor.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  window.requestAnimationFrame(() => {
    window.setTimeout(scroll, options?.delayMs ?? 150);
  });
}
