import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { IconButton } from "@mui/material";
import { type ReactElement, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import { useTranslation } from "../../hooks/useTranslation";
import {
  resolveNotificationCourseLink,
  type NotificationCourseLink,
} from "../../utilities/notification-course-link.util";
import { formatRelativeTimeLabel } from "../../utilities/relative-time.util";
import {
  NOTIFICATION_SOURCE_LABEL,
  type NotificationMode,
  type NotificationRecord,
} from "./notifications-list.api";
import styles from "./styles/notifications.module.scss";
import { opaqueShellProps } from "../../shared/opaqueShell";
import AppTooltip from "../../shared/AppTooltip";

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

type CourseActionLinkProps = {
  readonly courseLink: NotificationCourseLink;
  readonly label: string;
  readonly onNavigate: () => void;
};

const CourseActionLink = ({
  courseLink,
  label,
  onNavigate,
}: CourseActionLinkProps): ReactElement => (
  <span className={styles.cardMessageLinkWrap}>
    <RouterLink to={courseLink.href} className={styles.cardMessageLink} onClick={onNavigate}>
      <span>{label}</span>
      <ArrowBackRoundedIcon fontSize="inherit" />
    </RouterLink>
  </span>
);

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
  const courseLink = useMemo(
    () => resolveNotificationCourseLink(notification.source, notification.payload),
    [notification.payload, notification.source]
  );
  const courseLinkActionLabel = courseLink
    ? t(`pages.notifications.${courseLink.actionLabel}.action`)
    : null;
  const isChapterReleaseNotification = notification.source === "COURSE_CHAPTER";
  const showChapterAction = isChapterReleaseNotification && courseLink != null;
  const showPaymentAction = notification.source === "PAYMENT" && courseLink != null;
  const handleCourseLinkClick = (): void => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
  };
  const readActionLabel = t(
    !notification.isRead
      ? "pages.notifications.actions.markRead"
      : "pages.notifications.actions.markUnread"
  );
  const archiveActionLabel = t(
    isArchived ? "pages.notifications.actions.unarchive" : "pages.notifications.actions.archive"
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
    <article
      className={cardClassName}
      {...opaqueShellProps}
      aria-labelledby={`notification-title-${notification.id}`}
    >
      <div className={styles.cardAccent} aria-hidden="true" />

      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIconWrap}>
            <ModeIcon fontSize="small" />
          </div>

          <div className={styles.cardTitleRow}>
            <h3 id={`notification-title-${notification.id}`}>{notification.title}</h3>
            {!notification.isRead ? <span className={styles.unreadDot} aria-hidden="true" /> : null}
          </div>
        </div>

        {showChapterAction && courseLink && courseLinkActionLabel ? (
          <div className={styles.cardSourceRow}>
            <span className={styles.cardSourceBadge}>
              {NOTIFICATION_SOURCE_LABEL.COURSE_CHAPTER}
            </span>
            <CourseActionLink
              courseLink={courseLink}
              label={courseLinkActionLabel}
              onNavigate={handleCourseLinkClick}
            />
          </div>
        ) : null}

        {shouldShowMessage || showPaymentAction ? (
          <p className={styles.cardMessage}>
            {shouldShowMessage ? notification.message : null}
            {showPaymentAction && courseLink && courseLinkActionLabel ? (
              <CourseActionLink
                courseLink={courseLink}
                label={courseLinkActionLabel}
                onNavigate={handleCourseLinkClick}
              />
            ) : null}
          </p>
        ) : null}

        <div className={styles.cardFooter}>
          <time className={styles.cardTime} dateTime={notification.createdAt ?? undefined}>
            {timeLabel}
          </time>

          {notification.isActionable ? (
            <>
              <div className={styles.cardActions}>
                {!notification.isRead ? (
                  <AppTooltip title={readActionLabel} arrow>
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
                  </AppTooltip>
                ) : (
                  <AppTooltip title={readActionLabel} arrow>
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
                  </AppTooltip>
                )}

                <AppTooltip title={archiveActionLabel} arrow>
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
                </AppTooltip>
              </div>

              <div className={styles.mobileActions}>
                <AppTooltip title={readActionLabel} arrow>
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
                </AppTooltip>
                <AppTooltip title={archiveActionLabel} arrow>
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
                </AppTooltip>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default NotificationCard;
