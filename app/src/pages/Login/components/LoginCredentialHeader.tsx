import { Box, Button, Typography } from "@mui/material";
import { ArrowForward as ArrowForwardIcon } from "@mui/icons-material";
import type { ReactElement } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { type LoginNavState } from "../login-nav-state";
import verifyStyles from "../styles/VerifyLoginCode.module.scss";
import { AuthIdentityInputIcon } from "./AuthIdentityInputIcon";

interface LoginCredentialHeaderProps {
  readonly identity: LoginNavState;
  readonly onEditIdentity: (identity: LoginNavState) => void;
}

export function LoginCredentialHeader({
  identity,
  onEditIdentity,
}: LoginCredentialHeaderProps): ReactElement {
  const { t } = useTranslation();

  return (
    <Box className={verifyStyles.credentialHeader}>
      <Box className={verifyStyles.identityRow}>
        <AuthIdentityInputIcon identityKind={identity.identityKind} fontSize="small" />
        <Typography component="p" className={verifyStyles.identityValue}>
          {identity.identity}
        </Typography>
      </Box>

      <Button
        type="button"
        variant="text"
        size="small"
        className={verifyStyles.backToIdentityButton}
        startIcon={<ArrowForwardIcon fontSize="small" />}
        onClick={() => onEditIdentity(identity)}
      >
        {t("auth.login.backToIdentity")}
      </Button>
    </Box>
  );
}
