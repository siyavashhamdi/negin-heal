import { alpha, type SxProps, type Theme } from "@mui/material/styles";

const hairline = (color: string): string => `0.0625rem solid ${color}`;

export function crudModalTitleSx(theme: Theme): SxProps<Theme> {
  return {
    borderBottom: hairline(theme.palette.divider),
    backgroundColor:
      theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
    /** Breathing room between the title bar and the dialog body (create / edit / view). */
    mb: theme.spacing(1.5),
  };
}

export function crudModalFooterSx(
  theme: Theme,
  options: { pinFooterToBottomOnMobile?: boolean } = {}
): SxProps<Theme> {
  const { pinFooterToBottomOnMobile = false } = options;

  return {
    px: 3,
    py: 2,
    flexShrink: 0,
    ...(pinFooterToBottomOnMobile
      ? {
          [theme.breakpoints.down("md")]: {
            marginTop: "auto",
          },
        }
      : {}),
    borderTop: hairline(theme.palette.divider),
    backgroundColor:
      theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
  };
}

export function viewModalSectionHeaderSx(theme: Theme): SxProps<Theme> {
  const isDark = theme.palette.mode === "dark";
  const primary = theme.palette.primary.main;

  return {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    mb: theme.spacing(3),
    px: theme.spacing(3),
    py: theme.spacing(2),
    border: hairline(theme.palette.divider),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.02)",
    backgroundImage: `linear-gradient(90deg, ${alpha(primary, isDark ? 0.18 : 0.1)} 0%, ${alpha(primary, isDark ? 0.06 : 0.03)} 55%, transparent 100%)`,
  };
}

export function viewModalSectionAccentSx(theme: Theme): SxProps<Theme> {
  return {
    flexShrink: 0,
    width: "0.1875rem",
    height: "1.125rem",
    borderRadius: theme.shape.borderRadius,
    bgcolor: "primary.main",
  };
}

export function viewModalTabsSx(theme: Theme): SxProps<Theme> {
  return {
    borderBottom: hairline(theme.palette.divider),
    "& .MuiTab-root": {
      fontWeight: theme.typography.fontWeightBold,
      minHeight: theme.spacing(6),
    },
  };
}
