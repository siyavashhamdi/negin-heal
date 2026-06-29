import { type ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useMobileAppLayout } from "../../hooks/useMobileAppLayout";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import { peekPostLoginRedirect } from "../../routing/post-login-redirect";
import Login from "./Login";

const LoginRoute = (): ReactElement => {
  const isMobileAppLayout = useMobileAppLayout();
  const location = useLocation();
  const { isAuthenticated, isLoading, isPostLoginRedirectPending } = useAuth();

  if (isMobileAppLayout) {
    return <Navigate to={APP_SHELL_ROUTES.profileLogin} replace state={location.state} />;
  }

  if (isLoading) {
    return <></>;
  }

  if (isAuthenticated) {
    if (isPostLoginRedirectPending || peekPostLoginRedirect()) {
      return <></>;
    }

    return <Navigate to={APP_SHELL_ROUTES.products} replace />;
  }

  return <Login />;
};

export default LoginRoute;
