import { useEffect, useRef, useState, type ReactElement } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material";
import { useMutation } from "@apollo/client/react";
import { useTranslation } from "../../hooks/useTranslation";
import { USER_ACTIVATE_ACCOUNT_MUTATION } from "../../graphql/mutations/userActivateAccount.mutation";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import LoginShell from "./LoginShell";
import formStyles from "./styles/LoginFormShared.module.scss";

type ActivateAccountMutationResponse = {
  userActivateAccount: {
    success: boolean;
    message: string;
  };
};

type ActivateAccountMutationVariables = {
  token: string;
};

type ActivationState = "loading" | "success" | "error" | "missing-token";

const ActivateAccount = (): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<ActivationState>("loading");
  const hasAttemptedRef = useRef(false);

  const token = searchParams.get("token")?.trim() ?? "";

  const [activateAccount] = useMutation<
    ActivateAccountMutationResponse,
    ActivateAccountMutationVariables
  >(USER_ACTIVATE_ACCOUNT_MUTATION);

  useEffect(() => {
    if (hasAttemptedRef.current) {
      return;
    }

    if (!token) {
      setState("missing-token");
      return;
    }

    hasAttemptedRef.current = true;

    void activateAccount({ variables: { token } })
      .then((result) => {
        if (result.data?.userActivateAccount.success) {
          setState("success");
          return;
        }

        setState("error");
      })
      .catch(() => {
        setState("error");
      });
  }, [activateAccount, token]);

  if (state === "loading") {
    return (
      <LoginShell mobileFormOnly subtitle={t("auth.login.activateAccountSubtitle")}>
        <Box className={formStyles.successPanel}>
          <CircularProgress size={40} />
          <Typography component="p" className={formStyles.formLead}>
            {t("auth.login.activateAccountLoading")}
          </Typography>
        </Box>
      </LoginShell>
    );
  }

  if (state === "success") {
    return (
      <LoginShell mobileFormOnly subtitle={t("auth.login.activateAccountSuccessSubtitle")}>
        <Box className={formStyles.successPanel}>
          <CheckCircleIcon className={formStyles.successIcon} />
          <Typography component="h2" className={formStyles.panelTitle}>
            {t("auth.login.activateAccountSuccessTitle")}
          </Typography>
          <Typography component="p" className={formStyles.formLead}>
            {t("auth.login.activateAccountSuccessLead")}
          </Typography>
        </Box>
      </LoginShell>
    );
  }

  return (
    <LoginShell mobileFormOnly subtitle={t("auth.login.activateAccountSubtitle")}>
      <Box className={formStyles.formIntroPanel}>
        <ErrorOutlineIcon className={formStyles.successIcon} color="error" />
        <Typography component="h2" className={formStyles.panelTitle}>
          {t("auth.login.activateAccountErrorTitle")}
        </Typography>
        <Alert severity="error" className={formStyles.formAlert}>
          {state === "missing-token"
            ? t("auth.login.activateAccountMissingTokenHint")
            : t("auth.login.activateAccountErrorLead")}
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
};

export default ActivateAccount;
