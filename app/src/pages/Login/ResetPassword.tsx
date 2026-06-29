import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import { useSnackbar } from "../../hooks/useSnackbar";
import { usePasswordReset } from "../../hooks/usePasswordReset";
import { PasswordPolicyChecklist } from "../../shared/auth/PasswordPolicyChecklist";
import { arePasswordRulesPassed } from "../../utils/passwordPolicy.util";
import { toWesternDigits } from "../../utilities/persian-digits.util";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import LoginShell from "./LoginShell";
import { LoginAdornedTextField } from "./components/LoginAdornedTextField";
import { isLoginNavState, type LoginNavState } from "./login-nav-state";
import formStyles from "./styles/LoginFormShared.module.scss";
import verifyStyles from "./styles/VerifyLoginCode.module.scss";

const RESET_CODE_LENGTH = 6;
const RESET_CODE_REGEX = /^\d{6}$/;
const EMPTY_DIGITS: readonly string[] = Array.from({ length: RESET_CODE_LENGTH }, () => "");

interface ResetPasswordFormProps {
  readonly embedded?: boolean;
  readonly identity: LoginNavState;
  readonly onBackToLogin?: () => void;
}

export const ResetPasswordForm = ({
  embedded = false,
  identity,
  onBackToLogin,
}: ResetPasswordFormProps): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showError } = useSnackbar();
  const { resetPassword, resettingPassword } = usePasswordReset();

  const [resetDigits, setResetDigits] = useState<string[]>(() => [...EMPTY_DIGITS]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [completed, setCompleted] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const resetCode = resetDigits.join("");
  const passwordRulesPassed = arePasswordRulesPassed(newPassword);
  const passwordsMatch = confirmPassword.trim().length > 0 && newPassword === confirmPassword;
  const otpReady = RESET_CODE_REGEX.test(resetCode.trim());
  const canSubmit = otpReady && newPassword.trim().length > 0 && confirmPassword.trim().length > 0;

  useEffect(() => {
    queueMicrotask(() => {
      inputRefs.current[0]?.focus();
    });
  }, []);

  const updateDigits = (updater: (digits: string[]) => string[]): void => {
    setResetDigits((previous) => updater([...previous]));
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
        if (cursor >= RESET_CODE_LENGTH) {
          break;
        }
        digits[cursor] = digit;
        cursor += 1;
      }
      return digits;
    });

    const nextIndex = Math.min(index + sanitized.length, RESET_CODE_LENGTH - 1);
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

    if (event.key === "ArrowRight" && index < RESET_CODE_LENGTH - 1 && !event.shiftKey) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>): void => {
    event.preventDefault();
    handleDigitChange(index, event.clipboardData.getData("text"));
  };

  const handleBackToLogin = useCallback((): void => {
    if (onBackToLogin) {
      onBackToLogin();
      return;
    }

    navigate(APP_SHELL_ROUTES.login);
  }, [navigate, onBackToLogin]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const trimmedCode = resetCode.trim();

    if (!trimmedCode) {
      setHasError(true);
      showError(t("auth.login.errors.passwordResetCodeRequired"));
      return;
    }

    if (!RESET_CODE_REGEX.test(trimmedCode)) {
      setHasError(true);
      showError(t("auth.login.errors.invalidPasswordResetCode"));
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setHasError(true);
      showError(t("auth.login.errors.passwordRequired"));
      return;
    }

    if (!passwordRulesPassed) {
      setHasError(true);
      showError(t("auth.login.errors.passwordPolicy"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setHasError(true);
      showError(t("auth.login.errors.passwordMismatch"));
      return;
    }

    setHasError(false);
    const success = await resetPassword({
      identity: identity.identity,
      otp: trimmedCode,
      newPassword,
    });

    if (success) {
      setCompleted(true);
      setResetDigits([...EMPTY_DIGITS]);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  if (completed) {
    return (
      <LoginShell
        embedded={embedded}
        mobileFormOnly={!embedded}
        subtitle={t("auth.login.resetPasswordCompletedSubtitle")}
      >
        <Box className={formStyles.successPanel}>
          <CheckCircleIcon className={formStyles.successIcon} />
          <Typography component="h2" className={formStyles.panelTitle}>
            {t("auth.login.resetPasswordCompletedTitle")}
          </Typography>
          <Typography component="p" className={formStyles.formLead}>
            {t("auth.login.resetPasswordCompletedLead")}
          </Typography>
          <Button
            type="button"
            fullWidth
            variant="contained"
            size="large"
            className={formStyles.loginButton}
            onClick={handleBackToLogin}
          >
            {t("auth.login.signIn")}
          </Button>
        </Box>
      </LoginShell>
    );
  }

  return (
    <LoginShell
      embedded={embedded}
      mobileFormOnly={!embedded}
      subtitle={t("auth.login.resetPasswordSubtitle")}
    >
      <form onSubmit={handleSubmit} className={formStyles.loginForm}>
        <Box className={formStyles.formIntroPanel}>
          <Typography component="h2" className={formStyles.panelTitle}>
            {t("auth.login.resetPasswordTitle")}
          </Typography>
          <Typography component="p" className={formStyles.formLead}>
            {t("auth.login.resetPasswordLead")}
          </Typography>
        </Box>

        <Box className={verifyStyles.verificationCodeContainer}>
          <Box className={verifyStyles.verificationCodeHeader}>
            <Typography
              id="password-reset-otp-section-title"
              component="h2"
              className={verifyStyles.verificationCodeSectionTitle}
            >
              {t("auth.login.passwordResetCodeSectionTitle")}
            </Typography>
            <Typography className={verifyStyles.verificationCodeSectionHint}>
              {t("auth.login.passwordResetCodeSectionHint")}
            </Typography>
            <Alert severity="info" className={formStyles.formAlert}>
              {t("auth.login.resetPasswordSpamHint")}
            </Alert>
          </Box>

          <Box
            className={verifyStyles.verificationCodeInputs}
            role="group"
            aria-labelledby="password-reset-otp-section-title"
          >
            {resetDigits.map((digit, index) => (
              <TextField
                key={`reset-digit-${index}`}
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
                disabled={resettingPassword}
                error={hasError}
                inputProps={{
                  maxLength: 1,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  spellCheck: false,
                  "aria-label": t("auth.login.passwordResetCodeDigitAria", {
                    n: index + 1,
                    total: RESET_CODE_LENGTH,
                  }),
                }}
              />
            ))}
          </Box>
        </Box>

        <LoginAdornedTextField
          fullWidth
          label={t("auth.login.newPasswordFieldTitle")}
          type={showPassword ? "text" : "password"}
          value={newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value);
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
          autoComplete="new-password"
          disabled={resettingPassword}
          error={hasError && !newPassword.trim()}
        />

        <PasswordPolicyChecklist password={newPassword} />

        <LoginAdornedTextField
          fullWidth
          label={t("auth.login.confirmPasswordFieldTitle")}
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setHasError(false);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon className={formStyles.inputIcon} />
              </InputAdornment>
            ),
          }}
          autoComplete="new-password"
          disabled={resettingPassword}
          error={hasError && Boolean(confirmPassword) && !passwordsMatch}
          helperText={
            confirmPassword && !passwordsMatch
              ? t("auth.login.errors.passwordMismatch")
              : t("auth.login.confirmNewPasswordHelper")
          }
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          className={formStyles.loginButton}
          disabled={!canSubmit || resettingPassword}
          startIcon={
            resettingPassword ? (
              <CircularProgress className={formStyles.loginButtonSpinner} color="inherit" />
            ) : null
          }
        >
          {resettingPassword
            ? t("auth.login.resettingPassword")
            : t("auth.login.resetPasswordButton")}
        </Button>
      </form>
    </LoginShell>
  );
};

const ResetPasswordPage = (): ReactElement => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const identity = useMemo((): LoginNavState | null => {
    if (isLoginNavState(location.state)) {
      return location.state;
    }

    return null;
  }, [location.state]);

  if (!identity) {
    return (
      <LoginShell mobileFormOnly subtitle={t("auth.login.resetPasswordSubtitle")}>
        <Box className={formStyles.formIntroPanel}>
          <Alert severity="warning" className={formStyles.formAlert}>
            {t("auth.login.resetPasswordMissingIdentityHint")}
          </Alert>
          <Button
            type="button"
            variant="contained"
            size="large"
            className={formStyles.loginButton}
            onClick={() => navigate(APP_SHELL_ROUTES.login)}
          >
            {t("auth.login.backToSignIn")}
          </Button>
        </Box>
      </LoginShell>
    );
  }

  return <ResetPasswordForm identity={identity} />;
};

export default ResetPasswordPage;
