import { useMemo, useState, type ReactElement } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import { useSnackbar } from "../../hooks/useSnackbar";
import { usePasswordReset } from "../../hooks/usePasswordReset";
import { PasswordPolicyChecklist } from "../../shared/auth/PasswordPolicyChecklist";
import { arePasswordRulesPassed } from "../../utils/passwordPolicy.util";
import LoginShell from "./LoginShell";
import formStyles from "./styles/LoginFormShared.module.scss";

const getTokenFromLocation = (searchParams: URLSearchParams): string =>
  searchParams.get("token")?.trim() || searchParams.get("resetToken")?.trim() || "";

const ResetPassword = (): ReactElement => {
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, resettingPassword } = usePasswordReset();

  const resetToken = useMemo(() => getTokenFromLocation(searchParams), [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [completed, setCompleted] = useState(false);

  const passwordRulesPassed = arePasswordRulesPassed(newPassword);
  const passwordsMatch =
    confirmPassword.trim().length > 0 && newPassword === confirmPassword;
  const canSubmit =
    Boolean(resetToken) &&
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    passwordsMatch &&
    passwordRulesPassed;

  const goToLogin = (): void => {
    navigate("/login", { replace: true });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!resetToken) {
      setHasError(true);
      showError(t("auth.login.errors.resetTokenMissing"));
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
      resetLink: window.location.href,
      newPassword,
    });

    if (success) {
      setCompleted(true);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  if (completed) {
    return (
      <LoginShell subtitle={t("auth.login.resetPasswordCompletedSubtitle")}>
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
            variant="contained"
            className={formStyles.loginButton}
            onClick={goToLogin}
            startIcon={<ArrowForwardIcon fontSize="small" />}
          >
            {t("auth.login.backToSignIn")}
          </Button>
        </Box>
      </LoginShell>
    );
  }

  return (
    <LoginShell subtitle={t("auth.login.resetPasswordSubtitle")}>
      <form onSubmit={handleSubmit} className={formStyles.loginForm}>
        <Box className={formStyles.formIntroPanel}>
          <Typography component="h2" className={formStyles.panelTitle}>
            {t("auth.login.resetPasswordTitle")}
          </Typography>
          <Typography component="p" className={formStyles.formLead}>
            {t("auth.login.resetPasswordLead")}
          </Typography>
        </Box>

        {!resetToken ? (
          <Alert severity="warning" className={formStyles.formAlert}>
            {t("auth.login.resetPasswordMissingTokenHint")}
          </Alert>
        ) : null}

        <TextField
          fullWidth
          label={t("auth.login.newPasswordFieldTitle")}
          placeholder={t("auth.login.newPasswordPlaceholder")}
          variant="outlined"
          type={showPassword ? "text" : "password"}
          value={newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value);
            setHasError(false);
          }}
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
          autoFocus
          disabled={resettingPassword || !resetToken}
          error={hasError && !newPassword.trim()}
        />

        <PasswordPolicyChecklist password={newPassword} />

        <TextField
          fullWidth
          label={t("auth.login.confirmPasswordFieldTitle")}
          placeholder={t("auth.login.confirmNewPasswordPlaceholder")}
          variant="outlined"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setHasError(false);
          }}
          className={formStyles.textField}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <KeyIcon className={formStyles.inputIcon} />
              </InputAdornment>
            ),
          }}
          autoComplete="new-password"
          disabled={resettingPassword || !resetToken}
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

        <Button
          type="button"
          variant="text"
          className={formStyles.formTextButton}
          onClick={goToLogin}
          disabled={resettingPassword}
          startIcon={<ArrowForwardIcon fontSize="small" />}
        >
          {t("auth.login.backToSignIn")}
        </Button>
      </form>
    </LoginShell>
  );
};

export default ResetPassword;
