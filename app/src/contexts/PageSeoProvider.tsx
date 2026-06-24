import { useCallback, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { PageSeoContext, type PageSeoContextValue } from "./page-seo-context";
import { PageSeoHead } from "../seo/PageSeoHead";
import type { PageSeoOverride } from "../seo/seo.types";

export function PageSeoProvider({ children }: { readonly children: ReactNode }): ReactElement {
  const [override, setOverrideState] = useState<PageSeoOverride | null>(null);
  const setOverride = useCallback((next: PageSeoOverride | null) => {
    setOverrideState(next);
  }, []);

  const value = useMemo<PageSeoContextValue>(
    () => ({
      override,
      setOverride,
    }),
    [override, setOverride]
  );

  return (
    <PageSeoContext.Provider value={value}>
      {children}
      <PageSeoHead />
    </PageSeoContext.Provider>
  );
}
