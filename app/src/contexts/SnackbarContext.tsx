import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Snackbar,
  Alert,
  Box,
  LinearProgress,
  Slide,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";
import { SNACKBAR_AUTO_HIDE_DURATION_MS } from "../constants/snackbar.constants";
import { isSuppressedUserFacingErrorMessage } from "../utilities/graphql-error.util";
import {
  getSnackbarFilledAlertSx,
  getSnackbarFilledAlertTone,
  SNACKBAR_ALERT_CLASS,
} from "../theme";
import {
  SnackbarContext,
  type SnackbarSeverity,
  type SnackbarContextValue,
  type SnackbarMessageContent,
} from "./snackbar-context";
import styles from "./styles/SnackbarContext.module.scss";

/**
 * Snackbar message data
 */
interface SnackbarMessage {
  message: SnackbarMessageContent;
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
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number | null>(null);
  const [snackbarInstance, setSnackbarInstance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [snackbarData, setSnackbarData] = useState<SnackbarMessage>({
    message: "",
    severity: "info",
    duration: SNACKBAR_AUTO_HIDE_DURATION_MS,
  });
  const snackbarAlertSx = getSnackbarFilledAlertSx(snackbarData.severity);
  const uploadProgressAlertSx = getSnackbarFilledAlertSx("info");
  const snackbarTone = getSnackbarFilledAlertTone(snackbarData.severity);
  const uploadProgressTone = getSnackbarFilledAlertTone("info");
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
  });

  const resetDrag = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    dragStateRef.current = {
      pointerId: -1,
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
    };
  }, []);

  /**
   * Show snackbar with custom severity
   */
  const showSnackbar = useCallback(
    (
      message: SnackbarMessageContent,
      severity: SnackbarSeverity = "info",
      duration: number = SNACKBAR_AUTO_HIDE_DURATION_MS
    ) => {
      setSnackbarData({ message, severity, duration });
      setSnackbarInstance((instance) => instance + 1);
      setOpen(true);
    },
    []
  );

  /**
   * Show success snackbar
   */
  const showSuccess = useCallback(
    (message: SnackbarMessageContent, duration: number = SNACKBAR_AUTO_HIDE_DURATION_MS) => {
      showSnackbar(message, "success", duration);
    },
    [showSnackbar]
  );

  /**
   * Show error snackbar
   */
  const showError = useCallback(
    (message: SnackbarMessageContent, duration: number = SNACKBAR_AUTO_HIDE_DURATION_MS) => {
      if (typeof message === "string" && isSuppressedUserFacingErrorMessage(message)) {
        return;
      }

      showSnackbar(message, "error", duration);
    },
    [showSnackbar]
  );

  /**
   * Show warning snackbar
   */
  const showWarning = useCallback(
    (message: SnackbarMessageContent, duration: number = SNACKBAR_AUTO_HIDE_DURATION_MS) => {
      showSnackbar(message, "warning", duration);
    },
    [showSnackbar]
  );

  /**
   * Show info snackbar
   */
  const showInfo = useCallback(
    (message: SnackbarMessageContent, duration: number = SNACKBAR_AUTO_HIDE_DURATION_MS) => {
      showSnackbar(message, "info", duration);
    },
    [showSnackbar]
  );

  const updateUploadProgress = useCallback((percent: number) => {
    setUploadProgressPercent(Math.min(100, Math.max(0, Math.round(percent))));
  }, []);

  const hideUploadProgress = useCallback(() => {
    setUploadProgressPercent(null);
  }, []);

  /**
   * Handle snackbar close
   */
  const handleClose = useCallback(
    (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === "clickaway") {
        return;
      }
      setOpen(false);
      resetDrag();
    },
    [resetDrag]
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isMobile || !open) {
        return;
      }
      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: 0,
        y: 0,
      };
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [isMobile, open]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!isMobile || !isDragging) {
        return;
      }

      const dragState = dragStateRef.current;
      if (dragState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      dragState.x = deltaX;
      dragState.y = deltaY;
      setDragOffset({ x: deltaX, y: deltaY });
    },
    [isDragging, isMobile]
  );

  const handlePointerEnd = useCallback(
    (event?: PointerEvent) => {
      if (!isMobile) {
        return;
      }
      const dragState = dragStateRef.current;
      if (event && dragState.pointerId !== event.pointerId) {
        return;
      }

      const horizontalDismissed = Math.abs(dragState.x) > 96;
      const verticalDismissed = dragState.y < -72;
      const tapDismissed = Math.abs(dragState.x) < 8 && Math.abs(dragState.y) < 8;

      if (horizontalDismissed || verticalDismissed || tapDismissed) {
        handleClose();
        return;
      }

      resetDrag();
    },
    [handleClose, isMobile, resetDrag]
  );

  const dragTransform = useMemo(() => {
    if (!isMobile || !isDragging) {
      return undefined;
    }

    const horizontalPriority = Math.abs(dragOffset.x) >= Math.abs(dragOffset.y);
    if (horizontalPriority) {
      return `translate3d(${dragOffset.x}px, 0, 0)`;
    }

    const upwardOnlyY = Math.min(dragOffset.y, 0);
    return `translate3d(0, ${upwardOnlyY}px, 0)`;
  }, [dragOffset.x, dragOffset.y, isDragging, isMobile]);

  const dragDistance = Math.max(Math.abs(dragOffset.x), Math.abs(Math.min(dragOffset.y, 0)));
  const dragOpacity = isMobile && isDragging ? Math.max(0.45, 1 - dragDistance / 180) : 1;

  useEffect(() => {
    if (!isDragging || !isMobile) {
      return;
    }

    const onPointerMove = (event: PointerEvent): void => {
      handlePointerMove(event);
    };
    const onPointerEnd = (event: PointerEvent): void => {
      handlePointerEnd(event);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [handlePointerEnd, handlePointerMove, isDragging, isMobile]);

  const value: SnackbarContextValue = {
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    updateUploadProgress,
    hideUploadProgress,
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        key={snackbarInstance}
        open={open}
        autoHideDuration={snackbarData.duration ?? SNACKBAR_AUTO_HIDE_DURATION_MS}
        onClose={handleClose}
        anchorOrigin={
          isMobile
            ? { vertical: "top", horizontal: "center" }
            : { vertical: "bottom", horizontal: "left" }
        }
        TransitionComponent={SnackbarSlide}
        TransitionProps={{
          timeout: 360,
          onExited: resetDrag,
        }}
        className={styles.snackbar}
        sx={{
          /* Viewport-fixed: stays in view while the main layout / tables scroll */
          zIndex: (muiTheme) => muiTheme.zIndex.snackbar,
        }}
      >
        <Alert
          onClose={isMobile ? undefined : handleClose}
          severity={snackbarData.severity}
          variant="filled"
          className={[styles.alert, SNACKBAR_ALERT_CLASS, isMobile ? styles.alertMobile : ""]
            .filter(Boolean)
            .join(" ")}
          sx={snackbarAlertSx}
          onPointerDown={handlePointerDown}
          style={{
            backgroundColor: snackbarTone.backgroundColor,
            backgroundImage: "none",
            color: snackbarTone.color,
            transform: dragTransform,
            opacity: dragOpacity,
          }}
        >
          {snackbarData.message}
        </Alert>
      </Snackbar>
      <Snackbar
        open={uploadProgressPercent != null}
        autoHideDuration={null}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        className={styles.uploadProgressSnackbar}
        sx={{
          zIndex: (muiTheme) => muiTheme.zIndex.snackbar + 1,
        }}
      >
        <Alert
          severity="info"
          variant="filled"
          className={[styles.uploadProgressAlert, SNACKBAR_ALERT_CLASS].join(" ")}
          sx={uploadProgressAlertSx}
          style={{
            backgroundColor: uploadProgressTone.backgroundColor,
            backgroundImage: "none",
            color: uploadProgressTone.color,
          }}
        >
          <Box className={styles.uploadProgressContent}>
            <Typography variant="body2" className={styles.uploadProgressLabel}>
              در حال آپلود... {uploadProgressPercent?.toLocaleString("fa-IR")}٪
            </Typography>
            <LinearProgress
              variant="determinate"
              value={uploadProgressPercent ?? 0}
              className={styles.uploadProgressBar}
            />
          </Box>
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};
