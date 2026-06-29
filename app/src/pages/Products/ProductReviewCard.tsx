import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import { Typography } from "@mui/material";
import { type ReactElement } from "react";

import DateTimeValue from "../../shared/display/DateTimeValue";
import StarRating from "../../shared/rating/StarRating";
import {
  type EndUserProductReviewRecord,
  resolveEndUserReviewAuthorLabel,
  resolveReviewRatingDate,
} from "./product-reviews.api";
import { ProductReviewComment } from "./ProductReviewComment";
import styles from "./styles/ProductReviewsSection.module.scss";

type ProductReviewCardProps = {
  readonly review: EndUserProductReviewRecord;
};

const ProductReviewCard = ({ review }: ProductReviewCardProps): ReactElement | null => {
  if (!review.rating) {
    return null;
  }

  const authorLabel = resolveEndUserReviewAuthorLabel(review);
  const ratingDate = resolveReviewRatingDate(review.rating);
  const followUpComments = review.messages.filter((message) => !message.sender.isSupport);
  const supportMessages = review.isMine
    ? review.messages.filter((message) => message.sender.isSupport)
    : [];

  return (
    <article
      className={`${styles.reviewCard}${review.isMine ? ` ${styles.reviewCardMine}` : ""}`}
      aria-label={`نظر ${authorLabel}`}
    >
      <div className={styles.reviewCardHeader}>
        <div className={styles.reviewCardTitleBlock}>
          <Typography component="h3" className={styles.reviewCardAuthor}>
            {authorLabel}
          </Typography>
        </div>
        <StarRating
          value={review.rating.stars}
          size="small"
          ariaLabel={`امتیاز ${review.rating.stars}`}
        />
      </div>

      {ratingDate ? (
        <div className={styles.reviewCardDate}>
          <DateTimeValue value={ratingDate} />
        </div>
      ) : null}

      <ProductReviewComment comment={review.rating.comment} />

      {followUpComments.map((message) => (
        <ProductReviewComment key={message.key} comment={message.body} />
      ))}

      {supportMessages.length > 0 ? (
        <div className={styles.reviewThread}>
          <Typography variant="caption" color="text.secondary" className={styles.reviewThreadLabel}>
            گفتگو با پشتیبانی
          </Typography>
          <div className={styles.reviewThreadList}>
            {supportMessages.map((message) => (
              <div
                key={message.key}
                className={`${styles.reviewThreadMessage} ${styles.reviewThreadMessageSupport}`}
              >
                <div className={styles.reviewThreadMessageHeader}>
                  <SupportAgentRoundedIcon fontSize="small" />
                  <strong>{message.sender.firstName}</strong>
                  <DateTimeValue value={message.sentAt} />
                </div>
                <Typography component="p">{message.body}</Typography>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default ProductReviewCard;
