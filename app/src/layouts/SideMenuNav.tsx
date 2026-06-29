import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { IconButton } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useMemo, type ReactElement } from "react";
import { OverflowTooltip } from "../shared/OverflowTooltip";
import { useAuth } from "../contexts/AuthContext";
import { AppShellNavItemIcon } from "./AppShellNavItemIcon";
import {
  APP_SHELL_NAV_ITEMS,
  filterAppShellNavItems,
  resolveAppShellNavPath,
  type AppShellNavBadgeCounts,
} from "./app-shell-nav-items";
import "./styles/SideMenuNav.scss";
import AppTooltip from "../shared/AppTooltip";
import { warmAppShellNavTarget } from "../lib/app-shell-nav-warm";

export type SideMenuIcon = (typeof APP_SHELL_NAV_ITEMS)[number]["Icon"];

export type SideMenuItemDefinition = (typeof APP_SHELL_NAV_ITEMS)[number];

export const SIDE_MENU_ITEMS = APP_SHELL_NAV_ITEMS;

export interface SideMenuNavProps {
  readonly collapsed: boolean;
  readonly onToggleCollapsed?: () => void;
  readonly showCollapseToggle?: boolean;
  readonly badgeCounts?: AppShellNavBadgeCounts;
  readonly profileAvatar?: { readonly src: string; readonly alt: string } | null;
  readonly profileSubscriptionOnline?: boolean;
}

const DEFAULT_BADGE_COUNTS: AppShellNavBadgeCounts = {
  products: 0,
  payments: 0,
  notifications: 0,
  support: 0,
};

export function SideMenuNav({
  collapsed,
  onToggleCollapsed,
  showCollapseToggle = false,
  badgeCounts = DEFAULT_BADGE_COUNTS,
  profileAvatar = null,
  profileSubscriptionOnline,
}: SideMenuNavProps): ReactElement {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isEndUser = roles.includes("END_USER");
  const navContext = {
    roles,
    isAuthenticated: Boolean(user),
  };
  const navDataContext = useMemo(
    () => ({
      roles,
      isAuthenticated: Boolean(user),
      userId: user?.id ?? null,
      isEndUser,
    }),
    [isEndUser, roles, user]
  );
  const visibleItems = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, navContext);

  return (
    <>
      <div className="side-menu-nav__header">
        <div className="side-menu-nav__title">
          <span>منوی پنل</span>
          <small>دسترسی سریع</small>
        </div>
        <div className="side-menu-nav__header-actions">
          {showCollapseToggle && onToggleCollapsed ? (
            <AppTooltip title={collapsed ? "باز کردن منو" : "جمع کردن منو"}>
              <IconButton
                className="side-menu-nav__toggle"
                aria-label={collapsed ? "باز کردن منو" : "جمع کردن منو"}
                onClick={onToggleCollapsed}
                size="small"
              >
                {collapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
              </IconButton>
            </AppTooltip>
          ) : null}
        </div>
      </div>

      <nav className="side-menu-nav__list" aria-label="منوی اصلی">
        {visibleItems.map((item) => {
          const itemClassName = "side-menu-nav__item";
          const itemPath = resolveAppShellNavPath(item, navContext);

          return (
            <NavLink
              key={item.id}
              to={itemPath}
              end={item.exactPathMatch === true}
              onMouseEnter={() => warmAppShellNavTarget(item, navContext, navDataContext)}
              onTouchStart={() => warmAppShellNavTarget(item, navContext, navDataContext)}
              className={({ isActive }) =>
                `${itemClassName} ${isActive ? "side-menu-nav__item--active" : ""}`
              }
            >
              <AppShellNavItemIcon
                item={item}
                variant="side"
                badgeCounts={badgeCounts}
                profileAvatar={profileAvatar}
                profileSubscriptionOnline={profileSubscriptionOnline}
              />
              <OverflowTooltip className="side-menu-nav__item-label" title={item.title}>
                {item.title}
              </OverflowTooltip>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
