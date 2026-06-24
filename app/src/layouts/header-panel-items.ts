import { APP_SHELL_ROUTES } from "../routing/app-shell-routes";

export type HeaderPanelNavItem = {
  readonly id: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly to: string;
  readonly requiredRoles?: readonly string[];
  readonly requiresAuth?: boolean;
};

const hasRequiredRole = (roles: readonly string[], requiredRoles?: readonly string[]): boolean => {
  if (!requiredRoles?.length) {
    return true;
  }

  return requiredRoles.some((role) => roles.includes(role));
};

export const filterHeaderPanelNavItems = (
  items: readonly HeaderPanelNavItem[],
  roles: readonly string[],
  isAuthenticated: boolean
): readonly HeaderPanelNavItem[] =>
  items.filter(
    (item) => (!item.requiresAuth || isAuthenticated) && hasRequiredRole(roles, item.requiredRoles)
  );

export const HEADER_SETTINGS_ITEMS: readonly HeaderPanelNavItem[] = [
  {
    id: "system-settings",
    titleKey: "layout.header.panels.settings.items.systemSettings.title",
    descriptionKey: "layout.header.panels.settings.items.systemSettings.description",
    to: APP_SHELL_ROUTES.moreSystemSettings,
    requiredRoles: ["SUPER_ADMIN"],
  },
  {
    id: "notification-preferences",
    titleKey: "layout.header.panels.settings.popoverNotifications",
    descriptionKey: "layout.header.panels.settings.items.notifications.description",
    to: APP_SHELL_ROUTES.more,
  },
];

export const HEADER_HELP_ITEMS: readonly HeaderPanelNavItem[] = [
  {
    id: "faq",
    titleKey: "layout.header.panels.help.popoverFaqExperts",
    descriptionKey: "layout.header.panels.help.items.faq.description",
    to: APP_SHELL_ROUTES.supportFaq,
  },
  {
    id: "support",
    titleKey: "layout.header.panels.help.popoverSupportContact",
    descriptionKey: "layout.header.panels.help.items.support.description",
    to: APP_SHELL_ROUTES.support,
  },
  {
    id: "tickets",
    titleKey: "layout.header.panels.help.items.tickets.title",
    descriptionKey: "layout.header.panels.help.items.tickets.description",
    to: APP_SHELL_ROUTES.supportTickets,
    requiresAuth: true,
  },
];

export const HEADER_USER_ITEMS: readonly HeaderPanelNavItem[] = [
  {
    id: "profile",
    titleKey: "layout.header.panels.user.popoverEditProfile",
    descriptionKey: "layout.header.panels.user.items.profile.description",
    to: APP_SHELL_ROUTES.profile,
  },
  {
    id: "notifications",
    titleKey: "layout.header.panels.user.popoverPersonalNotifications",
    descriptionKey: "layout.header.panels.user.items.notifications.description",
    to: APP_SHELL_ROUTES.notifications,
  },
  {
    id: "security",
    titleKey: "layout.header.panels.user.popoverSecurity",
    descriptionKey: "layout.header.panels.user.items.security.description",
    to: `${APP_SHELL_ROUTES.profile}/password`,
  },
];

export const resolveHeaderSettingsDestination = (roles: readonly string[]): string =>
  roles.includes("SUPER_ADMIN") ? APP_SHELL_ROUTES.moreSystemSettings : APP_SHELL_ROUTES.more;
