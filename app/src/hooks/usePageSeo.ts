import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { API_CONFIG } from "../config";
import { APP_SHELL_ROUTES } from "../routing/app-shell-routes";
import { usePageSeoContext } from "../contexts/page-seo-context";
import { applyPageSeo } from "../seo/document-head.util";
import { buildPageSeo, resolveAppBaseUrl } from "../seo/build-page-seo";
import { useTranslation } from "./useTranslation";

/**
 * Applies route-aware SEO metadata (title, description, Open Graph, Twitter Card, JSON-LD).
 */
export const usePageSeo = (): void => {
  const location = useLocation();
  const { t } = useTranslation();
  const { override } = usePageSeoContext();

  useLayoutEffect(() => {
    const appUrl = resolveAppBaseUrl(API_CONFIG.APP_URL);
    const underConstruction =
      API_CONFIG.UNDER_CONSTRUCTION && location.pathname === APP_SHELL_ROUTES.home;

    const seo = buildPageSeo({
      t,
      pathname: location.pathname,
      appUrl,
      override,
      underConstruction,
    });

    applyPageSeo(seo);
  }, [location.pathname, override, t]);
};
