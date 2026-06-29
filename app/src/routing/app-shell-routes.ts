import {
  PRODUCT_DETAIL_ROUTE_PATTERN,
  PRODUCTS_ROUTE_PATH,
  isProductDetailRoutePathname,
} from "./product-route-path";

export const APP_SHELL_ROUTES = {
  login: "/login",
  resetPassword: "/reset-password",
  activateAccount: "/activate",
  products: PRODUCTS_ROUTE_PATH,
  productDetail: PRODUCT_DETAIL_ROUTE_PATTERN,
  more: "/more",
  moreAbout: "/more/about",
  morePrivacyPolicy: "/more/privacy-policy",
  moreTermsOfUse: "/more/terms-of-use",
  moreSystemSettings: "/more/system-settings",
  moreGlobalAnouncement: "/more/global-anouncement",
  moreBackup: "/more/backup",
  moreCoupons: "/more/coupons",
  notifications: "/notifications",
  payments: "/payments",
  paymentZarinPalCallback: "/payment/zarinpal/callback",
  profile: "/profile",
  profileLogin: "/profile/login",
  profileSignup: "/profile/signup",
  profileForgotPassword: "/profile/forgot-password",
  profileResetPassword: "/profile/reset-password",
  support: "/support",
  supportFaq: "/support/faq",
  supportTickets: "/support/tickets",
  users: "/users",
  landing: "/landing",
  home: "/",
} as const;

export const isProfileAuthRoute = (pathname: string): boolean =>
  pathname === APP_SHELL_ROUTES.profileLogin ||
  pathname === APP_SHELL_ROUTES.profileSignup ||
  pathname === APP_SHELL_ROUTES.profileForgotPassword ||
  pathname === APP_SHELL_ROUTES.profileResetPassword;

function normalizeShellPathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "/";
}

/** Routes rendered outside MainLayout — auth recovery must not navigate away from these. */
export const isStandaloneShellRoute = (pathname: string): boolean => {
  const normalized = normalizeShellPathname(pathname);
  return (
    normalized === APP_SHELL_ROUTES.landing ||
    normalized === APP_SHELL_ROUTES.login ||
    normalized === APP_SHELL_ROUTES.resetPassword ||
    normalized === APP_SHELL_ROUTES.activateAccount
  );
};

export const isLandingRoute = (pathname: string): boolean =>
  normalizeShellPathname(pathname) === APP_SHELL_ROUTES.landing;

export const isProductDetailRoute = (pathname: string): boolean =>
  isProductDetailRoutePathname(normalizeShellPathname(pathname));

export const isNotificationsRoute = (pathname: string): boolean =>
  normalizeShellPathname(pathname) === APP_SHELL_ROUTES.notifications;
