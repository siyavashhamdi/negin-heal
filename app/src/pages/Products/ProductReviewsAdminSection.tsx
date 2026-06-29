import ReviewsRoundedIcon from "@mui/icons-material/ReviewsRounded";
import { Alert, Button, CircularProgress, Skeleton, Typography } from "@mui/material";
import { useEffect, useMemo, useState, type ReactElement } from "react";

import { useAuth } from "../../contexts/AuthContext";
import ProductReviewAdminCard from "./ProductReviewAdminCard";
import ProductReviewStarFilters from "./ProductReviewStarFilters";
import ProductReviewSummary from "./ProductReviewSummary";
import ProductReviewUserBox from "./ProductReviewUserBox";
import {
  canUseAdminProductReviewList,
  findOwnAdminProductReview,
  mapAdminProductReviewToEndUserRecord,
  resolveCanSubmitProductReview,
} from "./product-reviews.api";
import { useProductReviewList } from "./useProductReviewList";
import styles from "./styles/ProductReviewsSection.module.scss";

type ProductReviewsAdminSectionProps = {
  readonly productId: string;
  readonly refreshToken?: number;
};

const ProductReviewsAdminSection = ({
  productId,
  refreshToken = 0,
}: ProductReviewsAdminSectionProps): ReactElement => {
  const { user, isAuthenticated } = useAuth();
  const [starsFilter, setStarsFilter] = useState<number | null>(null);
  const canUseReviewList = canUseAdminProductReviewList(user?.roles);

  const canSubmitOwnReview = resolveCanSubmitProductReview({
    isAuthenticated,
    roles: user?.roles,
  });

  const reviewList = useProductReviewList({
    productId,
    mode: "admin",
    enabled: Boolean(productId) && canUseReviewList,
    starsFilter,
    scrollRoot: "parent",
  });

  useEffect(() => {
    if (!productId || refreshToken === 0) {
      return;
    }

    reviewList.refetch();
  }, [productId, refreshToken, reviewList.refetch]);

  const ownAdminReview = useMemo(
    () => findOwnAdminProductReview(reviewList.items, user?.id),
    [reviewList.items, user?.id]
  );
  const ownReview = useMemo(
    () =>
      ownAdminReview && user?.id
        ? mapAdminProductReviewToEndUserRecord(ownAdminReview, user.id)
        : null,
    [ownAdminReview, user?.id]
  );
  const otherAdminReviews = useMemo(
    () => reviewList.items.filter((review) => review.userId !== user?.id),
    [reviewList.items, user?.id]
  );
  const showOwnStaffBox = canSubmitOwnReview || Boolean(ownReview);

  const summaryStats = reviewList.ratingSummary;

  const hasLoadedItems = otherAdminReviews.length > 0;
  const showEmptyState =
    !reviewList.loading && !reviewList.error && !hasLoadedItems && !showOwnStaffBox;
  const showReviewsScroll =
    showOwnStaffBox ||
    reviewList.loading ||
    hasLoadedItems ||
    showEmptyState ||
    reviewList.hasNextPage ||
    reviewList.isFetchingMore;

  if (!canUseReviewList) {
    return (
      <Alert severity="info" className={styles.roleNotice}>
        مشاهده نظرات دوره برای حساب شما فعال نیست.
      </Alert>
    );
  }

  return (
    <div className={styles.listShell}>
      <div className={styles.listFixed}>
        <ProductReviewSummary stats={summaryStats} isPartialSample={false} />

        <ProductReviewStarFilters
          activeStars={starsFilter}
          disabled={reviewList.loading}
          onChange={setStarsFilter}
        />

        {reviewList.error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={reviewList.refetch}>
                تلاش دوباره
              </Button>
            }
          >
            دریافت نظرات با خطا مواجه شد.
          </Alert>
        ) : null}

        {reviewList.loading && showOwnStaffBox ? (
          <Skeleton variant="rounded" height={180} className={styles.reviewUserBox} />
        ) : null}

        {!reviewList.loading && showOwnStaffBox ? (
          <ProductReviewUserBox
            review={ownReview}
            authorLabel="شما"
            canEdit={canSubmitOwnReview}
            productId={productId}
            onSubmitted={reviewList.refetch}
          />
        ) : null}
      </div>

      {showReviewsScroll ? (
        <div className={`${styles.adminListFlow} ${styles.adminReviewListDivided}`}>
          {reviewList.loading
            ? Array.from({ length: 2 }).map((_, index) => (
                <Skeleton
                  key={`product-review-admin-skeleton-${index}`}
                  variant="rounded"
                  height={180}
                  className={styles.reviewUserBox}
                />
              ))
            : null}

          {!reviewList.loading
            ? otherAdminReviews.map((review) => (
                <ProductReviewAdminCard
                  key={review.id}
                  productId={productId}
                  review={review}
                  limitCommentsPreview
                  onReplied={reviewList.refetch}
                  onModerationUpdated={reviewList.refetch}
                />
              ))
            : null}

          {showEmptyState ? (
            <div className={styles.emptyState}>
              <ReviewsRoundedIcon color="primary" />
              <h3>هنوز نظری ثبت نشده</h3>
              <p>
                {starsFilter != null
                  ? "نظری با این امتیاز پیدا نشد. فیلتر دیگری را امتحان کنید."
                  : "برای این دوره هنوز امتیاز یا نظری ثبت نشده است."}
              </p>
            </div>
          ) : null}

          {reviewList.isFetchingMore || reviewList.hasNextPage ? (
            <div
              ref={reviewList.loadMoreRef}
              className={styles.loadMoreState}
              aria-hidden={!reviewList.isFetchingMore}
            >
              {reviewList.isFetchingMore ? (
                <>
                  <CircularProgress size={18} />
                  <Typography variant="caption">در حال بارگذاری نظرات بیشتر…</Typography>
                </>
              ) : (
                <Typography variant="caption">برای مشاهده بیشتر اسکرول کنید</Typography>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ProductReviewsAdminSection;
