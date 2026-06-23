import { Typography } from "@mui/material";
import { useState, type ReactElement } from "react";

import {
  shouldTruncateReviewComment,
  truncateReviewComment,
} from "./course-reviews.api";
import styles from "./styles/CourseReviewsSection.module.scss";

type CourseReviewCommentProps = {
  readonly comment?: string | null;
};

export function CourseReviewComment({ comment }: CourseReviewCommentProps): ReactElement | null {
  const normalized = comment?.trim();
  const [expanded, setExpanded] = useState(false);

  if (!normalized) {
    return null;
  }

  const needsTruncate = shouldTruncateReviewComment(normalized);
  const displayText =
    needsTruncate && !expanded ? truncateReviewComment(normalized) : normalized;

  return (
    <Typography component="p" className={styles.reviewComment}>
      <span className={styles.reviewCommentText}>{displayText}</span>
      {needsTruncate ? (
        <button
          type="button"
          className={styles.reviewCommentContinueBadge}
          onClick={() => setExpanded((previous) => !previous)}
        >
          {expanded ? "نمایش کمتر" : "ادامه نظر"}
        </button>
      ) : null}
    </Typography>
  );
}
