import { useCallback, useMemo, useRef, useState, type ReactElement } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  ArrowForward as ArrowForwardIcon,
  Lock as LockIcon,
  Sms as SmsIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import { useSnackbar } from "../../hooks/useSnackbar";
import { toPersianDigits, toWesternDigits } from "../../utilities/persian-digits.util";
import { useLogin } from "../../hooks/useLogin";
import { API_CONFIG } from "../../config/env";
import LoginShell from "./LoginShell";
import { LoginCaptchaField } from "./components/LoginCaptchaField";
import { type LoginNavState } from "./login-nav-state";
import formStyles from "./styles/LoginFormShared.module.scss";
import verifyStyles from "./styles/VerifyLoginCode.module.scss";

const VERIFICATION_CODE_LENGTH = 6;
const VERIFICATION_CODE_REGEX = /^\d{4,6}$/;
const EMPTY_DIGITS: readonly string[] = Array.from(
  { length: VERIFICATION_CODE_LENGTH },
  () => "",
);

type SignupCredentialMode = "password" | "otp";

interface SignupFormProps {
  readonly identity: LoginNavState;
  readonly onEditIdentity: (identity: LoginNavState) => void;
}

export const SignupForm = ({ identity, onEditIdentity }: SignupFormProps): ReactElement => {
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const { signup, requestSignupCode, loading } = useLogin();

  const supportsOtp = identity.identityKind === "mobile";
  const [mode, setMode] = useState<SignupCredentialMode>("password");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState(identity.identityKind === "username" ? identity.identity : "");
  const [email, setEmail] = useState(identity.identityKind === "email" ? identity.identity : "");
  const [mobile, setMobile] = useState(identity.identityKind === "mobile" ? identity.identity : "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const [signupCodeRequested, setSignupCodeRequested] = useState(false);
  const [verificationDigits, setVerificationDigits] = useState<string[]>(() => [...EMPTY_DIGITS]);
  const [hasError, setHasError] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const verificationCode = verificationDigits.join("");
  const captchaEnabled = API_CONFIG.CAPTCHA_ENABLED;
  const hasAnyIdentity = useMemo(
    () => Boolean(username.trim() || email.trim() || mobile.trim()),
    [email, mobile, username],
  );
  const passwordReady = password.trim().length > 0 && confirmPassword.trim().length > 0;
  const otpReady = signupCodeRequested && VERIFICATION_CODE_REGEX.test(verificationCode.trim());
  const formReady =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    hasAnyIdentity &&
    (mode === "password" ? passwordReady : otpReady) &&
    (!captchaEnabled || captchaValid);

  const updateDigits = (updater: (digits: string[]) => string[]): void => {
    setVerificationDigits((previous) => updater([...previous]));
  };

  const focusDigit = (index: number): void => {
    queueMicrotask(() => {
      inputRefs.current[index]?.focus();
    });
  };

  const handleDigitChange = (index: number, rawValue: string): void => {
    setHasError(false);
    const sanitized = toWesternDigits(rawValue).replace(/\D/g, "");

    if (!sanitized) {
      updateDigits((digits) => {
        digits[index] = "";
        return digits;
      });
      return;
    }

    updateDigits((digits) => {
      let cursor = index;
      for (const digit of sanitized) {
        if (cursor >= VERIFICATION_CODE_LENGTH) {
          break;
        }
        digits[cursor] = digit;
        cursor += 1;
      }
      return digits;
    });

    const nextIndex = Math.min(index + sanitized.length, VERIFICATION_CODE_LENGTH - 1);
    focusDigit(nextIndex);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Backspace") {
      event.preventDefault();
      let previousIndexToFocus: number | null = null;
      updateDigits((digits) => {
        if (digits[index]) {
          digits[index] = "";
          return digits;
        }
        if (index > 0) {
          digits[index - 1] = "";
          previousIndexToFocus = index - 1;
        }
        return digits;
      });
      if (previousIndexToFocus !== null) {
        focusDigit(previousIndexToFocus);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0 && !event.shiftKey) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < VERIFICATION_CODE_LENGTH - 1 && !event.shiftKey) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>): void => {
    event.preventDefault();
    handleDigitChange(index, event.clipboardData.getData("text"));
  };

  const handleRequestSignupCode = async (): Promise<void> => {
    if (!mobile.trim()) {
      setHasError(true);
      showError(t("auth.login.errors.mobileRequiredForOtpSignup"));
      return;
    }

    const sent = await requestSignupCode(mobile);
    if (sent) {
      setSignupCodeRequested(true);
      setVerificationDigits([...EMPTY_DIGITS]);
      setHasError(false);
      focusDigit(0);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setHasError(true);
      showError(t("auth.login.errors.signupNameRequired"));
      return;
    }

    if (!hasAnyIdentity) {
      setHasError(true);
      showError(t("auth.login.errors.signupIdentityRequired"));
      return;
    }

    if (mode === "password") {
      if (!password.trim()) {
        setHasError(true);
        showError(t("auth.login.errors.passwordRequired"));
        return;
      }

      if (password !== confirmPassword) {
        setHasError(true);
        showError(t("auth.login.errors.passwordMismatch"));
        return;
      }
    } else {
      if (!mobile.trim()) {
        setHasError(true);
        showError(t("auth.login.errors.mobileRequiredForOtpSignup"));
        return;
      }

      if (!signupCodeRequested) {
        setHasError(true);
        showError(t("auth.login.errors.requestCodeFirst"));
        return;
      }

      if (!VERIFICATION_CODE_REGEX.test(verificationCode.trim())) {
        setHasError(true);
        showError(t("auth.login.errors.invalidVerificationCode"));
        return;
      }
    }

    if (captchaEnabled && !captchaValid) {
      setHasError(true);
      showError(t("auth.login.errors.captchaRequired"));
      return;
    }

    setHasError(false);
    const success = await signup({
      username: username.trim() || undefined,
      email: email.trim() || undefined,
      mobile: mobile.trim() || undefined,
      profile: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
      password: mode === "password" ? password : undefined,
      signupCode: mode === "otp" ? verificationCode.trim() : undefined,
      captchaId: captchaEnabled ? captchaId : undefined,
      captchaValue: captchaEnabled ? captchaValue : undefined,
      rememberMe,
    });

    if (!success && captchaEnabled) {
      setCaptchaId("");
      setCaptchaValue("");
      setCaptchaValid(false);
      setCaptchaVersion((previous) => previous + 1);
    }
  };

  const handleCaptchaChange = useCallback(
    ({
      captchaId: nextCaptchaId,
      value,
      isValid,
    }: {
      captchaId: string;
      value: string;
      isValid: boolean;
    }): void => {
      setCaptchaId(nextCaptchaId);
      setCaptchaValue(value);
      setCaptchaValid(isValid);
    },
    [],
  );

  return (
    <LoginShell subtitle={t("auth.login.signupSubtitle")}>
      <Box className={verifyStyles.credentialHeader}>
        <Typography component="p" className={verifyStyles.identityValue}>
          {identity.identityKind === "mobile" ? toPersianDigits(identity.identity) : identity.identity}
        </Typography>
        <Button
          type="button"
          variant="text"
          size="small"
          onClick={() => onEditIdentity(identity)}
          className={verifyStyles.backToIdentityButton}
          startIcon={<ArrowForwardIcon fontSize="small" aria-hidden />}
        >
          {t("auth.login.backToIdentity")}
        </Button>
      </Box>

      {supportsOtp ? (
        <ToggleButtonGroup
          exclusive
          value={mode}
          onChange={(_event, nextMode: SignupCredentialMode | null) => {
            if (!nextMode) {
              return;
            }
            setMode(nextMode);
            setHasError(false);
          }}
          className={verifyStyles.methodSwitcher}
          aria-label={t("auth.login.methodSwitcherAria")}
        >
          <ToggleButton value="password" className={verifyStyles.methodButton}>
            <LockIcon fontSize="small" />
            {t("auth.login.passwordMethod")}
          </ToggleButton>
          <ToggleButton value="otp" className={verifyStyles.methodButton}>
            <SmsIcon fontSize="small" />
            {t("auth.login.otpMethod")}
          </ToggleButton>
        </ToggleButtonGroup>
      ) : null}

      <form onSubmit={handleSubmit} className={formStyles.loginForm}>
        <Typography component="p" className={formStyles.formLead}>
          {t("auth.login.signupLead")}
        </Typography>

        <TextField
          fullWidth
          label={t("auth.login.firstNameFieldTitle")}
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          className={formStyles.textField}
          disabled={loading}
          error={hasError && !firstName.trim()}
        />

        <TextField
          fullWidth
          label={t("auth.login.lastNameFieldTitle")}
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          className={formStyles.textField}
          disabled={loading}
          error={hasError && !lastName.trim()}
        />

        <TextField
          fullWidth
          label={t("auth.login.usernameOptionalFieldTitle")}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className={formStyles.textField}
          disabled={loading}
        />

        <TextField
          fullWidth
          label={t("auth.login.emailOptionalFieldTitle")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={formStyles.textField}
          disabled={loading}
        />

        <TextField
          fullWidth
          label={t("auth.login.mobileOptionalFieldTitle")}
          value={mobile}
          onChange={(event) => setMobile(event.target.value)}
          className={formStyles.textField}
          disabled={loading}
        />

        {mode === "password" ? (
          <>
            <TextField
              fullWidth
              label={t("auth.login.passwordFieldTitle")}
              placeholder={t("auth.login.passwordPlaceholder")}
              variant="outlined"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={formStyles.textField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon className={formStyles.inputIcon} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t("auth.login.togglePasswordVisibility")}
                      onClick={() => setShowPassword((previous) => !previous)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              autoComplete="new-password"
              disabled={loading}
              error={hasError && !password.trim()}
            />

            <TextField
              fullWidth
              label={t("auth.login.confirmPasswordFieldTitle")}
              variant="outlined"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={formStyles.textField}
              autoComplete="new-password"
              disabled={loading}
              error={hasError && Boolean(confirmPassword) && password !== confirmPassword}
            />
          </>
        ) : (
          <Box className={verifyStyles.verificationCodeContainer}>
            <Button
              type="button"
              variant="outlined"
              onClick={handleRequestSignupCode}
              disabled={loading}
              className={verifyStyles.sendCodeButton}
            >
              {loading
                ? t("auth.login.sendingCode")
                : signupCodeRequested
                  ? t("auth.login.resendVerificationCode")
                  : t("auth.login.sendVerificationCode")}
            </Button>

            <Box className={verifyStyles.verificationCodeInputs}>
              {verificationDigits.map((digit, index) => (
                <TextField
                  key={`signup-verification-digit-${index}`}
                  value={digit}
                  onChange={(event) => handleDigitChange(index, event.target.value)}
                  onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) =>
                    handleKeyDown(index, event)
                  }
                  onPaste={(event: React.ClipboardEvent<HTMLInputElement>) =>
                    handlePaste(index, event)
                  }
                  inputRef={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  variant="outlined"
                  className={verifyStyles.verificationCodeInput}
                  autoComplete="one-time-code"
                  disabled={loading || !signupCodeRequested}
                  error={hasError}
                  inputProps={{
                    maxLength: 1,
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    spellCheck: false,
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {captchaEnabled ? (
          <LoginCaptchaField
            key={`signup-captcha-${captchaVersion}`}
            disabled={loading}
            error={hasError}
            onCaptchaChange={handleCaptchaChange}
          />
        ) : null}

        <Box className={verifyStyles.rememberMeContainer}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                color="primary"
              />
            }
            label={t("auth.login.rememberMe")}
            labelPlacement="end"
            className={verifyStyles.rememberMeLabel}
          />
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          className={formStyles.loginButton}
          disabled={loading || !formReady}
          startIcon={
            loading ? (
              <CircularProgress className={formStyles.loginButtonSpinner} color="inherit" />
            ) : null
          }
        >
          {loading ? t("auth.login.creatingAccount") : t("auth.login.signUp")}
        </Button>
      </form>
    </LoginShell>
  );
};
