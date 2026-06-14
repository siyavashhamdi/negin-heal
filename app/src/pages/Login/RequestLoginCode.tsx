import { useState, type ReactElement } from "react";
import {
  TextField,
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
import formStyles from "./styles/LoginFormShared.module.scss";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^(?:\+?98|0)?9\d{9}$/;

const detectIdentityKind = (identity: string): LoginNavState["identityKind"] => {
  const trimmedIdentity = identity.trim();
  const digitsOnly = trimmedIdentity.replace(/\D/g, "");

  if (EMAIL_REGEX.test(trimmedIdentity)) {
    return "email";
  }

  if (MOBILE_REGEX.test(trimmedIdentity) || /^9\d{9}$/.test(digitsOnly)) {
    return "mobile";
  }

  return "username";
};

export interface RequestLoginCodeProps {
  readonly initialPrefill?: LoginNavState | null;
  readonly onIdentityResolved: (identity: LoginNavState) => void;
  readonly onSignupRequired: (identity: LoginNavState) => void;
}

const RequestLoginCode = ({
  initialPrefill = null,
  onIdentityResolved,
  onSignupRequired,
}: RequestLoginCodeProps): ReactElement => {
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const { resolveAuthIdentity, loading } = useLogin();

  const [identity, setIdentity] = useState(() => initialPrefill?.identity ?? "");
  const [fieldError, setFieldError] = useState(false);

  const canSubmit = identity.trim().length > 0;

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

    setFieldError(false);
    const navState: LoginNavState = {
      identity: trimmedIdentity,
      identityKind: detectIdentityKind(trimmedIdentity),
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
    <LoginShell subtitle={t("auth.login.subtitle")}>
      <form onSubmit={handleSubmit} className={formStyles.loginForm}>
        <Typography component="p" className={formStyles.formLead}>
          {t("auth.login.identityStepLead")}
        </Typography>

        <TextField
          fullWidth
          label={t("auth.login.identityFieldTitle")}
          placeholder={t("auth.login.identityPlaceholder")}
          variant="outlined"
          type="text"
          value={identity}
          onChange={(event) => {
            setIdentity(event.target.value);
            setFieldError(false);
          }}
          className={formStyles.textField}
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
      </form>
    </LoginShell>
  );
};

export default RequestLoginCode;
