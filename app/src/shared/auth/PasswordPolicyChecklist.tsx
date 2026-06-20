import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Typography } from "@mui/material";
import { type ReactElement } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { getPasswordRules } from "../../utils/passwordPolicy.util";
import styles from "./PasswordPolicyChecklist.module.scss";

type PasswordPolicyChecklistProps = {
  readonly password: string;
};

export const PasswordPolicyChecklist = ({
  password,
}: PasswordPolicyChecklistProps): ReactElement => {
  const { t } = useTranslation();
  const passwordRules = getPasswordRules(password);

  return (
    <Box className={styles.passwordChecklist}>
      {passwordRules.map((rule) => (
        <Typography
          key={rule.id}
          component="span"
          className={rule.passed ? styles.passwordRulePassed : styles.passwordRule}
        >
          <CheckCircleIcon fontSize="inherit" />
          {t(rule.labelKey)}
        </Typography>
      ))}
    </Box>
  );
};
