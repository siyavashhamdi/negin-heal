import { createContext } from "react";
import type { AlertColor } from "@mui/material";

/**
 * Snackbar severity types
 */
export type SnackbarSeverity = AlertColor;

/**
 * Snackbar context value
 */
export interface SnackbarContextValue {
  showSnackbar: (message: string, severity?: SnackbarSeverity, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  updateUploadProgress: (percent: number) => void;
  hideUploadProgress: () => void;
}

/**
 * Snackbar Context
 */
export const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);
