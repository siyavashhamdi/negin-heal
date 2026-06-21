import { useState, type ReactElement } from "react";
import {
  Button,
  CircularProgress,
  InputAdornment,
  Typography,
} from "@mui/material";
import {
  AlternateEmail as AlternateEmailIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useLogin } from "../../hooks/useLogin";
import LoginShell from "./LoginShell";
import { type LoginNavState } from "./login-nav-state";
import { EMAIL_REGEX, isValidMobilePhone, sanitizeAuthIdentityInput } from "./password-reset-form.util";
import { LoginAdornedTextField } from "./components/LoginAdornedTextField";
import formStyles from "./styles/LoginFormShared.module.scss";

const detectIdentityKind = (identity: string): LoginNavState["identityKind"] => {
  const trimmedIdentity = identity.trim();

  if (EMAIL_REGEX.test(trimmedIdentity)) {
    return "email";
  }

  if (isValidMobilePhone(trimmedIdentity)) {
    return "mobile";
  }

  return "username";
};

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

    onForgotPassword({
      identity: trimmedIdentity,
      identityKind: detectIdentityKind(trimmedIdentity),
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const trimmedIdentity = identity.trim();

    if (!trimmedIdentity) {
      setFieldError(true);
      showError(t("auth.login.errors.identityRequired"));
      return;
    }

    if (trimmedIdentity.includes("@") && !EMAIL_REGEX.test(trimmedIdentity)) {
      setFieldError(true);
      showError(t("auth.login.errors.invalidEmail"));
      return;
    }

    const identityKind = detectIdentityKind(trimmedIdentity);
    if (identityKind === "mobile" && !isValidMobilePhone(trimmedIdentity)) {
      setFieldError(true);
      showError(t("auth.login.errors.invalidMobile"));
      return;
    }

    setFieldError(false);
    const navState: LoginNavState = {
      identity: trimmedIdentity,
      identityKind,
    };
    const exists = await resolveAuthIdentity({ identity: trimmedIdentity });
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
            lang: "en",
            spellCheck: "false",
            autoCapitalize: "off",
            autoCorrect: "off",
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {detectIdentityKind(identity) === "mobile" ? (
                  <PhoneIcon className={formStyles.inputIcon} />
                ) : detectIdentityKind(identity) === "email" ? (
                  <AlternateEmailIcon className={formStyles.inputIcon} />
                ) : (
                  <PersonIcon className={formStyles.inputIcon} />
                )}
              </InputAdornment>
            ),
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
