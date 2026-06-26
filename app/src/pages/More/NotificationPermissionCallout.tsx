import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import NotificationsOffRoundedIcon from "@mui/icons-material/NotificationsOffRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { useState, type ReactElement } from "react";

import { useBrowserNotificationPermission } from "../../hooks/useBrowserNotificationPermission";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import AppTooltip from "../../shared/AppTooltip";
import {
  canRequestBrowserNotificationPrompt,
  isBrowserNotificationDeliverySupported,
  isBrowserNotificationSupported,
  isSecureBrowserContext,
  registerNotificationServiceWorker,
  requestBrowserNotificationPermission,
} from "../../utils/browserNotification.util";
import { syncWebPushSubscriptionWithServer } from "../../utils/pushSubscription.util";
import styles from "./styles/more.module.scss";

type NotificationPermissionCalloutProps = {
  readonly notificationsEnabled: boolean;
};

type DeviceHintKey = "blockedHelpIos" | "blockedHelpAndroid" | "blockedHelpDesktop";

function resolveBlockedHelpKey(): DeviceHintKey {
  if (typeof navigator === "undefined") {
    return "blockedHelpDesktop";
  }

  const userAgent = navigator.userAgent;

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return "blockedHelpIos";
  }

  if (/Android/i.test(userAgent)) {
    return "blockedHelpAndroid";
  }

  return "blockedHelpDesktop";
}

const NotificationPermissionCallout = ({
  notificationsEnabled,
}: NotificationPermissionCalloutProps): ReactElement | null => {
  const { t } = useTranslation();
  const { showError, showSuccess, showWarning } = useSnackbar();
  const { permission, refreshPermission } = useBrowserNotificationPermission();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isBlockedDetailsExpanded, setIsBlockedDetailsExpanded] = useState(false);

  if (!isSecureBrowserContext()) {
    return (
      <div className={`${styles.notificationCallout} ${styles.notificationCalloutUnsupported}`}>
        <div className={styles.notificationCalloutIcon} aria-hidden="true">
          <NotificationsOffRoundedIcon />
        </div>
        <div className={styles.notificationCalloutContent}>
          <strong>{t("pages.more.notifications.insecureTitle")}</strong>
          <p>{t("pages.more.notifications.insecureDescription")}</p>
        </div>
      </div>
    );
  }

  if (!isBrowserNotificationSupported()) {
    return (
      <div className={`${styles.notificationCallout} ${styles.notificationCalloutUnsupported}`}>
        <div className={styles.notificationCalloutIcon} aria-hidden="true">
          <NotificationsOffRoundedIcon />
        </div>
        <div className={styles.notificationCalloutContent}>
          <strong>{t("pages.more.notifications.unsupportedTitle")}</strong>
          <p>{t("pages.more.notifications.unsupportedDescription")}</p>
        </div>
      </div>
    );
  }

  if (!isBrowserNotificationDeliverySupported()) {
    return (
      <div className={`${styles.notificationCallout} ${styles.notificationCalloutUnsupported}`}>
        <div className={styles.notificationCalloutIcon} aria-hidden="true">
          <NotificationsOffRoundedIcon />
        </div>
        <div className={styles.notificationCalloutContent}>
          <strong>{t("pages.more.notifications.mobileUnsupportedTitle")}</strong>
          <p>{t("pages.more.notifications.mobileUnsupportedDescription")}</p>
        </div>
      </div>
    );
  }

  if (permission === "granted" && notificationsEnabled) {
    return null;
  }

  const isDenied = permission === "denied";
  const showBrowserPromptButton = canRequestBrowserNotificationPrompt(permission);
  const blockedDetailsId = "notification-blocked-details";

  const handleRequestBrowserPermission = async (): Promise<void> => {
    setIsRequesting(true);
    try {
      const result = await requestBrowserNotificationPermission();
      refreshPermission();

      if (result === "granted") {
        await registerNotificationServiceWorker();
        await syncWebPushSubscriptionWithServer();
        showSuccess(t("pages.more.notifications.enabledSuccess"));
        return;
      }

      if (result === "denied") {
        showWarning(t("pages.more.notifications.blockedSnackbar"));
        return;
      }

      if (result === "default") {
        showWarning(t("pages.more.notifications.requestDismissed"));
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div
      className={`${styles.notificationCallout} ${
        isDenied ? styles.notificationCalloutBlocked : styles.notificationCalloutPrompt
      }`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.notificationCalloutIcon} aria-hidden="true">
        {isDenied ? <NotificationsOffRoundedIcon /> : <NotificationsActiveRoundedIcon />}
      </div>

      <div className={styles.notificationCalloutContent}>
        {isDenied ? (
          <div className={styles.notificationCalloutTitleRow}>
            <div className={styles.notificationCalloutTitleGroup}>
              <strong>{t("pages.more.notifications.blockedTitle")}</strong>
              {!isBlockedDetailsExpanded ? (
                <p className={styles.notificationCalloutHint}>
                  {t("pages.more.notifications.blockedGuideHint")}
                </p>
              ) : null}
            </div>
            <AppTooltip title={t("pages.more.infoToggleTooltip")} arrow>
              <button
                type="button"
                className={`${styles.calloutInfoToggle} ${isBlockedDetailsExpanded ? styles.calloutInfoToggleActive : ""}`}
                aria-expanded={isBlockedDetailsExpanded}
                aria-controls={blockedDetailsId}
                aria-label={t("pages.more.notifications.blockedDetailsToggleLabel")}
                onClick={() => setIsBlockedDetailsExpanded((current) => !current)}
              >
                <InfoOutlinedIcon fontSize="small" />
              </button>
            </AppTooltip>
          </div>
        ) : (
          <strong>
            {permission === "granted"
              ? t("pages.more.notifications.browserGrantedTitle")
              : t("pages.more.notifications.promptTitle")}
          </strong>
        )}

        {isDenied ? (
          <div
            id={blockedDetailsId}
            role="region"
            hidden={!isBlockedDetailsExpanded}
            className={styles.notificationCalloutExpandable}
          >
            <p>{t("pages.more.notifications.blockedDescription")}</p>
            <p className={styles.notificationCalloutHelp}>
              {t(`pages.more.notifications.${resolveBlockedHelpKey()}`)}
            </p>
          </div>
        ) : (
          <p>
            {permission === "granted"
              ? t("pages.more.notifications.browserGrantedDescription")
              : t("pages.more.notifications.promptDescription")}
          </p>
        )}

        {!isDenied && permission !== "granted" ? (
          <ul className={styles.notificationCalloutBenefits}>
            <li>{t("pages.more.notifications.benefitChapters")}</li>
            <li>{t("pages.more.notifications.benefitAnnouncements")}</li>
          </ul>
        ) : null}

        {showBrowserPromptButton ? (
          <div className={styles.notificationCalloutActions}>
            <button
              type="button"
              className={styles.notificationCalloutButton}
              disabled={isRequesting}
              aria-busy={isRequesting}
              onClick={() => void handleRequestBrowserPermission()}
            >
              {isRequesting
                ? t("pages.more.notifications.requestingButton")
                : isDenied
                  ? t("pages.more.notifications.retryBrowserPromptButton")
                  : t("pages.more.notifications.browserPromptButton")}
            </button>
            {!isDenied || isBlockedDetailsExpanded ? (
              <span className={styles.notificationCalloutPrivacy}>
                <ShieldRoundedIcon aria-hidden="true" />
                {isDenied
                  ? t("pages.more.notifications.blockedButtonHint")
                  : t("pages.more.notifications.privacyNote")}
              </span>
            ) : null}
          </div>
        ) : null}

        {permission === "granted" && !notificationsEnabled ? (
          <p className={styles.notificationCalloutHint}>
            {t("pages.more.notifications.enableAppToggleHint")}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default NotificationPermissionCallout;
