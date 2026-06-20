import { useState, type ReactElement } from "react";
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import styles from "./styles/ChapterCompletionCheckpoint.module.scss";

type ChapterCompletionCheckpointProps = {
  readonly chapterTitle: string;
  readonly isCompleted: boolean;
  readonly canComplete: boolean;
  readonly isSubmitting: boolean;
  readonly hasNextChapter: boolean;
  readonly isSingleChapter?: boolean;
  readonly onConfirm: () => void;
  readonly onGoToNextChapter?: () => void;
};

export function ChapterCompletionCheckpoint({
  chapterTitle,
  isCompleted,
  canComplete,
  isSubmitting,
  hasNextChapter,
  isSingleChapter = false,
  onConfirm,
  onGoToNextChapter,
}: ChapterCompletionCheckpointProps): ReactElement | null {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const completionScopeLabel = isSingleChapter ? "دوره" : `فصل ${chapterTitle}`;

  if (!canComplete && !isCompleted) {
    return null;
  }

  if (isCompleted) {
    return (
      <section
        className={styles.checkpoint}
        aria-label={`وضعیت تکمیل ${completionScopeLabel}`}
      >
        <div className={styles.completedCard}>
          <span className={styles.completedMessage}>
            <CheckCircleRoundedIcon fontSize="small" aria-hidden="true" />
            تکمیل شد
          </span>
          {hasNextChapter && onGoToNextChapter ? (
            <Button
              variant="text"
              size="small"
              color="success"
              endIcon={<NavigateNextRoundedIcon />}
              className={styles.nextChapterButton}
              onClick={onGoToNextChapter}
            >
              فصل بعد
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.checkpoint}
      aria-label={`تأیید تکمیل ${completionScopeLabel}`}
    >
      <div className={styles.pendingCard}>
        <div className={styles.pendingMain}>
          <FormControlLabel
            className={styles.acknowledgement}
            control={
              <Checkbox
                checked={hasAcknowledged}
                onChange={(event) => setHasAcknowledged(event.target.checked)}
                disabled={isSubmitting}
                color="success"
                size="small"
              />
            }
            label={
              isSingleChapter
                ? "محتوای دوره را کامل مرور کردم."
                : "این فصل را کامل مرور کردم."
            }
          />
          <Button
            variant="contained"
            size="small"
            color="success"
            disabled={!hasAcknowledged || isSubmitting}
            onClick={onConfirm}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <CheckCircleRoundedIcon />
              )
            }
            className={styles.confirmButton}
          >
            {isSubmitting ? "..." : "تأیید تکمیل"}
          </Button>
        </div>
        <span className={styles.pendingHint}>
          این تأیید فقط برای پیگیری پیشرفت شخصی شماست.
        </span>
      </div>
    </section>
  );
}

type CourseProgressSummaryProps = {
  readonly completedChapterCount: number;
  readonly accessibleChapterCount: number;
  readonly visible: boolean;
  readonly isSingleChapter?: boolean;
};

export function CourseProgressSummary({
  completedChapterCount,
  accessibleChapterCount,
  visible,
  isSingleChapter = false,
}: CourseProgressSummaryProps): ReactElement | null {
  if (!visible || accessibleChapterCount <= 0 || isSingleChapter) {
    return null;
  }

  const progressPercent = Math.round(
    (completedChapterCount / accessibleChapterCount) * 100,
  );
  const isFullyComplete =
    completedChapterCount >= accessibleChapterCount && accessibleChapterCount > 0;

  return (
    <div
      className={`${styles.progressSummary}${isFullyComplete ? ` ${styles.progressSummaryComplete}` : ""}`}
      aria-label="پیشرفت دوره"
    >
      <div className={styles.progressSummaryHeader}>
        <span className={styles.progressSummaryLabel}>پیشرفت شما</span>
        <strong className={styles.progressSummaryValue}>
          {completedChapterCount.toLocaleString("fa-IR")} از{" "}
          {accessibleChapterCount.toLocaleString("fa-IR")} فصل
        </strong>
      </div>
      <LinearProgress
        variant="determinate"
        value={progressPercent}
        className={styles.progressBar}
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      />
      {isFullyComplete ? (
        <span className={styles.progressCompleteMessage}>
          <EmojiEventsRoundedIcon fontSize="inherit" aria-hidden="true" />
          همه فصل‌های قابل مشاهده را تکمیل کردید!
        </span>
      ) : null}
    </div>
  );
}
