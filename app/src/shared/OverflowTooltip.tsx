import { Box, useMediaQuery } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import AppTooltip from "./AppTooltip";
import { useMobileAppLayout } from "../hooks/useMobileAppLayout";

const truncatedCellContentSx = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
  maxWidth: "100%",
  "& .MuiTypography-root": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  "& .MuiChip-root": {
    maxWidth: "100%",
  },
  "& .MuiChip-label": {
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
} as const satisfies SxProps<Theme>;

function measureOverflow(
  element: HTMLElement,
  measureNested: boolean,
): { overflowing: boolean; text: string } {
  const measureTargets = measureNested
    ? [
        element.querySelector<HTMLElement>(".MuiTypography-root"),
        element.querySelector<HTMLElement>(".MuiChip-label"),
        element.querySelector<HTMLElement>(".MuiChip-root"),
        element,
      ].filter((node): node is HTMLElement => node != null)
    : [element];

  for (const measureElement of measureTargets) {
    const widthOverflow = measureElement.scrollWidth > measureElement.clientWidth + 1;
    const heightOverflow = measureElement.scrollHeight > measureElement.clientHeight + 1;
    if (widthOverflow || heightOverflow) {
      return {
        overflowing: true,
        text: (measureElement.textContent ?? "").trim(),
      };
    }
  }

  return { overflowing: false, text: "" };
}

export type OverflowTooltipProps = {
  readonly children: ReactNode;
  /** Full tooltip text. When omitted, overflow text is read from the element. */
  readonly title?: string;
  readonly className?: string;
  readonly sx?: SxProps<Theme>;
  readonly component?: "span" | "div";
  /** Measure nested MUI typography/chip labels (table cells). */
  readonly measureNested?: boolean;
};

export function OverflowTooltip({
  children,
  title,
  className,
  sx,
  component = "span",
  measureNested = false,
}: OverflowTooltipProps): ReactElement {
  const contentRef = useRef<HTMLElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [detectedText, setDetectedText] = useState("");
  const [touchOpen, setTouchOpen] = useState(false);
  const isMobileLayout = useMobileAppLayout();
  const isTouchPrimary = useMediaQuery("(hover: none) and (pointer: coarse)");
  const useTouchToggle = isMobileLayout || isTouchPrimary;
  const tooltipText = title ?? detectedText;

  const updateOverflowState = useCallback((): void => {
    const element = contentRef.current;
    if (!element) {
      return;
    }
    const { overflowing, text } = measureOverflow(element, measureNested);
    setIsOverflowing(overflowing);
    setDetectedText(text);
    if (!overflowing) {
      setTouchOpen(false);
    }
  }, [measureNested]);

  useLayoutEffect(() => {
    updateOverflowState();
    const element = contentRef.current;
    if (!element) {
      return;
    }
    const resizeObserver = new ResizeObserver(updateOverflowState);
    resizeObserver.observe(element);
    return () => {
      resizeObserver.disconnect();
    };
  }, [children, updateOverflowState]);

  useEffect(() => {
    if (!touchOpen) {
      return;
    }
    const closeOnScroll = (): void => {
      setTouchOpen(false);
    };
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [touchOpen]);

  const showTooltip = isOverflowing && tooltipText !== "";

  const handleTouchToggle = (event: MouseEvent<HTMLElement>): void => {
    if (!useTouchToggle || !showTooltip) {
      return;
    }
    if (!touchOpen) {
      event.preventDefault();
      event.stopPropagation();
    }
    setTouchOpen((prev) => !prev);
  };

  return (
    <AppTooltip
      title={tooltipText}
      arrow
      enterDelay={500}
      enterTouchDelay={0}
      open={useTouchToggle ? (showTooltip ? touchOpen : false) : undefined}
      onClose={() => setTouchOpen(false)}
      disableHoverListener={!showTooltip || useTouchToggle}
      disableFocusListener={!showTooltip || useTouchToggle}
      disableTouchListener={!showTooltip || useTouchToggle}
    >
      <Box
        component={component}
        ref={contentRef}
        className={className}
        sx={sx}
        onClick={handleTouchToggle}
        aria-label={showTooltip && useTouchToggle ? tooltipText : undefined}
      >
        {children}
      </Box>
    </AppTooltip>
  );
}

export function TruncatedTableCellContent({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <OverflowTooltip component="div" sx={truncatedCellContentSx} measureNested>
      {children}
    </OverflowTooltip>
  );
}
