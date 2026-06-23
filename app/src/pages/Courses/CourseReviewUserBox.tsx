import { Button, CircularProgress, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from "react";

import { useSnackbar } from "../../hooks/useSnackbar";
import StarRating from "../../shared/rating/StarRating";
import { formatRelativeTimeLabel } from "../../utilities/relative-time.util";
import {
  getCourseReviewMessageBubbleClassName,
  getCourseReviewMessageBubbleCssVars,
  resolveCourseReviewMessageBubbleTone,
} from "./course-review-message-bubble.util";
import { CourseReviewComment } from "./CourseReviewComment";
import CourseReviewCaptchaDialog from "./CourseReviewCaptchaDialog";
import {
  COURSE_REVIEW_COMMENT_PREVIEW_LIMIT,
  type EndUserCourseReviewRecord,
} from "./course-reviews.api";
import { useCourseReviewSubmit } from "./useCourseReviewSubmit";
import styles from "./styles/CourseReviewsSection.module.scss";

const MAX_COMMENT_LENGTH = 2000;

type CourseReviewUserBoxProps = {
  readonly review: EndUserCourseReviewRecord | null;
  readonly authorLabel: string;
  readonly canEdit: boolean;
  readonly limitCommentsPreview?: boolean;
  readonly courseId: string;
  readonly onSubmitted: () => void;
};

type ThreadEntry = {
  readonly key: string;
  readonly body: string;
  readonly sentAt: string;
  readonly authorLabel: string;
  readonly isOwnMessage: boolean;
  readonly isSupport: boolean;
};

function buildThreadEntries(
  review: EndUserCourseReviewRecord | null,
  authorLabel: string,
  isMine: boolean,
): ThreadEntry[] {
  if (!review) {
    return [];
  }

  const entries: ThreadEntry[] = [];

  if (review.rating?.comment?.trim()) {
    entries.push({
      key: "initial",
      body: review.rating.comment.trim(),
      sentAt: review.rating.updatedAt ?? review.rating.ratedAt,
      authorLabel,
      isOwnMessage: isMine,
      isSupport: false,
    });
  }

  for (const message of review.messages) {
    entries.push({
      key: message.key,
      body: message.body,
      sentAt: message.sentAt,
      authorLabel: message.sender.isSupport ? message.sender.firstName : authorLabel,
      isOwnMessage: isMine && !message.sender.isSupport,
      isSupport: message.sender.isSupport,
    });
  }

  return entries.sort(
    (left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
  );
}

function ReviewCommentBubble({ entry }: { readonly entry: ThreadEntry }): ReactElement {
  const theme = useTheme();
  const tone = resolveCourseReviewMessageBubbleTone(entry.isOwnMessage, entry.isSupport);
  const bubbleClassName = getCourseReviewMessageBubbleClassName(styles, tone);

  return (
    <div className={styles.reviewCommentBubbleRow}>
      <div
        className={`${styles.reviewCommentBubble} ${bubbleClassName}`}
        style={
          getCourseReviewMessageBubbleCssVars(tone, theme.palette.mode === "dark") as CSSProperties
        }
      >
        <div className={styles.reviewCommentBubbleHeader}>
          <Typography component="p" className={styles.reviewCommentBubbleName}>
            {entry.authorLabel}
          </Typography>
          <Typography
            component="time"
            variant="caption"
            className={styles.reviewCommentBubbleDate}
          >
            {formatRelativeTimeLabel(entry.sentAt)}
          </Typography>
        </div>
        <CourseReviewComment comment={entry.body} />
      </div>
    </div>
  );
}

const CourseReviewUserBox = ({
  review,
  authorLabel,
  canEdit,
  limitCommentsPreview = false,
  courseId,
  onSubmitted,
}: CourseReviewUserBoxProps): ReactElement => {
  const { showSuccess } = useSnackbar();
  const persistedStars = review?.rating?.stars ?? 0;
  const hasExistingRating = Boolean(review?.rating);
  const hasExistingReview = Boolean(review);
  const hasPersistedStars = persistedStars >= 1;
  const isMine = canEdit || Boolean(review?.isMine);
  const [stars, setStars] = useState(persistedStars);
  const [comment, setComment] = useState("");
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const showNoStarsYet = !hasPersistedStars && stars < 1;

  useEffect(() => {
    setCommentsExpanded(false);
  }, [review?.id]);

  const {
    captchaDialogOpen,
    captchaEnabled,
    captchaVersion,
    captchaValid,
    clearStarAutoSubmitBlock,
    closeCaptchaDialog,
    confirmCaptchaDialog,
    handleCaptchaChange,
    isSubmitting,
    pendingIsStarUpdate,
    pendingSubmitStars,
    submitComment,
    submitStars,
    successMessageRef,
  } = useCourseReviewSubmit({
    courseId,
    persistedStars,
    hasExistingRating,
    hasExistingReview,
    onSubmitted: () => {
      showSuccess(successMessageRef.current);
      setComment("");
      onSubmitted();
    },
  });

  useEffect(() => {
    setStars(persistedStars);
    clearStarAutoSubmitBlock();
  }, [clearStarAutoSubmitBlock, review?.id, persistedStars]);

  const threadEntries = useMemo(
    () => buildThreadEntries(review, authorLabel, isMine),
    [authorLabel, isMine, review],
  );
  const hiddenCommentCount = Math.max(
    0,
    threadEntries.length - COURSE_REVIEW_COMMENT_PREVIEW_LIMIT,
  );
  const shouldCollapseComments =
    limitCommentsPreview && hiddenCommentCount > 0 && !commentsExpanded;
  const visibleThreadEntries = shouldCollapseComments
    ? threadEntries.slice(0, COURSE_REVIEW_COMMENT_PREVIEW_LIMIT)
    : threadEntries;
  const hasRating = (review?.rating?.stars ?? 0) >= 1;
  const hasComments = threadEntries.length > 0;
  const hasRatingOrComments = hasRating || hasComments;
  const trimmedComment = comment.trim();
  const canSubmitComment = trimmedComment.length > 0 && canEdit && !isSubmitting;

  useEffect(() => {
    if (!canEdit || isSubmitting || captchaDialogOpen || stars < 1 || stars === persistedStars) {
      return;
    }

    submitStars(stars);
  }, [canEdit, captchaDialogOpen, isSubmitting, persistedStars, stars, submitStars]);

  const handleStarChange = (nextStars: number): void => {
    setStars(nextStars);
  };

  const handleCommentSubmit = (): void => {
    if (!canSubmitComment) {
      return;
    }

    submitComment(stars, trimmedComment);
  };

  const handleCaptchaDialogClose = (): void => {
    if (pendingIsStarUpdate) {
      setStars(persistedStars);
    }

    closeCaptchaDialog();
  };

  return (
    <>
      <article
        className={`${styles.reviewUserBox}${isMine ? ` ${styles.reviewUserBoxMine}` : ""}`}
        aria-label={`نظر ${authorLabel}`}
      >
        <header
          className={`${styles.reviewUserHeader}${
            canEdit ? ` ${styles.reviewUserHeaderStars}` : ` ${styles.reviewUserHeaderOther}`
          }${hasRatingOrComments ? ` ${styles.reviewUserHeaderNoDivider}` : ""}`}
        >
          {canEdit ? (
            <div className={styles.reviewUserStarsRow}>
              <Typography component="h3" className={styles.reviewUserAuthor}>
                نظر شما:
              </Typography>
              {showNoStarsYet ? (
                <Typography
                  component="span"
                  variant="body2"
                  className={styles.reviewUserStarsEmpty}
                >
                  هنوز امتیازی ثبت نکرده‌اید.
                </Typography>
              ) : null}
              <StarRating
                mode="input"
                value={stars}
                size="large"
                disabled={isSubmitting}
                onChange={handleStarChange}
              />
            </div>
          ) : (
            <>
              <Typography component="h3" className={styles.reviewUserAuthor}>
                {authorLabel}
              </Typography>
              {review?.rating ? (
                <StarRating
                  value={review.rating.stars}
                  size="medium"
                  ariaLabel={`امتیاز ${review.rating.stars}`}
                />
              ) : null}
            </>
          )}
          {isSubmitting ? <CircularProgress size={16} aria-label="در حال ذخیره" /> : null}
        </header>

        <div className={styles.reviewCommentsList}>
          {visibleThreadEntries.length > 0 ? (
            visibleThreadEntries.map((entry) => (
              <ReviewCommentBubble key={entry.key} entry={entry} />
            ))
          ) : canEdit ? (
            <div className={styles.reviewCommentBoxEmpty}>
              <Typography variant="body2" color="text.secondary">
                هنوز نظری ثبت نکرده‌اید.
              </Typography>
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
        </div>

        {canEdit ? (
          <div className={styles.reviewCommentForm}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              maxRows={6}
              placeholder="نظر خود را بنویسید…"
              value={comment}
              disabled={isSubmitting}
              onChange={(event) => setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
              helperText={`${comment.length.toLocaleString("fa-IR")} / ${MAX_COMMENT_LENGTH.toLocaleString("fa-IR")}`}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={!canSubmitComment}
              onClick={handleCommentSubmit}
              className={styles.submitButton}
            >
              ثبت نظر
            </Button>
          </div>
        ) : null}
      </article>

      {captchaEnabled ? (
        <CourseReviewCaptchaDialog
          open={captchaDialogOpen}
          captchaVersion={captchaVersion}
          submitting={isSubmitting}
          canConfirm={captchaValid}
          selectedStars={pendingSubmitStars}
          onClose={handleCaptchaDialogClose}
          onConfirm={confirmCaptchaDialog}
          onCaptchaChange={handleCaptchaChange}
        />
      ) : null}
    </>
  );
};

export default CourseReviewUserBox;
