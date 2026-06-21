import AndroidRoundedIcon from "@mui/icons-material/AndroidRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useState, type ReactElement } from "react";

import { useTranslation } from "../../hooks/useTranslation";
import AppTooltip from "../../shared/AppTooltip";
import {
  getAndroidAppDownloadUrl,
  shouldShowAndroidAppDownloadLink,
} from "../../utils/androidAppDownload.util";
import { opaqueShellProps } from "../../shared/opaqueShell";
import styles from "./styles/more.module.scss";

const AndroidAppDownloadLink = (): ReactElement | null => {
  const { t } = useTranslation();
  const [isAccessNoteExpanded, setIsAccessNoteExpanded] = useState(false);

  if (!shouldShowAndroidAppDownloadLink()) {
    return null;
  }

  const accessNoteId = "android-download-access-note";

  return (
    <section
      className={styles.androidInstallCard}
      aria-label={t("pages.more.androidDownload.cardAriaLabel")}
      {...opaqueShellProps}
    >
      <div className={styles.androidInstallIcon} aria-hidden="true">
        <AndroidRoundedIcon />
      </div>

      <div className={styles.androidInstallContent}>
        <div className={styles.androidInstallTitleRow}>
          <strong>{t("pages.more.androidDownload.cardTitle")}</strong>
          <AppTooltip title={t("pages.more.infoToggleTooltip")} arrow>
            <button
              type="button"
              className={`${styles.calloutInfoToggle} ${isAccessNoteExpanded ? styles.calloutInfoToggleActive : ""}`}
              aria-expanded={isAccessNoteExpanded}
              aria-controls={accessNoteId}
              aria-label={t("pages.more.androidDownload.accessNoteToggleLabel")}
              onClick={() => setIsAccessNoteExpanded((current) => !current)}
            >
              <InfoOutlinedIcon fontSize="small" />
            </button>
          </AppTooltip>
        </div>

        <p>{t("pages.more.androidDownload.cardDescription")}</p>

        <div
          id={accessNoteId}
          role="region"
          hidden={!isAccessNoteExpanded}
          className={styles.androidInstallAccessNote}
        >
          <p>{t("pages.more.androidDownload.accessNote")}</p>
        </div>

        <a
          href={getAndroidAppDownloadUrl()}
          className={styles.androidInstallButton}
          download="negin-heal.apk"
        >
          {t("pages.more.androidDownload.downloadButton")}
        </a>
      </div>
    </section>
  );
};

export default AndroidAppDownloadLink;
