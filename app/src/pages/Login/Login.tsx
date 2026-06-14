import { useCallback, useState, type ReactElement } from "react";
import RequestLoginCode from "./RequestLoginCode";
import { VerifyLoginCodeForm } from "./VerifyLoginCode";
import { SignupForm } from "./SignupForm";
import { type LoginNavState } from "./login-nav-state";

const Login = (): ReactElement => {
  const [step, setStep] = useState<"request" | "verify" | "signup">("request");
  const [verifyIdentity, setVerifyIdentity] = useState<LoginNavState | null>(null);
  const [signupIdentity, setSignupIdentity] = useState<LoginNavState | null>(null);
  const [requestPrefill, setRequestPrefill] = useState<LoginNavState | null>(null);
  const [requestFormKey, setRequestFormKey] = useState(0);

  const handleIdentityResolved = useCallback((identity: LoginNavState) => {
    setVerifyIdentity(identity);
    setSignupIdentity(null);
    setStep("verify");
  }, []);

  const handleSignupRequired = useCallback((identity: LoginNavState) => {
    setSignupIdentity(identity);
    setVerifyIdentity(null);
    setStep("signup");
  }, []);

  const handleEditIdentity = useCallback((identity: LoginNavState) => {
    setRequestPrefill(identity);
    setRequestFormKey((previous) => previous + 1);
    setStep("request");
    setVerifyIdentity(null);
    setSignupIdentity(null);
  }, []);

  if (step === "verify" && verifyIdentity) {
    return <VerifyLoginCodeForm identity={verifyIdentity} onEditIdentity={handleEditIdentity} />;
  }

  if (step === "signup" && signupIdentity) {
    return <SignupForm identity={signupIdentity} onEditIdentity={handleEditIdentity} />;
  }

  return (
    <RequestLoginCode
      key={requestFormKey}
      initialPrefill={requestPrefill}
      onIdentityResolved={handleIdentityResolved}
      onSignupRequired={handleSignupRequired}
    />
  );
};

export default Login;
