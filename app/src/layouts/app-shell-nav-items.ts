import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import type { ComponentType } from "react";
import { APP_SHELL_ROUTES } from "../routing/app-shell-routes";

export type AppShellNavIcon = ComponentType<{ className?: string }>;

export type AppShellNavBadgeKind = "courses" | "payments" | "notifications" | "support";

export type AppShellNavItemId =
  | "courses"
  | "payments"
  | "notifications"
  | "support"
  | "profile"
  | "more";

export type AppShellNavItemDefinition = {
  readonly id: AppShellNavItemId;
  readonly title: string;
  readonly path: string;
  readonly Icon: AppShellNavIcon;
  readonly requiredRoles?: readonly string[];
  readonly requiresAuth?: boolean;
  readonly badge?: AppShellNavBadgeKind;
  readonly supportTicketsForSuperAdmin?: boolean;
};

export const APP_SHELL_NAV_ITEMS: readonly AppShellNavItemDefinition[] = [
  {
    id: "courses",
    title: "دوره‌ها",
    path: APP_SHELL_ROUTES.courses,
    Icon: MenuBookRoundedIcon,
    badge: "courses",
  },
  {
    id: "payments",
    title: "پرداخت‌ها",
    path: APP_SHELL_ROUTES.payments,
    Icon: AccountBalanceWalletRoundedIcon,
    requiredRoles: ["SUPER_ADMIN"],
    badge: "payments",
  },
  {
    id: "notifications",
    title: "اعلان‌ها",
    path: APP_SHELL_ROUTES.notifications,
    Icon: NotificationsNoneRoundedIcon,
    requiresAuth: true,
    badge: "notifications",
  },
  {
    id: "support",
    title: "پشتیبانی",
    path: APP_SHELL_ROUTES.support,
    Icon: ConfirmationNumberRoundedIcon,
    supportTicketsForSuperAdmin: true,
    badge: "support",
  },
  {
    id: "profile",
    title: "پروفایل",
    path: APP_SHELL_ROUTES.profile,
    Icon: PersonRoundedIcon,
  },
  {
    id: "more",
    title: "سایر",
    path: APP_SHELL_ROUTES.more,
    Icon: MoreHorizRoundedIcon,
  },
];

export type AppShellNavContext = {
  readonly roles: readonly string[];
  readonly isAuthenticated: boolean;
};

export type AppShellNavBadgeCounts = {
  readonly courses: number;
  readonly payments: number;
  readonly notifications: number;
  readonly support: number;
};

export function filterAppShellNavItems(
  items: readonly AppShellNavItemDefinition[],
  context: AppShellNavContext,
): readonly AppShellNavItemDefinition[] {
  return items.filter((item) => {
    if (item.requiresAuth && !context.isAuthenticated) {
      return false;
    }

    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true;
    }

    return item.requiredRoles.some((role) => context.roles.includes(role));
  });
}

export function resolveAppShellNavPath(
  item: AppShellNavItemDefinition,
  context: AppShellNavContext,
): string {
  if (item.supportTicketsForSuperAdmin && context.roles.includes("SUPER_ADMIN")) {
    return APP_SHELL_ROUTES.supportTickets;
  }

  return item.path;
}

export function resolveAppShellNavBadgeCount(
  item: AppShellNavItemDefinition,
  counts: AppShellNavBadgeCounts,
): number {
  if (!item.badge) {
    return 0;
  }

  return counts[item.badge] ?? 0;
}
