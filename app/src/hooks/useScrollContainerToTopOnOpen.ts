import { useCallback, useLayoutEffect, type RefObject } from "react";

const DIALOG_SCROLL_CONTAINER_SELECTOR =
  ".MuiDialog-container, .MuiDialog-paper, .MuiDialogContent-root";

function resetScrollContainer(element: HTMLElement | null | undefined): void {
  if (!element) {
    return;
  }

  element.scrollTop = 0;
  element.scrollLeft = 0;
}

export function resetDialogScrollContainers(contentElement: HTMLElement | null | undefined): void {
  resetScrollContainer(contentElement);

  if (contentElement) {
    let node: HTMLElement | null = contentElement;
    while (node) {
      if (
        node.classList.contains("MuiDialogContent-root") ||
        node.classList.contains("MuiDialog-paper") ||
        node.classList.contains("MuiDialog-container")
      ) {
        resetScrollContainer(node);
      }
      node = node.parentElement;
    }

    const dialogRoot = contentElement.closest(".MuiDialog-root");
    dialogRoot
      ?.querySelectorAll<HTMLElement>(DIALOG_SCROLL_CONTAINER_SELECTOR)
      .forEach((element) => resetScrollContainer(element));
  }
}

function scheduleScrollReset(getContainer: () => HTMLElement | null): () => void {
  resetDialogScrollContainers(getContainer());

  const rafId = requestAnimationFrame(() => {
    resetDialogScrollContainers(getContainer());
    requestAnimationFrame(() => {
      resetDialogScrollContainers(getContainer());
    });
  });

  const timeoutId = window.setTimeout(() => {
    resetDialogScrollContainers(getContainer());
  }, 0);

  return () => {
    cancelAnimationFrame(rafId);
    window.clearTimeout(timeoutId);
  };
}

type DialogScrollTransitionProps = {
  readonly onEntered: () => void;
};

/**
 * Resets dialog scroll containers whenever a dialog opens or its content identity
 * changes (e.g. edit form data finished loading).
 */
export function useScrollContainerToTopOnOpen(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  resetKey?: unknown
): DialogScrollTransitionProps {
  const resetScroll = useCallback(() => {
    resetDialogScrollContainers(containerRef.current);
  }, [containerRef]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    return scheduleScrollReset(() => containerRef.current);
  }, [containerRef, open, resetKey]);

  const onEntered = useCallback(() => {
    if (!open) {
      return;
    }
    resetScroll();
  }, [open, resetScroll]);

  return { onEntered };
}
