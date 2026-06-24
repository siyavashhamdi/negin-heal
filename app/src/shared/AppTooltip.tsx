import { Tooltip, type TooltipProps } from "@mui/material";
import { useForkRef } from "@mui/material/utils";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type SyntheticEvent,
} from "react";
import { useMobileAppLayout } from "../hooks/useMobileAppLayout";
import {
  isOutsideTooltipTrigger,
  MOBILE_TOOLTIP_DISMISS_MS,
  MOBILE_TOOLTIP_LONG_PRESS_MS,
} from "./mobileTooltip.util";

export type AppTooltipProps = TooltipProps;

export default function AppTooltip({
  children,
  open: openProp,
  onClose,
  onOpen,
  title,
  disableHoverListener,
  disableFocusListener,
  disableTouchListener,
  leaveTouchDelay = MOBILE_TOOLTIP_DISMISS_MS,
  enterTouchDelay,
  ...rest
}: AppTooltipProps): ReactElement {
  const isMobileLayout = useMobileAppLayout();
  const isControlled = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const childElement = isValidElement(children) ? children : null;
  const childRef = childElement?.ref as React.Ref<HTMLElement> | undefined;
  const mergedTriggerRef = useForkRef(triggerRef, childRef);

  const hasTooltipContent = title !== "" && title != null && title !== false;
  const useMobileBehavior = isMobileLayout && hasTooltipContent;
  const isTooltipOpen = isControlled ? Boolean(openProp) : uncontrolledOpen;

  const resolvedEnterTouchDelay =
    enterTouchDelay ?? (useMobileBehavior ? MOBILE_TOOLTIP_LONG_PRESS_MS : 700);

  type TriggerChildProps = {
    ref?: React.Ref<HTMLElement>;
  };

  const closeMobileTooltip = useCallback((): void => {
    if (isControlled) {
      onClose?.({ type: "dismiss" } as SyntheticEvent);
      return;
    }
    setUncontrolledOpen(false);
  }, [isControlled, onClose]);

  useEffect(() => {
    if (!useMobileBehavior || !isTooltipOpen) {
      return;
    }

    const timeoutId = window.setTimeout(closeMobileTooltip, MOBILE_TOOLTIP_DISMISS_MS);

    const handlePointerDown = (event: PointerEvent): void => {
      if (!isOutsideTooltipTrigger(event.target, triggerRef.current)) {
        return;
      }
      closeMobileTooltip();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [closeMobileTooltip, isTooltipOpen, useMobileBehavior]);

  const resolvedOpen = isControlled ? openProp : uncontrolledOpen;

  const enhancedChild = childElement
    ? cloneElement(childElement as ReactElement<TriggerChildProps>, {
        ref: mergedTriggerRef,
      })
    : children;

  return (
    <Tooltip
      {...rest}
      title={title}
      open={resolvedOpen}
      onOpen={(event) => {
        if (!isControlled) {
          setUncontrolledOpen(true);
        }
        onOpen?.(event);
      }}
      onClose={(event) => {
        if (!isControlled) {
          setUncontrolledOpen(false);
        }
        onClose?.(event);
      }}
      disableHoverListener={useMobileBehavior || disableHoverListener}
      disableFocusListener={useMobileBehavior || disableFocusListener}
      disableTouchListener={disableTouchListener}
      leaveTouchDelay={leaveTouchDelay}
      enterTouchDelay={resolvedEnterTouchDelay}
    >
      {enhancedChild}
    </Tooltip>
  );
}
