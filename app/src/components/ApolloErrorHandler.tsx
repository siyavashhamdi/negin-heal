import { useEffect, useRef, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../hooks/useSnackbar";
import {
  getErrors,
  getRedirects,
  removeProcessedErrors,
  removeProcessedRedirects,
} from "./apollo-error-queue";

const POLL_INTERVAL_MS = 100;
const LOGIN_REDIRECT_DELAY_MS = 2000;

/**
 * Drains Apollo error / login-redirect queues (filled from the Apollo error link) into
 * snackbars and navigation. Mount once inside ApolloProvider + SnackbarProvider.
 */
export const ApolloErrorHandler = (): ReactElement | null => {
  const { showError } = useSnackbar();
  const navigate = useNavigate();
  const processedErrorsRef = useRef<Set<number>>(new Set());
  const processedRedirectsRef = useRef<Set<number>>(new Set());
  const redirectTimeoutRef = useRef<number | null>(null);

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

      const redirects = getRedirects();
      const newRedirects = redirects.filter(
        (redirect) => !processedRedirectsRef.current.has(redirect.timestamp)
      );

      newRedirects.forEach((redirect) => {
        processedRedirectsRef.current.add(redirect.timestamp);

        if (redirectTimeoutRef.current !== null) {
          window.clearTimeout(redirectTimeoutRef.current);
        }

        redirectTimeoutRef.current = window.setTimeout(() => {
          navigate("/login");
        }, LOGIN_REDIRECT_DELAY_MS);
      });

      if (newRedirects.length > 0) {
        removeProcessedRedirects(new Set(newRedirects.map((r) => r.timestamp)));
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [navigate, showError]);

  return null;
};
