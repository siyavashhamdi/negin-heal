import { Button, CircularProgress, TextField, Typography } from "@mui/material";
import type { ReactElement } from "react";

import {
  COURSE_REVIEW_REPLY_VISIBILITY_OPTIONS,
  type CourseReviewReplyVisibility,
} from "./course-reviews.api";
import CourseReviewModerationSelect from "./CourseReviewModerationSelect";
import styles from "./styles/CourseReviewsSection.module.scss";

type CourseReviewAdminMessageFormProps = {
  readonly reply: string;
  readonly replyLength: number;
  readonly maxReplyLength: number;
  readonly replyVisibility: CourseReviewReplyVisibility;
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
  readonly onReplyChange: (value: string) => void;
  readonly onReplyVisibilityChange: (value: CourseReviewReplyVisibility) => void;
  readonly onSubmit: () => void;
  readonly placeholder?: string;
  readonly submitLabel?: string;
};

const CourseReviewAdminMessageForm = ({
  reply,
  replyLength,
  maxReplyLength,
  replyVisibility,
  isSubmitting,
  canSubmit,
  onReplyChange,
  onReplyVisibilityChange,
  onSubmit,
  placeholder = "پیام پشتیبانی را بنویسید…",
  submitLabel = "ارسال پیام",
}: CourseReviewAdminMessageFormProps): ReactElement => (
  <div className={styles.reviewCommentForm}>
    <TextField
      fullWidth
      multiline
      minRows={2}
      maxRows={5}
      placeholder={placeholder}
      value={reply}
      disabled={isSubmitting}
      onChange={(event) => onReplyChange(event.target.value)}
      helperText={`${replyLength.toLocaleString("fa-IR")} / ${maxReplyLength.toLocaleString("fa-IR")}`}
    />

    <div className={styles.reviewReplyActionsRow}>
      <div className={styles.reviewReplyVisibilityColumn}>
        <Typography component="span" variant="caption" color="text.secondary">
          نوع پیام
        </Typography>
        <CourseReviewModerationSelect
          value={replyVisibility}
          disabled={isSubmitting}
          options={COURSE_REVIEW_REPLY_VISIBILITY_OPTIONS}
          onChange={onReplyVisibilityChange}
        />
      </div>

      <Button
        type="button"
        variant="contained"
        size="small"
        disabled={!canSubmit}
        onClick={onSubmit}
        className={styles.reviewReplySubmitButton}
      >
        {isSubmitting ? <CircularProgress size={16} color="inherit" /> : submitLabel}
      </Button>
    </div>
  </div>
);

export default CourseReviewAdminMessageForm;
