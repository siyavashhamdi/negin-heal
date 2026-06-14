import { type ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LOCAL_STORAGE_KEYS } from "../constants";

const LOGIN_PATH = "/login";

interface ProtectedRouteProps {
  readonly children: ReactElement;
}

/**
 * Renders children only when an access token exists; otherwise redirects to login with return
 * state.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps): ReactElement => {
  const location = useLocation();
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

  if (!token) {
    return <Navigate to={LOGIN_PATH} state={{ from: location }} replace />;
  }

  return children;
};
