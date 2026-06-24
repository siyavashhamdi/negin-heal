import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Typography,
} from "@mui/material";
import {
  HelpOutlineRounded as HelpIcon,
  LogoutRounded as LogoutIcon,
  NotificationsNoneRounded as NotificationsIcon,
  SettingsRounded as SettingsIcon,
} from "@mui/icons-material";
import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useMe } from "../../hooks/useMe";
import {
  resolveAvatarInitial,
  resolveMeUserDisplayName,
  resolveStoredUserDisplayName,
} from "../../utils/storedUser.util";
import { useTranslation } from "../../hooks/useTranslation";
import ThemeToggle from "../ThemeToggle";
import { AvatarInitial } from "../../shared/display/AvatarInitial";
import styles from "./styles/header.module.scss";
import AppTooltip from "../../shared/AppTooltip";

const POPOVER_ANCHOR_ORIGIN = { vertical: "bottom", horizontal: "left" } as const;
const POPOVER_TRANSFORM_ORIGIN = { vertical: "top", horizontal: "left" } as const;
const SUPER_ADMIN_ROLE_BADGE_LABEL = "سوپرادمین" as const;

function HeaderPopover(props: {
  readonly open: boolean;
  readonly anchorEl: HTMLButtonElement | null;
  readonly onClose: () => void;
  readonly children: ReactNode;
}): ReactElement {
  const { open, anchorEl, onClose, children } = props;
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={POPOVER_ANCHOR_ORIGIN}
      transformOrigin={POPOVER_TRANSFORM_ORIGIN}
    >
      {children}
    </Popover>
  );
}

const Header = (): ReactElement => {
  const { t } = useTranslation();
  const { user, avatarUrl, loading: userLoading } = useMe();
  const { logout, user: authUser } = useAuth();
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLButtonElement | null>(null);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLButtonElement | null>(null);
  const [helpAnchor, setHelpAnchor] = useState<HTMLButtonElement | null>(null);
  const [userAnchor, setUserAnchor] = useState<HTMLButtonElement | null>(null);

  const notificationItems = useMemo((): readonly string[] => {
    const raw = t("layout.header.panels.notifications.___popoverStringSamples", {
      returnObjects: true,
    });
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);

  const { displayName, avatarLetter } = useMemo(() => {
    const name =
      userLoading || !user
        ? resolveStoredUserDisplayName(authUser, authUser?.username ?? "")
        : resolveMeUserDisplayName(user, authUser?.username ?? "");
    const letter = resolveAvatarInitial(name);
    return { displayName: name, avatarLetter: letter };
  }, [authUser, user, userLoading]);

  const brandTitle = t("layout.header.brand.title");
  const isPublicAudience = !authUser || authUser.roles.includes("END_USER");
  const brandTagline = isPublicAudience
    ? t("layout.header.brand.publicTagline")
    : t("layout.header.brand.tagline");
  const adminRoleBadgeLabel = authUser?.roles?.includes("SUPER_ADMIN")
    ? SUPER_ADMIN_ROLE_BADGE_LABEL
    : null;

  return (
    <Box component="header" className={styles.header}>
      <Box
        component={RouterLink}
        to="/"
        className={styles.brand}
        aria-label={t("layout.mainLayout.navigation.brandHomeLink", { title: brandTitle })}
      >
        <Box component="img" src="/logo.png" alt="" className={styles.logo} aria-hidden />
        <Box className={styles.brandText}>
          <Typography component="h1" className={styles.title}>
            {brandTitle}{" "}
            {adminRoleBadgeLabel ? (
              <span className={styles.titleBadge}>{adminRoleBadgeLabel}</span>
            ) : null}
          </Typography>
          <Typography className={styles.subtitle}>{brandTagline}</Typography>
        </Box>
      </Box>

      <Box className={styles.actions}>
        <Box className={styles.quickActions}>
          <ThemeToggle />
          <AppTooltip title={t("layout.header.actions.notifications")}>
            <IconButton
              onClick={(event) => setNotificationAnchor(event.currentTarget)}
              className={styles.iconButton}
            >
              <Badge badgeContent={notificationItems.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </AppTooltip>

          <AppTooltip title={t("layout.header.actions.settings")}>
            <IconButton
              onClick={(event) => setSettingsAnchor(event.currentTarget)}
              className={styles.iconButton}
            >
              <SettingsIcon />
            </IconButton>
          </AppTooltip>
          <AppTooltip title={t("layout.header.actions.help")}>
            <IconButton
              onClick={(event) => setHelpAnchor(event.currentTarget)}
              className={styles.iconButton}
            >
              <HelpIcon />
            </IconButton>
          </AppTooltip>
        </Box>

        <button
          type="button"
          className={styles.userChip}
          onClick={(event) => setUserAnchor(event.currentTarget)}
        >
          <Avatar className={styles.avatar} src={avatarUrl ?? undefined} alt={displayName}>
            <AvatarInitial initial={avatarLetter} />
          </Avatar>
          <strong>{displayName}</strong>
        </button>

        <AppTooltip title={t("layout.header.actions.exit")}>
          <Button
            variant="outlined"
            className={styles.signoutButton}
            startIcon={<LogoutIcon />}
            onClick={logout}
          >
            {t("layout.header.actions.exit")}
          </Button>
        </AppTooltip>
      </Box>

      <HeaderPopover
        open={Boolean(notificationAnchor)}
        anchorEl={notificationAnchor}
        onClose={() => setNotificationAnchor(null)}
      >
        <Box className={styles.popoverPanel}>
          <Typography className={styles.popoverTitle}>
            {t("layout.header.panels.notifications.popoverTitle")}
          </Typography>
          <Divider />
          {notificationItems.map((item) => (
            <Typography key={item} className={styles.popoverItem}>
              {item}
            </Typography>
          ))}
        </Box>
      </HeaderPopover>

      <HeaderPopover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
      >
        <Box className={styles.popoverPanel}>
          <Typography className={styles.popoverTitle}>
            {t("layout.header.panels.settings.popoverTitle")}
          </Typography>
          <Divider />
          <Typography className={styles.popoverItem}>
            {t("layout.header.panels.settings.popoverRoles")}
          </Typography>
          <Typography className={styles.popoverItem}>
            {t("layout.header.panels.settings.popoverContact")}
          </Typography>
          <Typography className={styles.popoverItem}>
            {t("layout.header.panels.settings.popoverNotifications")}
          </Typography>
        </Box>
      </HeaderPopover>

      <HeaderPopover
        open={Boolean(helpAnchor)}
        anchorEl={helpAnchor}
        onClose={() => setHelpAnchor(null)}
      >
        <Box className={styles.popoverPanel}>
          <Typography className={styles.popoverTitle}>
            {t("layout.header.panels.help.popoverTitle")}
          </Typography>
          <Divider />
          <Typography className={styles.popoverItem}>
            {t("layout.header.panels.help.popoverRegisterGuide")}
          </Typography>
          <Typography className={styles.popoverItem}>
            {t("layout.header.panels.help.popoverFaqExperts")}
          </Typography>
          <Typography className={styles.popoverItem}>
            {t("layout.header.panels.help.popoverSupportContact")}
          </Typography>
        </Box>
      </HeaderPopover>

      <HeaderPopover
        open={Boolean(userAnchor)}
        anchorEl={userAnchor}
        onClose={() => setUserAnchor(null)}
      >
        <Box className={styles.popoverPanel}>
          <Typography className={styles.popoverTitle}>{displayName}</Typography>
          <Divider />
          <Typography className={styles.popoverItem}>
            {t("layout.header.panels.user.popoverEditProfile")}
          </Typography>
          <Typography className={styles.popoverItem}>
            {t("layout.header.panels.user.popoverPersonalNotifications")}
          </Typography>
          <Typography className={styles.popoverItem}>
            {t("layout.header.panels.user.popoverSecurity")}
          </Typography>
        </Box>
      </HeaderPopover>
    </Box>
  );
};

export default Header;
