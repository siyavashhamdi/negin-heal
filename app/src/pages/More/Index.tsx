import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import CachedRoundedIcon from "@mui/icons-material/CachedRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import BackupRoundedIcon from "@mui/icons-material/BackupRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PrivacyTipRoundedIcon from "@mui/icons-material/PrivacyTipRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { useQuery } from "@apollo/client/react";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useThemeMode } from "../../contexts/ThemeContext";
import { USER_PROFILE_UPDATE_MUTATION } from "../../graphql/mutations/userProfileUpdate.mutation";
import { APP_PRIVACY_POLICY_PAGE_QUERY } from "../../graphql/queries/appPrivacyPolicyPageConfig.query";
import { APP_TERMS_OF_USE_PAGE_QUERY } from "../../graphql/queries/appTermsOfUsePageConfig.query";
import { USER_ME_QUERY } from "../../graphql/queries/userMe.query";
import { useMobileAppLayout } from "../../hooks/useMobileAppLayout";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import type { UserMeResponse } from "../../hooks/useMe";
import TicketDialog from "../Support/TicketDialog";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import { opaqueShellProps } from "../../shared/opaqueShell";
import { emptyCacheAndHardReload } from "../../utils/hardReload.util";
import {
  EMPTY_APP_PRIVACY_POLICY_PAGE,
  type AppPrivacyPolicyPageConfigQuery,
} from "./privacy-policy-page.api";
import {
  EMPTY_APP_TERMS_OF_USE_PAGE,
  type AppTermsOfUsePageConfigQuery,
} from "./terms-of-use-page.api";
import NotificationPermissionCallout from "./NotificationPermissionCallout";
import AndroidAppDownloadLink from "./AndroidAppDownloadLink";
import AndroidHomeScreenInstallPrompt from "./AndroidHomeScreenInstallPrompt";
import AppVersionBlock from "./AppVersionBlock";
import IosHomeScreenInstallPrompt from "./IosHomeScreenInstallPrompt";
import {
  applyUserPreferences,
  readStoredNotificationsEnabled,
  resolveThemePreference,
  type ThemePreference,
} from "../../utils/userPreferences.util";
import { getBrowserNotificationPermission } from "../../utils/browserNotification.util";
import {
  syncWebPushSubscriptionWithServer,
  unregisterWebPushSubscriptionFromServer,
} from "../../utils/pushSubscription.util";
import styles from "./styles/more.module.scss";

const hasText = (value: string): boolean => value.trim().length > 0;

type UserProfilePreferencesMutationResult = {
  readonly userProfileUpdate: {
    readonly id: string;
    readonly preferences?: {
      readonly notificationsEnabled: boolean;
      readonly theme?: string | null;
    } | null;
  };
};

type UserProfilePreferencesMutationVariables = {
  readonly input: {
    readonly preferences: {
      readonly notificationsEnabled?: boolean;
      readonly theme?: ThemePreference;
    };
  };
};

const More = (): ReactElement => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isMobile = useMobileAppLayout();
  const { mode, setThemeMode } = useThemeMode();
  const roles = user?.roles ?? [];
  const isSuperAdmin = roles.includes("SUPER_ADMIN");
  const shouldShowPublicInfoCards = !isSuperAdmin;
  const { data: meData } = useQuery<UserMeResponse>(USER_ME_QUERY, {
    fetchPolicy: "cache-only",
    returnPartialData: true,
  });
  const serverThemePreference = resolveThemePreference(meData?.me?.preferences?.theme);
  const serverNotificationsEnabled = meData?.me?.preferences?.notificationsEnabled;
  const initialThemePreference = serverThemePreference ?? mode;
  const initialNotificationsEnabled =
    serverNotificationsEnabled ?? readStoredNotificationsEnabled();
  const { data } = useQuery<AppPrivacyPolicyPageConfigQuery>(APP_PRIVACY_POLICY_PAGE_QUERY, {
    fetchPolicy: "cache-and-network",
    skip: !shouldShowPublicInfoCards,
  });
  const { data: termsOfUseData } = useQuery<AppTermsOfUsePageConfigQuery>(
    APP_TERMS_OF_USE_PAGE_QUERY,
    {
      fetchPolicy: "cache-and-network",
      skip: !shouldShowPublicInfoCards,
    }
  );
  const [preferredTheme, setPreferredTheme] = useState<ThemePreference>(initialThemePreference);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    initialNotificationsEnabled
  );
  const lastSyncedThemePreferenceRef = useRef<ThemePreference | null>(serverThemePreference);
  const lastSyncedNotificationsEnabledRef = useRef<boolean | undefined>(serverNotificationsEnabled);
  const [updatePreferences, updatePreferencesResult] = useMutationWithSnackbar<
    UserProfilePreferencesMutationResult,
    UserProfilePreferencesMutationVariables
  >(USER_PROFILE_UPDATE_MUTATION, {
    errorMessage: "به‌روزرسانی تنظیمات انجام نشد.",
  });
  const [bugReportDialogOpen, setBugReportDialogOpen] = useState(false);
  const [isHardReloading, setIsHardReloading] = useState(false);
  const isDarkMode = preferredTheme === "dark";
  const isUpdatingPreferences = updatePreferencesResult.loading;
  const shouldShowBugReport = isAuthenticated && !isSuperAdmin;
  const privacyPolicyPage = data?.appPrivacyPolicyPageConfig ?? EMPTY_APP_PRIVACY_POLICY_PAGE;
  const termsOfUsePage = termsOfUseData?.appTermsOfUsePageConfig ?? EMPTY_APP_TERMS_OF_USE_PAGE;
  const shouldShowPrivacyPolicy = shouldShowPublicInfoCards && hasText(privacyPolicyPage.html);
  const shouldShowTermsOfUse = shouldShowPublicInfoCards && hasText(termsOfUsePage.html);

  useEffect(() => {
    if (mode !== preferredTheme) {
      setThemeMode(preferredTheme);
    }
  }, [mode, preferredTheme, setThemeMode]);

  useEffect(() => {
    if (serverThemePreference && lastSyncedThemePreferenceRef.current !== serverThemePreference) {
      lastSyncedThemePreferenceRef.current = serverThemePreference;
      setPreferredTheme(serverThemePreference);
    }

    if (
      serverNotificationsEnabled !== undefined &&
      lastSyncedNotificationsEnabledRef.current !== serverNotificationsEnabled
    ) {
      lastSyncedNotificationsEnabledRef.current = serverNotificationsEnabled;
      setNotificationsEnabled(serverNotificationsEnabled);
    }
  }, [serverNotificationsEnabled, serverThemePreference]);

  const handleThemeToggle = async (): Promise<void> => {
    const previousTheme = preferredTheme;
    const nextTheme: ThemePreference = previousTheme === "dark" ? "light" : "dark";
    setPreferredTheme(nextTheme);
    setThemeMode(nextTheme);
    applyUserPreferences({ theme: nextTheme });

    if (!isAuthenticated) {
      return;
    }

    const result = await updatePreferences({
      variables: {
        input: {
          preferences: {
            theme: nextTheme,
          },
        },
      },
    }).catch(() => null);

    if (result?.data?.userProfileUpdate) {
      lastSyncedThemePreferenceRef.current = nextTheme;
      return;
    }

    setPreferredTheme(previousTheme);
    setThemeMode(previousTheme);
    applyUserPreferences({ theme: previousTheme });
  };

  const handleEmptyCacheAndHardReload = (): void => {
    if (isHardReloading) {
      return;
    }

    setIsHardReloading(true);
    void emptyCacheAndHardReload().finally(() => {
      setIsHardReloading(false);
    });
  };

  const handleNotificationsToggle = async (): Promise<void> => {
    const previousValue = notificationsEnabled;
    const nextValue = !previousValue;
    setNotificationsEnabled(nextValue);
    applyUserPreferences({ notificationsEnabled: nextValue });

    const result = await updatePreferences({
      variables: {
        input: {
          preferences: {
            notificationsEnabled: nextValue,
          },
        },
      },
    }).catch(() => null);

    if (result?.data?.userProfileUpdate) {
      lastSyncedNotificationsEnabledRef.current = nextValue;
      if (nextValue && getBrowserNotificationPermission() === "granted") {
        void syncWebPushSubscriptionWithServer();
      }
      if (!nextValue) {
        void unregisterWebPushSubscriptionFromServer();
      }
      return;
    }

    setNotificationsEnabled(previousValue);
    applyUserPreferences({ notificationsEnabled: previousValue });
  };

  return (
    <section className={styles.page}>
      <div className={styles.hero} {...opaqueShellProps}>
        <p>سایر</p>
        <h2>تنظیمات و میانبرها</h2>
        <span>دسترسی سریع به امکانات عمومی پنل</span>
      </div>

      <div className={styles.pageBody}>
        <div className={styles.contentStack}>
          <div className={styles.themeCard} {...opaqueShellProps}>
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
              disabled={isUpdatingPreferences}
              onClick={() => void handleThemeToggle()}
            >
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb}>
                  {isDarkMode ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
                </span>
              </span>
            </button>
          </div>

          {isAuthenticated ? (
            <section
              className={styles.notificationsSection}
              aria-label="تنظیمات اعلان‌ها"
              {...opaqueShellProps}
            >
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
                  disabled={isUpdatingPreferences}
                  onClick={() => void handleNotificationsToggle()}
                >
                  <span className={styles.switchTrack} aria-hidden="true">
                    <span className={styles.switchThumb}>
                      <NotificationsRoundedIcon />
                    </span>
                  </span>
                </button>
              </div>
              <NotificationPermissionCallout notificationsEnabled={notificationsEnabled} />
            </section>
          ) : null}
        </div>

        <div className={styles.installStack}>
          <IosHomeScreenInstallPrompt />
          <AndroidHomeScreenInstallPrompt />
          <AndroidAppDownloadLink />
        </div>
      </div>

      <div className={styles.linkGrid}>
        {isSuperAdmin ? (
          <>
            <button
              type="button"
              className={styles.linkCard}
              {...opaqueShellProps}
              onClick={() => navigate(APP_SHELL_ROUTES.users)}
            >
              <PeopleAltRoundedIcon />
              <span>کاربران</span>
            </button>
            <button
              type="button"
              className={styles.linkCard}
              {...opaqueShellProps}
              onClick={() => navigate(APP_SHELL_ROUTES.moreSystemSettings)}
            >
              <SettingsRoundedIcon />
              <span>تنظیمات سامانه</span>
            </button>
            <button
              type="button"
              className={`${styles.linkCard} ${styles.globalAnouncementCard}`}
              {...opaqueShellProps}
              onClick={() => navigate(APP_SHELL_ROUTES.moreGlobalAnouncement)}
            >
              <CampaignRoundedIcon />
              <span>اعلان عمومی</span>
            </button>
            <button
              type="button"
              className={`${styles.linkCard} ${styles.couponsCard}`}
              {...opaqueShellProps}
              onClick={() => navigate(APP_SHELL_ROUTES.moreCoupons)}
            >
              <ConfirmationNumberRoundedIcon />
              <span>کدهای تخفیف</span>
            </button>
            <button
              type="button"
              className={`${styles.linkCard} ${styles.backupCard}`}
              {...opaqueShellProps}
              onClick={() => navigate(APP_SHELL_ROUTES.moreBackup)}
            >
              <BackupRoundedIcon />
              <span>پشتیبان‌گیری</span>
            </button>
          </>
        ) : null}
        {shouldShowPrivacyPolicy ? (
          <button
            type="button"
            className={styles.linkCard}
            {...opaqueShellProps}
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
            {...opaqueShellProps}
            onClick={() => navigate("/more/terms-of-use")}
          >
            <GavelRoundedIcon />
            <span>شرایط استفاده</span>
          </button>
        ) : null}
        {shouldShowPublicInfoCards ? (
          <button
            type="button"
            className={styles.linkCard}
            {...opaqueShellProps}
            onClick={() => navigate("/more/about")}
          >
            <InfoOutlinedIcon />
            <span>درباره سامانه</span>
          </button>
        ) : null}
        {shouldShowBugReport ? (
          <button
            type="button"
            className={`${styles.linkCard} ${styles.bugReportCard}`}
            {...opaqueShellProps}
            onClick={() => setBugReportDialogOpen(true)}
          >
            <BugReportRoundedIcon />
            <span>گزارش باگ</span>
          </button>
        ) : null}
        <button
          type="button"
          className={styles.linkCard}
          {...opaqueShellProps}
          disabled={isHardReloading}
          aria-busy={isHardReloading}
          aria-label="پاکسازی کَش و بارگذاری مجدد"
          onClick={handleEmptyCacheAndHardReload}
        >
          <CachedRoundedIcon />
          <span>{isHardReloading ? "در حال پاکسازی..." : "پاکسازی کَش و بارگذاری"}</span>
        </button>
      </div>

      {isMobile ? <AppVersionBlock /> : null}

      {bugReportDialogOpen ? (
        <TicketDialog
          open
          mode="create"
          record={null}
          canReply={false}
          isSuperAdmin={false}
          initialCategory="BUG"
          disableCategorySelect
          onClose={() => setBugReportDialogOpen(false)}
          onSuccess={() => setBugReportDialogOpen(false)}
        />
      ) : null}
    </section>
  );
};

export default More;
