import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Avatar, Badge, Box, Button, Container, Divider, IconButton, Popover } from "@mui/material";
import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Link as RouterLink, NavLink } from "react-router-dom";
import Footer from "../components/layout/Footer";
import { useAuth } from "../contexts/AuthContext";
import { useThemeMode } from "../contexts/ThemeContext";
import { BADGE_COUNT_QUERY } from "../graphql/queries/badgeCount.query";
import { useMe } from "../hooks/useMe";
import { resolveMeUserDisplayName, resolveStoredUserDisplayName } from "../utils/storedUser.util";
import { useSnackbar } from "../hooks/useSnackbar";
import { useTranslation } from "../hooks/useTranslation";
import {
  GENERAL_NOTIFICATION_MESSAGE_TYPES,
  GENERAL_SUBSCRIPTION_UPDATE_TYPES,
  type GeneralNotificationMessageType,
} from "../constants";
import { useGeneralUpdatesSubscription, type GeneralUpdateEvent } from "../hooks/useGeneralUpdatesSubscription";
import { useVerificationStatusSubscription } from "../hooks/useVerificationStatusSubscription";
import { notifyBadgeCountUpdateListeners } from "../lib/badge-count-update-listeners";
import { notifyGeneralUpdateListeners } from "../lib/general-updates-listeners";
import { APP_SHELL_ROUTES } from "../routing/app-shell-routes";
import { resolveNotificationActionPayload } from "../utilities/notification-action.util";
import { showBrowserNotification } from "../utils/browserNotification.util";
import { scrollToTopOnMobile } from "../utils/scrollToTopOnMobile.util";
import { SideMenuNav } from "./SideMenuNav";
import "./styles/MainLayout.scss";
import AppTooltip from "../shared/AppTooltip";

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
const ADMIN_ROLE_BADGE_LABELS = {
  SUPER_ADMIN: "سوپرادمین",
  ADMIN: "ادمین",
} as const;

type TitleDescItem = { readonly id: string; readonly title: string; readonly description: string };
type NotificationSample = TitleDescItem & { readonly timeLabel: string };
type NotificationPayload = Partial<TitleDescItem> & {
  readonly messageType?: GeneralNotificationMessageType;
  readonly isPushNotification?: boolean;
  readonly mode?: string;
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
    readonly courses: number;
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

function asRecordArray<T>(value: unknown): readonly T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

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

function resolveSnackbarSeverity(value: unknown): "info" | "success" | "warning" | "error" {
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
  const { showSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const { mode, toggleTheme } = useThemeMode();
  const { logout, user: authUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { user, avatarUrl, loading: userLoading } = useMe();

  const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [helpAnchorEl, setHelpAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [userAnchorEl, setUserAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(false);
  const [generalUpdatePopup, setGeneralUpdatePopup] =
    useState<GeneralUpdatePopup | null>(null);

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
  const isEndUser = roles.includes("END_USER");
  const isSuperAdmin = roles.includes("SUPER_ADMIN");
  const shouldOpenSupportTickets = isSuperAdmin || roles.includes("ADMIN");
  const supportNavPath = shouldOpenSupportTickets
    ? APP_SHELL_ROUTES.supportTickets
    : APP_SHELL_ROUTES.support;
  const usesPublicCourseList = !authUser || isEndUser;
  const brandTagline = usesPublicCourseList
    ? t("layout.header.brand.publicTagline")
    : t("layout.header.brand.tagline");

  const { data: badgeCountData, refetch: refetchBadgeCount } =
    useQuery<BadgeCountQuery>(BADGE_COUNT_QUERY, {
      fetchPolicy: "cache-and-network",
    });
  const previousAuthUserIdRef = useRef<string | null>(authUser?.id ?? null);
  const [liveCounts, setLiveCounts] = useState<{
    readonly courses?: number;
    readonly payments?: number | null;
    readonly notifications?: number;
    readonly tickets?: number;
    readonly others?: number;
  }>({});

  const sampleNotifications = useMemo(
    () =>
      asRecordArray<NotificationSample>(
        t("layout.header.panels.notifications.___samples", { returnObjects: true })
      ),
    [t]
  );
  const [liveNotifications, setLiveNotifications] =
    useState<readonly NotificationSample[]>(sampleNotifications);

  useEffect(() => {
    setLiveNotifications(sampleNotifications);
  }, [sampleNotifications]);

  useEffect(() => {
    const currentAuthUserId = authUser?.id ?? null;
    const previousAuthUserId = previousAuthUserIdRef.current;
    previousAuthUserIdRef.current = currentAuthUserId;

    if (currentAuthUserId === previousAuthUserId) {
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

  const handleNotificationUpdate = useCallback((event: GeneralUpdateEvent): void => {
    const payload = asNotificationPayload(event.payload);
    const incomingTitle =
      typeof payload?.title === "string" && payload.title.trim().length > 0
        ? payload.title
        : undefined;
    const incomingDescription =
      typeof payload?.description === "string" && payload.description.trim().length > 0
        ? payload.description
        : "رویداد جدیدی برای حساب شما ثبت شد.";
    const incomingTimeLabel = formatGeneralUpdateTimeLabel(event.createdAt);
    const popupId = event.targetId || `${event.updateType}-${event.createdAt}`;
    const popupMode = resolvePopupMode(payload?.mode);
    const action = resolveNotificationActionPayload(payload) ?? undefined;
    const messageType =
      typeof payload?.messageType === "string"
        ? payload.messageType.toUpperCase()
        : GENERAL_NOTIFICATION_MESSAGE_TYPES.SNACKBAR;

    setLiveNotifications((previous) => [
      {
        id: popupId,
        title: incomingTitle ?? "اعلان جدید",
        description: incomingDescription,
        timeLabel: incomingTimeLabel,
      },
      ...previous.slice(0, 19),
    ]);
    setLiveCounts({});
    void refetchBadgeCount();
    notifyBadgeCountUpdateListeners();

    if (payload?.isPushNotification) {
      void showBrowserNotification({
        title: incomingTitle ?? "اعلان جدید",
        body: incomingDescription,
        tag: popupId,
      });
    }

    if (messageType === GENERAL_NOTIFICATION_MESSAGE_TYPES.SNACKBAR) {
      showSnackbar(
        incomingTitle ? `${incomingTitle}: ${incomingDescription}` : incomingDescription,
        resolveSnackbarSeverity(payload?.mode)
      );
      return;
    }

    setGeneralUpdatePopup({
      id: popupId,
      title: incomingTitle,
      description: incomingDescription,
      mode: popupMode,
      action,
    });
  }, [refetchBadgeCount, showSnackbar]);

  useGeneralUpdatesSubscription({
    enabled: isAuthenticated && !isAuthLoading,
    updateTypes: [
      GENERAL_SUBSCRIPTION_UPDATE_TYPES.NOTIFICATION,
      GENERAL_SUBSCRIPTION_UPDATE_TYPES.BADGE_COUNTS,
      GENERAL_SUBSCRIPTION_UPDATE_TYPES.VERIFICATION_STATUS,
    ],
    onAnyUpdate: notifyGeneralUpdateListeners,
    onNotification: handleNotificationUpdate,
    onBadgeCounts: handleBadgeCountsUpdate,
  });

  useVerificationStatusSubscription({
    enabled: isAuthenticated && !isAuthLoading,
  });

  const coursesBadgeCount = liveCounts.courses ?? badgeCountData?.badgeCount.courses ?? 0;
  const paymentBadgeCount = liveCounts.payments ?? badgeCountData?.badgeCount.payments ?? 0;
  const notificationBadgeCount =
    liveCounts.notifications ?? badgeCountData?.badgeCount.notifications ?? 0;
  const supportBadgeCount = liveCounts.tickets ?? badgeCountData?.badgeCount.tickets ?? 0;

  const sampleSettings = useMemo(
    () =>
      asRecordArray<TitleDescItem>(
        t("layout.header.panels.settings.___sampleItems", { returnObjects: true })
      ),
    [t]
  );

  const sampleHelpItems = useMemo(
    () =>
      asRecordArray<TitleDescItem>(
        t("layout.header.panels.help.___sampleItems", { returnObjects: true })
      ),
    [t]
  );

  const userQuickActions = useMemo(
    () =>
      asRecordArray<TitleDescItem>(
        t("layout.header.panels.user.___sampleItems", { returnObjects: true })
      ),
    [t]
  );

  const fallbackUser = t("layout.mainLayout.fallbackUser");

  const userRoleTitle =
    user?.roles
      ?.filter((role) => role !== "END_USER")
      .join("، ") ?? "";
  const adminRoleBadgeLabel = authUser?.roles?.includes("SUPER_ADMIN")
    ? ADMIN_ROLE_BADGE_LABELS.SUPER_ADMIN
    : authUser?.roles?.includes("ADMIN")
      ? ADMIN_ROLE_BADGE_LABELS.ADMIN
      : null;

  const { userDisplayName, userInitial } = useMemo(() => {
    const name =
      userLoading || !user
        ? resolveStoredUserDisplayName(authUser, fallbackUser)
        : resolveMeUserDisplayName(user, fallbackUser);
    const trimmed = name.trim();
    return {
      userDisplayName: name,
      userInitial: trimmed.slice(0, 1) || "?",
    };
  }, [authUser, fallbackUser, user, userLoading]);

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
      className={[
        "main-layout",
        isSideMenuCollapsed ? "main-layout--side-menu-collapsed" : "",
      ]
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
                            {liveNotifications.map((notification) => (
                              <article key={notification.id} className="main-layout__notification-item">
                                <div className="main-layout__notification-dot" />
                                <div>
                                  <h4>{notification.title}</h4>
                                  <p>{notification.description}</p>
                                  <time>{notification.timeLabel}</time>
                                </div>
                              </article>
                            ))}
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
                            <Button size="small" variant="text">
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
                        {sampleSettings.map((setting) => (
                          <button
                            key={setting.id}
                            type="button"
                            className="main-layout__settings-item"
                          >
                            <h4>{setting.title}</h4>
                            <p>{setting.description}</p>
                          </button>
                        ))}
                      </div>
                      <Divider />
                      <div className="main-layout__panel-actions">
                        <Button size="small" variant="contained">
                          {t("layout.header.panels.settings.enterSettings")}
                        </Button>
                        <Button size="small" variant="text">
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
                        {sampleHelpItems.map((helpItem) => (
                          <button
                            key={helpItem.id}
                            type="button"
                            className="main-layout__help-item"
                          >
                            <h4>{helpItem.title}</h4>
                            <p>{helpItem.description}</p>
                          </button>
                        ))}
                      </div>
                      <Divider />
                      <div className="main-layout__panel-actions">
                        <Button size="small" variant="contained">
                          {t("layout.header.panels.help.viewGuide")}
                        </Button>
                        <Button size="small" variant="text">
                          {t("layout.header.panels.help.supportTicket")}
                        </Button>
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
                    {userInitial}
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
                        {userInitial}
                      </Avatar>
                      <div>
                        <h3>{userDisplayName}</h3>
                        {userRoleTitle ? <p>{userRoleTitle}</p> : null}
                      </div>
                    </div>
                    <Divider />
                    <div className="main-layout__user-actions-list">
                      {userQuickActions.map((actionItem) => (
                        <button
                          key={actionItem.id}
                          type="button"
                          className="main-layout__user-action-item"
                        >
                          <h4>{actionItem.title}</h4>
                          <p>{actionItem.description}</p>
                        </button>
                      ))}
                    </div>
                    <Divider />
                    <div className="main-layout__panel-actions">
                      <Button size="small" variant="contained">
                        {t("layout.header.panels.user.openProfile")}
                      </Button>
                      <Button size="small" variant="text">
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
              />
            </div>
          </aside>

          <div className="main-layout__content">{children}</div>
        </div>

        {showFooter ? <Footer /> : null}
      </Container>

      {showHeader ? (
        <nav
          className="main-layout__mobile-bottom-nav"
          data-opaque-shell
          aria-label="منوی موبایل"
        >
          <NavLink
            to="/courses"
            onClick={scrollToTopOnMobile}
            className={({ isActive }) =>
              `main-layout__mobile-bottom-item${
                isActive ? " main-layout__mobile-bottom-item--active" : ""
              }`
            }
          >
            <Badge
              badgeContent={coursesBadgeCount}
              color="primary"
              max={999}
              className="main-layout__mobile-bottom-badge"
            >
              <MenuBookRoundedIcon />
            </Badge>
            <span>دوره‌ها</span>
          </NavLink>
          {isSuperAdmin ? (
            <NavLink
              to="/payments"
              onClick={scrollToTopOnMobile}
              className={({ isActive }) =>
                `main-layout__mobile-bottom-item${
                  isActive ? " main-layout__mobile-bottom-item--active" : ""
                }`
              }
            >
              <Badge
                badgeContent={paymentBadgeCount}
                color="warning"
                max={999}
                className="main-layout__mobile-bottom-badge main-layout__mobile-bottom-badge--payments"
              >
                <AccountBalanceWalletRoundedIcon />
              </Badge>
              <span>پرداخت‌ها</span>
            </NavLink>
          ) : null}
          {authUser ? (
            <NavLink
              to="/notifications"
              onClick={scrollToTopOnMobile}
              className={({ isActive }) =>
                `main-layout__mobile-bottom-item${
                  isActive ? " main-layout__mobile-bottom-item--active" : ""
                }`
              }
            >
              <Badge
                badgeContent={notificationBadgeCount}
                color="error"
                className="main-layout__mobile-bottom-badge"
              >
                <NotificationsNoneRoundedIcon />
              </Badge>
              <span>اعلان‌ها</span>
            </NavLink>
          ) : null}
          <NavLink
            to={supportNavPath}
            onClick={scrollToTopOnMobile}
            className={({ isActive }) =>
              `main-layout__mobile-bottom-item${
                isActive ? " main-layout__mobile-bottom-item--active" : ""
              }`
            }
          >
            <span
              className={[
                "main-layout__mobile-bottom-icon-wrap",
                supportBadgeCount > 0
                  ? "main-layout__mobile-bottom-icon-wrap--attention"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <ConfirmationNumberRoundedIcon />
            </span>
            <span>پشتیبانی</span>
          </NavLink>
          <NavLink
            to="/profile"
            onClick={scrollToTopOnMobile}
            className={({ isActive }) =>
              `main-layout__mobile-bottom-item${
                isActive ? " main-layout__mobile-bottom-item--active" : ""
              }`
            }
          >
            {authUser && avatarUrl ? (
              <Avatar
                className="main-layout__mobile-bottom-avatar"
                src={avatarUrl}
                alt={userDisplayName}
              />
            ) : (
              <PersonRoundedIcon />
            )}
            <span>پروفایل</span>
          </NavLink>
          <NavLink
            to="/more"
            onClick={scrollToTopOnMobile}
            className={({ isActive }) =>
              `main-layout__mobile-bottom-item${
                isActive ? " main-layout__mobile-bottom-item--active" : ""
              }`
            }
          >
            <MoreHorizRoundedIcon />
            <span>سایر</span>
          </NavLink>
        </nav>
      ) : null}
    </Box>
  );
}
