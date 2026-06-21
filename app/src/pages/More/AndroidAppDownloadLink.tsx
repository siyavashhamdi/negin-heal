import AndroidRoundedIcon from "@mui/icons-material/AndroidRounded";
import { type ReactElement } from "react";

import { useTranslation } from "../../hooks/useTranslation";
import {
  getAndroidAppDownloadUrl,
  shouldShowAndroidAppDownloadLink,
} from "../../utils/androidAppDownload.util";
import styles from "./styles/more.module.scss";

const AndroidAppDownloadLink = (): ReactElement | null => {
  const { t } = useTranslation();

  if (!shouldShowAndroidAppDownloadLink()) {
    return null;
  }

  return (
    <a
      href={getAndroidAppDownloadUrl()}
      className={styles.linkCard}
      download="negin-heal.apk"
    >
      <AndroidRoundedIcon />
      <span>{t("pages.more.androidDownload.linkLabel")}</span>
    </a>
  );
};

export default AndroidAppDownloadLink;
