import { type ReactElement } from "react";
import { DarkMode, LightMode } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useThemeMode } from "../contexts/ThemeContext";
import { useTranslation } from "../hooks/useTranslation";

const ThemeToggle = (): ReactElement => {
  const { mode, toggleTheme } = useThemeMode();
  const { t } = useTranslation();

  const tooltipTitle =
    mode === "light" ? t("auth.login.theme.enableDarkMode") : t("auth.login.theme.enableLightMode");

  const toggleAriaLabel = t("auth.login.theme.toggleTheme");

  return (
    <Tooltip title={tooltipTitle}>
      <IconButton onClick={toggleTheme} color="inherit" aria-label={toggleAriaLabel}>
        {mode === "light" ? <DarkMode /> : <LightMode />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
