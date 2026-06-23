import ReviewsRoundedIcon from "@mui/icons-material/ReviewsRounded";
import { Alert, Button, CircularProgress, Skeleton, Typography } from "@mui/material";
import { useMemo, useState, type ReactElement } from "react";

import CourseReviewAdminCard from "./CourseReviewAdminCard";
import CourseReviewStarFilters from "./CourseReviewStarFilters";
import CourseReviewSummary from "./CourseReviewSummary";
import { computeCourseReviewSummaryStats } from "./course-reviews.api";
import { useCourseReviewList } from "./useCourseReviewList";
import styles from "./styles/CourseReviewsSection.module.scss";

type CourseReviewsAdminSectionProps = {
  readonly courseId: string;
};

const CourseReviewsAdminSection = ({
  courseId,
}: CourseReviewsAdminSectionProps): ReactElement => {
  const [starsFilter, setStarsFilter] = useState<number | null>(null);

  const reviewList = useCourseReviewList({
    courseId,
    mode: "admin",
    enabled: Boolean(courseId),
    starsFilter,
    scrollRoot: "parent",
  });

  const summaryStats = useMemo(
    () => computeCourseReviewSummaryStats(reviewList.items, reviewList.totalCount),
    [reviewList.items, reviewList.totalCount],
  );

  const hasLoadedItems = reviewList.items.length > 0;
  const showEmptyState = !reviewList.loading && !reviewList.error && !hasLoadedItems;
  const showReviewsScroll =
    reviewList.loading ||
    hasLoadedItems ||
    showEmptyState ||
    reviewList.hasNextPage ||
    reviewList.isFetchingMore;

  return (
    <div className={styles.listShell}>
      <div className={styles.listFixed}>
        <CourseReviewSummary
          stats={summaryStats}
          isPartialSample={reviewList.items.length < reviewList.totalCount}
        />

        <CourseReviewStarFilters
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
      </div>

      {showReviewsScroll ? (
        <div className={styles.adminListFlow}>
          {reviewList.loading
            ? Array.from({ length: 2 }).map((_, index) => (
                <Skeleton
                  key={`course-review-admin-skeleton-${index}`}
                  variant="rounded"
                  height={132}
                  className={styles.reviewCard}
                />
              ))
            : null}

          {!reviewList.loading
            ? reviewList.items.map((review) => (
                <CourseReviewAdminCard
                  key={review.id}
                  courseId={courseId}
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

export default CourseReviewsAdminSection;
