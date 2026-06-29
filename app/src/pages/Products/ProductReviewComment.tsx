import { Typography } from "@mui/material";
import { useState, type ReactElement } from "react";

import { shouldTruncateReviewComment, truncateReviewComment } from "./product-reviews.api";
import styles from "./styles/ProductReviewsSection.module.scss";

type ProductReviewCommentProps = {
  readonly comment?: string | null;
};

export function ProductReviewComment({ comment }: ProductReviewCommentProps): ReactElement | null {
  const normalized = comment?.trim();
  const [expanded, setExpanded] = useState(false);

  if (!normalized) {
    return null;
  }

  const needsTruncate = shouldTruncateReviewComment(normalized);
  const displayText = needsTruncate && !expanded ? truncateReviewComment(normalized) : normalized;

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
