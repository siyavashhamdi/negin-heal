import { isNativeAndroidShell } from "../utils/nativePlatform.util";

const KEYBOARD_OPEN_THRESHOLD_PX = 80;
const SCROLL_PADDING_PX = 16;
const DEFAULT_BOTTOM_RESERVE_PX = 88;
const FOCUS_SCROLL_DELAYS_MS = [0, 120, 320] as const;

function readMobileBottomReservePx(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--app-mobile-bottom-reserve")
    .trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_BOTTOM_RESERVE_PX;
}

function isEditableField(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    const input = target as HTMLInputElement;
    return input.type !== "hidden" && input.type !== "checkbox" && input.type !== "radio";
  }

  return target.classList.contains("MuiInputBase-input");
}

function resolveScrollTarget(element: HTMLElement): HTMLElement {
  return (
    element.closest<HTMLElement>(".MuiFormControl-root") ??
    element.closest<HTMLElement>(".MuiDialogContent-root") ??
    element
  );
}

function findScrollableParent(element: HTMLElement): HTMLElement | null {
  let current = element.parentElement;

  while (current) {
    if (
      current.classList.contains("MuiDialogContent-root") ||
      current.classList.contains("modalDialogContentScrollMobile") ||
      current.classList.contains("modalDialogContentScrollDesktop")
    ) {
      return current;
    }

    const style = getComputedStyle(current);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      current.scrollHeight > current.clientHeight + 1
    ) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function readVisibleViewportBounds(): { readonly top: number; readonly bottom: number } {
  const viewport = window.visualViewport;
  const top = (viewport?.offsetTop ?? 0) + SCROLL_PADDING_PX;
  const viewportHeight = viewport?.height ?? window.innerHeight;
  const keyboardInset = Math.max(
    0,
    window.innerHeight - viewportHeight - (viewport?.offsetTop ?? 0)
  );
  const bottomReserve =
    keyboardInset > KEYBOARD_OPEN_THRESHOLD_PX ? SCROLL_PADDING_PX : readMobileBottomReservePx();

  return {
    top,
    bottom: (viewport?.offsetTop ?? 0) + viewportHeight - bottomReserve - SCROLL_PADDING_PX,
  };
}

function scrollWithinContainer(container: HTMLElement, deltaY: number): void {
  if (Math.abs(deltaY) < 1) {
    return;
  }

  container.scrollBy({ top: deltaY, behavior: "smooth" });
}

function scrollElementIntoVisibleArea(element: HTMLElement): void {
  const scrollTarget = resolveScrollTarget(element);
  const rect = scrollTarget.getBoundingClientRect();
  const { top: visibleTop, bottom: visibleBottom } = readVisibleViewportBounds();

  if (rect.bottom <= visibleBottom && rect.top >= visibleTop) {
    return;
  }

  let deltaY = 0;
  if (rect.bottom > visibleBottom) {
    deltaY = rect.bottom - visibleBottom;
  } else if (rect.top < visibleTop) {
    deltaY = rect.top - visibleTop;
  }

  const scrollParent = findScrollableParent(scrollTarget);
  if (scrollParent) {
    scrollWithinContainer(scrollParent, deltaY);
    return;
  }

  const scrollingElement = document.scrollingElement;
  if (scrollingElement instanceof HTMLElement) {
    scrollWithinContainer(scrollingElement, deltaY);
    return;
  }

  window.scrollBy({ top: deltaY, behavior: "smooth" });
}

function updateKeyboardViewportState(): void {
  const viewport = window.visualViewport;
  if (!viewport) {
    return;
  }

  const keyboardInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);

  document.documentElement.style.setProperty("--app-keyboard-inset", `${keyboardInset}px`);
  document.documentElement.classList.toggle(
    "keyboard-open",
    keyboardInset > KEYBOARD_OPEN_THRESHOLD_PX
  );
}

let focusedField: HTMLElement | null = null;
let scrollFrameId: number | null = null;
let scrollTimeoutIds: number[] = [];

function clearScheduledScrolls(): void {
  if (scrollFrameId !== null) {
    window.cancelAnimationFrame(scrollFrameId);
    scrollFrameId = null;
  }

  for (const timeoutId of scrollTimeoutIds) {
    window.clearTimeout(timeoutId);
  }
  scrollTimeoutIds = [];
}

function scheduleScrollIntoView(element: HTMLElement): void {
  clearScheduledScrolls();

  const run = (): void => {
    if (focusedField !== element) {
      return;
    }

    updateKeyboardViewportState();
    scrollElementIntoVisibleArea(element);
  };

  scrollFrameId = window.requestAnimationFrame(run);
  scrollTimeoutIds = FOCUS_SCROLL_DELAYS_MS.map((delayMs) => window.setTimeout(run, delayMs));
}

export function registerNativeKeyboardScrollBehavior(): void {
  if (!isNativeAndroidShell()) {
    return;
  }

  const handleFocusIn = (event: FocusEvent): void => {
    if (!isEditableField(event.target)) {
      return;
    }

    focusedField = event.target;
    scheduleScrollIntoView(event.target);
  };

  const handleFocusOut = (): void => {
    focusedField = null;
    clearScheduledScrolls();
  };

  const handleViewportChange = (): void => {
    updateKeyboardViewportState();
    if (focusedField) {
      scheduleScrollIntoView(focusedField);
    }
  };

  document.addEventListener("focusin", handleFocusIn, true);
  document.addEventListener("focusout", handleFocusOut, true);
  window.visualViewport?.addEventListener("resize", handleViewportChange);
  window.visualViewport?.addEventListener("scroll", handleViewportChange);
  window.addEventListener("resize", handleViewportChange);
  updateKeyboardViewportState();
}
