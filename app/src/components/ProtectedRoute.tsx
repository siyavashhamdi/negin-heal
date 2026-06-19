import { type ReactElement } from "react";

interface ProtectedRouteProps {
  readonly children: ReactElement;
}

/**
 * Route wrapper for authenticated pages. Access checks are enforced by the API; the shell stays
 * on the current page instead of redirecting to login.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps): ReactElement => children;
