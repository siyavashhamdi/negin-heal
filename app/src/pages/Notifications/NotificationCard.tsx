import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { IconButton, Tooltip } from "@mui/material";
import { type ReactElement } from "react";

import { useTranslation } from "../../hooks/useTranslation";
import { formatRelativeTimeLabel } from "../../utilities/relative-time.util";
import { type NotificationMode, type NotificationRecord } from "./notifications-list.api";
import styles from "./styles/notifications.module.scss";

type NotificationCardProps = {
  readonly notification: NotificationRecord;
  readonly onMarkRead: (id: string) => void;
  readonly onMarkUnread: (id: string) => void;
  readonly onArchive: (id: string) => void;
  readonly onUnarchive: (id: string) => void;
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
  onUnarchive,
  isUpdating = false,
}: NotificationCardProps): ReactElement => {
  const { t } = useTranslation();
  const modeMeta = MODE_META[notification.mode] ?? MODE_META.INFO;
  const ModeIcon = modeMeta.icon;
  const timeLabel = formatRelativeTimeLabel(notification.createdAt ?? notification.updatedAt);
  const isArchived = Boolean(notification.archivedAt);
  const shouldShowMessage = notification.message.trim() !== notification.title.trim();
  const readActionLabel = t(
    !notification.isRead
      ? "pages.notifications.actions.markRead"
      : "pages.notifications.actions.markUnread",
  );
  const archiveActionLabel = t(
    isArchived ? "pages.notifications.actions.unarchive" : "pages.notifications.actions.archive",
  );
  const cardClassName = [
    styles.card,
    modeMeta.accentClass,
    !notification.isRead ? styles.cardUnread : "",
    isArchived ? styles.cardArchived : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleReadToggle = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
      return;
    }
    onMarkUnread(notification.id);
  };

  const handleArchiveToggle = () => {
    if (isArchived) {
      onUnarchive(notification.id);
      return;
    }
    onArchive(notification.id);
  };

  return (
    <article className={cardClassName} aria-labelledby={`notification-title-${notification.id}`}>
      <div className={styles.cardAccent} aria-hidden="true" />

      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIconWrap}>
            <ModeIcon fontSize="small" />
          </div>

          <div className={styles.cardTitleRow}>
            <h3 id={`notification-title-${notification.id}`}>{notification.title}</h3>
            {!notification.isRead ? (
              <span className={styles.unreadDot} aria-hidden="true" />
            ) : null}
          </div>
        </div>

        {shouldShowMessage ? (
          <p className={styles.cardMessage}>{notification.message}</p>
        ) : null}

        <div className={styles.cardFooter}>
          <time className={styles.cardTime} dateTime={notification.createdAt ?? undefined}>
            {timeLabel}
          </time>

          {notification.isActionable ? (
            <>
              <div className={styles.cardActions}>
                {!notification.isRead ? (
                  <Tooltip title={readActionLabel} arrow>
                    <span>
                      <IconButton
                        size="small"
                        className={styles.actionIconButton}
                        disabled={isUpdating}
                        aria-label={readActionLabel}
                        onClick={handleReadToggle}
                      >
                        <CheckCircleOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                ) : (
                  <Tooltip title={readActionLabel} arrow>
                    <span>
                      <IconButton
                        size="small"
                        className={styles.actionIconButton}
                        disabled={isUpdating}
                        aria-label={readActionLabel}
                        onClick={handleReadToggle}
                      >
                        <MarkEmailUnreadOutlinedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}

                <Tooltip title={archiveActionLabel} arrow>
                  <span>
                    <IconButton
                      size="small"
                      className={styles.actionIconButton}
                      disabled={isUpdating}
                      aria-label={archiveActionLabel}
                      onClick={handleArchiveToggle}
                    >
                      {isArchived ? (
                        <UnarchiveOutlinedIcon fontSize="small" />
                      ) : (
                        <ArchiveOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </div>

              <div className={styles.mobileActions}>
                <Tooltip title={readActionLabel} arrow>
                  <span>
                    <IconButton
                      size="small"
                      className={styles.actionIconButton}
                      disabled={isUpdating}
                      aria-label={readActionLabel}
                      onClick={handleReadToggle}
                    >
                      {!notification.isRead ? (
                        <CheckCircleOutlineRoundedIcon fontSize="small" />
                      ) : (
                        <MarkEmailUnreadOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={archiveActionLabel} arrow>
                  <span>
                    <IconButton
                      size="small"
                      className={styles.actionIconButton}
                      disabled={isUpdating}
                      aria-label={archiveActionLabel}
                      onClick={handleArchiveToggle}
                    >
                      {isArchived ? (
                        <UnarchiveOutlinedIcon fontSize="small" />
                      ) : (
                        <ArchiveOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default NotificationCard;
