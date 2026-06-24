import { Avatar, Chip, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { AvatarInitial } from "../../shared/display/AvatarInitial";
import StarRating from "../../shared/rating/StarRating";
import { resolveFileAccessUrl } from "../../utils/fileAccessUrl.util";
import { resolveAvatarInitial } from "../../utils/storedUser.util";
import CourseReviewThreadBubble from "./CourseReviewThreadBubble";
import {
  buildAdminCourseReviewThreadEntries,
  buildCourseReviewThreadSegments,
  resolveCourseReviewThreadPreviewEntries,
  type CourseReviewThreadMessageSegment,
} from "./course-review-thread.util";
import {
  COURSE_REVIEW_COMMENT_PREVIEW_LIMIT,
  resolveAdminReviewAuthorLabel,
  resolveDefaultReplyVisibility,
  type AdminCourseReviewRecord,
  type CourseReviewVisibility,
} from "./course-reviews.api";
import CourseReviewAdminMessageForm from "./CourseReviewAdminMessageForm";
import CourseReviewModerationSelect from "./CourseReviewModerationSelect";
import { useAdminCourseReviewModeration } from "./useAdminCourseReviewModeration";
import { useAdminCourseReviewReply } from "./useAdminCourseReviewReply";
import { scrollToCourseReviewBoxEnd } from "./course-review-box-scroll.util";
import styles from "./styles/CourseReviewsSection.module.scss";

type CourseReviewAdminCardProps = {
  readonly courseId: string;
  readonly review: AdminCourseReviewRecord;
  readonly limitCommentsPreview?: boolean;
  readonly onReplied: () => void;
  readonly onModerationUpdated: () => void;
};

type AdminSegmentModeration = {
  readonly visibility: CourseReviewVisibility;
  readonly hiddenReason?: string | null;
  readonly moderationTarget: "RATING" | "MESSAGE";
  readonly messageKey?: string;
};

function buildAdminSegmentModerationMap(
  review: AdminCourseReviewRecord
): Map<string, AdminSegmentModeration> {
  const moderationBySegmentKey = new Map<string, AdminSegmentModeration>();

  if (review.rating?.comment?.trim()) {
    moderationBySegmentKey.set("initial", {
      visibility: review.rating.moderation.visibility,
      hiddenReason: review.rating.moderation.hiddenReason,
      moderationTarget: "RATING",
    });
  }

  for (const message of review.messages) {
    moderationBySegmentKey.set(message.key, {
      visibility: message.moderation.visibility,
      hiddenReason: message.moderation.hiddenReason,
      moderationTarget: "MESSAGE",
      messageKey: message.key,
    });
  }

  return moderationBySegmentKey;
}

const CourseReviewAdminCard = ({
  courseId,
  review,
  limitCommentsPreview = true,
  onReplied,
  onModerationUpdated,
}: CourseReviewAdminCardProps): ReactElement => {
  const authorLabel = resolveAdminReviewAuthorLabel(review);
  const avatarUrl = resolveFileAccessUrl(review.user?.profile?.avatarAccessUrl);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const boxEndRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollToEndRef = useRef(false);
  const segmentModerationByKey = useMemo(() => buildAdminSegmentModerationMap(review), [review]);
  const adminThreadEntries = useMemo(() => buildAdminCourseReviewThreadEntries(review), [review]);
  const defaultReplyVisibility = useMemo(() => resolveDefaultReplyVisibility(review), [review]);
  const { isUpdating, updateVisibility } = useAdminCourseReviewModeration({
    reviewId: review.id,
    onUpdated: onModerationUpdated,
  });
  const handleReplied = useCallback((): void => {
    pendingScrollToEndRef.current = true;
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
    adminThreadEntries.length - COURSE_REVIEW_COMMENT_PREVIEW_LIMIT
  );
  const shouldCollapseComments =
    limitCommentsPreview && hiddenCommentCount > 0 && !commentsExpanded;
  const visibleThreadEntries = useMemo(
    () =>
      resolveCourseReviewThreadPreviewEntries(
        adminThreadEntries,
        COURSE_REVIEW_COMMENT_PREVIEW_LIMIT,
        shouldCollapseComments
      ),
    [adminThreadEntries, shouldCollapseComments]
  );
  const visibleThreadSegments = useMemo(
    () => buildCourseReviewThreadSegments(visibleThreadEntries),
    [visibleThreadEntries]
  );
  const trimmedReply = reply.trim();
  const canSubmitReply = trimmedReply.length > 0 && !isSubmitting;
  const moderationDisabled = isUpdating || isSubmitting;

  useEffect(() => {
    setCommentsExpanded(false);
  }, [review.id]);

  useEffect(() => {
    if (!pendingScrollToEndRef.current) {
      return;
    }

    pendingScrollToEndRef.current = false;
    scrollToCourseReviewBoxEnd(boxEndRef.current, { delayMs: 200 });
  }, [adminThreadEntries.length]);

  const renderSegmentActions = useCallback(
    (segment: CourseReviewThreadMessageSegment): ReactElement | null => {
      const moderation = segmentModerationByKey.get(segment.key);
      if (!moderation || moderation.moderationTarget === "RATING") {
        return null;
      }

      return (
        <div className={styles.reviewCommentBubbleSegmentModeration}>
          <CourseReviewModerationSelect
            value={moderation.visibility}
            disabled={moderationDisabled}
            onChange={(visibility) =>
              updateVisibility(moderation.moderationTarget, visibility, moderation.messageKey)
            }
          />
        </div>
      );
    },
    [moderationDisabled, segmentModerationByKey, updateVisibility]
  );

  const renderSegmentFooter = useCallback(
    (segment: CourseReviewThreadMessageSegment): ReactElement | null => {
      const hiddenReason = segmentModerationByKey.get(segment.key)?.hiddenReason;
      if (!hiddenReason) {
        return null;
      }

      return (
        <Typography variant="caption" color="error" className={styles.reviewModerationNote}>
          دلیل پنهان‌سازی: {hiddenReason}
        </Typography>
      );
    },
    [segmentModerationByKey]
  );

  return (
    <article className={styles.reviewUserBoxPlain} aria-label={`نظر ${authorLabel}`}>
      <div className={styles.reviewCardHeader}>
        <div className={styles.reviewCardTitleBlock}>
          <Avatar src={avatarUrl ?? undefined} className={styles.reviewAdminAvatar}>
            <AvatarInitial initial={resolveAvatarInitial(authorLabel)} />
          </Avatar>
          <div className={styles.reviewAdminIdentity}>
            <div className={styles.reviewAdminNameRow}>
              <Typography component="h3" className={styles.reviewCardAuthor}>
                {authorLabel}
              </Typography>
              <CourseReviewModerationSelect
                value={review.moderation.visibility}
                disabled={moderationDisabled}
                onChange={(visibility) => updateVisibility("REVIEW", visibility)}
              />
            </div>
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
        <div className={styles.reviewAdminRatingColumn}>
          {review.rating ? (
            <>
              <StarRating
                value={review.rating.stars}
                size="small"
                className={styles.reviewAdminRatingStars}
                ariaLabel={`امتیاز ${review.rating.stars}`}
              />
              <CourseReviewModerationSelect
                value={review.rating.moderation.visibility}
                disabled={moderationDisabled}
                onChange={(visibility) => updateVisibility("RATING", visibility)}
              />
            </>
          ) : (
            <Chip size="small" label="بدون امتیاز" variant="outlined" />
          )}
        </div>
      </div>

      {visibleThreadSegments.length > 0 ? (
        <div className={styles.reviewCommentsList}>
          <CourseReviewThreadBubble
            segments={visibleThreadSegments}
            isReviewMine={false}
            expandControlPlacement="top"
            segmentActionsPlacement="footer"
            expandControl={
              limitCommentsPreview && hiddenCommentCount > 0
                ? {
                    expanded: commentsExpanded,
                    hiddenCount: hiddenCommentCount,
                    onToggle: () => setCommentsExpanded((previous) => !previous),
                  }
                : undefined
            }
            renderSegmentActions={renderSegmentActions}
            renderSegmentFooter={renderSegmentFooter}
          />
        </div>
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
      <div ref={boxEndRef} className={styles.reviewUserBoxEndAnchor} aria-hidden="true" />
    </article>
  );
};

export default CourseReviewAdminCard;
