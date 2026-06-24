import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
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
import { Lock as LockIcon, Sms as SmsIcon, Visibility, VisibilityOff } from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import { useLogin } from "../../hooks/useLogin";
import { useSnackbar } from "../../hooks/useSnackbar";
import { API_CONFIG } from "../../config/env";
import { LOGIN_OTP_ENABLED } from "../../constants/authCredential.constants";
import { LOGIN_CAPTCHA_FAILED_ATTEMPTS_THRESHOLD } from "../../constants";
import { toWesternDigits } from "../../utilities/persian-digits.util";
import LoginShell from "./LoginShell";
import { LoginAdornedTextField } from "./components/LoginAdornedTextField";
import { LoginCaptchaField } from "./components/LoginCaptchaField";
import { LoginCredentialHeader } from "./components/LoginCredentialHeader";
import { type LoginNavState } from "./login-nav-state";
import formStyles from "./styles/LoginFormShared.module.scss";
import verifyStyles from "./styles/VerifyLoginCode.module.scss";

const VERIFICATION_CODE_LENGTH = 6;
const VERIFICATION_CODE_REGEX = /^\d{4,6}$/;
const EMPTY_DIGITS: readonly string[] = Array.from({ length: VERIFICATION_CODE_LENGTH }, () => "");
const CAPTCHA_ERROR_CODES = new Set(["CAPTCHA_REQUIRED", "CAPTCHA_EXPIRED", "CAPTCHA_INVALID"]);

type CredentialMode = "password" | "otp";

interface VerifyLoginCodeFormProps {
  readonly embedded?: boolean;
  readonly identity: LoginNavState;
  readonly onEditIdentity: (identity: LoginNavState) => void;
  readonly onForgotPassword: (identity: LoginNavState) => void;
}

export const VerifyLoginCodeForm = ({
  embedded = false,
  identity,
  onEditIdentity,
  onForgotPassword,
}: VerifyLoginCodeFormProps): ReactElement => {
  const { t } = useTranslation();
  const { requestLoginCode, verifyLoginCode, loginWithPassword, loading } = useLogin();
  const { showError } = useSnackbar();

  const supportsOtp = LOGIN_OTP_ENABLED && identity.identityKind === "mobile";
  const [mode, setMode] = useState<CredentialMode>("password");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const [failedPasswordAttempts, setFailedPasswordAttempts] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const [verificationDigits, setVerificationDigits] = useState<string[]>(() => [...EMPTY_DIGITS]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const verificationCode = verificationDigits.join("");
  const captchaEnabled = API_CONFIG.CAPTCHA_ENABLED;
  const shouldShowCaptcha =
    captchaEnabled && failedPasswordAttempts >= LOGIN_CAPTCHA_FAILED_ATTEMPTS_THRESHOLD;
  const passwordReady = password.trim().length > 0 && (!shouldShowCaptcha || captchaValid);
  const otpReady = codeRequested && VERIFICATION_CODE_REGEX.test(verificationCode.trim());

  useEffect(() => {
    if (mode === "otp") {
      queueMicrotask(() => {
        inputRefs.current[0]?.focus();
      });
    }
  }, [mode, codeRequested]);

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

  const handleRequestCode = async (): Promise<void> => {
    const sent = await requestLoginCode({ identity: identity.identity });
    if (sent) {
      setCodeRequested(true);
      setVerificationDigits([...EMPTY_DIGITS]);
      setHasError(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!password.trim()) {
      setHasError(true);
      showError(t("auth.login.errors.passwordRequired"));
      return;
    }

    if (shouldShowCaptcha && !captchaValid) {
      setHasError(true);
      showError(t("auth.login.errors.captchaRequired"));
      return;
    }

    setHasError(false);
    const loginResult = await loginWithPassword({
      identity: identity.identity,
      password,
      rememberMe,
      captchaId: shouldShowCaptcha ? captchaId : undefined,
      captchaValue: shouldShowCaptcha ? captchaValue : undefined,
    });

    if (loginResult.success) {
      return;
    }

    const nextFailedPasswordAttempts =
      loginResult.errorCode === "INVALID_CREDENTIALS"
        ? failedPasswordAttempts + 1
        : failedPasswordAttempts;
    if (
      loginResult.errorCode === "CAPTCHA_REQUIRED" ||
      nextFailedPasswordAttempts >= LOGIN_CAPTCHA_FAILED_ATTEMPTS_THRESHOLD
    ) {
      setFailedPasswordAttempts(
        Math.max(nextFailedPasswordAttempts, LOGIN_CAPTCHA_FAILED_ATTEMPTS_THRESHOLD)
      );
    } else {
      setFailedPasswordAttempts(nextFailedPasswordAttempts);
    }

    if (
      captchaEnabled &&
      (shouldShowCaptcha || CAPTCHA_ERROR_CODES.has(loginResult.errorCode || ""))
    ) {
      setCaptchaId("");
      setCaptchaValue("");
      setCaptchaValid(false);
      setCaptchaVersion((previous) => previous + 1);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!codeRequested) {
      showError(t("auth.login.errors.requestCodeFirst"));
      return;
    }

    const trimmedCode = verificationCode.trim();

    if (!trimmedCode) {
      setHasError(true);
      showError(t("auth.login.errors.verificationCodeRequired"));
      return;
    }

    if (!VERIFICATION_CODE_REGEX.test(trimmedCode)) {
      setHasError(true);
      showError(t("auth.login.errors.invalidVerificationCode"));
      return;
    }

    setHasError(false);
    await verifyLoginCode({
      identity: identity.identity,
      code: trimmedCode,
      rememberMe,
    });
  };

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextMode: CredentialMode | null
  ): void => {
    if (!nextMode || nextMode === mode) {
      return;
    }
    setMode(nextMode);
    setHasError(false);
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
    []
  );

  return (
    <LoginShell embedded={embedded} subtitle={t("auth.login.credentialSubtitle")}>
      <LoginCredentialHeader identity={identity} onEditIdentity={onEditIdentity} />

      {supportsOtp ? (
        <ToggleButtonGroup
          exclusive
          value={mode}
          onChange={handleModeChange}
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

      {mode === "password" ? (
        <form onSubmit={handlePasswordSubmit} className={formStyles.loginForm}>
          <LoginAdornedTextField
            fullWidth
            label={t("auth.login.passwordFieldTitle")}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setHasError(false);
            }}
            endAdornmentOnlyWhenLabelShrunk
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
            autoComplete="current-password"
            autoFocus
            disabled={loading}
            error={hasError}
          />

          {shouldShowCaptcha ? (
            <LoginCaptchaField
              key={`login-captcha-${captchaVersion}`}
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
            type="button"
            variant="text"
            size="small"
            className={verifyStyles.forgotPasswordButton}
            onClick={() => onForgotPassword(identity)}
          >
            {t("auth.login.forgotPasswordLink")}
          </Button>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            className={formStyles.loginButton}
            disabled={loading || !passwordReady}
            startIcon={
              loading ? (
                <CircularProgress className={formStyles.loginButtonSpinner} color="inherit" />
              ) : null
            }
          >
            {loading ? t("auth.login.signingIn") : t("auth.login.signIn")}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className={formStyles.loginForm}>
          <Typography component="p" className={formStyles.formLead}>
            {t("auth.login.otpStepLead")}
          </Typography>

          <Box className={verifyStyles.verificationCodeContainer}>
            <Box className={verifyStyles.verificationCodeHeader}>
              <Typography
                id="login-otp-section-title"
                component="h2"
                className={verifyStyles.verificationCodeSectionTitle}
              >
                {t("auth.login.verificationCodeSectionTitle")}
              </Typography>
              <Typography className={verifyStyles.verificationCodeSectionHint}>
                {t("auth.login.verificationCodeSectionHintPrefix")}{" "}
                <span className={verifyStyles.verificationHintPhone}>{identity.identity}</span>{" "}
                {t("auth.login.verificationCodeSectionHintSuffix")}
              </Typography>
            </Box>

            <Button
              type="button"
              variant="outlined"
              onClick={handleRequestCode}
              disabled={loading}
              className={verifyStyles.sendCodeButton}
            >
              {loading
                ? t("auth.login.sendingCode")
                : codeRequested
                  ? t("auth.login.resendVerificationCode")
                  : t("auth.login.sendVerificationCode")}
            </Button>

            <Box
              className={verifyStyles.verificationCodeInputs}
              role="group"
              aria-labelledby="login-otp-section-title"
            >
              {verificationDigits.map((digit, index) => (
                <TextField
                  key={`verification-digit-${index}`}
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
                  disabled={loading || !codeRequested}
                  error={hasError}
                  inputProps={{
                    maxLength: 1,
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    spellCheck: false,
                    "aria-label": t("auth.login.verificationCodeDigitAria", {
                      n: index + 1,
                      total: VERIFICATION_CODE_LENGTH,
                    }),
                  }}
                />
              ))}
            </Box>
          </Box>

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
            disabled={loading || !otpReady}
            startIcon={
              loading ? (
                <CircularProgress className={formStyles.loginButtonSpinner} color="inherit" />
              ) : null
            }
          >
            {loading ? t("auth.login.verifying") : t("auth.login.verifyAndSignIn")}
          </Button>
        </form>
      )}
    </LoginShell>
  );
};
