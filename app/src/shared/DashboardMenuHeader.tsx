import { type ReactElement, type ReactNode } from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useTranslation } from "../hooks/useTranslation";
import { PageBackIconButton, PageBackTextButton } from "./PageBackNavigation";
import styles from "./styles/DashboardMenuHeader.module.scss";

export type DashboardMenuHeaderProps = {
  readonly title: string;
  readonly description?: string;
  readonly imageSrc?: string;
  readonly actions?: ReactNode;
  /** Fallback route when there is no previous in-app history entry. Defaults to `/dashboard`. */
  readonly backTo?: string;
  readonly backLabel?: string;
};

const DashboardMenuHeader = ({
  title,
  description,
  imageSrc,
  backTo,
  backLabel,
  actions,
}: DashboardMenuHeaderProps): ReactElement => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const resolvedBackTo = backTo ?? "/dashboard";
  const resolvedBackLabel = backLabel ?? t("layout.mainLayout.navigation.backToDashboard");
  const showBackLink = Boolean(resolvedBackTo && resolvedBackLabel);

  const titleClassName = `${styles.titleHeading}${
    description ? ` ${styles.titleHeadingWithDescription}` : ""
  }`;

  return (
    <Box className={styles.outer}>
      <Box dir="ltr" className={styles.rowLtr}>
        {showBackLink ? (
          <Box className={styles.backWrap}>
            {isMobile ? (
              <PageBackIconButton label={resolvedBackLabel} fallbackTo={resolvedBackTo} />
            ) : (
              <PageBackTextButton
                label={resolvedBackLabel}
                fallbackTo={resolvedBackTo}
                size="small"
              />
            )}
          </Box>
        ) : null}

        <Box dir="rtl" className={styles.rowRtl}>
          {imageSrc ? (
            <Box
              component="img"
              src={imageSrc}
              alt={t("layout.header.dashboardMenu.imageAlt", { title })}
              className={styles.titleImg}
            />
          ) : null}
          <Box className={styles.titleColumn}>
            <Typography variant="h4" color="text.primary" className={titleClassName}>
              {title}
            </Typography>
            {description ? (
              <Typography variant="body2" color="text.secondary" className={styles.description}>
                {description}
              </Typography>
            ) : null}
          </Box>
          {actions ? <Box className={styles.actionsWrap}>{actions}</Box> : null}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardMenuHeader;
