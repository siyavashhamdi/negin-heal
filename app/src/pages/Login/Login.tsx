import { useCallback, useState, type ReactElement } from "react";
import RequestLoginCode from "./RequestLoginCode";
import { VerifyLoginCodeForm } from "./VerifyLoginCode";
import { SignupForm } from "./SignupForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { type LoginNavState } from "./login-nav-state";

const Login = (): ReactElement => {
  const [step, setStep] = useState<"request" | "verify" | "signup" | "forgot">("request");
  const [verifyIdentity, setVerifyIdentity] = useState<LoginNavState | null>(null);
  const [signupIdentity, setSignupIdentity] = useState<LoginNavState | null>(null);
  const [forgotIdentity, setForgotIdentity] = useState<LoginNavState | null>(null);
  const [requestPrefill, setRequestPrefill] = useState<LoginNavState | null>(null);
  const [requestFormKey, setRequestFormKey] = useState(0);

  const handleIdentityResolved = useCallback((identity: LoginNavState) => {
    setVerifyIdentity(identity);
    setSignupIdentity(null);
    setForgotIdentity(null);
    setStep("verify");
  }, []);

  const handleSignupRequired = useCallback((identity: LoginNavState) => {
    setSignupIdentity(identity);
    setVerifyIdentity(null);
    setForgotIdentity(null);
    setStep("signup");
  }, []);

  const handleEditIdentity = useCallback((identity: LoginNavState) => {
    setRequestPrefill(identity);
    setRequestFormKey((previous) => previous + 1);
    setStep("request");
    setVerifyIdentity(null);
    setSignupIdentity(null);
    setForgotIdentity(null);
  }, []);

  const handleForgotPassword = useCallback((identity?: LoginNavState | null) => {
    setForgotIdentity(identity ?? null);
    setVerifyIdentity(null);
    setSignupIdentity(null);
    setStep("forgot");
  }, []);

  const handleBackToLogin = useCallback(() => {
    setStep("request");
    setVerifyIdentity(null);
    setSignupIdentity(null);
    setForgotIdentity(null);
  }, []);

  if (step === "verify" && verifyIdentity) {
    return (
      <VerifyLoginCodeForm
        identity={verifyIdentity}
        onEditIdentity={handleEditIdentity}
        onForgotPassword={handleForgotPassword}
      />
    );
  }

  if (step === "signup" && signupIdentity) {
    return <SignupForm identity={signupIdentity} onEditIdentity={handleEditIdentity} />;
  }

  if (step === "forgot") {
    return (
      <ForgotPasswordForm
        initialIdentity={forgotIdentity}
        onBackToLogin={handleBackToLogin}
      />
    );
  }

  return (
    <RequestLoginCode
      key={requestFormKey}
      initialPrefill={requestPrefill}
      onIdentityResolved={handleIdentityResolved}
      onSignupRequired={handleSignupRequired}
      onForgotPassword={handleForgotPassword}
    />
  );
};

export default Login;
