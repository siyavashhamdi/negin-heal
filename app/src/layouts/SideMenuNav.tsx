import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import PostAddRoundedIcon from "@mui/icons-material/PostAddRounded";
import { IconButton, Tooltip } from "@mui/material";
import { NavLink } from "react-router-dom";
import type { ComponentType, ReactElement } from "react";
import { OverflowTooltip } from "../shared/OverflowTooltip";
import { useAuth } from "../contexts/AuthContext";
import { APP_SHELL_ROUTES } from "../routing/app-shell-routes";
import "./styles/SideMenuNav.scss";

export type SideMenuIcon = ComponentType<{ className?: string }>;

export type SideMenuItemDefinition = {
  readonly id: string;
  readonly title: string;
  readonly path?: string;
  readonly Icon: SideMenuIcon;
  readonly requiredRoles?: readonly string[];
};

export const SIDE_MENU_ITEMS: readonly SideMenuItemDefinition[] = [
  { id: "dashboard", title: "داشبورد", path: "/dashboard", Icon: DashboardRoundedIcon },
  {
    id: "payments",
    title: "پرداخت‌ها",
    path: "/payments",
    Icon: AccountBalanceWalletRoundedIcon,
    requiredRoles: ["SUPER_ADMIN"],
  },
  { id: "course-definition", title: "تعریف دوره‌ها", Icon: PostAddRoundedIcon },
  { id: "courses", title: "دوره‌ها", path: "/courses", Icon: MenuBookRoundedIcon },
  { id: "notifications", title: "اعلان‌ها", Icon: NotificationsRoundedIcon },
  { id: "support", title: "پشتیبانی", path: "/support", Icon: ConfirmationNumberRoundedIcon },
  { id: "website-settings", title: "تنظیمات وبسایت", Icon: LanguageRoundedIcon },
  { id: "static-pages", title: "صفحات استاتیک", Icon: ArticleRoundedIcon },
];

export interface SideMenuNavProps {
  readonly collapsed: boolean;
  readonly onToggleCollapsed?: () => void;
  readonly showCollapseToggle?: boolean;
}

export function SideMenuNav({
  collapsed,
  onToggleCollapsed,
  showCollapseToggle = false,
}: SideMenuNavProps): ReactElement {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const shouldOpenSupportTickets = roles.includes("SUPER_ADMIN") || roles.includes("ADMIN");
  const visibleItems = SIDE_MENU_ITEMS.filter((item) => {
    if (item.id === "notifications" && !user) {
      return false;
    }

    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true;
    }
    return item.requiredRoles.some((role) => roles.includes(role));
  });

  return (
    <>
      <div className="side-menu-nav__header">
        <div className="side-menu-nav__title">
          <span>منوی پنل</span>
          <small>دسترسی سریع</small>
        </div>
        <div className="side-menu-nav__header-actions">
          {showCollapseToggle && onToggleCollapsed ? (
            <Tooltip title={collapsed ? "باز کردن منو" : "جمع کردن منو"}>
              <IconButton
                className="side-menu-nav__toggle"
                aria-label={collapsed ? "باز کردن منو" : "جمع کردن منو"}
                onClick={onToggleCollapsed}
                size="small"
              >
                {collapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
              </IconButton>
            </Tooltip>
          ) : null}
        </div>
      </div>

      <nav className="side-menu-nav__list" aria-label="منوی اصلی">
        {visibleItems.map((item) => {
          const ItemIcon = item.Icon;
          const itemClassName = "side-menu-nav__item";
          const itemPath =
            item.id === "support" && shouldOpenSupportTickets
              ? APP_SHELL_ROUTES.supportTickets
              : item.path;

          if (itemPath) {
            return (
              <NavLink
                key={item.id}
                to={itemPath}
                className={({ isActive }) =>
                  `${itemClassName} ${isActive ? "side-menu-nav__item--active" : ""}`
                }
              >
                <ItemIcon className="side-menu-nav__item-icon" />
                <OverflowTooltip className="side-menu-nav__item-label" title={item.title}>
                  {item.title}
                </OverflowTooltip>
              </NavLink>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              className={`${itemClassName} side-menu-nav__item--disabled`}
              disabled
            >
              <ItemIcon className="side-menu-nav__item-icon" />
              <OverflowTooltip className="side-menu-nav__item-label" title={item.title}>
                {item.title}
              </OverflowTooltip>
            </button>
          );
        })}
      </nav>
    </>
  );
}
