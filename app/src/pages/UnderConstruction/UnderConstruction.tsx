import { type ReactElement } from "react";
import { Box, IconButton, LinearProgress, Typography } from "@mui/material";
import { DarkMode, Engineering, LightMode } from "@mui/icons-material";
import { useThemeMode } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import styles from "./styles/UnderConstruction.module.scss";
import AppTooltip from "../../shared/AppTooltip";

const UnderConstruction = (): ReactElement => {
  const { t } = useTranslation();
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Box className={styles.page} aria-labelledby="under-construction-title">
      <Box className={styles.ambientGlow} aria-hidden />
      <Box className={styles.orbOne} aria-hidden />
      <Box className={styles.orbTwo} aria-hidden />
      <Box className={styles.gridOverlay} aria-hidden />

      <Box className={styles.themeToggle}>
        <AppTooltip
          title={
            mode === "light"
              ? t("auth.login.theme.enableDarkMode")
              : t("auth.login.theme.enableLightMode")
          }
        >
          <IconButton
            onClick={toggleTheme}
            className={styles.themeToggleButton}
            aria-label={t("auth.login.theme.toggleTheme")}
          >
            {mode === "light" ? <DarkMode /> : <LightMode />}
          </IconButton>
        </AppTooltip>
      </Box>

      <Box className={styles.content}>
        <Box className={styles.brandBlock}>
          <Box
            component="img"
            src="/logo.png"
            alt={t("layout.header.brand.title")}
            className={styles.logo}
          />
          <Typography variant="overline" className={styles.brandEyebrow}>
            {t("layout.header.brand.title")}
          </Typography>
        </Box>

        <Box className={styles.heroCard}>
          <Box className={styles.iconRing}>
            <Engineering className={styles.heroIcon} />
          </Box>

          <Typography id="under-construction-title" variant="h3" className={styles.title}>
            {t("pages.underConstruction.title")}
          </Typography>

          <Typography variant="h6" className={styles.subtitle}>
            {t("pages.underConstruction.subtitle")}
          </Typography>

          <Typography variant="body1" className={styles.description}>
            {t("pages.underConstruction.description")}
          </Typography>

          <Box className={styles.progressBlock}>
            <LinearProgress className={styles.progressBar} />
            <Typography variant="caption" className={styles.progressLabel}>
              {t("pages.underConstruction.progressLabel")}
            </Typography>
          </Box>
        </Box>

        <Typography variant="caption" className={styles.footerNote}>
          {t("pages.underConstruction.footer")}
        </Typography>
      </Box>
    </Box>
  );
};

export default UnderConstruction;
