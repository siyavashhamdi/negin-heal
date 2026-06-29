import { Avatar, Badge } from "@mui/material";
import type { ReactElement } from "react";
import {
  resolveAppShellNavBadgeCount,
  type AppShellNavBadgeCounts,
  type AppShellNavItemDefinition,
} from "./app-shell-nav-items";
import "./styles/AppShellNavItemIcon.scss";

type AppShellNavItemIconProps = {
  readonly item: AppShellNavItemDefinition;
  readonly variant: "side" | "bottom";
  readonly badgeCounts: AppShellNavBadgeCounts;
  readonly profileAvatar?: { readonly src: string; readonly alt: string } | null;
  /** When set, profile icon shows a green/gray subscription status dot. */
  readonly profileSubscriptionOnline?: boolean;
};

const BADGE_COLORS = {
  products: "primary",
  payments: "warning",
  notifications: "error",
} as const;

export function AppShellNavItemIcon({
  item,
  variant,
  badgeCounts,
  profileAvatar,
  profileSubscriptionOnline,
}: AppShellNavItemIconProps): ReactElement {
  const ItemIcon = item.Icon;
  const badgeCount = resolveAppShellNavBadgeCount(item, badgeCounts);

  if (item.id === "profile") {
    const profileIcon = profileAvatar ? (
      <Avatar
        className={
          variant === "bottom" ? "main-layout__mobile-bottom-avatar" : "side-menu-nav__item-avatar"
        }
        src={profileAvatar.src}
        alt={profileAvatar.alt}
      />
    ) : (
      <ItemIcon className={variant === "bottom" ? undefined : "side-menu-nav__item-icon"} />
    );

    if (profileSubscriptionOnline === undefined) {
      return profileIcon;
    }

    return (
      <span className="app-shell-nav__profile-status-wrap">
        {profileIcon}
        <span
          className={`app-shell-nav__profile-status-dot app-shell-nav__profile-status-dot--${
            profileSubscriptionOnline ? "online" : "offline"
          }`}
          aria-hidden
        />
      </span>
    );
  }

  const icon = (
    <ItemIcon className={variant === "bottom" ? undefined : "side-menu-nav__item-icon"} />
  );

  if (item.badge === "support" && badgeCount > 0) {
    return (
      <span
        className={[
          variant === "bottom"
            ? "main-layout__mobile-bottom-icon-wrap"
            : "side-menu-nav__item-icon-wrap",
          variant === "bottom"
            ? "main-layout__mobile-bottom-icon-wrap--attention"
            : "side-menu-nav__item-icon-wrap--attention",
        ].join(" ")}
      >
        {icon}
      </span>
    );
  }

  if (!item.badge || badgeCount <= 0) {
    return icon;
  }

  const badgeColor = BADGE_COLORS[item.badge as keyof typeof BADGE_COLORS] ?? "default";

  return (
    <Badge
      badgeContent={badgeCount}
      color={badgeColor}
      max={999}
      className={
        variant === "bottom"
          ? `main-layout__mobile-bottom-badge${
              item.badge === "payments" ? " main-layout__mobile-bottom-badge--payments" : ""
            }`
          : `side-menu-nav__item-badge${
              item.badge === "payments" ? " side-menu-nav__item-badge--payments" : ""
            }`
      }
    >
      {icon}
    </Badge>
  );
}
