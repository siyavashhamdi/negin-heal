import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Typography } from "@mui/material";
import type { ReactElement, ReactNode } from "react";

import DateTimeValue from "../../shared/display/DateTimeValue";
import StarRating from "../../shared/rating/StarRating";
import {
  getProductReviewMessageBubbleClassName,
  resolveProductReviewMessageBubbleTone,
} from "./product-review-message-bubble.util";
import { ProductReviewComment } from "./ProductReviewComment";
import type { ProductReviewThreadMessageSegment } from "./product-review-thread.util";
import styles from "./styles/ProductReviewsSection.module.scss";

export type ProductReviewThreadExpandControl = {
  readonly expanded: boolean;
  readonly hiddenCount: number;
  readonly onToggle: () => void;
};

type ProductReviewThreadBubbleProps = {
  readonly segments: ReadonlyArray<ProductReviewThreadMessageSegment>;
  readonly isReviewMine: boolean;
  readonly hideSegmentStars?: boolean;
  readonly expandControl?: ProductReviewThreadExpandControl;
  readonly expandControlPlacement?: "top" | "bottom";
  readonly segmentActionsPlacement?: "author" | "footer";
  readonly renderSegmentActions?: (segment: ProductReviewThreadMessageSegment) => ReactNode;
  readonly renderSegmentFooter?: (segment: ProductReviewThreadMessageSegment) => ReactNode;
};

const ProductReviewThreadBubble = ({
  segments,
  isReviewMine,
  hideSegmentStars = false,
  expandControl,
  expandControlPlacement = "bottom",
  segmentActionsPlacement = "author",
  renderSegmentActions,
  renderSegmentFooter,
}: ProductReviewThreadBubbleProps): ReactElement => {
  const tone = resolveProductReviewMessageBubbleTone(isReviewMine, false);
  const bubbleClassName = getProductReviewMessageBubbleClassName(styles, tone);

  const renderExpandControl = (): ReactElement | null => {
    if (!expandControl) {
      return null;
    }

    return (
      <button
        type="button"
        className={styles.reviewCommentsExpandInline}
        onClick={expandControl.onToggle}
        aria-expanded={expandControl.expanded}
      >
        <span>
          {expandControl.expanded
            ? "نمایش کمتر"
            : `نمایش ${expandControl.hiddenCount.toLocaleString("fa-IR")} نظر دیگر`}
        </span>
        {expandControl.expanded ? (
          <ExpandLessRoundedIcon fontSize="inherit" />
        ) : (
          <ExpandMoreRoundedIcon fontSize="inherit" />
        )}
      </button>
    );
  };

  return (
    <div className={styles.reviewCommentBubbleRow}>
      <div className={`${styles.reviewCommentBubble} ${bubbleClassName}`}>
        {expandControl && expandControlPlacement === "top" ? (
          <>
            {renderExpandControl()}
            {segments.length > 0 ? (
              <div
                className={styles.reviewCommentBubbleDivider}
                role="separator"
                aria-hidden="true"
              />
            ) : null}
          </>
        ) : null}

        <div className={styles.reviewCommentBubbleMessages}>
          {segments.map((segment, index) => (
            <div key={segment.key} className={styles.reviewCommentBubbleMessage}>
              {index > 0 ? (
                <div
                  className={styles.reviewCommentBubbleDivider}
                  role="separator"
                  aria-hidden="true"
                />
              ) : null}
              {segment.showAuthorLabel ? (
                <div
                  className={`${styles.reviewCommentBubbleSegmentAuthor}${
                    segment.isSupport ? ` ${styles.reviewCommentBubbleSegmentAuthorSupport}` : ""
                  }${
                    !isReviewMine && segment.stars != null && segment.stars >= 1
                      ? ` ${styles.reviewCommentBubbleSegmentAuthorStarsApart}`
                      : ""
                  }`}
                >
                  {!hideSegmentStars &&
                  !isReviewMine &&
                  segment.stars != null &&
                  segment.stars >= 1 ? (
                    <>
                      <Typography component="p" className={styles.reviewCommentBubbleName}>
                        {segment.authorLabel}
                      </Typography>
                      <StarRating
                        value={segment.stars}
                        size="small"
                        ariaLabel={`امتیاز ${segment.stars}`}
                      />
                    </>
                  ) : !hideSegmentStars && segment.stars != null && segment.stars >= 1 ? (
                    <div className={styles.reviewCommentBubbleNameRow}>
                      <StarRating
                        value={segment.stars}
                        size="small"
                        ariaLabel={`امتیاز ${segment.stars}`}
                      />
                      <Typography component="p" className={styles.reviewCommentBubbleName}>
                        {segment.authorLabel}
                      </Typography>
                    </div>
                  ) : (
                    <Typography component="p" className={styles.reviewCommentBubbleName}>
                      {segment.authorLabel}
                    </Typography>
                  )}
                  {segmentActionsPlacement === "author" ? renderSegmentActions?.(segment) : null}
                </div>
              ) : segmentActionsPlacement === "author" && renderSegmentActions ? (
                <div className={styles.reviewCommentBubbleSegmentActionsOnly}>
                  {renderSegmentActions(segment)}
                </div>
              ) : null}
              {segment.body ? <ProductReviewComment comment={segment.body} /> : null}
              {renderSegmentFooter?.(segment)}
              {segmentActionsPlacement === "footer" ? (
                <div className={styles.reviewCommentBubbleSegmentMeta}>
                  {renderSegmentActions?.(segment)}
                  <DateTimeValue
                    value={segment.sentAt}
                    inlineDateTime
                    className={styles.reviewCommentBubbleSegmentDate}
                  />
                </div>
              ) : (
                <DateTimeValue
                  value={segment.sentAt}
                  inlineDateTime
                  className={styles.reviewCommentBubbleSegmentDate}
                />
              )}
            </div>
          ))}
        </div>

        {expandControl && expandControlPlacement === "bottom" ? (
          <>
            <div
              className={styles.reviewCommentBubbleDivider}
              role="separator"
              aria-hidden="true"
            />
            {renderExpandControl()}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ProductReviewThreadBubble;
