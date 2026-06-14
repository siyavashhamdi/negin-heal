import { createContext } from "react";

/**
 * Loading context value
 */
export interface LoadingContextValue {
  /** Whether any loading operation is in progress */
  isLoading: boolean;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Start a loading operation (returns a function to stop it) */
  startLoading: () => () => void;
}

export const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);
