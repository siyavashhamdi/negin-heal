import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "./useTranslation";

const STATIC_ROUTE_TITLE_KEYS: Readonly<Record<string, string>> = {
  "/dashboard": "app.pageTitles.dashboard",
  "/courses": "app.pageTitles.courses",
  "/more": "app.pageTitles.more",
  "/more/about": "app.pageTitles.moreAbout",
  "/more/privacy-policy": "app.pageTitles.morePrivacyPolicy",
  "/more/terms-of-use": "app.pageTitles.moreTermsOfUse",
  "/more/system-settings": "app.pageTitles.moreSystemSettings",
  "/more/payment-coupons": "app.pageTitles.morePaymentCoupons",
  "/notifications": "app.pageTitles.notifications",
  "/payments": "app.pageTitles.payments",
  "/profile": "app.pageTitles.profile",
  "/support": "app.pageTitles.support",
  "/support/faq": "app.pageTitles.supportFaq",
  "/support/tickets": "app.pageTitles.supportTickets",
  "/users": "app.pageTitles.usersManagement",
  "/users-management": "app.pageTitles.usersManagement",
  "/login": "app.pageTitles.login",
};

const staticTitleKeyForPath = (pathname: string): string =>
  STATIC_ROUTE_TITLE_KEYS[pathname] ?? "app.pageTitles.genericPage";

/**
 * Sets `document.title` from the current route.
 */
export const usePageTitle = (): void => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const pageTitle = t(staticTitleKeyForPath(location.pathname));
    const brand = t("layout.header.brand.title");
    document.title = `${brand} - ${pageTitle}`;
  }, [location.pathname, t]);
};
