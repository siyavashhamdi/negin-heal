import { createContext, type ReactNode } from "react";
import type { AlertColor } from "@mui/material";

/**
 * Snackbar severity types
 */
export type SnackbarSeverity = AlertColor;

export type SnackbarMessageContent = string | ReactNode;

/**
 * Snackbar context value
 */
export interface SnackbarContextValue {
  showSnackbar: (
    message: SnackbarMessageContent,
    severity?: SnackbarSeverity,
    duration?: number
  ) => void;
  showSuccess: (message: SnackbarMessageContent, duration?: number) => void;
  showError: (message: SnackbarMessageContent, duration?: number) => void;
  showWarning: (message: SnackbarMessageContent, duration?: number) => void;
  showInfo: (message: SnackbarMessageContent, duration?: number) => void;
  updateUploadProgress: (percent: number) => void;
  hideUploadProgress: () => void;
}

/**
 * Snackbar Context
 */
export const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);
