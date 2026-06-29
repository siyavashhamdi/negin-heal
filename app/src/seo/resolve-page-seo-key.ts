import {
  PRODUCT_DETAIL_PAGE_ROUTE_REGEX,
  PRODUCTS_ROUTE_PATH,
} from "../routing/product-route-path";

const STATIC_ROUTE_SEO_KEYS: Readonly<Record<string, string>> = {
  [PRODUCTS_ROUTE_PATH]: "products",
  "/more/about": "moreAbout",
  "/more/privacy-policy": "morePrivacyPolicy",
  "/more/terms-of-use": "moreTermsOfUse",
  "/profile/login": "login",
  "/profile/signup": "signup",
  "/profile/forgot-password": "forgotPassword",
  "/profile/reset-password": "resetPassword",
  "/support": "support",
  "/support/faq": "supportFaq",
  "/landing": "landing",
  "/login": "login",
  "/reset-password": "resetPassword",
  "/activate": "activateAccount",
  "/payment/zarinpal/callback": "paymentCallback",
  "/": "products",
};

type RouteSeoRule = {
  readonly match: (pathname: string) => boolean;
  readonly key: string;
};

/** Public routes only — authenticated and super-admin pages fall back to `genericPage`. */
const ROUTE_SEO_RULES: readonly RouteSeoRule[] = [
  {
    match: (p) => PRODUCT_DETAIL_PAGE_ROUTE_REGEX.test(p) && p !== `${PRODUCTS_ROUTE_PATH}/new`,
    key: "productDetail",
  },
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
