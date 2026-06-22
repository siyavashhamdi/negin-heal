import type { ReactElement } from "react";

import { API_CONFIG } from "../../config/env";
import {
  APP_VERSION,
  APP_VERSION_DEPLOY_TOOLTIP_DELAY_MS,
} from "../../constants/app-version.constants";
import AppTooltip from "../../shared/AppTooltip";
import styles from "./styles/more.module.scss";

function buildDeployTooltipTitle(): string {
  const hash = API_CONFIG.DEPLOY_HASH?.trim() || "N/A";
  const deployedAt = API_CONFIG.DEPLOY_DATE_TIME?.trim() || "N/A";

  return `Hash: ${hash}\nDate: ${deployedAt}`;
}

const AppVersionBlock = (): ReactElement => {
  return (
    <div className={styles.versionBlock}>
      <span />
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
        <p className={styles.versionLabel}>نسخه {APP_VERSION}</p>
      </AppTooltip>
    </div>
  );
};

export default AppVersionBlock;
