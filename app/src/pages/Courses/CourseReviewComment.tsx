import { Button, Typography } from "@mui/material";
import { useState, type ReactElement } from "react";

import { formatRelativeTimeLabel } from "../../utilities/relative-time.util";
import {
  resolveReviewRatingDate,
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
    <div className={styles.reviewCommentBlock}>
      <Typography component="p" className={styles.reviewComment}>
        {displayText}
      </Typography>
      {needsTruncate ? (
        <Button
          type="button"
          size="small"
          variant="text"
          className={styles.reviewCommentToggle}
          onClick={() => setExpanded((previous) => !previous)}
        >
          {expanded ? "نمایش کمتر" : "ادامه نظر"}
        </Button>
      ) : null}
    </div>
  );
}

export function formatReviewDateLabel(
  rating?: { readonly ratedAt: string; readonly updatedAt?: string | null } | null,
): string | null {
  const dateValue = resolveReviewRatingDate(rating);
  if (!dateValue) {
    return null;
  }

  return formatRelativeTimeLabel(dateValue);
}
