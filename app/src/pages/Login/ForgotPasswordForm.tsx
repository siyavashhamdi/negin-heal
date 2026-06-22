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
import { LoginAdornedTextField } from "./components/LoginAdornedTextField";
import { type LoginNavState } from "./login-nav-state";
import {
  createForgotPasswordPrefill,
  detectPasswordResetIdentityKind,
  isValidAuthIdentity,
  latinIdentityFieldInputProps,
  normalizeAuthIdentityForSubmit,
  resolveInvalidAuthIdentityErrorKind,
  sanitizeAuthIdentityInput,
} from "./password-reset-form.util";
import { AuthIdentityInputAdornment } from "./components/AuthIdentityInputAdornment";
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
  const [fieldError, setFieldError] = useState<"identity" | "email" | "mobile" | null>(null);

  const trimmedIdentity = identity.trim();
  const normalizedIdentity = normalizeAuthIdentityForSubmit(trimmedIdentity);
  const identityKind = detectPasswordResetIdentityKind(normalizedIdentity);
  const captchaEnabled = API_CONFIG.CAPTCHA_ENABLED;
  const canSubmit = trimmedIdentity.length > 0 && (!captchaEnabled || captchaValid);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!canSubmit) {
      setFieldError("identity");
      showError(t("auth.login.errors.passwordResetIdentityRequired"));
      return;
    }

    if (!isValidAuthIdentity(trimmedIdentity)) {
      const errorKind = resolveInvalidAuthIdentityErrorKind(trimmedIdentity);
      setFieldError(errorKind === "email" ? "email" : errorKind === "mobile" ? "mobile" : "identity");
      showError(
        t(
          errorKind === "email"
            ? "auth.login.errors.invalidEmail"
            : errorKind === "mobile"
              ? "auth.login.errors.invalidMobile"
              : "auth.login.errors.identityInvalid",
        ),
      );
      return;
    }

    if (captchaEnabled && !captchaValid) {
      showError(t("auth.login.errors.captchaRequired"));
      return;
    }

    setFieldError(null);
    const success = await requestResetLink({
      identity: normalizedIdentity,
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

        <LoginAdornedTextField
          fullWidth
          label={t("auth.login.identityFieldTitle")}
          type="text"
          value={identity}
          onChange={(event) => {
            setIdentity(sanitizeAuthIdentityInput(event.target.value));
            setFieldError(null);
          }}
          inputProps={{
            ...latinIdentityFieldInputProps,
            inputMode: "text",
            className: formStyles.latinInput,
          }}
          InputProps={{
            startAdornment: <AuthIdentityInputAdornment identity={identity} />,
          }}
          autoComplete="username"
          autoFocus
          disabled={requestingResetLink}
          error={fieldError !== null}
          helperText={
            fieldError === "email"
              ? t("auth.login.errors.invalidEmail")
              : fieldError === "mobile"
                ? t("auth.login.errors.invalidMobile")
              : fieldError === "identity"
                ? t("auth.login.errors.identityInvalid")
                : t("auth.login.forgotPasswordHelper")
          }
        />

        {captchaEnabled ? (
          <LoginCaptchaField
            key={`forgot-password-captcha-${captchaVersion}`}
            disabled={requestingResetLink}
            error={false}
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
