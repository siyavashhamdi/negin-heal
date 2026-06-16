import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { IconButton, Tooltip } from "@mui/material";
import { type ReactElement } from "react";

import { useTranslation } from "../../hooks/useTranslation";
import { formatRelativeTimeLabel } from "../../utilities/relative-time.util";
import {
  NOTIFICATION_SOURCE_LABEL,
  type NotificationMode,
  type NotificationRecord,
} from "./notifications-list.api";
import styles from "./styles/notifications.module.scss";

type NotificationCardProps = {
  readonly notification: NotificationRecord;
  readonly onMarkRead: (id: string) => void;
  readonly onMarkUnread: (id: string) => void;
  readonly onArchive: (id: string) => void;
  readonly isUpdating?: boolean;
};

const MODE_META: Record<
  NotificationMode,
  {
    readonly icon: typeof InfoOutlinedIcon;
    readonly accentClass: string;
  }
> = {
  INFO: { icon: InfoOutlinedIcon, accentClass: styles.cardAccentInfo ?? "" },
  SUCCESS: { icon: CheckCircleOutlineRoundedIcon, accentClass: styles.cardAccentSuccess ?? "" },
  WARNING: { icon: WarningAmberRoundedIcon, accentClass: styles.cardAccentWarning ?? "" },
  ERROR: { icon: ErrorOutlineRoundedIcon, accentClass: styles.cardAccentError ?? "" },
};

const NotificationCard = ({
  notification,
  onMarkRead,
  onMarkUnread,
  onArchive,
  isUpdating = false,
}: NotificationCardProps): ReactElement => {
  const { t } = useTranslation();
  const modeMeta = MODE_META[notification.mode] ?? MODE_META.INFO;
  const ModeIcon = modeMeta.icon;
  const timeLabel = formatRelativeTimeLabel(notification.createdAt ?? notification.updatedAt);
  const isArchived = Boolean(notification.archivedAt);
  const cardClassName = [
    styles.card,
    modeMeta.accentClass,
    !notification.isRead ? styles.cardUnread : "",
    isArchived ? styles.cardArchived : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClassName} aria-labelledby={`notification-title-${notification.id}`}>
      <div className={styles.cardAccent} aria-hidden="true" />

      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIconWrap}>
            <ModeIcon fontSize="small" />
          </div>

          <div className={styles.cardHeading}>
            <div className={styles.cardTitleRow}>
              <h3 id={`notification-title-${notification.id}`}>{notification.title}</h3>
              {!notification.isRead ? (
                <span className={styles.unreadDot} aria-hidden="true" />
              ) : null}
            </div>

            <div className={styles.cardMeta}>
              <span className={styles.sourceChip}>
                {NOTIFICATION_SOURCE_LABEL[notification.source]}
              </span>
              {notification.isGlobalAnnouncement ? (
                <span className={styles.globalChip}>
                  <CampaignOutlinedIcon fontSize="inherit" />
                  {t("pages.notifications.globalBadge")}
                </span>
              ) : null}
              <time dateTime={notification.createdAt ?? undefined}>{timeLabel}</time>
            </div>
          </div>
        </div>

        <p className={styles.cardMessage}>{notification.message}</p>

        {notification.isActionable ? (
          <div className={styles.cardActions}>
            {!notification.isRead ? (
              <Tooltip title={t("pages.notifications.actions.markRead")} arrow>
                <span>
                  <IconButton
                    size="small"
                    className={styles.actionIconButton}
                    disabled={isUpdating}
                    aria-label={t("pages.notifications.actions.markRead")}
                    onClick={() => onMarkRead(notification.id)}
                  >
                    <CheckCircleOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title={t("pages.notifications.actions.markUnread")} arrow>
                <span>
                  <IconButton
                    size="small"
                    className={styles.actionIconButton}
                    disabled={isUpdating}
                    aria-label={t("pages.notifications.actions.markUnread")}
                    onClick={() => onMarkUnread(notification.id)}
                  >
                    <MarkEmailUnreadOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {!isArchived ? (
              <Tooltip title={t("pages.notifications.actions.archive")} arrow>
                <span>
                  <IconButton
                    size="small"
                    className={styles.actionIconButton}
                    disabled={isUpdating}
                    aria-label={t("pages.notifications.actions.archive")}
                    onClick={() => onArchive(notification.id)}
                  >
                    <ArchiveOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
          </div>
        ) : (
          <p className={styles.cardHint}>{t("pages.notifications.globalHint")}</p>
        )}
      </div>
    </article>
  );
};

export default NotificationCard;
