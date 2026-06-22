import { useState, type ReactElement } from "react";
import {
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useLogin } from "../../hooks/useLogin";
import LoginShell from "./LoginShell";
import { type LoginNavState } from "./login-nav-state";
import {
  detectAuthIdentityKind,
  isValidAuthIdentity,
  latinIdentityFieldInputProps,
  normalizeAuthIdentityForSubmit,
  resolveInvalidAuthIdentityErrorKind,
  sanitizeAuthIdentityInput,
} from "./password-reset-form.util";
import { AuthIdentityInputAdornment } from "./components/AuthIdentityInputAdornment";
import { LoginAdornedTextField } from "./components/LoginAdornedTextField";
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
    sanitizeAuthIdentityInput(initialPrefill?.identity ?? ""),
  );
  const [fieldError, setFieldError] = useState(false);

  const canSubmit = identity.trim().length > 0;

  const handleForgotPasswordClick = (): void => {
    const trimmedIdentity = identity.trim();
    if (!trimmedIdentity) {
      onForgotPassword(null);
      return;
    }

    const normalizedIdentity = normalizeAuthIdentityForSubmit(trimmedIdentity);
    onForgotPassword({
      identity: normalizedIdentity,
      identityKind: detectAuthIdentityKind(normalizedIdentity),
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const trimmedIdentity = identity.trim();
    const normalizedIdentity = normalizeAuthIdentityForSubmit(trimmedIdentity);

    if (!trimmedIdentity) {
      setFieldError(true);
      showError(t("auth.login.errors.identityRequired"));
      return;
    }

    if (!isValidAuthIdentity(trimmedIdentity)) {
      setFieldError(true);
      const errorKind = resolveInvalidAuthIdentityErrorKind(trimmedIdentity);
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

    const identityKind = detectAuthIdentityKind(normalizedIdentity);

    setFieldError(false);
    const navState: LoginNavState = {
      identity: normalizedIdentity,
      identityKind,
    };
    const exists = await resolveAuthIdentity({ identity: normalizedIdentity });
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

        <LoginAdornedTextField
          fullWidth
          label={t("auth.login.identityFieldTitle")}
          type="text"
          value={identity}
          onChange={(event) => {
            setIdentity(sanitizeAuthIdentityInput(event.target.value));
            setFieldError(false);
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
          error={fieldError}
          helperText={
            fieldError
              ? t("auth.login.errors.identityRequired")
              : t("auth.login.identityHelper")
          }
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
