import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Popover,
  Tooltip,
} from "@mui/material";
import { useQuery } from "@apollo/client/react";
import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import { Link as RouterLink, NavLink, useLocation } from "react-router-dom";
import Footer from "../components/layout/Footer";
import { useAuth } from "../contexts/AuthContext";
import { useThemeMode } from "../contexts/ThemeContext";
import { COURSE_LIST_QUERY } from "../graphql/queries/courseList.query";
import { USER_COURSE_LIST_QUERY } from "../graphql/queries/userCourseList.query";
import { useMe } from "../hooks/useMe";
import { useTranslation } from "../hooks/useTranslation";
import {
  buildCourseListQueryVariables,
  DEFAULT_COURSE_LIST_FILTERS,
  DEFAULT_COURSE_LIST_SORT,
  type CourseListQuery,
  type CourseListQueryVariables,
} from "../pages/Courses/courses-list.api";
import { SideMenuNav } from "./SideMenuNav";
import "./styles/MainLayout.scss";

const NOTIFICATION_BADGE_COUNT = 3;

const POPOVER_ANCHOR_ORIGIN = { vertical: "bottom", horizontal: "left" } as const;
const POPOVER_TRANSFORM_ORIGIN = { vertical: "top", horizontal: "left" } as const;
const ADMIN_ROLE_BADGE_LABELS = {
  SUPER_ADMIN: "سوپرادمین",
  ADMIN: "ادمین",
} as const;

type TitleDescItem = { readonly id: string; readonly title: string; readonly description: string };
type NotificationSample = TitleDescItem & { readonly timeLabel: string };

type MainLayoutProps = {
  readonly children: ReactNode;
  readonly showSessionTools?: boolean;
  readonly showHeader?: boolean;
  readonly showFooter?: boolean;
};

function asRecordArray<T>(value: unknown): readonly T[] {
  return Array.isArray(value) ? (value as T[]) : [];
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
  const { t } = useTranslation();
  const { mode, toggleTheme } = useThemeMode();
  const { logout, user: authUser } = useAuth();
  const { user, loading: userLoading } = useMe();
  const location = useLocation();

  const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [helpAnchorEl, setHelpAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [userAnchorEl, setUserAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(false);

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
  const isCoursesRoute = location.pathname.startsWith("/courses");
  const isEndUser = authUser?.roles?.includes("END_USER") === true;
  const isSuperAdmin = authUser?.roles?.includes("SUPER_ADMIN") === true;
  const usesPublicCourseList = !authUser || isEndUser;
  const brandTagline = usesPublicCourseList
    ? t("layout.header.brand.publicTagline")
    : t("layout.header.brand.tagline");

  const courseBadgeVariables = useMemo(
    () =>
      buildCourseListQueryVariables(DEFAULT_COURSE_LIST_FILTERS, DEFAULT_COURSE_LIST_SORT, 1, null),
    []
  );

  const { data: courseBadgeData } = useQuery<CourseListQuery, CourseListQueryVariables>(
    usesPublicCourseList ? USER_COURSE_LIST_QUERY : COURSE_LIST_QUERY,
    {
      variables: courseBadgeVariables,
      fetchPolicy: "cache-first",
    }
  );
  const coursesBadgeCount = courseBadgeData?.courseList.pagination.total ?? 0;

  const sampleNotifications = useMemo(
    () =>
      asRecordArray<NotificationSample>(
        t("layout.header.panels.notifications.___samples", { returnObjects: true })
      ),
    [t]
  );

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

  const userRoleTitle = user?.roles?.join("، ") ?? "";
  const adminRoleBadgeLabel = authUser?.roles?.includes("SUPER_ADMIN")
    ? ADMIN_ROLE_BADGE_LABELS.SUPER_ADMIN
    : authUser?.roles?.includes("ADMIN")
      ? ADMIN_ROLE_BADGE_LABELS.ADMIN
      : null;

  const { userDisplayName, userInitial } = useMemo(() => {
    let name: string;
    if (userLoading) {
      name = authUser?.username ?? fallbackUser;
    } else if (!user) {
      name = authUser?.username ?? fallbackUser;
    } else if (user.profile?.firstName && user.profile?.lastName) {
      name = `${user.profile.firstName} ${user.profile.lastName}`;
    } else {
      name = user.profile?.firstName || user.username || fallbackUser;
    }
    const trimmed = name.trim();
    return {
      userDisplayName: name,
      userInitial: trimmed.slice(0, 1) || "?",
    };
  }, [authUser?.username, fallbackUser, user, userLoading]);

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
        isCoursesRoute ? "main-layout--courses-page" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Container maxWidth="lg" className="main-layout__container">
        {showHeader ? (
          <header className="main-layout__header">
            <div className="main-layout__brand">
              <RouterLink
                to="/"
                className="main-layout__brand-link main-layout__brand-link--desktop"
                aria-label={brandHomeAriaLabel}
              >
                <img
                  className="main-layout__brand-logo"
                  src="/logo.svg"
                  alt=""
                  decoding="async"
                  aria-hidden
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
                <img
                  className="main-layout__brand-logo"
                  src="/logo.svg"
                  alt=""
                  decoding="async"
                  aria-hidden
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
                  <Tooltip title={t("layout.header.actions.notifications")}>
                    <Badge
                      className="main-layout__notification-badge"
                      badgeContent={NOTIFICATION_BADGE_COUNT}
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
                  </Tooltip>
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
                            count: NOTIFICATION_BADGE_COUNT,
                          })}
                        </span>
                      </div>
                      <Divider />
                      <div className="main-layout__notifications-list">
                        {sampleNotifications.map((notification) => (
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
                        <Button size="small" variant="contained">
                          {t("layout.header.panels.notifications.viewAll")}
                        </Button>
                        <Button size="small" variant="text">
                          {t("layout.header.panels.notifications.markAllRead")}
                        </Button>
                      </div>
                    </div>
                  </LayoutPopover>

                  <Tooltip title={t("layout.header.actions.settings")}>
                    <IconButton
                      id="main-layout-settings-button"
                      aria-label={t("layout.header.actions.settings")}
                      aria-describedby={settingsPopoverId}
                      className="main-layout__icon-button"
                      onClick={(event) => setSettingsAnchorEl(event.currentTarget)}
                    >
                      <SettingsRoundedIcon />
                    </IconButton>
                  </Tooltip>
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

                  <Tooltip title={t("layout.header.actions.help")}>
                    <IconButton
                      id="main-layout-help-button"
                      aria-label={t("layout.header.actions.help")}
                      aria-describedby={helpPopoverId}
                      className="main-layout__icon-button"
                      onClick={(event) => setHelpAnchorEl(event.currentTarget)}
                    >
                      <HelpOutlineRoundedIcon />
                    </IconButton>
                  </Tooltip>
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

                  <Tooltip title={themeToggleLabel}>
                    <IconButton
                      aria-label={themeToggleLabel}
                      className="main-layout__icon-button"
                      onClick={toggleTheme}
                    >
                      {mode === "light" ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
                    </IconButton>
                  </Tooltip>
                </div>

                <button
                  type="button"
                  className="main-layout__user-chip"
                  id="main-layout-user-button"
                  aria-label={t("layout.header.panels.user.chipAriaLabel")}
                  aria-describedby={userPopoverId}
                  onClick={(event) => setUserAnchorEl(event.currentTarget)}
                >
                  <Avatar className="main-layout__avatar">{userInitial}</Avatar>
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
                      <Avatar className="main-layout__avatar main-layout__avatar--lg">
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
          </header>
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

        {showHeader ? (
          <nav className="main-layout__mobile-bottom-nav" aria-label="منوی موبایل">
            <NavLink
              to="/courses"
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
                className={({ isActive }) =>
                  `main-layout__mobile-bottom-item${
                    isActive ? " main-layout__mobile-bottom-item--active" : ""
                  }`
                }
              >
                <AccountBalanceWalletRoundedIcon />
                <span>پرداخت‌ها</span>
              </NavLink>
            ) : null}
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `main-layout__mobile-bottom-item${
                  isActive ? " main-layout__mobile-bottom-item--active" : ""
                }`
              }
            >
              <Badge
                badgeContent={NOTIFICATION_BADGE_COUNT}
                color="error"
                className="main-layout__mobile-bottom-badge"
              >
                <NotificationsNoneRoundedIcon />
              </Badge>
              <span>اعلان‌ها</span>
            </NavLink>
            <NavLink
              to="/support"
              className={({ isActive }) =>
                `main-layout__mobile-bottom-item${
                  isActive ? " main-layout__mobile-bottom-item--active" : ""
                }`
              }
            >
              <span className="main-layout__mobile-bottom-icon-wrap main-layout__mobile-bottom-icon-wrap--attention">
                <ConfirmationNumberRoundedIcon />
              </span>
              <span>پشتیبانی</span>
            </NavLink>
            {isSuperAdmin ? (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `main-layout__mobile-bottom-item${
                    isActive || location.pathname === "/users-management"
                      ? " main-layout__mobile-bottom-item--active"
                      : ""
                  }`
                }
              >
                <PeopleAltRoundedIcon />
                <span>کاربران</span>
              </NavLink>
            ) : null}
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `main-layout__mobile-bottom-item${
                  isActive ? " main-layout__mobile-bottom-item--active" : ""
                }`
              }
            >
              <PersonRoundedIcon />
              <span>پروفایل</span>
            </NavLink>
            <NavLink
              to="/more"
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

        {showFooter ? <Footer /> : null}
      </Container>
    </Box>
  );
}
