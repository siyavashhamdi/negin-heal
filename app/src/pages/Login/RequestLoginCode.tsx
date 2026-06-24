import { useState, type ReactElement } from "react";
import { Button, CircularProgress, Typography } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useLogin } from "../../hooks/useLogin";
import LoginShell from "./LoginShell";
import { type LoginNavState } from "./login-nav-state";
import {
  sanitizeAuthIdentityInput,
  resolveAuthIdentityValidationMessageKey,
  validateSubmittedAuthIdentity,
  type SubmittedAuthIdentityValidationError,
} from "./password-reset-form.util";
import { AuthIdentityTextField } from "./components/AuthIdentityTextField";
import formStyles from "./styles/LoginFormShared.module.scss";

export interface RequestLoginCodeProps {
  readonly embedded?: boolean;
  readonly initialPrefill?: LoginNavState | null;
  readonly onIdentityResolved: (identity: LoginNavState) => void;
  readonly onSignupRequired: (identity: LoginNavState) => void;
  readonly onForgotPassword: (identity?: LoginNavState | null) => void;
}

const RequestLoginCode = ({
  embedded = false,
  initialPrefill = null,
  onIdentityResolved,
  onSignupRequired,
  onForgotPassword,
}: RequestLoginCodeProps): ReactElement => {
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const { resolveAuthIdentity, loading } = useLogin();

  const [identity, setIdentity] = useState(() =>
    sanitizeAuthIdentityInput(initialPrefill?.identity ?? "")
  );
  const [fieldError, setFieldError] = useState<SubmittedAuthIdentityValidationError | null>(null);

  const canSubmit = identity.trim().length > 0;

  const handleForgotPasswordClick = (): void => {
    const validation = validateSubmittedAuthIdentity(identity);
    if (!validation.ok) {
      onForgotPassword(null);
      return;
    }

    onForgotPassword({
      identity: validation.normalized,
      identityKind: validation.kind,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const validation = validateSubmittedAuthIdentity(identity);
    if (!validation.ok) {
      setFieldError(validation.error);
      showError(t(resolveAuthIdentityValidationMessageKey(validation.error)));
      return;
    }

    setFieldError(null);
    const navState: LoginNavState = {
      identity: validation.normalized,
      identityKind: validation.kind,
    };
    const exists = await resolveAuthIdentity({ identity: validation.normalized });
    if (exists === null) {
      return;
    }

    if (exists) {
      onIdentityResolved(navState);
      return;
    }

    onSignupRequired(navState);
  };

  return (
    <LoginShell embedded={embedded} subtitle={t("auth.login.subtitle")}>
      <form onSubmit={handleSubmit} className={formStyles.loginForm}>
        <Typography component="p" className={formStyles.formLead}>
          {t("auth.login.identityStepLead")}
        </Typography>

        <AuthIdentityTextField
          value={identity}
          onChange={(nextValue) => {
            setIdentity(nextValue);
            setFieldError(null);
          }}
          autoFocus
          required
          error={fieldError}
          helperText={t("auth.login.identityHelper")}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          className={formStyles.loginButton}
          disabled={!canSubmit || loading}
          endIcon={<ArrowBackIcon fontSize="small" />}
          startIcon={
            loading ? (
              <CircularProgress className={formStyles.loginButtonSpinner} color="inherit" />
            ) : null
          }
        >
          {loading ? t("auth.login.resolvingIdentity") : t("auth.login.nextStep")}
        </Button>

        <Button
          type="button"
          variant="text"
          className={formStyles.formTextButton}
          onClick={handleForgotPasswordClick}
        >
          {t("auth.login.forgotPasswordLink")}
        </Button>
      </form>
    </LoginShell>
  );
};

export default RequestLoginCode;
