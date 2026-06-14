import { useState, useCallback, useMemo, type ReactElement, type ReactNode } from "react";
import { Snackbar, Alert, Slide, useMediaQuery, useTheme } from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";
import {
  SnackbarContext,
  type SnackbarSeverity,
  type SnackbarContextValue,
} from "./snackbar-context";
import styles from "./styles/SnackbarContext.module.scss";

/**
 * Snackbar message data
 */
interface SnackbarMessage {
  message: string;
  severity: SnackbarSeverity;
  duration?: number;
}

/**
 * Snackbar Provider Props
 */
interface SnackbarProviderProps {
  readonly children: ReactNode;
}

/**
 * Snackbar Provider Component
 * Manages snackbar state and provides methods to show different types of alerts
 */
export const SnackbarProvider = ({ children }: SnackbarProviderProps): ReactElement => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });

  const SnackbarSlide = useMemo(() => {
    const direction = isMobile ? "down" : "up";
    return function SnackbarSlideInner(props: SlideProps): ReactElement {
      return <Slide {...props} direction={direction} />;
    };
  }, [isMobile]);
  const [open, setOpen] = useState(false);
  const [snackbarData, setSnackbarData] = useState<SnackbarMessage>({
    message: "",
    severity: "info",
    duration: 6000,
  });

  /**
   * Show snackbar with custom severity
   */
  const showSnackbar = useCallback(
    (message: string, severity: SnackbarSeverity = "info", duration: number = 6000) => {
      setSnackbarData({ message, severity, duration });
      setOpen(true);
    },
    []
  );

  /**
   * Show success snackbar
   */
  const showSuccess = useCallback(
    (message: string, duration: number = 6000) => {
      showSnackbar(message, "success", duration);
    },
    [showSnackbar]
  );

  /**
   * Show error snackbar
   */
  const showError = useCallback(
    (message: string, duration: number = 6000) => {
      showSnackbar(message, "error", duration);
    },
    [showSnackbar]
  );

  /**
   * Show warning snackbar
   */
  const showWarning = useCallback(
    (message: string, duration: number = 6000) => {
      showSnackbar(message, "warning", duration);
    },
    [showSnackbar]
  );

  /**
   * Show info snackbar
   */
  const showInfo = useCallback(
    (message: string, duration: number = 6000) => {
      showSnackbar(message, "info", duration);
    },
    [showSnackbar]
  );

  /**
   * Handle snackbar close
   */
  const handleClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  }, []);

  const value: SnackbarContextValue = {
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={snackbarData.duration}
        onClose={handleClose}
        anchorOrigin={
          isMobile
            ? { vertical: "top", horizontal: "center" }
            : { vertical: "bottom", horizontal: "left" }
        }
        TransitionComponent={SnackbarSlide}
        TransitionProps={{
          timeout: 360,
        }}
        className={styles.snackbar}
        sx={{
          /* Viewport-fixed: stays in view while the main layout / tables scroll */
          zIndex: (muiTheme) => muiTheme.zIndex.snackbar,
        }}
      >
        <Alert
          onClose={handleClose}
          severity={snackbarData.severity}
          variant="filled"
          className={styles.alert}
        >
          {snackbarData.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};
