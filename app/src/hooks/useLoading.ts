import { useContext } from "react";
import { LoadingContext, type LoadingContextValue } from "../contexts/loading-context";

/** @throws if used outside `LoadingProvider` */
export const useLoading = (): LoadingContextValue => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider.");
  }
  return context;
};
