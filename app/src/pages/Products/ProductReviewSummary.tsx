import { Typography } from "@mui/material";
import { type ReactElement } from "react";

import StarRating from "../../shared/rating/StarRating";
import { toPersianDigits } from "../../utilities/persian-digits.util";
import type { ProductReviewSummaryStats } from "./product-reviews.api";
import styles from "./styles/ProductReviewsSection.module.scss";

type ProductReviewSummaryProps = {
  readonly stats: ProductReviewSummaryStats;
  readonly isPartialSample: boolean;
  readonly showDistribution?: boolean;
  readonly showDistributionBars?: boolean;
  readonly showAverageNumber?: boolean;
  readonly showReviewCount?: boolean;
};

function formatAverageRating(value: number | null): string {
  if (value == null) {
    return "—";
  }

  return toPersianDigits(value.toFixed(1));
}

const ProductReviewSummary = ({
  stats,
  isPartialSample,
  showDistribution = true,
  showDistributionBars = true,
  showAverageNumber = true,
  showReviewCount = true,
}: ProductReviewSummaryProps): ReactElement => {
  const hasRatings = stats.ratedCount > 0;
  const averageRating = stats.averageRating ?? 0;

  return (
    <div className={styles.summaryPanel}>
      <div className={styles.summaryScoreBlock}>
        {showAverageNumber ? (
          <strong className={styles.summaryAverage}>
            {formatAverageRating(stats.averageRating)}
          </strong>
        ) : null}
        <StarRating
          value={averageRating}
          size={showAverageNumber ? "small" : "large"}
          ariaLabel="میانگین امتیاز"
        />
        {showReviewCount ? (
          <Typography variant="caption" color="text.secondary">
            {hasRatings ? `${toPersianDigits(stats.ratedCount)} نظر ثبت‌شده` : "هنوز نظری ثبت نشده"}
          </Typography>
        ) : null}
        {showDistribution && showDistributionBars && isPartialSample && hasRatings ? (
          <Typography variant="caption" color="text.secondary" className={styles.summaryHint}>
            نمودار بر اساس نظرات بارگذاری‌شده است
          </Typography>
        ) : null}
      </div>

      {showDistribution ? (
        <div className={styles.summaryDistribution}>
          {stats.distribution.map(({ stars, count, percentage }) => (
            <div key={stars} className={styles.summaryDistributionRow}>
              <span className={styles.summaryDistributionLabel}>
                {toPersianDigits(stars)} ستاره
              </span>
              {showDistributionBars ? (
                <div className={styles.summaryDistributionTrack} aria-hidden="true">
                  <span
                    className={styles.summaryDistributionFill}
                    style={{ inlineSize: `${hasRatings ? percentage : 0}%` }}
                  />
                </div>
              ) : null}
              <span className={styles.summaryDistributionCount}>{toPersianDigits(count)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ProductReviewSummary;
