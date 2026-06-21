import { type ReactElement, type ReactNode } from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useTranslation } from "../hooks/useTranslation";
import styles from "./styles/DashboardMenuHeader.module.scss";

export type DashboardMenuHeaderProps = {
  readonly title: string;
  readonly description?: string;
  readonly imageSrc?: string;
  readonly actions?: ReactNode;
};

const DashboardMenuHeader = ({
  title,
  description,
  imageSrc,
  actions,
}: DashboardMenuHeaderProps): ReactElement => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  const titleClassName = `${styles.titleHeading}${
    description ? ` ${styles.titleHeadingWithDescription}` : ""
  }`;

  return (
    <Box className={styles.outer}>
      <Box dir="rtl" className={styles.rowRtl}>
        {!isMobile && imageSrc ? (
          <Box
            component="img"
            src={imageSrc}
            alt={t("layout.header.dashboardMenu.imageAlt", { title })}
            className={styles.titleImg}
          />
        ) : null}
        {!isMobile ? (
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
        ) : null}
        {actions ? <Box className={styles.actionsWrap}>{actions}</Box> : null}
      </Box>
    </Box>
  );
};

export default DashboardMenuHeader;
