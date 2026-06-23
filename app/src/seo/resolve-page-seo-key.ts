const STATIC_ROUTE_SEO_KEYS: Readonly<Record<string, string>> = {
  "/courses": "courses",
  "/more": "more",
  "/more/about": "moreAbout",
  "/more/privacy-policy": "morePrivacyPolicy",
  "/more/terms-of-use": "moreTermsOfUse",
  "/more/system-settings": "moreSystemSettings",
  "/more/global-anouncement": "moreGlobalAnouncement",
  "/more/coupons": "moreCoupons",
  "/notifications": "notifications",
  "/payments": "payments",
  "/profile": "profile",
  "/profile/login": "login",
  "/profile/signup": "signup",
  "/profile/forgot-password": "forgotPassword",
  "/profile/reset-password": "resetPassword",
  "/support": "support",
  "/support/faq": "supportFaq",
  "/support/tickets": "supportTickets",
  "/users": "usersManagement",
  "/login": "login",
  "/reset-password": "resetPassword",
  "/activate": "activateAccount",
  "/payment/zarinpal/callback": "paymentCallback",
  "/": "courses",
};

type RouteSeoRule = {
  readonly match: (pathname: string) => boolean;
  readonly key: string;
};

/** Most specific routes first — mirrors `resolvePageTitleKey` with dedicated SEO page keys. */
const ROUTE_SEO_RULES: readonly RouteSeoRule[] = [
  { match: (p) => /\/max$/.test(p), key: "contentViewer" },
  { match: (p) => /\/purchase$/.test(p), key: "coursePurchase" },
  { match: (p) => p === "/courses/new", key: "courseCreate" },
  { match: (p) => /^\/courses\/edit\/[^/]+$/.test(p), key: "courseEdit" },
  { match: (p) => /^\/courses\/delete\/[^/]+$/.test(p), key: "courseDelete" },
  { match: (p) => /^\/courses\/[^/]+$/.test(p), key: "courseDetail" },
  { match: (p) => p === "/support/tickets/new", key: "supportCreate" },
  { match: (p) => /^\/support\/tickets\/[^/]+$/.test(p), key: "supportView" },
  { match: (p) => p === "/payments/new", key: "paymentManualCreate" },
  { match: (p) => /^\/payments\/[^/]+\/confirm$/.test(p), key: "paymentStatusChange" },
  { match: (p) => /^\/payments\/[^/]+$/.test(p), key: "paymentReview" },
  { match: (p) => p === "/more/coupons/new", key: "couponCreate" },
  { match: (p) => /^\/more\/coupons\/edit\/[^/]+$/.test(p), key: "couponEdit" },
  {
    match: (p) => /^\/more\/coupons\/delete\/[^/]+$/.test(p),
    key: "couponDelete",
  },
  {
    match: (p) => /^\/more\/system-settings\/edit\/[^/]+$/.test(p),
    key: "systemSettingEdit",
  },
  { match: (p) => p === "/users/new", key: "usersCreate" },
  {
    match: (p) => /^\/users\/edit\/[^/]+\/confirm$/.test(p),
    key: "usersEditConfirm",
  },
  { match: (p) => /^\/users\/edit\/[^/]+$/.test(p), key: "usersEdit" },
  { match: (p) => p === "/profile/edit", key: "profileEdit" },
  { match: (p) => p === "/profile/password", key: "profilePassword" },
];

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "/";
}

export function resolvePageSeoKey(pathname: string): string {
  const normalizedPath = normalizePathname(pathname);

  for (const rule of ROUTE_SEO_RULES) {
    if (rule.match(normalizedPath)) {
      return rule.key;
    }
  }

  return STATIC_ROUTE_SEO_KEYS[normalizedPath] ?? "genericPage";
}
