import { useEffect, useRef, type ReactElement } from "react";
import { useSnackbar } from "../hooks/useSnackbar";
import { getErrors, removeProcessedErrors } from "./apollo-error-queue";

const POLL_INTERVAL_MS = 100;

/**
 * Drains Apollo error queue (filled from the Apollo error link) into snackbars.
 * Mount once inside ApolloProvider + SnackbarProvider.
 */
export const ApolloErrorHandler = (): ReactElement | null => {
  const { showError } = useSnackbar();
  const processedErrorsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const errors = getErrors();
      const newErrors = errors.filter((error) => !processedErrorsRef.current.has(error.timestamp));

      newErrors.forEach((error) => {
        processedErrorsRef.current.add(error.timestamp);
        showError(error.message);
      });

      if (newErrors.length > 0) {
        removeProcessedErrors(new Set(newErrors.map((e) => e.timestamp)));
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [showError]);

  return null;
};
