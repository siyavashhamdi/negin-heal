import { Box, Typography } from "@mui/material";
import { type ReactElement } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import styles from "./styles/footer.module.scss";

export interface FooterProps {
  /**
   * When true, omits outer card chrome so the footer can sit inside a parent panel
   * (e.g. login form holder) with only a top divider.
   */
  readonly embedded?: boolean;
}

const Footer = ({ embedded = false }: FooterProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <Box
      component="footer"
      className={embedded ? styles.footerEmbedded : styles.footer}
      aria-label={t("layout.footer.ariaLabel")}
    >
      <Box className={styles.footerBottom}>
        <Typography component="p" className={styles.footerCopyright}>
          {t("layout.footer.copyright")}{" "}
          <span className={styles.footerCopyrightMark} aria-hidden="true">
            ©
          </span>
        </Typography>
        <Box component="nav" className={styles.footerInlineLinks}>
          <a className={styles.footerLink} href="#">
            {t("layout.footer.links.helpCenter")}
          </a>
          <a className={styles.footerLink} href="#">
            {t("layout.footer.links.supportTicket")}
          </a>
          <a className={styles.footerLink} href="#">
            {t("layout.footer.links.contactUs")}
          </a>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
