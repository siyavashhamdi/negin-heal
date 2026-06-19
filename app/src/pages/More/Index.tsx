import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import CachedRoundedIcon from "@mui/icons-material/CachedRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PrivacyTipRoundedIcon from "@mui/icons-material/PrivacyTipRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { useApolloClient } from "@apollo/client/react";
import { useQuery } from "@apollo/client/react";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useThemeMode } from "../../contexts/ThemeContext";
import { USER_PROFILE_UPDATE_MUTATION } from "../../graphql/mutations/userProfileUpdate.mutation";
import { APP_PRIVACY_POLICY_PAGE_QUERY } from "../../graphql/queries/appPrivacyPolicyPageConfig.query";
import { APP_TERMS_OF_USE_PAGE_QUERY } from "../../graphql/queries/appTermsOfUsePageConfig.query";
import { USER_ME_QUERY } from "../../graphql/queries/userMe.query";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import type { UserMeResponse } from "../../hooks/useMe";
import TicketDialog from "../Support/TicketDialog";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import { emptyCacheAndHardReload } from "../../utils/hardReload.util";
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
type ThemePreference = "dark" | "light";

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

function resolveThemePreference(value: string | null | undefined): ThemePreference | null {
  return value === "dark" || value === "light" ? value : null;
}

const More = (): ReactElement => {
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const { user, isAuthenticated } = useAuth();
  const { appVersion } = useAppSettings();
  const { mode, setThemeMode } = useThemeMode();
  const roles = user?.roles ?? [];
  const isSuperAdmin = roles.includes("SUPER_ADMIN");
  const isAdmin = roles.includes("ADMIN");
  const shouldShowPublicInfoCards = !isSuperAdmin && !isAdmin;
  const { data: meData } = useQuery<UserMeResponse>(USER_ME_QUERY, {
    fetchPolicy: "cache-only",
    returnPartialData: true,
  });
  const serverThemePreference = resolveThemePreference(meData?.me?.preferences?.theme);
  const serverNotificationsEnabled = meData?.me?.preferences?.notificationsEnabled;
  const initialThemePreference = serverThemePreference ?? mode;
  const initialNotificationsEnabled = serverNotificationsEnabled ?? true;
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
  const shouldShowVersion = hasText(appVersion.value);

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

  const refreshMe = async (): Promise<void> => {
    await apolloClient.query<UserMeResponse>({
      query: USER_ME_QUERY,
      fetchPolicy: "network-only",
    });
  };

  const handleThemeToggle = async (): Promise<void> => {
    const previousTheme = preferredTheme;
    const nextTheme: ThemePreference = previousTheme === "dark" ? "light" : "dark";
    setPreferredTheme(nextTheme);
    setThemeMode(nextTheme);

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
      await refreshMe();
      return;
    }

    setPreferredTheme(previousTheme);
    setThemeMode(previousTheme);
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
      await refreshMe();
      return;
    }

    setNotificationsEnabled(previousValue);
  };

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
      ) : null}

      <div className={styles.linkGrid}>
        {isSuperAdmin ? (
          <>
            <button
              type="button"
              className={styles.linkCard}
              onClick={() => navigate(APP_SHELL_ROUTES.users)}
            >
              <PeopleAltRoundedIcon />
              <span>کاربران</span>
            </button>
            <button
              type="button"
              className={styles.linkCard}
              onClick={() => navigate(APP_SHELL_ROUTES.moreSystemSettings)}
            >
              <SettingsRoundedIcon />
              <span>تنظیمات سامانه</span>
            </button>
            <button
              type="button"
              className={`${styles.linkCard} ${styles.globalAnouncementCard}`}
              onClick={() => navigate(APP_SHELL_ROUTES.moreGlobalAnouncement)}
            >
              <CampaignRoundedIcon />
              <span>اعلان عمومی</span>
            </button>
            <button
              type="button"
              className={`${styles.linkCard} ${styles.couponsCard}`}
              onClick={() => navigate(APP_SHELL_ROUTES.moreCoupons)}
            >
              <ConfirmationNumberRoundedIcon />
              <span>کدهای تخفیف</span>
            </button>
          </>
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
        {shouldShowPublicInfoCards ? (
          <button type="button" className={styles.linkCard} onClick={() => navigate("/more/about")}>
            <InfoOutlinedIcon />
            <span>درباره سامانه</span>
          </button>
        ) : null}
        {shouldShowBugReport ? (
          <button
            type="button"
            className={`${styles.linkCard} ${styles.bugReportCard}`}
            onClick={() => setBugReportDialogOpen(true)}
          >
            <BugReportRoundedIcon />
            <span>گزارش باگ</span>
          </button>
        ) : null}
        <button
          type="button"
          className={styles.linkCard}
          disabled={isHardReloading}
          aria-busy={isHardReloading}
          aria-label="پاکسازی کَش و بارگذاری مجدد"
          onClick={handleEmptyCacheAndHardReload}
        >
          <CachedRoundedIcon />
          <span>{isHardReloading ? "در حال پاکسازی..." : "پاکسازی کَش و بارگذاری"}</span>
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
