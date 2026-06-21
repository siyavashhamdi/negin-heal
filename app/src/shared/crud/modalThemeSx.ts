import { alpha, type SxProps, type Theme } from "@mui/material/styles";

const hairline = (color: string): string => `0.0625rem solid ${color}`;

/** Neutral elevated surface for tables, dialogs, and boxes (`index.scss`). */
export const APP_CONTENT_SURFACE_BG = "var(--app-content-surface-bg, var(--app-surface-bg))";

/** Matches layout header / table shell surfaces (`index.scss` --app-surface-bg). */
export const APP_SURFACE_BG = APP_CONTENT_SURFACE_BG;

/** Soft pink panel wash for light mode chrome only (`index.scss` --app-panel-gradient). */
export const APP_PANEL_GRADIENT = "var(--app-panel-gradient)";

/** Soft blush wash for tables / boxes in light mode. */
export const APP_CONTENT_SURFACE_GRADIENT = "var(--app-content-surface-gradient)";

function contentSurfaceSx(theme: Theme): SxProps<Theme> {
  if (theme.palette.mode === "dark") {
    return {
      backgroundColor: APP_CONTENT_SURFACE_BG,
      backgroundImage: "none",
    };
  }

  return {
    backgroundColor: APP_CONTENT_SURFACE_BG,
    backgroundImage: APP_CONTENT_SURFACE_GRADIENT,
  };
}

export function appSurfacePaperSx(theme: Theme): SxProps<Theme> {
  return contentSurfaceSx(theme);
}

export function crudModalTitleSx(theme: Theme): SxProps<Theme> {
  return {
    borderBottom: hairline(theme.palette.divider),
    ...contentSurfaceSx(theme),
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
    ...contentSurfaceSx(theme),
  };
}

export function crudModalContentSx(theme: Theme): SxProps<Theme> {
  return contentSurfaceSx(theme);
}

export function viewModalSectionHeaderSx(theme: Theme): SxProps<Theme> {
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
    ...contentSurfaceSx(theme),
    backgroundImage:
      theme.palette.mode === "dark"
        ? `linear-gradient(90deg, ${alpha(primary, 0.18)} 0%, ${alpha(primary, 0.06)} 55%, transparent 100%)`
        : `${APP_CONTENT_SURFACE_GRADIENT}, linear-gradient(90deg, ${alpha(primary, 0.08)} 0%, ${alpha(primary, 0.02)} 55%, transparent 100%)`,
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
