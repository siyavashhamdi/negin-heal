import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import { Typography } from "@mui/material";
import { type ReactElement } from "react";

import StarRating from "../../shared/rating/StarRating";
import { formatRelativeTimeLabel } from "../../utilities/relative-time.util";
import {
  type EndUserCourseReviewRecord,
  resolveEndUserReviewAuthorLabel,
} from "./course-reviews.api";
import { CourseReviewComment, formatReviewDateLabel } from "./CourseReviewComment";
import styles from "./styles/CourseReviewsSection.module.scss";

type CourseReviewCardProps = {
  readonly review: EndUserCourseReviewRecord;
};

const CourseReviewCard = ({ review }: CourseReviewCardProps): ReactElement | null => {
  if (!review.rating) {
    return null;
  }

  const authorLabel = resolveEndUserReviewAuthorLabel(review);
  const dateLabel = formatReviewDateLabel(review.rating);
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
        <StarRating value={review.rating.stars} size="small" ariaLabel={`امتیاز ${review.rating.stars}`} />
      </div>

      {dateLabel ? (
        <Typography variant="caption" color="text.secondary" className={styles.reviewCardDate}>
          {dateLabel}
        </Typography>
      ) : null}

      <CourseReviewComment comment={review.rating.comment} />

      {followUpComments.map((message) => (
        <CourseReviewComment key={message.key} comment={message.body} />
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
                  <span>{formatRelativeTimeLabel(message.sentAt)}</span>
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

export default CourseReviewCard;
