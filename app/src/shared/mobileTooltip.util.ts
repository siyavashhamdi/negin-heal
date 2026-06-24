export const MOBILE_TOOLTIP_DISMISS_MS = 3000;
export const MOBILE_TOOLTIP_LONG_PRESS_MS = 500;

export function isTooltipPortalTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(".MuiTooltip-popper"));
}

export function isOutsideTooltipTrigger(
  target: EventTarget | null,
  triggerElement: HTMLElement | null
): boolean {
  if (!(target instanceof Node)) {
    return true;
  }

  if (triggerElement?.contains(target)) {
    return false;
  }

  return !isTooltipPortalTarget(target);
}
