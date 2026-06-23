import { type ReactElement } from "react";
import { usePageSeo } from "../hooks/usePageSeo";

/** Applies head tags after route children mount so page-level SEO overrides win. */
export function PageSeoHead(): ReactElement | null {
  usePageSeo();
  return null;
}
