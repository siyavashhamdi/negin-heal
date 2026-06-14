import { useState, useCallback, type ReactElement, type ReactNode } from "react";
import { LoadingContext, type LoadingContextValue } from "./loading-context";

/**
 * Loading Provider Props
 */
interface LoadingProviderProps {
  readonly children: ReactNode;
}

/**
 * Loading Provider Component
 * Manages global loading state for queries and mutations
 */
export const LoadingProvider = ({ children }: LoadingProviderProps): ReactElement => {
  const [loadingCount, setLoadingCount] = useState(0);

  /**
   * Set loading state directly
   */
  const setLoading = useCallback((loading: boolean) => {
    setLoadingCount((prev) => (loading ? prev + 1 : Math.max(0, prev - 1)));
  }, []);

  /**
   * Start a loading operation
   * Returns a function to stop the loading
   */
  const startLoading = useCallback(() => {
    setLoadingCount((prev) => prev + 1);
    return () => {
      setLoadingCount((prev) => Math.max(0, prev - 1));
    };
  }, []);

  const value: LoadingContextValue = {
    isLoading: loadingCount > 0,
    setLoading,
    startLoading,
  };

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};
