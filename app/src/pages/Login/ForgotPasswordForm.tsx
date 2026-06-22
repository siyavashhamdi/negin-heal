import { useCallback, useMemo, useState, type ReactElement } from "react";
import {
  Button,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  MarkEmailUnread as MarkEmailUnreadIcon,
} from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import { useSnackbar } from "../../hooks/useSnackbar";
import { usePasswordReset } from "../../hooks/usePasswordReset";
import { API_CONFIG } from "../../config/env";
import LoginShell from "./LoginShell";
import { LoginCaptchaField } from "./components/LoginCaptchaField";
import { AuthIdentityTextField } from "./components/AuthIdentityTextField";
import { type LoginNavState } from "./login-nav-state";
import {
  createForgotPasswordPrefill,
  resolveAuthIdentityValidationMessageKey,
  sanitizeAuthIdentityInput,
  validateSubmittedAuthIdentity,
  type SubmittedAuthIdentityValidationError,
} from "./password-reset-form.util";
import formStyles from "./styles/LoginFormShared.module.scss";

interface ForgotPasswordFormProps {
  readonly embedded?: boolean;
  readonly initialIdentity?: LoginNavState | null;
  readonly onBackToLogin: () => void;
}

export const ForgotPasswordForm = ({
  embedded = false,
  initialIdentity = null,
}: ForgotPasswordFormProps): ReactElement => {
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const { requestResetLink, requestingResetLink } = usePasswordReset();
  const initialValues = useMemo(
    () => sanitizeAuthIdentityInput(createForgotPasswordPrefill(initialIdentity)),
    [initialIdentity],
  );

  const [identity, setIdentity] = useState(initialValues);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [fieldError, setFieldError] =
    useState<SubmittedAuthIdentityValidationError | null>(null);
  const [captchaError, setCaptchaError] = useState(false);

  const trimmedIdentity = identity.trim();
  const captchaEnabled = API_CONFIG.CAPTCHA_ENABLED;
  const canSubmit =
    trimmedIdentity.length > 0 && (!captchaEnabled || captchaValid);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const validation = validateSubmittedAuthIdentity(identity);
    if (!validation.ok) {
      setFieldError(validation.error);
      showError(
        t(
          resolveAuthIdentityValidationMessageKey(validation.error, {
            requiredMessageKey: "auth.login.errors.passwordResetIdentityRequired",
          }),
        ),
      );
      return;
    }

    if (captchaEnabled && !captchaValid) {
      setCaptchaError(true);
      showError(t("auth.login.errors.captchaRequired"));
      return;
    }

    setFieldError(null);
    setCaptchaError(false);
    const success = await requestResetLink({
      identity: validation.normalized,
      captchaId: captchaEnabled ? captchaId : undefined,
      captchaValue: captchaEnabled ? captchaValue : undefined,
    });

    if (success) {
      setSubmitted(true);
      return;
    }

    if (captchaEnabled) {
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
      setCaptchaError(false);
    },
    [],
  );

  if (submitted) {
    return (
      <LoginShell embedded={embedded} subtitle={t("auth.login.forgotPasswordSubmittedSubtitle")}>
        <Box className={formStyles.successPanel}>
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
        </Box>
      </LoginShell>
    );
  }

  return (
    <LoginShell embedded={embedded} subtitle={t("auth.login.forgotPasswordSubtitle")}>
      <form onSubmit={handleSubmit} className={formStyles.loginForm}>
        <div className={formStyles.formIntroPanel}>
          <Typography component="h2" className={formStyles.panelTitle}>
            {t("auth.login.forgotPasswordTitle")}
          </Typography>
          <Typography component="p" className={formStyles.formLead}>
            {t("auth.login.forgotPasswordLead")}
          </Typography>
        </div>

        <AuthIdentityTextField
          value={identity}
          onChange={(nextValue) => {
            setIdentity(nextValue);
            setFieldError(null);
          }}
          autoFocus
          disabled={requestingResetLink}
          required
          error={fieldError}
          requiredMessageKey="auth.login.errors.passwordResetIdentityRequired"
          helperText={t("auth.login.forgotPasswordHelper")}
        />

        {captchaEnabled ? (
          <LoginCaptchaField
            key={`forgot-password-captcha-${captchaVersion}`}
            disabled={requestingResetLink}
            error={captchaError}
            required
            onCaptchaChange={handleCaptchaChange}
          />
        ) : null}

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
      </form>
    </LoginShell>
  );
};
