import { useCallback, useState, type ReactElement } from "react";
import RequestLoginCode from "./RequestLoginCode";
import { VerifyLoginCodeForm } from "./VerifyLoginCode";
import { SignupForm } from "./SignupForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { ResetPasswordForm } from "./ResetPassword";
import { type LoginNavState } from "./login-nav-state";

export type LoginProps = {
  readonly embedded?: boolean;
};

const Login = ({ embedded = false }: LoginProps): ReactElement => {
  const [step, setStep] = useState<"request" | "verify" | "signup" | "forgot" | "reset">("request");
  const [verifyIdentity, setVerifyIdentity] = useState<LoginNavState | null>(null);
  const [signupIdentity, setSignupIdentity] = useState<LoginNavState | null>(null);
  const [forgotIdentity, setForgotIdentity] = useState<LoginNavState | null>(null);
  const [resetIdentity, setResetIdentity] = useState<LoginNavState | null>(null);
  const [requestPrefill, setRequestPrefill] = useState<LoginNavState | null>(null);
  const [requestFormKey, setRequestFormKey] = useState(0);

  const handleIdentityResolved = useCallback((identity: LoginNavState) => {
    setVerifyIdentity(identity);
    setSignupIdentity(null);
    setForgotIdentity(null);
    setResetIdentity(null);
    setStep("verify");
  }, []);

  const handleSignupRequired = useCallback((identity: LoginNavState) => {
    setSignupIdentity(identity);
    setVerifyIdentity(null);
    setForgotIdentity(null);
    setResetIdentity(null);
    setStep("signup");
  }, []);

  const handleEditIdentity = useCallback((identity: LoginNavState) => {
    setRequestPrefill(identity);
    setRequestFormKey((previous) => previous + 1);
    setStep("request");
    setVerifyIdentity(null);
    setSignupIdentity(null);
    setForgotIdentity(null);
    setResetIdentity(null);
  }, []);

  const handleForgotPassword = useCallback((identity?: LoginNavState | null) => {
    setForgotIdentity(identity ?? null);
    setVerifyIdentity(null);
    setSignupIdentity(null);
    setResetIdentity(null);
    setStep("forgot");
  }, []);

  const handlePasswordResetRequested = useCallback((identity: LoginNavState) => {
    setResetIdentity(identity);
    setForgotIdentity(null);
    setVerifyIdentity(null);
    setSignupIdentity(null);
    setStep("reset");
  }, []);

  const handleBackToLogin = useCallback(() => {
    setStep("request");
    setVerifyIdentity(null);
    setSignupIdentity(null);
    setForgotIdentity(null);
    setResetIdentity(null);
  }, []);

  if (step === "verify" && verifyIdentity) {
    return (
      <VerifyLoginCodeForm
        embedded={embedded}
        identity={verifyIdentity}
        onEditIdentity={handleEditIdentity}
        onForgotPassword={handleForgotPassword}
      />
    );
  }

  if (step === "signup" && signupIdentity) {
    return (
      <SignupForm
        embedded={embedded}
        identity={signupIdentity}
        onEditIdentity={handleEditIdentity}
      />
    );
  }

  if (step === "forgot") {
    return (
      <ForgotPasswordForm
        embedded={embedded}
        initialIdentity={forgotIdentity}
        onBackToLogin={handleBackToLogin}
        onPasswordResetRequested={handlePasswordResetRequested}
      />
    );
  }

  if (step === "reset" && resetIdentity) {
    return (
      <ResetPasswordForm
        embedded={embedded}
        identity={resetIdentity}
        onBackToLogin={handleBackToLogin}
      />
    );
  }

  return (
    <RequestLoginCode
      key={requestFormKey}
      embedded={embedded}
      initialPrefill={requestPrefill}
      onIdentityResolved={handleIdentityResolved}
      onSignupRequired={handleSignupRequired}
      onForgotPassword={handleForgotPassword}
    />
  );
};

export default Login;
