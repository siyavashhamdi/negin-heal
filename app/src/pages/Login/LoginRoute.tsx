import { type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useMobileAppLayout } from "../../hooks/useMobileAppLayout";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import Login from "./Login";

const LoginRoute = (): ReactElement => {
  const isMobileAppLayout = useMobileAppLayout();

  if (isMobileAppLayout) {
    return <Navigate to={APP_SHELL_ROUTES.profile} replace />;
  }

  return <Login />;
};

export default LoginRoute;
