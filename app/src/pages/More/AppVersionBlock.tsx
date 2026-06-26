import type { ReactElement } from "react";

import { API_CONFIG } from "../../config/env";
import {
  ANDROID_APP_VERSION,
  API_VERSION,
  APP_VERSION_DEPLOY_TOOLTIP_DELAY_MS,
  WEB_VERSION,
} from "../../constants/app-version.constants";
import AppTooltip from "../../shared/AppTooltip";
import { toPersianDigits } from "../../utilities/persian-digits.util";
import { isAndroidApp } from "../../utils/androidAppDownload.util";
import styles from "./styles/more.module.scss";

function buildDeployTooltipTitle(): string {
  const hash = API_CONFIG.DEPLOY_HASH?.trim() || "N/A";
  const deployedAt = API_CONFIG.DEPLOY_DATE_TIME?.trim() || "N/A";

  return `Hash: ${hash}\nDate: ${deployedAt}`;
}

const AppVersionBlock = (): ReactElement => {
  const showAndroidVersion = isAndroidApp();

  return (
    <div className={styles.versionBlock}>
      <span className={styles.versionDivider} />
      <AppTooltip
        title={buildDeployTooltipTitle()}
        arrow
        placement="top"
        enterDelay={APP_VERSION_DEPLOY_TOOLTIP_DELAY_MS}
        enterTouchDelay={APP_VERSION_DEPLOY_TOOLTIP_DELAY_MS}
        slotProps={{
          tooltip: {
            className: styles.versionDeployTooltip,
            sx: { whiteSpace: "pre-line", textAlign: "start" },
          },
        }}
      >
        <p className={styles.versionLine}>
          <span className={styles.versionItem}>
            <span className={styles.versionLabel}>نسخه وب:</span>{" "}
            <span className={styles.versionValue}>{toPersianDigits(WEB_VERSION)}</span>
          </span>
          <span className={styles.versionSeparator} aria-hidden>
            |
          </span>
          <span className={styles.versionItem}>
            <span className={styles.versionLabel}>نسخه اِی‌پی‌آی:</span>{" "}
            <span className={styles.versionValue}>{toPersianDigits(API_VERSION)}</span>
          </span>
          {showAndroidVersion ? (
            <>
              <span className={styles.versionSeparator} aria-hidden>
                |
              </span>
              <span className={styles.versionItem}>
                <span className={styles.versionLabel}>نسخه اپ:</span>{" "}
                <span className={styles.versionValue}>{toPersianDigits(ANDROID_APP_VERSION)}</span>
              </span>
            </>
          ) : null}
        </p>
      </AppTooltip>
    </div>
  );
};

export default AppVersionBlock;
