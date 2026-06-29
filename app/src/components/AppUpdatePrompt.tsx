import SystemUpdateAltRoundedIcon from "@mui/icons-material/SystemUpdateAltRounded";
import { Alert, Button, Snackbar, Stack, useMediaQuery, useTheme } from "@mui/material";
import type { ReactElement } from "react";

import { useAppUpdatePrompt } from "../hooks/useAppUpdatePrompt";
import { useTranslation } from "../hooks/useTranslation";
import { getSnackbarFilledAlertSx, getSnackbarFilledAlertTone } from "../theme";

export function AppUpdatePrompt(): ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
  const { updateAvailable, isApplyingUpdate, confirmUpdate, dismissUpdate } = useAppUpdatePrompt();
  const alertSx = getSnackbarFilledAlertSx("info");
  const alertTone = getSnackbarFilledAlertTone("info");

  return (
    <Snackbar
      open={updateAvailable}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      sx={{
        zIndex: (muiTheme) => muiTheme.zIndex.snackbar + 1,
        top: isMobile ? 12 : 20,
      }}
    >
      <Alert
        severity="info"
        variant="filled"
        icon={<SystemUpdateAltRoundedIcon fontSize="inherit" />}
        sx={{
          ...alertSx,
          width: "100%",
          maxWidth: isMobile ? "min(100vw - 24px, 420px)" : 480,
          backgroundColor: alertTone.backgroundColor,
          backgroundImage: "none",
          color: alertTone.color,
          alignItems: "center",
        }}
        action={
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={dismissUpdate}
              disabled={isApplyingUpdate}
            >
              {t("layout.appUpdate.laterButton")}
            </Button>
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={confirmUpdate}
              disabled={isApplyingUpdate}
            >
              {t("layout.appUpdate.updateButton")}
            </Button>
          </Stack>
        }
      >
        {t("layout.appUpdate.message")}
      </Alert>
    </Snackbar>
  );
}
