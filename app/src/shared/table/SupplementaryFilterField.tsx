import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

/** Width presets aligned with common table column filter sizes (کمیسیون نظارت / اتاق‌ها). */
export type SupplementaryFilterFieldWidth = "sm" | "md" | "lg" | "grow";

const WIDTH_SX: Record<SupplementaryFilterFieldWidth, SxProps<Theme>> = {
  sm: {
    width: { xs: "100%", sm: "14rem" },
    flexShrink: 0,
  },
  md: {
    width: { xs: "100%", sm: "14.5rem" },
    minWidth: { sm: "14.5rem" },
    flex: { sm: "1 1 14.5rem" },
    maxWidth: { sm: "20rem" },
  },
  lg: {
    width: { xs: "100%", sm: "17.5rem" },
    flexShrink: 0,
  },
  grow: {
    width: { xs: "100%", sm: "auto" },
    minWidth: { sm: "14rem" },
    flex: { sm: "1 1 14rem" },
    maxWidth: { sm: "24rem" },
  },
};

interface LabeledFilterControlProps {
  label?: string;
  ariaLabel?: string;
}

function injectFloatingLabel(children: ReactNode, label: string): ReactNode {
  if (!isValidElement<LabeledFilterControlProps>(children)) {
    return children;
  }
  const childLabel = children.props.label;
  if (childLabel != null && childLabel !== "") {
    return children;
  }
  return cloneElement(children, {
    label,
    ariaLabel: children.props.ariaLabel ?? label,
  });
}

export interface SupplementaryFilterFieldProps {
  /** Caption for stacked layout, or floating label injected into the control when `variant` is `floating`. */
  label?: string;
  children: ReactNode;
  width?: SupplementaryFilterFieldWidth;
  /**
   * `stacked` — caption above the control.
   * `floating` — MUI floating label inside the control (supplementary bar only).
   */
  variant?: "stacked" | "floating";
}

/**
 * One labeled filter slot inside {@link SupplementaryFiltersBar}.
 * Use per-table children; width presets keep layout consistent across lists.
 */
const SupplementaryFilterField = ({
  label,
  children,
  width = "sm",
  variant = "floating",
}: SupplementaryFilterFieldProps): ReactElement => {
  const resolvedChildren =
    variant === "floating" && label ? injectFloatingLabel(children, label) : children;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: variant === "stacked" ? 0.5 : 0,
        ...WIDTH_SX[width],
      }}
    >
      {variant === "stacked" && label ? (
        <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
          {label}
        </Typography>
      ) : null}
      {resolvedChildren}
    </Box>
  );
};

export default SupplementaryFilterField;
