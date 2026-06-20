import { type ReactElement } from "react";
import { DarkMode, LightMode } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useThemeMode } from "../contexts/ThemeContext";
import { useTranslation } from "../hooks/useTranslation";
import AppTooltip from "../shared/AppTooltip";

const ThemeToggle = (): ReactElement => {
  const { mode, toggleTheme } = useThemeMode();
  const { t } = useTranslation();

  const tooltipTitle =
    mode === "light" ? t("auth.login.theme.enableDarkMode") : t("auth.login.theme.enableLightMode");

  const toggleAriaLabel = t("auth.login.theme.toggleTheme");

  return (
    <AppTooltip title={tooltipTitle}>
      <IconButton onClick={toggleTheme} color="inherit" aria-label={toggleAriaLabel}>
        {mode === "light" ? <DarkMode /> : <LightMode />}
      </IconButton>
    </AppTooltip>
  );
};

export default ThemeToggle;
