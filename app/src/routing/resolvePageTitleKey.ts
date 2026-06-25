const STATIC_ROUTE_TITLE_KEYS: Readonly<Record<string, string>> = {
  "/courses": "app.pageTitles.courses",
  "/more": "app.pageTitles.more",
  "/more/about": "app.pageTitles.moreAbout",
  "/more/privacy-policy": "app.pageTitles.morePrivacyPolicy",
  "/more/terms-of-use": "app.pageTitles.moreTermsOfUse",
  "/more/system-settings": "app.pageTitles.moreSystemSettings",
  "/more/global-anouncement": "app.pageTitles.moreGlobalAnouncement",
  "/more/backup": "app.pageTitles.moreBackup",
  "/more/coupons": "app.pageTitles.moreCoupons",
  "/notifications": "app.pageTitles.notifications",
  "/payments": "app.pageTitles.payments",
  "/profile": "app.pageTitles.profile",
  "/profile/login": "app.pageTitles.login",
  "/profile/signup": "app.pageTitles.signup",
  "/profile/forgot-password": "app.pageTitles.forgotPassword",
  "/profile/reset-password": "app.pageTitles.resetPassword",
  "/support": "app.pageTitles.support",
  "/support/faq": "app.pageTitles.supportFaq",
  "/support/tickets": "app.pageTitles.supportTickets",
  "/users": "app.pageTitles.usersManagement",
  "/landing": "app.pageTitles.landing",
  "/login": "app.pageTitles.login",
  "/reset-password": "app.pageTitles.resetPassword",
  "/activate": "app.pageTitles.activateAccount",
  "/payment/zarinpal/callback": "app.pageTitles.paymentCallback",
};

type RouteTitleRule = {
  readonly match: (pathname: string) => boolean;
  readonly key: string;
};

/** Most specific routes first — popup overlays and nested paths before list pages. */
const ROUTE_TITLE_RULES: readonly RouteTitleRule[] = [
  { match: (p) => /\/compress-media$/.test(p), key: "app.pageTitles.mediaCompress" },
  { match: (p) => /\/max$/.test(p), key: "app.pageTitles.contentViewer" },
  { match: (p) => /\/purchase$/.test(p), key: "app.pageTitles.coursePurchase" },
  { match: (p) => p === "/courses/new", key: "app.pageTitles.courseCreate" },
  {
    match: (p) => /^\/courses\/edit\/[^/]+$/.test(p),
    key: "app.pageTitles.courseEdit",
  },
  {
    match: (p) => /^\/courses\/delete\/[^/]+$/.test(p),
    key: "table.dataGrid.deleteDialog.title",
  },
  {
    match: (p) => /^\/courses\/[^/]+$/.test(p),
    key: "app.pageTitles.courseDetail",
  },
  { match: (p) => p === "/support/tickets/new", key: "pages.support.create.title" },
  {
    match: (p) => /^\/support\/tickets\/[^/]+$/.test(p),
    key: "pages.support.view.title",
  },
  { match: (p) => p === "/payments/new", key: "app.pageTitles.paymentManualCreate" },
  {
    match: (p) => /^\/payments\/[^/]+\/confirm$/.test(p),
    key: "app.pageTitles.paymentStatusChange",
  },
  {
    match: (p) => /^\/payments\/[^/]+$/.test(p),
    key: "app.pageTitles.paymentReview",
  },
  { match: (p) => p === "/more/coupons/new", key: "pages.coupons.create.title" },
  {
    match: (p) => /^\/more\/coupons\/edit\/[^/]+$/.test(p),
    key: "pages.coupons.edit.title",
  },
  {
    match: (p) => /^\/more\/coupons\/delete\/[^/]+$/.test(p),
    key: "table.dataGrid.deleteDialog.title",
  },
  {
    match: (p) => /^\/more\/system-settings\/edit\/[^/]+$/.test(p),
    key: "app.pageTitles.systemSettingEdit",
  },
  { match: (p) => p === "/users/new", key: "pages.usersManagement.create.title" },
  {
    match: (p) => /^\/users\/edit\/[^/]+\/confirm$/.test(p),
    key: "pages.usersManagement.edit.confirm.title",
  },
  {
    match: (p) => /^\/users\/edit\/[^/]+$/.test(p),
    key: "pages.usersManagement.edit.title",
  },
  { match: (p) => p === "/profile/edit", key: "app.pageTitles.profileEdit" },
  { match: (p) => p === "/profile/password", key: "app.pageTitles.profilePassword" },
];

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "/";
}

export function resolvePageTitleKey(pathname: string): string {
  const normalizedPath = normalizePathname(pathname);

  for (const rule of ROUTE_TITLE_RULES) {
    if (rule.match(normalizedPath)) {
      return rule.key;
    }
  }

  return STATIC_ROUTE_TITLE_KEYS[normalizedPath] ?? "app.pageTitles.genericPage";
}
