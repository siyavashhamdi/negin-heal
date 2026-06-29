import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  IconButton,
  Slide,
  Snackbar,
  useMediaQuery,
  useTheme,
  type AlertColor,
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { useLocation } from "react-router-dom";

import { GENERAL_SUBSCRIPTION_UPDATE_TYPES } from "../constants";
import { NOTIFICATION_SNACKBAR_AUTO_HIDE_DURATION_MS } from "../constants/snackbar.constants";
import snackbarStyles from "../contexts/styles/SnackbarContext.module.scss";
import { useMobileSnackbarDismiss } from "../hooks/useMobileSnackbarDismiss";
import { subscribeGeneralUpdates } from "../lib/general-updates-listeners";
import { isNotificationsRoute } from "../routing/app-shell-routes";
import {
  getSnackbarFilledAlertSx,
  getSnackbarFilledAlertTone,
  SNACKBAR_ALERT_CLASS,
} from "../theme";
import {
  parseNotificationLiveUpdate,
  shouldShowNotificationLiveBanner,
  type NotificationLiveBannerState,
} from "../utilities/notification-live-update.util";
import { NotificationSnackbarContent } from "./NotificationSnackbarContent";

const MODE_ICONS: Record<AlertColor, typeof InfoOutlinedIcon> = {
  info: InfoOutlinedIcon,
  success: CheckCircleOutlineRoundedIcon,
  warning: WarningAmberRoundedIcon,
  error: ErrorOutlineRoundedIcon,
};

export function NotificationLiveBanner(): ReactElement | null {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
  const location = useLocation();
  const [banner, setBanner] = useState<NotificationLiveBannerState | null>(null);
  const [open, setOpen] = useState(false);
  const isNotificationsPage = isNotificationsRoute(location.pathname);

  const SnackbarSlide = useMemo(() => {
    const direction = isMobile ? "down" : "up";
    return function SnackbarSlideInner(props: SlideProps): ReactElement {
      return <Slide {...props} direction={direction} />;
    };
  }, [isMobile]);

  const dismiss = useCallback((): void => {
    setOpen(false);
  }, []);

  const { handlePointerDown, dragStyle, resetDrag } = useMobileSnackbarDismiss(
    isMobile,
    open,
    dismiss
  );

  useEffect(() => {
    return subscribeGeneralUpdates((event) => {
      if (event.updateType !== GENERAL_SUBSCRIPTION_UPDATE_TYPES.NOTIFICATION) {
        return;
      }

      const parsed = parseNotificationLiveUpdate(event);
      if (!parsed) {
        return;
      }

      if (!shouldShowNotificationLiveBanner(parsed, isNotificationsPage)) {
        return;
      }

      setBanner(parsed);
      setOpen(true);
    });
  }, [isNotificationsPage]);

  useEffect(() => {
    if (isNotificationsPage) {
      setOpen(false);
    }
  }, [isNotificationsPage]);

  useEffect(() => {
    if (!open || !banner) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setOpen(false);
    }, NOTIFICATION_SNACKBAR_AUTO_HIDE_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [banner, open]);

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

  const alertSx = banner ? getSnackbarFilledAlertSx(banner.severity) : undefined;
  const alertTone = banner ? getSnackbarFilledAlertTone(banner.severity) : undefined;
  const ModeIcon = useMemo(
    () => (banner ? (MODE_ICONS[banner.severity] ?? InfoOutlinedIcon) : InfoOutlinedIcon),
    [banner]
  );

  if (!banner) {
    return null;
  }

  return (
    <Snackbar
      open={open}
      onClose={(_event, reason) => {
        if (reason === "clickaway") {
          return;
        }
        dismiss();
      }}
      autoHideDuration={null}
      anchorOrigin={
        isMobile
          ? { vertical: "top", horizontal: "center" }
          : { vertical: "bottom", horizontal: "left" }
      }
      TransitionComponent={SnackbarSlide}
      TransitionProps={{
        timeout: 360,
        onExited: () => {
          resetDrag();
          setBanner(null);
        },
      }}
      className={snackbarStyles.snackbar}
      sx={{
        zIndex: (muiTheme) => muiTheme.zIndex.snackbar + 1,
      }}
    >
      <Alert
        severity={banner.severity}
        variant="filled"
        icon={<ModeIcon fontSize="inherit" />}
        className={[
          snackbarStyles.alert,
          SNACKBAR_ALERT_CLASS,
          isMobile ? snackbarStyles.alertMobile : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClose={isMobile ? undefined : dismiss}
        onPointerDown={handlePointerDown}
        action={
          isMobile ? undefined : (
            <IconButton aria-label="بستن اعلان" color="inherit" size="small" onClick={dismiss}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          )
        }
        sx={{
          ...alertSx,
          backgroundColor: alertTone?.backgroundColor,
          backgroundImage: "none",
          color: alertTone?.color,
          alignItems: "flex-start",
          "& .MuiAlert-message": {
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: "0.5rem",
            width: "100%",
            overflow: "visible",
            maxHeight: "none",
          },
        }}
        style={dragStyle}
      >
        <NotificationSnackbarContent
          title={banner.title}
          message={banner.message}
          payload={banner.payload}
          source={banner.source}
        />
      </Alert>
    </Snackbar>
  );
}
