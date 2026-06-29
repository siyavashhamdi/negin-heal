import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import { Alert, Box, Button, Snackbar } from "@mui/material";
import { useEffect, useRef, useState, type ReactElement } from "react";

import { useBrowserOffline } from "../hooks/useBrowserOffline";
import { useGeneralUpdatesOnline } from "../hooks/useGeneralUpdatesOnline";
import { useOfflineBannerDismissed } from "../hooks/useOfflineBannerDismissed";
import { useMobileAppLayout } from "../hooks/useMobileAppLayout";
import { useMobileSnackbarDismiss } from "../hooks/useMobileSnackbarDismiss";
import { useTranslation } from "../hooks/useTranslation";
import {
  getSnackbarFilledAlertSx,
  getSnackbarFilledAlertTone,
  SNACKBAR_ALERT_CLASS,
} from "../theme";

/** Clears the floating mobile bottom nav (padding + item height + gap). */
const MOBILE_BOTTOM_NAV_SNACKBAR_OFFSET =
  "calc(4.75rem + max(0.7rem, env(safe-area-inset-bottom, 0px)))";

const DISMISS_BUTTON_BORDER_COLOR = "rgba(255, 236, 179, 0.95)";
const BANNER_INSET_MARGIN = "0.5rem";
const INITIAL_GRACE_PERIOD_MS = 5_000;

const dismissButtonSx = {
  flexShrink: 0,
  minWidth: 0,
  px: 0.65,
  py: 0.125,
  fontSize: "0.75rem",
  lineHeight: 1.3,
  fontWeight: 500,
  borderColor: DISMISS_BUTTON_BORDER_COLOR,
  color: "inherit",
  "&:hover": {
    borderColor: "#fff7ed",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
} as const;

export function OfflineModeBanner(): ReactElement | null {
  const { t } = useTranslation();
  const isMobileAppLayout = useMobileAppLayout();
  const isOfflineMode = useBrowserOffline();
  const generalUpdatesOnline = useGeneralUpdatesOnline();
  const isOffline = isOfflineMode && generalUpdatesOnline !== true;
  const { dismissed, dismiss } = useOfflineBannerDismissed();
  const wasOfflineRef = useRef(isOffline);
  const [gracePeriodElapsed, setGracePeriodElapsed] = useState(false);
  const isOpen = isOffline && !dismissed && gracePeriodElapsed;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setGracePeriodElapsed(true);
    }, INITIAL_GRACE_PERIOD_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const { handlePointerDown, dragStyle, resetDrag } = useMobileSnackbarDismiss(
    isMobileAppLayout,
    isOpen,
    dismiss
  );

  useEffect(() => {
    const enteredOnline = !isOffline && wasOfflineRef.current;

    if (enteredOnline) {
      resetDrag();
    }

    wasOfflineRef.current = isOffline;
  }, [isOffline, resetDrag]);

  if (!isOffline || !gracePeriodElapsed) {
    return null;
  }

  const alertSx = getSnackbarFilledAlertSx("warning");
  const alertTone = getSnackbarFilledAlertTone("warning");

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={null}
      anchorOrigin={{ vertical: "bottom", horizontal: isMobileAppLayout ? "center" : "left" }}
      TransitionProps={{
        onExited: resetDrag,
      }}
      sx={{
        zIndex: (muiTheme) => muiTheme.zIndex.snackbar + 2,
        top: "auto !important",
        bottom: isMobileAppLayout
          ? `${MOBILE_BOTTOM_NAV_SNACKBAR_OFFSET} !important`
          : "calc(1.5rem + env(safe-area-inset-bottom, 0px)) !important",
        ...(isMobileAppLayout
          ? {
              insetInline: "0 !important",
              width: "100% !important",
              maxWidth: "100% !important",
              paddingInline:
                "max(0.75rem, env(safe-area-inset-left, 0px)) max(0.75rem, env(safe-area-inset-right, 0px)) !important",
              boxSizing: "border-box",
            }
          : {
              insetInlineStart: "1.5rem !important",
              insetInlineEnd: "auto !important",
            }),
      }}
    >
      <Alert
        severity="warning"
        variant="filled"
        icon={<CloudOffRoundedIcon fontSize="inherit" />}
        className={SNACKBAR_ALERT_CLASS}
        onPointerDown={handlePointerDown}
        sx={{
          ...alertSx,
          position: "relative",
          width: "100%",
          maxWidth: isMobileAppLayout ? "100%" : 400,
          backgroundColor: alertTone.backgroundColor,
          backgroundImage: "none",
          color: alertTone.color,
          alignItems: "flex-start",
          py: 0.5,
          ...(isMobileAppLayout
            ? {
                cursor: "grab",
                touchAction: "none",
                userSelect: "none",
                transition: "transform 200ms ease, opacity 200ms ease",
                "&:active": {
                  cursor: "grabbing",
                },
              }
            : {}),
          "& .MuiAlert-message": {
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.5rem",
            width: "100%",
            py: 0.25,
            pe: 0.5,
            fontSize: "0.8125rem",
            lineHeight: 1.45,
          },
        }}
        style={{
          ...dragStyle,
        }}
      >
        <Box component="span" sx={{ width: "100%" }}>
          {t("layout.offlineMode.message")}
        </Box>
        <Button
          color="inherit"
          size="small"
          variant="outlined"
          onClick={dismiss}
          sx={{
            ...dismissButtonSx,
            marginInlineEnd: BANNER_INSET_MARGIN,
            marginBlockEnd: BANNER_INSET_MARGIN,
          }}
        >
          {t("layout.offlineMode.dismissButton")}
        </Button>
      </Alert>
    </Snackbar>
  );
}
