import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { resolvePageTitleKey } from "../routing/resolvePageTitleKey";
import { useTranslation } from "./useTranslation";

/**
 * Sets `document.title` from the current route, including popup overlay paths.
 */
export const usePageTitle = (): void => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const pageTitle = t(resolvePageTitleKey(location.pathname));
    const brand = t("layout.header.brand.title");
    document.title = `${brand} - ${pageTitle}`;
  }, [location.pathname, t]);
};
