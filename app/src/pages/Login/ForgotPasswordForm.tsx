import { useMemo, useState, type ReactElement } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import {
  AlternateEmail as AlternateEmailIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  MarkEmailUnread as MarkEmailUnreadIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import { useSnackbar } from "../../hooks/useSnackbar";
import { usePasswordReset } from "../../hooks/usePasswordReset";
import LoginShell from "./LoginShell";
import { type LoginNavState } from "./login-nav-state";
import {
  createForgotPasswordPrefill,
  detectPasswordResetIdentityKind,
  EMAIL_REGEX,
} from "./password-reset-form.util";
import formStyles from "./styles/LoginFormShared.module.scss";

interface ForgotPasswordFormProps {
  readonly initialIdentity?: LoginNavState | null;
  readonly onBackToLogin: () => void;
}

export const ForgotPasswordForm = ({
  initialIdentity = null,
  onBackToLogin,
}: ForgotPasswordFormProps): ReactElement => {
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const { requestResetLink, requestingResetLink } = usePasswordReset();
  const initialValues = useMemo(
    () => createForgotPasswordPrefill(initialIdentity),
    [initialIdentity],
  );

  const [identity, setIdentity] = useState(initialValues);
  const [submitted, setSubmitted] = useState(false);
  const [fieldError, setFieldError] = useState<"identity" | "email" | null>(null);

  const trimmedIdentity = identity.trim();
  const identityKind = detectPasswordResetIdentityKind(identity);
  const canSubmit = trimmedIdentity.length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!canSubmit) {
      setFieldError("identity");
      showError(t("auth.login.errors.passwordResetIdentityRequired"));
      return;
    }

    if (trimmedIdentity.includes("@") && !EMAIL_REGEX.test(trimmedIdentity)) {
      setFieldError("email");
      showError(t("auth.login.errors.invalidEmail"));
      return;
    }

    setFieldError(null);
    const success = await requestResetLink({
      identity: trimmedIdentity,
    });

    if (success) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <LoginShell subtitle={t("auth.login.forgotPasswordSubmittedSubtitle")}>
        <>
          <CheckCircleIcon className={formStyles.successIcon} />
          <Typography component="h2" className={formStyles.panelTitle}>
            {t("auth.login.forgotPasswordSubmittedTitle")}
          </Typography>
          <Typography component="p" className={formStyles.formLead}>
            {t("auth.login.forgotPasswordSubmittedLead")}
          </Typography>
          <Typography component="p" className={formStyles.formLead}>
            {t("auth.login.forgotPasswordSubmittedHint")}
          </Typography>

          <Button
            type="button"
            variant="contained"
            className={formStyles.loginButton}
            onClick={onBackToLogin}
            startIcon={<ArrowForwardIcon fontSize="small" />}
          >
            {t("auth.login.backToSignIn")}
          </Button>
        </>
      </LoginShell>
    );
  }

  return (
    <LoginShell subtitle={t("auth.login.forgotPasswordSubtitle")}>
      <form onSubmit={handleSubmit} className={formStyles.loginForm}>
        <div className={formStyles.formIntroPanel}>
          <Typography component="h2" className={formStyles.panelTitle}>
            {t("auth.login.forgotPasswordTitle")}
          </Typography>
          <Typography component="p" className={formStyles.formLead}>
            {t("auth.login.forgotPasswordLead")}
          </Typography>
        </div>

        <TextField
          fullWidth
          label={t("auth.login.identityFieldTitle")}
          placeholder={t("auth.login.identityPlaceholder")}
          variant="outlined"
          type="text"
          value={identity}
          onChange={(event) => {
            setIdentity(event.target.value);
            setFieldError(null);
          }}
          className={formStyles.textField}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {identityKind === "mobile" ? (
                  <PhoneIcon className={formStyles.inputIcon} />
                ) : identityKind === "email" ? (
                  <AlternateEmailIcon className={formStyles.inputIcon} />
                ) : (
                  <PersonIcon className={formStyles.inputIcon} />
                )}
              </InputAdornment>
            ),
          }}
          autoComplete="username"
          autoFocus
          disabled={requestingResetLink}
          error={fieldError === "email" || fieldError === "identity"}
          helperText={
            fieldError === "email"
              ? t("auth.login.errors.invalidEmail")
              : t("auth.login.forgotPasswordHelper")
          }
        />

        <Alert severity="info" className={formStyles.formAlert}>
          {t("auth.login.forgotPasswordPrivacyHint")}
        </Alert>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          className={formStyles.loginButton}
          disabled={!canSubmit || requestingResetLink}
          startIcon={
            requestingResetLink ? (
              <CircularProgress className={formStyles.loginButtonSpinner} color="inherit" />
            ) : (
              <MarkEmailUnreadIcon fontSize="small" />
            )
          }
        >
          {requestingResetLink
            ? t("auth.login.sendingResetLink")
            : t("auth.login.sendResetLink")}
        </Button>

        <Button
          type="button"
          variant="text"
          className={formStyles.formTextButton}
          onClick={onBackToLogin}
          startIcon={<ArrowForwardIcon fontSize="small" />}
          disabled={requestingResetLink}
        >
          {t("auth.login.backToSignIn")}
        </Button>
      </form>
    </LoginShell>
  );
};
