import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import PrivacyTipRoundedIcon from "@mui/icons-material/PrivacyTipRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { useQuery } from "@apollo/client/react";
import { useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { LOCAL_STORAGE_KEYS } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { useThemeMode } from "../../contexts/ThemeContext";
import { APP_PRIVACY_POLICY_PAGE_QUERY } from "../../graphql/queries/appPrivacyPolicyPageConfig.query";
import { APP_TERMS_OF_USE_PAGE_QUERY } from "../../graphql/queries/appTermsOfUsePageConfig.query";
import { APP_VERSION_QUERY } from "../../graphql/queries/appVersionConfig.query";
import TicketDialog from "../Support/TicketDialog";
import { EMPTY_APP_VERSION, type AppVersionConfigQuery } from "./app-version.api";
import {
  EMPTY_APP_PRIVACY_POLICY_PAGE,
  type AppPrivacyPolicyPageConfigQuery,
} from "./privacy-policy-page.api";
import {
  EMPTY_APP_TERMS_OF_USE_PAGE,
  type AppTermsOfUsePageConfigQuery,
} from "./terms-of-use-page.api";
import styles from "./styles/more.module.scss";

const hasText = (value: string): boolean => value.trim().length > 0;

const More = (): ReactElement => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const { data } = useQuery<AppPrivacyPolicyPageConfigQuery>(APP_PRIVACY_POLICY_PAGE_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const { data: termsOfUseData } = useQuery<AppTermsOfUsePageConfigQuery>(
    APP_TERMS_OF_USE_PAGE_QUERY,
    {
      fetchPolicy: "cache-and-network",
    },
  );
  const { data: versionData } = useQuery<AppVersionConfigQuery>(APP_VERSION_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const savedValue = localStorage.getItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    return savedValue === null ? true : savedValue === "true";
  });
  const [bugReportDialogOpen, setBugReportDialogOpen] = useState(false);
  const isDarkMode = mode === "dark";
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN") === true;
  const privacyPolicyPage = data?.appPrivacyPolicyPageConfig ?? EMPTY_APP_PRIVACY_POLICY_PAGE;
  const termsOfUsePage = termsOfUseData?.appTermsOfUsePageConfig ?? EMPTY_APP_TERMS_OF_USE_PAGE;
  const appVersion = versionData?.appVersionConfig ?? EMPTY_APP_VERSION;
  const shouldShowPrivacyPolicy = hasText(privacyPolicyPage.html);
  const shouldShowTermsOfUse = hasText(termsOfUsePage.html);
  const shouldShowVersion = hasText(appVersion.value);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS_ENABLED, String(notificationsEnabled));
  }, [notificationsEnabled]);

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <p>سایر</p>
        <h2>تنظیمات و میانبرها</h2>
        <span>دسترسی سریع به امکانات عمومی پنل</span>
      </div>

      <div className={styles.themeCard}>
        <div className={styles.themeIcon}>
          {isDarkMode ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
        </div>
        <div>
          <strong>حالت نمایش</strong>
          <small>{isDarkMode ? "حالت تاریک فعال است" : "حالت روشن فعال است"}</small>
        </div>
        <button
          type="button"
          className={`${styles.switchButton} ${isDarkMode ? styles.switchButtonActive : ""}`}
          role="switch"
          aria-checked={isDarkMode}
          aria-label="تغییر حالت نمایش"
          onClick={toggleTheme}
        >
          <span className={styles.switchTrack} aria-hidden="true">
            <span className={styles.switchThumb}>
              {isDarkMode ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
            </span>
          </span>
        </button>
      </div>

      <div className={styles.preferenceRow}>
        <div className={styles.preferenceIcon}>
          <NotificationsRoundedIcon />
        </div>
        <div className={styles.preferenceText}>
          <strong>اعلان‌ها</strong>
          <small>{notificationsEnabled ? "فعال" : "غیرفعال"}</small>
        </div>
        <button
          type="button"
          className={`${styles.switchButton} ${notificationsEnabled ? styles.switchButtonActive : ""}`}
          role="switch"
          aria-checked={notificationsEnabled}
          aria-label={notificationsEnabled ? "غیرفعال کردن اعلان‌ها" : "فعال کردن اعلان‌ها"}
          onClick={() => setNotificationsEnabled((isEnabled) => !isEnabled)}
        >
          <span className={styles.switchTrack} aria-hidden="true">
            <span className={styles.switchThumb}>
              <NotificationsRoundedIcon />
            </span>
          </span>
        </button>
      </div>

      <div className={styles.linkGrid}>
        {isSuperAdmin ? (
          <button type="button" className={styles.linkCard}>
            <SettingsRoundedIcon />
            <span>تنظیمات سامانه</span>
          </button>
        ) : null}
        {shouldShowPrivacyPolicy ? (
          <button
            type="button"
            className={styles.linkCard}
            onClick={() => navigate("/more/privacy-policy")}
          >
            <PrivacyTipRoundedIcon />
            <span>حریم خصوصی</span>
          </button>
        ) : null}
        {shouldShowTermsOfUse ? (
          <button
            type="button"
            className={styles.linkCard}
            onClick={() => navigate("/more/terms-of-use")}
          >
            <GavelRoundedIcon />
            <span>شرایط استفاده</span>
          </button>
        ) : null}
        <button type="button" className={styles.linkCard} onClick={() => navigate("/more/about")}>
          <InfoOutlinedIcon />
          <span>درباره سامانه</span>
        </button>
        <button
          type="button"
          className={`${styles.linkCard} ${styles.bugReportCard}`}
          onClick={() => setBugReportDialogOpen(true)}
        >
          <BugReportRoundedIcon />
          <span>گزارش باگ</span>
        </button>
      </div>

      {shouldShowVersion ? (
        <div className={styles.versionBlock}>
          <span />
          <p>نسخه {appVersion.value}</p>
        </div>
      ) : null}

      <TicketDialog
        open={bugReportDialogOpen}
        mode="create"
        record={null}
        canReply={false}
        isSuperAdmin={false}
        initialCategory="BUG"
        disableCategorySelect
        onClose={() => setBugReportDialogOpen(false)}
        onSuccess={() => setBugReportDialogOpen(false)}
      />
    </section>
  );
};

export default More;
