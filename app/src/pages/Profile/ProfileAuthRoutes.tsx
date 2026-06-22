import { type ReactElement } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ForgotPasswordForm } from "../Login/ForgotPasswordForm";
import { ResetPasswordForm } from "../Login/ResetPassword";
import {
  createProfileLoginVerifyState,
  isLoginNavState,
  isProfileLoginVerifyState,
  toLoginNavState,
} from "../Login/login-nav-state";
import RequestLoginCode from "../Login/RequestLoginCode";
import { SignupForm } from "../Login/SignupForm";
import { VerifyLoginCodeForm } from "../Login/VerifyLoginCode";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";

const ProfileLogin = (): ReactElement => {
  const navigate = useNavigate();
  const location = useLocation();
  const verifyState = isProfileLoginVerifyState(location.state) ? location.state : null;
  const prefill =
    verifyState || !isLoginNavState(location.state) ? null : location.state;

  if (verifyState) {
    return (
      <VerifyLoginCodeForm
        embedded
        identity={toLoginNavState(verifyState)}
        onEditIdentity={(identity) =>
          navigate(APP_SHELL_ROUTES.profileLogin, {
            replace: true,
            state: toLoginNavState(identity),
          })
        }
        onForgotPassword={(identity) =>
          navigate(APP_SHELL_ROUTES.profileForgotPassword, {
            state: identity ?? undefined,
          })
        }
      />
    );
  }

  return (
    <RequestLoginCode
      key={prefill?.identity ?? "default"}
      embedded
      initialPrefill={prefill}
      onIdentityResolved={(identity) =>
        navigate(APP_SHELL_ROUTES.profileLogin, {
          state: createProfileLoginVerifyState(identity),
        })
      }
      onSignupRequired={(identity) =>
        navigate(APP_SHELL_ROUTES.profileSignup, { state: identity })
      }
      onForgotPassword={(identity) =>
        navigate(APP_SHELL_ROUTES.profileForgotPassword, {
          state: identity ?? undefined,
        })
      }
    />
  );
};

const ProfileLoginVerifyRedirect = (): ReactElement => {
  const location = useLocation();
  const nextState = isLoginNavState(location.state)
    ? createProfileLoginVerifyState(location.state)
    : undefined;

  return <Navigate to={APP_SHELL_ROUTES.profileLogin} replace state={nextState} />;
};

const ProfileSignup = (): ReactElement => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isLoginNavState(location.state)) {
    return <Navigate to={APP_SHELL_ROUTES.profileLogin} replace />;
  }

  return (
    <SignupForm
      embedded
      identity={location.state}
      onEditIdentity={(identity) =>
        navigate(APP_SHELL_ROUTES.profileLogin, { state: toLoginNavState(identity) })
      }
    />
  );
};

const ProfileForgotPassword = (): ReactElement => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialIdentity = isLoginNavState(location.state) ? location.state : null;

  return (
    <ForgotPasswordForm
      embedded
      initialIdentity={initialIdentity}
      onBackToLogin={() => navigate(APP_SHELL_ROUTES.profileLogin, { replace: true })}
      onPasswordResetRequested={(identity) =>
        navigate(APP_SHELL_ROUTES.profileResetPassword, { state: identity })
      }
    />
  );
};

const ProfileResetPassword = (): ReactElement => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isLoginNavState(location.state)) {
    return <Navigate to={APP_SHELL_ROUTES.profileForgotPassword} replace />;
  }

  return (
    <ResetPasswordForm
      embedded
      identity={location.state}
      onBackToLogin={() => navigate(APP_SHELL_ROUTES.profileLogin, { replace: true })}
    />
  );
};

export const ProfileAuthRoutes = (): ReactElement => (
  <Routes>
    <Route index element={<Navigate to={APP_SHELL_ROUTES.profileLogin} replace />} />
    <Route path="login" element={<ProfileLogin />} />
    <Route path="login/verify" element={<ProfileLoginVerifyRedirect />} />
    <Route path="signup" element={<ProfileSignup />} />
    <Route path="forgot-password" element={<ProfileForgotPassword />} />
    <Route path="reset-password" element={<ProfileResetPassword />} />
    <Route path="*" element={<Navigate to={APP_SHELL_ROUTES.profileLogin} replace />} />
  </Routes>
);
