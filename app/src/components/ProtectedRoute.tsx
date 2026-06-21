import { type ReactElement } from "react";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  readonly children: ReactElement;
}

/**
 * Route wrapper for authenticated pages. Waits for auth hydration on refresh so the current URL
 * is preserved. Access checks are enforced by the API; the shell stays on the current page
 * instead of redirecting to login.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps): ReactElement | null => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return children;
};
