import { Avatar, Button, Chip, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

import StarRating from "../../shared/rating/StarRating";
import { resolveFileAccessUrl } from "../../utils/fileAccessUrl.util";
import { resolveAvatarInitial } from "../../utils/storedUser.util";
import { formatRelativeTimeLabel } from "../../utilities/relative-time.util";
import {
  COURSE_REVIEW_COMMENT_PREVIEW_LIMIT,
  type AdminCourseReviewRecord,
  type CourseReviewVisibility,
  resolveAdminReviewAuthorLabel,
  resolveDefaultReplyVisibility,
} from "./course-reviews.api";
import { CourseReviewComment } from "./CourseReviewComment";
import CourseReviewAdminMessageForm from "./CourseReviewAdminMessageForm";
import CourseReviewModerationSelect from "./CourseReviewModerationSelect";
import { useAdminCourseReviewModeration } from "./useAdminCourseReviewModeration";
import { useAdminCourseReviewReply } from "./useAdminCourseReviewReply";
import styles from "./styles/CourseReviewsSection.module.scss";

type CourseReviewAdminCardProps = {
  readonly courseId: string;
  readonly review: AdminCourseReviewRecord;
  readonly limitCommentsPreview?: boolean;
  readonly onReplied: () => void;
  readonly onModerationUpdated: () => void;
};

type AdminCommentEntry = {
  readonly key: string;
  readonly body: string;
  readonly sentAt: string;
  readonly senderLabel: string;
  readonly visibility: CourseReviewVisibility;
  readonly hiddenReason?: string | null;
  readonly moderationTarget: "RATING" | "MESSAGE";
  readonly messageKey?: string;
};

function resolveAdminSenderLabel(
  review: AdminCourseReviewRecord,
  senderUserId: string,
): string {
  if (senderUserId !== review.userId) {
    return "پشتیبانی";
  }

  return resolveAdminReviewAuthorLabel(review);
}

function buildAdminCommentEntries(review: AdminCourseReviewRecord): AdminCommentEntry[] {
  const entries: AdminCommentEntry[] = [];
  const authorLabel = resolveAdminReviewAuthorLabel(review);

  if (review.rating?.comment?.trim()) {
    entries.push({
      key: "rating-comment",
      body: review.rating.comment.trim(),
      sentAt: review.rating.updatedAt ?? review.rating.ratedAt,
      senderLabel: authorLabel,
      visibility: review.rating.moderation.visibility,
      hiddenReason: review.rating.moderation.hiddenReason,
      moderationTarget: "RATING",
    });
  }

  for (const message of review.messages) {
    entries.push({
      key: message.key,
      body: message.body,
      sentAt: message.sentAt,
      senderLabel: resolveAdminSenderLabel(review, message.senderUserId),
      visibility: message.moderation.visibility,
      hiddenReason: message.moderation.hiddenReason,
      moderationTarget: "MESSAGE",
      messageKey: message.key,
    });
  }

  return entries;
}

const CourseReviewAdminCard = ({
  courseId,
  review,
  limitCommentsPreview = false,
  onReplied,
  onModerationUpdated,
}: CourseReviewAdminCardProps): ReactElement => {
  const authorLabel = resolveAdminReviewAuthorLabel(review);
  const avatarUrl = resolveFileAccessUrl(review.user?.profile?.avatarAccessUrl);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const commentEntries = useMemo(() => buildAdminCommentEntries(review), [review]);
  const defaultReplyVisibility = useMemo(
    () => resolveDefaultReplyVisibility(review),
    [review],
  );
  const { isUpdating, updateVisibility } = useAdminCourseReviewModeration({
    reviewId: review.id,
    onUpdated: onModerationUpdated,
  });
  const handleReplied = useCallback((): void => {
    setCommentsExpanded(true);
    onReplied();
  }, [onReplied]);
  const {
    handleReplyChange,
    handleReplyVisibilityChange,
    isSubmitting,
    reply,
    replyLength,
    replyVisibility,
    maxReplyLength,
    submitAdminReply,
  } = useAdminCourseReviewReply({
    courseId,
    reviewUserId: review.userId,
    defaultReplyVisibility,
    onSubmitted: handleReplied,
  });
  const hiddenCommentCount = Math.max(
    0,
    commentEntries.length - COURSE_REVIEW_COMMENT_PREVIEW_LIMIT,
  );
  const shouldCollapseComments =
    limitCommentsPreview && hiddenCommentCount > 0 && !commentsExpanded;
  const visibleCommentEntries = shouldCollapseComments
    ? commentEntries.slice(0, COURSE_REVIEW_COMMENT_PREVIEW_LIMIT)
    : commentEntries;
  const trimmedReply = reply.trim();
  const canSubmitReply = trimmedReply.length > 0 && !isSubmitting;
  const moderationDisabled = isUpdating || isSubmitting;

  useEffect(() => {
    setCommentsExpanded(false);
  }, [review.id]);

  return (
    <article
      className={`${styles.reviewCard} ${styles.reviewCardAdmin}`}
      aria-label={`نظر ${authorLabel}`}
    >
      <div className={styles.reviewCardHeader}>
        <div className={styles.reviewCardTitleBlock}>
          <div className={styles.reviewAdminAvatarColumn}>
            <Avatar src={avatarUrl ?? undefined} className={styles.reviewAdminAvatar}>
              {resolveAvatarInitial(authorLabel)}
            </Avatar>
            <CourseReviewModerationSelect
              value={review.moderation.visibility}
              disabled={moderationDisabled}
              onChange={(visibility) => updateVisibility("REVIEW", visibility)}
            />
          </div>
          <div className={styles.reviewAdminIdentity}>
            <Typography component="h3" className={styles.reviewCardAuthor}>
              {authorLabel}
            </Typography>
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              className={styles.reviewAdminUsername}
              dir="ltr"
              lang="en"
            >
              @{review.userSnapshot.username}
            </Typography>
          </div>
        </div>
        <div className={styles.reviewAdminMetaRow}>
          {review.rating ? (
            <>
              <CourseReviewModerationSelect
                value={review.rating.moderation.visibility}
                disabled={moderationDisabled}
                onChange={(visibility) => updateVisibility("RATING", visibility)}
              />
              <StarRating
                value={review.rating.stars}
                size="small"
                ariaLabel={`امتیاز ${review.rating.stars}`}
              />
            </>
          ) : (
            <Chip size="small" label="بدون امتیاز" variant="outlined" />
          )}
        </div>
      </div>

      {visibleCommentEntries.length > 0 ? (
        <div className={styles.reviewThreadList}>
          {visibleCommentEntries.map((entry) => (
            <div key={entry.key} className={styles.reviewThreadMessage}>
              <div className={styles.reviewThreadMessageHeader}>
                <div className={styles.reviewThreadMessageHeaderMain}>
                  <strong>{entry.senderLabel}</strong>
                  <CourseReviewModerationSelect
                    value={entry.visibility}
                    disabled={moderationDisabled}
                    onChange={(visibility) =>
                      updateVisibility(
                        entry.moderationTarget,
                        visibility,
                        entry.messageKey,
                      )
                    }
                  />
                </div>
                <Typography
                  component="time"
                  variant="caption"
                  className={styles.reviewThreadMessageDate}
                >
                  {formatRelativeTimeLabel(entry.sentAt)}
                </Typography>
              </div>
              <CourseReviewComment comment={entry.body} />
              {entry.hiddenReason ? (
                <Typography variant="caption" color="error" className={styles.reviewModerationNote}>
                  دلیل پنهان‌سازی: {entry.hiddenReason}
                </Typography>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {limitCommentsPreview && hiddenCommentCount > 0 ? (
        <Button
          type="button"
          size="small"
          variant="text"
          className={styles.reviewCommentsExpandButton}
          onClick={() => setCommentsExpanded((previous) => !previous)}
        >
          {commentsExpanded
            ? "نمایش کمتر"
            : `نمایش ${hiddenCommentCount.toLocaleString("fa-IR")} نظر دیگر`}
        </Button>
      ) : null}

      <CourseReviewAdminMessageForm
        reply={reply}
        replyLength={replyLength}
        maxReplyLength={maxReplyLength}
        replyVisibility={replyVisibility}
        isSubmitting={isSubmitting}
        canSubmit={canSubmitReply}
        onReplyChange={handleReplyChange}
        onReplyVisibilityChange={handleReplyVisibilityChange}
        onSubmit={submitAdminReply}
      />
    </article>
  );
};

export default CourseReviewAdminCard;
