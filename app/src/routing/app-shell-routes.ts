export const APP_SHELL_ROUTES = {
  login: "/login",
  resetPassword: "/reset-password",
  activateAccount: "/activate",
  courses: "/courses",
  courseDetail: "/courses/:courseId",
  more: "/more",
  moreAbout: "/more/about",
  morePrivacyPolicy: "/more/privacy-policy",
  moreTermsOfUse: "/more/terms-of-use",
  moreSystemSettings: "/more/system-settings",
  moreGlobalAnouncement: "/more/global-anouncement",
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
