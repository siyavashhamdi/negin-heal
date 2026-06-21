import type { Breakpoint, SxProps, Theme } from "@mui/material";
import { useMediaQuery, useTheme } from "@mui/material";
import { appSurfacePaperSx } from "../shared/crud/modalThemeSx";

type UseMobileDialogPropsOptions = {
  readonly breakpoint?: Breakpoint;
};

type PaperPropsOptions = {
  readonly className?: string;
  readonly sx?: SxProps<Theme>;
};

type ContentPropsOptions = {
  readonly className?: string;
  readonly sx?: SxProps<Theme>;
};

/**
 * Width-based compact layout (not height) so iOS virtual keyboard does not flip layout mode.
 * MUI `fullScreen` dialogs are a common cause of immediate input blur on iPhone Safari/Chrome.
 */
export function useCompactViewport(breakpoint: Breakpoint = "md"): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down(breakpoint), { noSsr: true });
}

export function useMobileDialogProps(options?: UseMobileDialogPropsOptions) {
  const breakpoint = options?.breakpoint ?? "md";
  const theme = useTheme();
  const isCompact = useCompactViewport(breakpoint);

  const dialogProps = {
    fullScreen: false as const,
    fullWidth: true as const,
    disableScrollLock: false,
    scroll: "paper" as const,
    disableRestoreFocus: false,
  };

  const getPaperProps = ({ className, sx }: PaperPropsOptions = {}) => ({
    className,
    "data-opaque-shell": true,
    sx: {
      ...appSurfacePaperSx(theme),
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      ...(isCompact
        ? {
            m: 0,
            width: "100%",
            maxWidth: "100%",
            height: "100svh",
            maxHeight: "100svh",
            borderRadius: 0,
          }
        : {
            m: 2,
            maxHeight: "min(90dvh, 45rem)",
            borderRadius: 2,
          }),
      ...sx,
    } satisfies SxProps<Theme>,
  });

  const getContentProps = ({ className, sx }: ContentPropsOptions = {}) => ({
    className,
    sx: {
      ...appSurfacePaperSx(theme),
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      ...sx,
    } satisfies SxProps<Theme>,
  });

  return {
    isCompact,
    dialogProps,
    getPaperProps,
    getContentProps,
  };
}
