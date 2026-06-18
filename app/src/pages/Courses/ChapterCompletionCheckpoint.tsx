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
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import styles from "./styles/ChapterCompletionCheckpoint.module.scss";

type ChapterCompletionCheckpointProps = {
  readonly chapterTitle: string;
  readonly chapterIndex: number;
  readonly isCompleted: boolean;
  readonly userCompletedAt?: string | null;
  readonly canComplete: boolean;
  readonly isSubmitting: boolean;
  readonly hasNextChapter: boolean;
  readonly onConfirm: () => void;
  readonly onGoToNextChapter?: () => void;
};

function formatCompletionDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ChapterCompletionCheckpoint({
  chapterTitle,
  chapterIndex,
  isCompleted,
  userCompletedAt,
  canComplete,
  isSubmitting,
  hasNextChapter,
  onConfirm,
  onGoToNextChapter,
}: ChapterCompletionCheckpointProps): ReactElement | null {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  if (!canComplete && !isCompleted) {
    return null;
  }

  const completionDateLabel = formatCompletionDate(userCompletedAt);

  if (isCompleted) {
    return (
      <section
        className={styles.checkpoint}
        aria-label={`وضعیت تکمیل فصل ${chapterTitle}`}
      >
        <div className={styles.completedCard}>
          <div className={styles.completedIconWrap} aria-hidden="true">
            <CheckCircleRoundedIcon className={styles.completedIcon} />
          </div>
          <div className={styles.completedBody}>
            <span className={styles.completedEyebrow}>فصل تکمیل شد</span>
            <h3>آفرین! این فصل را به پایان رساندید.</h3>
            <p>
              «{chapterTitle}» در مسیر یادگیری شما ثبت شد
              {completionDateLabel ? ` · ${completionDateLabel}` : ""}.
            </p>
          </div>
          {hasNextChapter && onGoToNextChapter ? (
            <Button
              variant="contained"
              size="large"
              endIcon={<NavigateNextRoundedIcon />}
              className={styles.nextChapterButton}
              onClick={onGoToNextChapter}
            >
              ادامه به فصل بعد
            </Button>
          ) : (
            <div className={styles.courseFinishedHint}>
              <EmojiEventsRoundedIcon fontSize="small" aria-hidden="true" />
              <span>فصل‌های در دسترس این دوره را تکمیل کردید.</span>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.checkpoint}
      aria-label={`تأیید تکمیل فصل ${chapterTitle}`}
    >
      <div className={styles.pendingCard}>
        <div className={styles.pendingHeader}>
          <div className={styles.pendingIconWrap} aria-hidden="true">
            <FlagRoundedIcon className={styles.pendingIcon} />
          </div>
          <div className={styles.pendingIntro}>
            <span className={styles.pendingEyebrow}>
              پایان فصل {(chapterIndex + 1).toLocaleString("fa-IR")}
            </span>
            <h3>آیا مطالب این فصل را کامل مرور کردید؟</h3>
            <p>
              با تأیید تکمیل، پیشرفت شما ذخیره می‌شود و مسیر یادگیری دوره به‌روز
              می‌ماند.
            </p>
          </div>
        </div>

        <FormControlLabel
          className={styles.acknowledgement}
          control={
            <Checkbox
              checked={hasAcknowledged}
              onChange={(event) => setHasAcknowledged(event.target.checked)}
              disabled={isSubmitting}
              color="success"
            />
          }
          label="مطالب این فصل را مرور کردم و آماده ادامه مسیر هستم."
        />

        <div className={styles.pendingActions}>
          <Button
            variant="contained"
            size="large"
            color="success"
            disabled={!hasAcknowledged || isSubmitting}
            onClick={onConfirm}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <CheckCircleRoundedIcon />
              )
            }
            className={styles.confirmButton}
          >
            {isSubmitting ? "در حال ثبت..." : "تأیید تکمیل فصل"}
          </Button>
          <span className={styles.pendingHint}>
            این تأیید فقط برای پیگیری پیشرفت شخصی شماست.
          </span>
        </div>
      </div>
    </section>
  );
}

type CourseProgressSummaryProps = {
  readonly completedChapterCount: number;
  readonly accessibleChapterCount: number;
  readonly visible: boolean;
};

export function CourseProgressSummary({
  completedChapterCount,
  accessibleChapterCount,
  visible,
}: CourseProgressSummaryProps): ReactElement | null {
  if (!visible || accessibleChapterCount <= 0) {
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
          همه فصل‌های در دسترس را تکمیل کردید!
        </span>
      ) : null}
    </div>
  );
}
