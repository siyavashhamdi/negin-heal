import { useContext } from "react";
import { SnackbarContext, type SnackbarContextValue } from "../contexts/snackbar-context";

/** @throws if used outside `SnackbarProvider` */
export const useSnackbar = (): SnackbarContextValue => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error("useSnackbar must be used within a SnackbarProvider.");
  }
  return context;
};
