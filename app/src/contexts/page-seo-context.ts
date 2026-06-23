import { createContext, useContext } from "react";
import type { PageSeoOverride } from "../seo/seo.types";

export type PageSeoContextValue = {
  readonly override: PageSeoOverride | null;
  readonly setOverride: (override: PageSeoOverride | null) => void;
};

export const PageSeoContext = createContext<PageSeoContextValue | null>(null);

export function usePageSeoContext(): PageSeoContextValue {
  const context = useContext(PageSeoContext);
  if (!context) {
    throw new Error("usePageSeoContext must be used within PageSeoProvider");
  }
  return context;
}
