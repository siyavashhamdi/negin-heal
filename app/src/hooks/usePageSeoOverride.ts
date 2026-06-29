import { useLayoutEffect } from "react";
import { usePageSeoContext } from "../contexts/page-seo-context";
import type { PageSeoOverride } from "../seo/seo.types";

/**
 * Lets a page override route-default SEO (e.g. product title, cover image, structured data).
 */
export const usePageSeoOverride = (override: PageSeoOverride | null | undefined): void => {
  const { setOverride } = usePageSeoContext();

  useLayoutEffect(() => {
    setOverride(override ?? null);
    return () => setOverride(null);
  }, [override, setOverride]);
};
