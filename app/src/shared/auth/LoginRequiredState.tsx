import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import { Button } from "@mui/material";
import { type ReactElement, type ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useMobileAppLayout } from "../../hooks/useMobileAppLayout";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import { opaqueShellProps } from "../opaqueShell";
import styles from "./LoginRequiredState.module.scss";

type LoginRequiredStateProps = {
  readonly eyebrow?: string;
  readonly title: string;
  readonly description: string;
  readonly actionLabel?: string;
  readonly icon?: ReactNode;
  readonly className?: string;
};

export const LoginRequiredState = ({
  eyebrow,
  title,
  description,
  actionLabel = "ورود به حساب کاربری",
  icon,
  className,
}: LoginRequiredStateProps): ReactElement => {
  const location = useLocation();
  const isMobileAppLayout = useMobileAppLayout();
  const loginPath = isMobileAppLayout ? APP_SHELL_ROUTES.profileLogin : APP_SHELL_ROUTES.login;

  return (
    <section
      className={[styles.panel, className].filter(Boolean).join(" ")}
      aria-labelledby="login-required-title"
      {...opaqueShellProps}
    >
      <div className={styles.iconWrap} aria-hidden="true">
        {icon ?? <LoginRoundedIcon />}
      </div>
      <div className={styles.copy}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h2 id="login-required-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.description}>{description}</p>
      </div>
      <Button
        component={RouterLink}
        to={loginPath}
        state={{ from: location.pathname }}
        variant="contained"
        size="large"
        className={styles.action}
        startIcon={<LoginRoundedIcon />}
      >
        {actionLabel}
      </Button>
    </section>
  );
};
