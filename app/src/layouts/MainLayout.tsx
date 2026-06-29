import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Avatar, Badge, Box, Button, Container, Divider, IconButton, Popover } from "@mui/material";
import { useQuery } from "@apollo/client/react";
import { Capacitor } from "@capacitor/core";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Link as RouterLink, NavLink, useLocation } from "react-router-dom";
import Footer from "../components/layout/Footer";
import { AvatarInitial } from "../shared/display/AvatarInitial";
import { useAuth } from "../contexts/AuthContext";
import { useThemeMode } from "../contexts/ThemeContext";
import { BADGE_COUNT_QUERY } from "../graphql/queries/badgeCount.query";
import { useMe } from "../hooks/useMe";
import {
  resolveAvatarInitial,
  resolveMeUserDisplayName,
  resolveStoredUserDisplayName,
} from "../utils/storedUser.util";
import { usePushNotificationOpenPresentation } from "../hooks/usePushNotificationOpenPresentation";
import { useTranslation } from "../hooks/useTranslation";
import {
  GENERAL_NOTIFICATION_MESSAGE_TYPES,
  GENERAL_SUBSCRIPTION_UPDATE_TYPES,
  type GeneralNotificationMessageType,
} from "../constants";
import { type GeneralUpdateEvent } from "../hooks/useGeneralUpdatesSubscription";
import { useVerificationStatusSubscription } from "../hooks/useVerificationStatusSubscription";
import {
  notifyBadgeCountUpdateListeners,
  subscribeBadgeCountUpdates,
} from "../lib/badge-count-update-listeners";
import { subscribeGeneralUpdates } from "../lib/general-updates-listeners";
import { subscribePushNotificationOpen } from "../lib/push-open-listeners";
import { useGeneralUpdatesOnline } from "../hooks/useGeneralUpdatesOnline";
import { APP_SHELL_ROUTES, isProductDetailRoute } from "../routing/app-shell-routes";
import { resolveNotificationActionPayload } from "../utilities/notification-action.util";
import { deliverNotificationPushIfEnabled } from "../utils/browserNotification.util";
import { scrollToTopOnMobile } from "../utils/scrollToTopOnMobile.util";
import { AppShellNavItemIcon } from "./AppShellNavItemIcon";
import {
  APP_SHELL_NAV_ITEMS,
  filterAppShellNavItems,
  resolveAppShellNavPath,
  type AppShellNavBadgeCounts,
} from "./app-shell-nav-items";
import { SideMenuNav } from "./SideMenuNav";
import {
  filterHeaderPanelNavItems,
  HEADER_HELP_ITEMS,
  HEADER_SETTINGS_ITEMS,
  HEADER_USER_ITEMS,
  resolveHeaderSettingsDestination,
} from "./header-panel-items";
import { useAppShellNavPrefetch } from "../hooks/useAppShellNavPrefetch";
import { useAppShellRoutePrefetch } from "../hooks/useAppShellRoutePrefetch";
import { useAfterLogoutCacheCleanup } from "../hooks/useAfterLogoutCacheCleanup";
import { isLogoutCacheCleanupInProgress } from "../lib/app-shell-nav-prefetch";
import { warmAppShellNavTarget } from "../lib/app-shell-nav-warm";
import { useHeaderNotificationPreview } from "./useHeaderNotificationPreview";
import "./styles/MainLayout.scss";
import AppTooltip from "../shared/AppTooltip";
import { PUSH_NOTIFICATION_TITLE } from "../constants/push-notification-open.constants";

const POPOVER_ANCHOR_ORIGIN = { vertical: "bottom", horizontal: "left" } as const;
const POPOVER_TRANSFORM_ORIGIN = { vertical: "top", horizontal: "left" } as const;
const LAYOUT_CONTAINER_SX = {
  maxWidth: "min(96vw, 82.5rem) !important",
  px: { xs: 1, sm: 1.25, md: 1.5 },
} as const;
const HEADER_SX = {
  py: { xs: 0.75, md: 0.85 },
  px: { xs: 1.25, sm: 1.45 },
} as const;
const BRAND_LOGO_SX = {
  width: "3.5rem",
  height: "3.5rem",
  flexShrink: 0,
  display: "block",
  objectFit: "contain",
} as const;
const SUPER_ADMIN_ROLE_BADGE_LABEL = "سوپرادمین" as const;

type TitleDescItem = { readonly id: string; readonly title: string; readonly description: string };
type NotificationPayload = Partial<TitleDescItem> & {
  readonly messageType?: GeneralNotificationMessageType;
  readonly isPushNotification?: boolean;
  readonly mode?: string;
  readonly source?: string;
  readonly productId?: string;
  readonly chapterKey?: string;
  readonly purchaseStatus?: string;
  readonly action?: {
    readonly label?: string;
    readonly href?: string;
    readonly url?: string;
    readonly to?: string;
  };
  readonly actionLabel?: string;
  readonly actionUrl?: string;
};
type GeneralUpdatePopupMode = "info" | "success" | "warning" | "error";
type GeneralUpdatePopupAction = {
  readonly label: string;
  readonly href: string;
};
type GeneralUpdatePopup = {
  readonly id: string;
  readonly title?: string;
  readonly description: string;
  readonly mode: GeneralUpdatePopupMode;
  readonly action?: GeneralUpdatePopupAction;
};
type BadgeCountQuery = {
  readonly badgeCount: {
    readonly products: number;
    readonly payments?: number | null;
    readonly notifications?: number | null;
    readonly tickets?: number | null;
  };
};

type MainLayoutProps = {
  readonly children: ReactNode;
  readonly showSessionTools?: boolean;
  readonly showHeader?: boolean;
  readonly showFooter?: boolean;
};

function asNotificationPayload(value: unknown): NotificationPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as NotificationPayload;
}

function resolvePopupMode(value: unknown): GeneralUpdatePopupMode {
  if (typeof value !== "string") {
    return "info";
  }

  switch (value.toUpperCase()) {
    case "SUCCESS":
      return "success";
    case "WARN":
    case "WARNING":
      return "warning";
    case "ERROR":
      return "error";
    case "INFO":
    default:
      return "info";
  }
}

function formatGeneralUpdateTimeLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "همین الان";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) {
    return "همین الان";
  }

  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function LayoutPopover(props: {
  readonly id: string | undefined;
  readonly open: boolean;
  readonly anchorEl: HTMLButtonElement | null;
  readonly onClose: () => void;
  readonly paperClassName: string;
  readonly children: ReactNode;
}): ReactElement {
  const { id, open, anchorEl, onClose, paperClassName, children } = props;
  return (
    <Popover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={POPOVER_ANCHOR_ORIGIN}
      transformOrigin={POPOVER_TRANSFORM_ORIGIN}
      slotProps={{
        paper: { className: paperClassName },
      }}
    >
      {children}
    </Popover>
  );
}

export function MainLayout({
  children,
  showSessionTools = false,
  showHeader = true,
  showFooter = true,
}: MainLayoutProps): ReactElement {
  const location = useLocation();
  const { t } = useTranslation();
  const { mode, toggleTheme } = useThemeMode();
  const { logout, user: authUser, isLoading: authLoading } = useAuth();
  const { user, avatarUrl, loading: userLoading } = useMe();

  const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [helpAnchorEl, setHelpAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [userAnchorEl, setUserAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(false);
  const [generalUpdatePopup, setGeneralUpdatePopup] = useState<GeneralUpdatePopup | null>(null);

  const handleShowGeneralUpdatePopup = useCallback((popup: GeneralUpdatePopup): void => {
    setGeneralUpdatePopup(popup);
  }, []);

  usePushNotificationOpenPresentation({
    enabled: !Capacitor.isNativePlatform(),
    onShowPopup: handleShowGeneralUpdatePopup,
  });

  const profileSubscriptionOnline = useGeneralUpdatesOnline();

  const isNotificationOpen = Boolean(notificationAnchorEl);
  const isSettingsOpen = Boolean(settingsAnchorEl);
  const isHelpOpen = Boolean(helpAnchorEl);
  const isUserOpen = Boolean(userAnchorEl);

  const notificationPopoverId = isNotificationOpen
    ? "main-layout-notifications-popover"
    : undefined;
  const settingsPopoverId = isSettingsOpen ? "main-layout-settings-popover" : undefined;
  const helpPopoverId = isHelpOpen ? "main-layout-help-popover" : undefined;
  const userPopoverId = isUserOpen ? "main-layout-user-popover" : undefined;
  const roles = authUser?.roles ?? [];
  const isAuthenticated = Boolean(authUser);
  const isEndUser = roles.includes("END_USER");
  const usesPublicProductList = !authUser || isEndUser;
  const appShellNavContext = useMemo(
    () => ({
      roles,
      isAuthenticated: Boolean(authUser),
    }),
    [authUser, roles]
  );
  const visibleAppShellNavItems = useMemo(
    () => filterAppShellNavItems(APP_SHELL_NAV_ITEMS, appShellNavContext),
    [appShellNavContext]
  );
  const appShellNavDataContext = useMemo(
    () => ({
      roles,
      isAuthenticated,
      userId: authUser?.id ?? null,
      isEndUser,
    }),
    [authUser?.id, isAuthenticated, isEndUser, roles]
  );

  useAppShellNavPrefetch({
    authLoading,
    roles,
    isAuthenticated,
    userId: authUser?.id ?? null,
    isEndUser,
  });
  useAppShellRoutePrefetch({
    authLoading,
    roles,
    isAuthenticated,
  });

  useEffect(() => {
    if (!isProductDetailRoute(location.pathname)) {
      return;
    }

    const productsItem = APP_SHELL_NAV_ITEMS.find((item) => item.id === "products");
    if (!productsItem) {
      return;
    }

    warmAppShellNavTarget(productsItem, appShellNavContext, appShellNavDataContext);
  }, [appShellNavContext, appShellNavDataContext, location.pathname]);

  const brandTagline = usesPublicProductList
    ? t("layout.header.brand.publicTagline")
    : t("layout.header.brand.tagline");

  const { data: badgeCountData, refetch: refetchBadgeCount } = useQuery<BadgeCountQuery>(
    BADGE_COUNT_QUERY,
    {
      fetchPolicy: "cache-and-network",
    }
  );
  const previousAuthUserIdRef = useRef<string | null>(authUser?.id ?? null);
  const [liveCounts, setLiveCounts] = useState<{
    readonly products?: number;
    readonly payments?: number | null;
    readonly notifications?: number;
    readonly tickets?: number;
    readonly others?: number;
  }>({});

  const shouldLoadHeaderNotificationPreview =
    isAuthenticated && !isProductDetailRoute(location.pathname);

  const {
    items: headerNotifications,
    upsertLiveItem: upsertLiveHeaderNotification,
    markAllAsRead: markAllHeaderNotificationsAsRead,
    canMarkAllAsRead: canMarkAllHeaderNotificationsAsRead,
    isMarkingAllAsRead: isMarkingAllHeaderNotificationsAsRead,
  } = useHeaderNotificationPreview(shouldLoadHeaderNotificationPreview);

  useAfterLogoutCacheCleanup(() => {
    void refetchBadgeCount();
  });

  useEffect(() => {
    const currentAuthUserId = authUser?.id ?? null;
    const previousAuthUserId = previousAuthUserIdRef.current;
    previousAuthUserIdRef.current = currentAuthUserId;

    if (currentAuthUserId === previousAuthUserId) {
      return;
    }

    if (isLogoutCacheCleanupInProgress()) {
      return;
    }

    setLiveCounts({});
    void refetchBadgeCount();
  }, [authUser?.id, refetchBadgeCount]);

  const handleBadgeCountsUpdate = useCallback((): void => {
    setLiveCounts({});
    void refetchBadgeCount();
    notifyBadgeCountUpdateListeners();
  }, [refetchBadgeCount]);

  useEffect(() => {
    return subscribeBadgeCountUpdates(() => {
      setLiveCounts({});
      void refetchBadgeCount();
    });
  }, [refetchBadgeCount]);

  const handleNotificationUpdate = useCallback(
    (event: GeneralUpdateEvent): void => {
      const payload = asNotificationPayload(event.payload);
      const incomingTitle =
        typeof payload?.title === "string" && payload.title.trim().length > 0
          ? payload.title.trim()
          : undefined;
      const incomingDescription =
        typeof payload?.description === "string" && payload.description.trim().length > 0
          ? payload.description.trim()
          : "رویداد جدیدی برای حساب شما ثبت شد.";
      const displayTitle = incomingTitle ?? incomingDescription;
      const incomingTimeLabel = formatGeneralUpdateTimeLabel(event.createdAt);
      const popupId = event.targetId || `${event.updateType}-${event.createdAt}`;
      const popupMode = resolvePopupMode(payload?.mode);
      const action = resolveNotificationActionPayload(payload) ?? undefined;
      const messageType =
        typeof payload?.messageType === "string" ? payload.messageType.toUpperCase() : undefined;

      upsertLiveHeaderNotification({
        id: popupId,
        title: displayTitle,
        description: incomingDescription,
        timeLabel: incomingTimeLabel,
      });
      setLiveCounts((previous) => {
        if (typeof previous.notifications !== "number") {
          return previous;
        }

        return {
          ...previous,
          notifications: previous.notifications + 1,
        };
      });

      void deliverNotificationPushIfEnabled(
        {
          title: PUSH_NOTIFICATION_TITLE,
          body: incomingDescription,
          tag: popupId,
        },
        payload
      );

      if (messageType === GENERAL_NOTIFICATION_MESSAGE_TYPES.POPUP) {
        setGeneralUpdatePopup({
          id: popupId,
          title: incomingTitle,
          description: incomingDescription,
          mode: popupMode,
          action,
        });
      }
    },
    [upsertLiveHeaderNotification]
  );

  useEffect(() => {
    return subscribeGeneralUpdates((event) => {
      switch (event.updateType) {
        case GENERAL_SUBSCRIPTION_UPDATE_TYPES.NOTIFICATION:
          handleNotificationUpdate(event);
          break;
        case GENERAL_SUBSCRIPTION_UPDATE_TYPES.BADGE_COUNTS:
          handleBadgeCountsUpdate();
          break;
        default:
          break;
      }
    });
  }, [handleBadgeCountsUpdate, handleNotificationUpdate]);

  useEffect(() => {
    return subscribePushNotificationOpen(() => {
      handleBadgeCountsUpdate();
    });
  }, [handleBadgeCountsUpdate]);

  useVerificationStatusSubscription({
    enabled: Boolean(authUser),
  });

  const productsBadgeCount = liveCounts.products ?? badgeCountData?.badgeCount.products ?? 0;
  const paymentBadgeCount = liveCounts.payments ?? badgeCountData?.badgeCount.payments ?? 0;
  const notificationBadgeCount =
    liveCounts.notifications ?? badgeCountData?.badgeCount.notifications ?? 0;
  const supportBadgeCount = liveCounts.tickets ?? badgeCountData?.badgeCount.tickets ?? 0;
  const appShellNavBadgeCounts = useMemo<AppShellNavBadgeCounts>(
    () => ({
      products: productsBadgeCount,
      payments: paymentBadgeCount,
      notifications: notificationBadgeCount,
      support: supportBadgeCount,
    }),
    [productsBadgeCount, notificationBadgeCount, paymentBadgeCount, supportBadgeCount]
  );

  const headerSettingsItems = useMemo(
    () => filterHeaderPanelNavItems(HEADER_SETTINGS_ITEMS, roles, isAuthenticated),
    [isAuthenticated, roles]
  );

  const headerHelpItems = useMemo(
    () => filterHeaderPanelNavItems(HEADER_HELP_ITEMS, roles, isAuthenticated),
    [isAuthenticated, roles]
  );

  const headerUserItems = useMemo(
    () => filterHeaderPanelNavItems(HEADER_USER_ITEMS, roles, isAuthenticated),
    [isAuthenticated, roles]
  );

  const headerSettingsDestination = useMemo(() => resolveHeaderSettingsDestination(roles), [roles]);

  const fallbackUser = t("layout.mainLayout.fallbackUser");

  const userRoleTitle = user?.roles?.filter((role) => role !== "END_USER").join("، ") ?? "";
  const adminRoleBadgeLabel = authUser?.roles?.includes("SUPER_ADMIN")
    ? SUPER_ADMIN_ROLE_BADGE_LABEL
    : null;

  const { userDisplayName, userInitial } = useMemo(() => {
    const name =
      userLoading || !user
        ? resolveStoredUserDisplayName(authUser, fallbackUser)
        : resolveMeUserDisplayName(user, fallbackUser);
    const trimmed = name.trim();
    return {
      userDisplayName: name,
      userInitial: resolveAvatarInitial(trimmed),
    };
  }, [authUser, fallbackUser, user, userLoading]);

  const profileAvatar = authUser && avatarUrl ? { src: avatarUrl, alt: userDisplayName } : null;

  const themeToggleLabel =
    mode === "light"
      ? t("layout.header.panels.theme.darkModeTooltip")
      : t("layout.header.panels.theme.lightModeTooltip");

  const brandTitle = t("layout.header.brand.title");
  const brandHomeAriaLabel = t("layout.mainLayout.navigation.brandHomeLink", { title: brandTitle });

  const handleLogout = (): void => {
    setUserAnchorEl(null);
    logout();
  };

  const sideMenuNavProps = {
    collapsed: isSideMenuCollapsed,
  };

  return (
    <Box
      component="main"
      className={["main-layout", isSideMenuCollapsed ? "main-layout--side-menu-collapsed" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {generalUpdatePopup ? (
        <aside
          className={[
            "main-layout__general-update-popup",
            `main-layout__general-update-popup--${generalUpdatePopup.mode}`,
          ].join(" ")}
          role={generalUpdatePopup.mode === "error" ? "alert" : "status"}
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="main-layout__general-update-popup-glow" aria-hidden="true" />
          <div className="main-layout__general-update-popup-icon" aria-hidden="true">
            {generalUpdatePopup.mode === "success" ? (
              <CheckCircleOutlineRoundedIcon fontSize="small" />
            ) : generalUpdatePopup.mode === "warning" ? (
              <WarningAmberRoundedIcon fontSize="small" />
            ) : generalUpdatePopup.mode === "error" ? (
              <ErrorOutlineRoundedIcon fontSize="small" />
            ) : (
              <InfoOutlinedIcon fontSize="small" />
            )}
          </div>
          <div className="main-layout__general-update-popup-content">
            {generalUpdatePopup.title ? <h3>{generalUpdatePopup.title}</h3> : null}
            <p>{generalUpdatePopup.description}</p>
            {generalUpdatePopup.action ? (
              generalUpdatePopup.action.href.startsWith("/") ? (
                <Button
                  size="small"
                  variant="contained"
                  className="main-layout__general-update-popup-action"
                  component={RouterLink}
                  to={generalUpdatePopup.action.href}
                  onClick={() => setGeneralUpdatePopup(null)}
                >
                  {generalUpdatePopup.action.label}
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  className="main-layout__general-update-popup-action"
                  component="a"
                  href={generalUpdatePopup.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setGeneralUpdatePopup(null)}
                >
                  {generalUpdatePopup.action.label}
                </Button>
              )
            ) : null}
          </div>
          <IconButton
            className="main-layout__general-update-popup-close"
            aria-label="بستن اعلان"
            size="small"
            onClick={() => setGeneralUpdatePopup(null)}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </aside>
      ) : null}
      <Container maxWidth={false} className="main-layout__container" sx={LAYOUT_CONTAINER_SX}>
        {showHeader ? (
          <Box component="header" className="main-layout__header" sx={HEADER_SX}>
            <div className="main-layout__brand">
              <RouterLink
                to="/"
                className="main-layout__brand-link main-layout__brand-link--desktop"
                aria-label={brandHomeAriaLabel}
              >
                <Box
                  component="img"
                  className="main-layout__brand-logo"
                  src="/logo.png"
                  alt=""
                  decoding="async"
                  aria-hidden
                  sx={BRAND_LOGO_SX}
                />
                <div className="main-layout__brand-text">
                  <h1>
                    <span>{brandTitle}</span>
                    {adminRoleBadgeLabel ? (
                      <span className="main-layout__badge">{adminRoleBadgeLabel}</span>
                    ) : null}
                  </h1>
                  <p>{brandTagline}</p>
                </div>
              </RouterLink>
              <div
                className="main-layout__brand-link main-layout__brand-link--mobile"
                aria-label={brandHomeAriaLabel}
              >
                <Box
                  component="img"
                  className="main-layout__brand-logo"
                  src="/logo.png"
                  alt=""
                  decoding="async"
                  aria-hidden
                  sx={BRAND_LOGO_SX}
                />
                <div className="main-layout__brand-text">
                  <h1>
                    <span>{brandTitle}</span>
                    {adminRoleBadgeLabel ? (
                      <span className="main-layout__badge">{adminRoleBadgeLabel}</span>
                    ) : null}
                  </h1>
                  <p>{brandTagline}</p>
                </div>
              </div>
            </div>

            <div className="main-layout__header-tools">
              <div className="main-layout__tools-start">
                <div className="main-layout__quick-actions">
                  {authUser ? (
                    <>
                      <AppTooltip title={t("layout.header.actions.notifications")}>
                        <Badge
                          className="main-layout__notification-badge"
                          badgeContent={notificationBadgeCount}
                          color="error"
                          anchorOrigin={{ vertical: "top", horizontal: "left" }}
                        >
                          <IconButton
                            id="main-layout-notification-button"
                            aria-label={t("layout.header.actions.notifications")}
                            aria-describedby={notificationPopoverId}
                            className="main-layout__icon-button"
                            onClick={(event) => setNotificationAnchorEl(event.currentTarget)}
                          >
                            <NotificationsNoneRoundedIcon />
                          </IconButton>
                        </Badge>
                      </AppTooltip>
                      <LayoutPopover
                        id={notificationPopoverId}
                        open={isNotificationOpen}
                        anchorEl={notificationAnchorEl}
                        onClose={() => setNotificationAnchorEl(null)}
                        paperClassName="main-layout__notifications-popover"
                      >
                        <div className="main-layout__notifications-panel">
                          <div className="main-layout__panel-header main-layout__panel-header--notifications">
                            <div>
                              <h3>{t("layout.header.panels.notifications.popoverTitle")}</h3>
                              <p>{t("layout.header.panels.notifications.panelSubtitle")}</p>
                            </div>
                            <span>
                              {t("layout.header.panels.notifications.countLabel", {
                                count: notificationBadgeCount,
                              })}
                            </span>
                          </div>
                          <Divider />
                          <div className="main-layout__notifications-list">
                            {headerNotifications.length > 0 ? (
                              headerNotifications.map((notification) => (
                                <article
                                  key={notification.id}
                                  className="main-layout__notification-item"
                                >
                                  <div className="main-layout__notification-dot" />
                                  <div>
                                    <h4>{notification.title}</h4>
                                    <p>{notification.description}</p>
                                    <time>{notification.timeLabel}</time>
                                  </div>
                                </article>
                              ))
                            ) : (
                              <p className="main-layout__panel-empty">
                                {t("layout.header.panels.notifications.empty")}
                              </p>
                            )}
                          </div>
                          <Divider />
                          <div className="main-layout__panel-actions">
                            <Button
                              size="small"
                              variant="contained"
                              component={RouterLink}
                              to={APP_SHELL_ROUTES.notifications}
                              onClick={() => setNotificationAnchorEl(null)}
                            >
                              {t("layout.header.panels.notifications.viewAll")}
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              disabled={
                                !canMarkAllHeaderNotificationsAsRead ||
                                isMarkingAllHeaderNotificationsAsRead
                              }
                              onClick={() => void markAllHeaderNotificationsAsRead()}
                            >
                              {t("layout.header.panels.notifications.markAllRead")}
                            </Button>
                          </div>
                        </div>
                      </LayoutPopover>
                    </>
                  ) : null}

                  <AppTooltip title={t("layout.header.actions.settings")}>
                    <IconButton
                      id="main-layout-settings-button"
                      aria-label={t("layout.header.actions.settings")}
                      aria-describedby={settingsPopoverId}
                      className="main-layout__icon-button"
                      onClick={(event) => setSettingsAnchorEl(event.currentTarget)}
                    >
                      <SettingsRoundedIcon />
                    </IconButton>
                  </AppTooltip>
                  <LayoutPopover
                    id={settingsPopoverId}
                    open={isSettingsOpen}
                    anchorEl={settingsAnchorEl}
                    onClose={() => setSettingsAnchorEl(null)}
                    paperClassName="main-layout__settings-popover"
                  >
                    <div className="main-layout__settings-panel">
                      <div className="main-layout__panel-header main-layout__panel-header--settings">
                        <div>
                          <h3>{t("layout.header.panels.settings.title")}</h3>
                          <p>{t("layout.header.panels.settings.subtitle")}</p>
                        </div>
                        <span>{t("layout.header.panels.settings.badgeSuggested")}</span>
                      </div>
                      <Divider />
                      <div className="main-layout__settings-list">
                        {headerSettingsItems.map((setting) => (
                          <RouterLink
                            key={setting.id}
                            to={setting.to}
                            className="main-layout__settings-item"
                            onClick={() => setSettingsAnchorEl(null)}
                          >
                            <h4>{t(setting.titleKey)}</h4>
                            <p>{t(setting.descriptionKey)}</p>
                          </RouterLink>
                        ))}
                      </div>
                      <Divider />
                      <div className="main-layout__panel-actions">
                        <Button
                          size="small"
                          variant="contained"
                          component={RouterLink}
                          to={headerSettingsDestination}
                          onClick={() => setSettingsAnchorEl(null)}
                        >
                          {t("layout.header.panels.settings.enterSettings")}
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          component={RouterLink}
                          to={APP_SHELL_ROUTES.more}
                          onClick={() => setSettingsAnchorEl(null)}
                        >
                          {t("layout.header.panels.settings.customizePanel")}
                        </Button>
                      </div>
                    </div>
                  </LayoutPopover>

                  <AppTooltip title={t("layout.header.actions.help")}>
                    <IconButton
                      id="main-layout-help-button"
                      aria-label={t("layout.header.actions.help")}
                      aria-describedby={helpPopoverId}
                      className="main-layout__icon-button"
                      onClick={(event) => setHelpAnchorEl(event.currentTarget)}
                    >
                      <HelpOutlineRoundedIcon />
                    </IconButton>
                  </AppTooltip>
                  <LayoutPopover
                    id={helpPopoverId}
                    open={isHelpOpen}
                    anchorEl={helpAnchorEl}
                    onClose={() => setHelpAnchorEl(null)}
                    paperClassName="main-layout__help-popover"
                  >
                    <div className="main-layout__help-panel">
                      <div className="main-layout__panel-header main-layout__panel-header--help">
                        <div>
                          <h3>{t("layout.header.panels.help.popoverTitle")}</h3>
                          <p>{t("layout.header.panels.help.subtitle")}</p>
                        </div>
                        <span>{t("layout.footer.links.helpCenter")}</span>
                      </div>
                      <Divider />
                      <div className="main-layout__help-list">
                        {headerHelpItems.map((helpItem) => (
                          <RouterLink
                            key={helpItem.id}
                            to={helpItem.to}
                            className="main-layout__help-item"
                            onClick={() => setHelpAnchorEl(null)}
                          >
                            <h4>{t(helpItem.titleKey)}</h4>
                            <p>{t(helpItem.descriptionKey)}</p>
                          </RouterLink>
                        ))}
                      </div>
                      <Divider />
                      <div className="main-layout__panel-actions">
                        <Button
                          size="small"
                          variant="contained"
                          component={RouterLink}
                          to={APP_SHELL_ROUTES.supportFaq}
                          onClick={() => setHelpAnchorEl(null)}
                        >
                          {t("layout.header.panels.help.viewGuide")}
                        </Button>
                        {isAuthenticated ? (
                          <Button
                            size="small"
                            variant="text"
                            component={RouterLink}
                            to={APP_SHELL_ROUTES.supportTickets}
                            onClick={() => setHelpAnchorEl(null)}
                          >
                            {t("layout.header.panels.help.supportTicket")}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </LayoutPopover>

                  <AppTooltip title={themeToggleLabel}>
                    <IconButton
                      aria-label={themeToggleLabel}
                      className="main-layout__icon-button"
                      onClick={toggleTheme}
                    >
                      {mode === "light" ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
                    </IconButton>
                  </AppTooltip>
                </div>

                <button
                  type="button"
                  className="main-layout__user-chip"
                  id="main-layout-user-button"
                  aria-label={t("layout.header.panels.user.chipAriaLabel")}
                  aria-describedby={userPopoverId}
                  onClick={(event) => setUserAnchorEl(event.currentTarget)}
                >
                  <Avatar
                    className="main-layout__avatar"
                    src={avatarUrl ?? undefined}
                    alt={userDisplayName}
                  >
                    <AvatarInitial initial={userInitial} />
                  </Avatar>
                  <div className="main-layout__user-meta">
                    <strong className="main-layout__user-name">{userDisplayName}</strong>
                  </div>
                </button>
                <LayoutPopover
                  id={userPopoverId}
                  open={isUserOpen}
                  anchorEl={userAnchorEl}
                  onClose={() => setUserAnchorEl(null)}
                  paperClassName="main-layout__user-popover"
                >
                  <div className="main-layout__user-panel">
                    <div className="main-layout__user-header">
                      <Avatar
                        className="main-layout__avatar main-layout__avatar--lg"
                        src={avatarUrl ?? undefined}
                        alt={userDisplayName}
                      >
                        <AvatarInitial initial={userInitial} />
                      </Avatar>
                      <div>
                        <h3>{userDisplayName}</h3>
                        {userRoleTitle ? <p>{userRoleTitle}</p> : null}
                      </div>
                    </div>
                    <Divider />
                    <div className="main-layout__user-actions-list">
                      {headerUserItems.map((actionItem) => (
                        <RouterLink
                          key={actionItem.id}
                          to={actionItem.to}
                          className="main-layout__user-action-item"
                          onClick={() => setUserAnchorEl(null)}
                        >
                          <h4>{t(actionItem.titleKey)}</h4>
                          <p>{t(actionItem.descriptionKey)}</p>
                        </RouterLink>
                      ))}
                    </div>
                    <Divider />
                    <div className="main-layout__panel-actions">
                      <Button
                        size="small"
                        variant="contained"
                        component={RouterLink}
                        to={APP_SHELL_ROUTES.profile}
                        onClick={() => setUserAnchorEl(null)}
                      >
                        {t("layout.header.panels.user.openProfile")}
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        component={RouterLink}
                        to={`${APP_SHELL_ROUTES.profile}/password`}
                        onClick={() => setUserAnchorEl(null)}
                      >
                        {t("layout.header.panels.user.changePassword")}
                      </Button>
                    </div>
                    {showSessionTools ? (
                      <>
                        <Divider />
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          className="main-layout__user-signout"
                          startIcon={<LogoutRoundedIcon />}
                          onClick={handleLogout}
                        >
                          {t("layout.header.actions.exit")}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </LayoutPopover>
              </div>
            </div>
          </Box>
        ) : null}

        <div className="main-layout__body">
          <aside
            className={`main-layout__side-menu main-layout__side-menu--desktop ${
              isSideMenuCollapsed ? "main-layout__side-menu--collapsed" : ""
            }`}
          >
            <div
              className={`side-menu-nav ${isSideMenuCollapsed ? "side-menu-nav--collapsed" : ""}`}
            >
              <SideMenuNav
                {...sideMenuNavProps}
                showCollapseToggle
                onToggleCollapsed={() => setIsSideMenuCollapsed((previous) => !previous)}
                badgeCounts={appShellNavBadgeCounts}
                profileAvatar={profileAvatar}
                profileSubscriptionOnline={profileSubscriptionOnline}
              />
            </div>
          </aside>

          <div className="main-layout__content">{children}</div>
        </div>

        {showFooter ? <Footer /> : null}
      </Container>

      {showHeader ? (
        <nav className="main-layout__mobile-bottom-nav" data-opaque-shell aria-label="منوی موبایل">
          {visibleAppShellNavItems.map((item) => (
            <NavLink
              key={item.id}
              to={resolveAppShellNavPath(item, appShellNavContext)}
              end={item.exactPathMatch === true}
              onMouseEnter={() =>
                warmAppShellNavTarget(item, appShellNavContext, appShellNavDataContext)
              }
              onTouchStart={() =>
                warmAppShellNavTarget(item, appShellNavContext, appShellNavDataContext)
              }
              onClick={scrollToTopOnMobile}
              className={({ isActive }) =>
                `main-layout__mobile-bottom-item${
                  isActive ? " main-layout__mobile-bottom-item--active" : ""
                }`
              }
            >
              <AppShellNavItemIcon
                item={item}
                variant="bottom"
                badgeCounts={appShellNavBadgeCounts}
                profileAvatar={profileAvatar}
                profileSubscriptionOnline={profileSubscriptionOnline}
              />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      ) : null}
    </Box>
  );
}
