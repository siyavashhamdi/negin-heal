import { useState, type ReactElement, type ReactNode } from "react";
import { Box, Container, Typography, IconButton, Tooltip } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import { useThemeMode } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import Footer from "../../components/layout/Footer";
import styles from "./styles/LoginShell.module.scss";

interface LoginShellProps {
  readonly subtitle: string;
  readonly children: ReactNode;
  /** Form-only chrome for embedding inside app shells (e.g. mobile profile). */
  readonly embedded?: boolean;
}

/**
 * Shared visual chrome for every login step: theme toggle, branded header,
 * form holder and the marketing image panel. Step-specific markup is rendered
 * inside the form holder via `children`.
 */
const LoginShell = ({ subtitle, children, embedded = false }: LoginShellProps): ReactElement => {
  const { t } = useTranslation();
  const { mode, toggleTheme } = useThemeMode();
  const [marketingImageVisible, setMarketingImageVisible] = useState(true);

  if (embedded) {
    return (
      <Box className={styles.embeddedShell}>
        <Box component="section" className={styles.loginFormHolder}>
          {children}
        </Box>
      </Box>
    );
  }

  const marketingImageClassName = [
    styles.backgroundImage,
    !marketingImageVisible && styles.backgroundImageHidden,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Box className={styles.loginPageWrapper}>
      <Box className={styles.loginContainer}>
        <Box className={styles.loginWrapper}>
          <Box className={styles.formSection}>
            <Box className={styles.formSectionMain}>
              <Box className={styles.themeToggleContainer}>
                <Tooltip
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
                </Tooltip>
              </Box>

              <Container maxWidth="md" className={styles.formContainer}>
                <Box className={styles.formColumnBody}>
                  <Box className={styles.logoSection}>
                    <Box
                      component="img"
                      src="/logo.svg"
                      alt={t("layout.header.brand.title")}
                      className={styles.logo}
                    />
                    <Typography variant="h4" className={styles.welcomeTitle}>
                      {t("auth.login.welcome")}
                    </Typography>
                    <Typography variant="body2" className={styles.welcomeSubtitle}>
                      {subtitle}
                    </Typography>
                  </Box>

                  <Box component="section" className={styles.loginFormHolder}>
                    {children}
                  </Box>
                </Box>

                <Box className={styles.loginFooterSlot}>
                  <Footer embedded />
                </Box>
              </Container>
            </Box>
          </Box>

          <Box className={styles.imageSection}>
            <Box
              component="img"
              src="/login-image.png"
              alt={t("auth.login.marketingImageAlt")}
              className={marketingImageClassName}
              onError={() => {
                setMarketingImageVisible(false);
              }}
            />
            <Box className={styles.imageOverlay} />
            <Box className={styles.imageContent}>
              <Typography variant="h3" className={styles.imageTitle}>
                {t("auth.login.imageTitle")}
              </Typography>
              <Typography variant="h6" className={styles.imageSubtitle}>
                {t("auth.login.imageSubtitle")}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginShell;
