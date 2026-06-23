import ReviewsRoundedIcon from "@mui/icons-material/ReviewsRounded";
import { Alert, Button, CircularProgress, Skeleton, Typography } from "@mui/material";
import { useMemo, type ReactElement } from "react";

import { useAuth } from "../../contexts/AuthContext";
import { LoginRequiredState } from "../../shared/auth/LoginRequiredState";
import CourseReviewSummary from "./CourseReviewSummary";
import CourseReviewUserBox from "./CourseReviewUserBox";
import {
  computeCourseReviewSummaryStats,
  resolveEndUserReviewAuthorLabel,
  type EndUserCourseReviewRecord,
} from "./course-reviews.api";
import { useCourseReviewList } from "./useCourseReviewList";
import styles from "./styles/CourseReviewsSection.module.scss";

type CourseReviewsSectionProps = {
  readonly courseId: string;
  readonly canSubmitReview: boolean;
};

function findOwnReview(items: ReadonlyArray<EndUserCourseReviewRecord>): EndUserCourseReviewRecord | null {
  return items.find((item) => item.isMine) ?? null;
}

function resolveOwnAuthorLabel(): string {
  return "شما";
}

function isOtherUserReview(
  review: EndUserCourseReviewRecord,
  ownReviewId?: string,
): boolean {
  if (review.isMine) {
    return false;
  }

  if (ownReviewId && review.id === ownReviewId) {
    return false;
  }

  return true;
}

const CourseReviewsSection = ({
  courseId,
  canSubmitReview,
}: CourseReviewsSectionProps): ReactElement => {
  const { user, isAuthenticated } = useAuth();
  const canUseEndUserReviewList = isAuthenticated && user?.roles?.includes("END_USER") === true;

  const reviewList = useCourseReviewList({
    courseId,
    mode: "endUser",
    enabled: canUseEndUserReviewList,
    starsFilter: null,
  });

  const summaryStats = useMemo(
    () => computeCourseReviewSummaryStats(reviewList.items, reviewList.totalCount),
    [reviewList.items, reviewList.totalCount],
  );
  const ownReview = findOwnReview(reviewList.items);
  const ownReviewId = ownReview?.id;
  const otherReviews = useMemo(
    () => reviewList.items.filter((review) => isOtherUserReview(review, ownReviewId)),
    [ownReviewId, reviewList.items],
  );
  const ownAuthorLabel = resolveOwnAuthorLabel();
  const showOwnBox = canSubmitReview || Boolean(ownReview);
  const showOthersScroll =
    reviewList.loading ||
    otherReviews.length > 0 ||
    reviewList.hasNextPage ||
    reviewList.isFetchingMore;

  if (!isAuthenticated) {
    return (
      <LoginRequiredState
        eyebrow="امتیاز و نظرات"
        title="برای مشاهده نظرات وارد شوید"
        description="نظرات عمومی دوره و امکان ثبت امتیاز پس از ورود به حساب کاربری در دسترس است."
        icon={<ReviewsRoundedIcon />}
      />
    );
  }

  if (!canUseEndUserReviewList) {
    return (
      <Alert severity="info" className={styles.roleNotice}>
        مشاهده نظرات دوره فقط برای کاربران عادی فعال است.
      </Alert>
    );
  }

  const showEmptyState =
    !reviewList.loading && !reviewList.error && !showOwnBox && otherReviews.length === 0;

  return (
    <div className={styles.listShell}>
      <div className={styles.listFixed}>
        <CourseReviewSummary
          stats={summaryStats}
          isPartialSample={reviewList.items.length < reviewList.totalCount}
          showDistribution={false}
          showAverageNumber={false}
          showReviewCount={false}
        />

        {!canSubmitReview ? (
          <Alert severity="info" className={styles.roleNotice}>
            پس از خرید و فعال شدن دسترسی دوره می‌توانید امتیاز و نظر خود را ثبت کنید.
          </Alert>
        ) : null}

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

        {reviewList.loading && showOwnBox ? (
          <Skeleton variant="rounded" height={180} className={styles.reviewUserBox} />
        ) : null}

        {!reviewList.loading && showOwnBox ? (
          <CourseReviewUserBox
            review={ownReview}
            authorLabel={ownAuthorLabel}
            canEdit={canSubmitReview}
            courseId={courseId}
            onSubmitted={reviewList.refetch}
          />
        ) : null}
      </div>

      {showOthersScroll ? (
        <div ref={reviewList.scrollContainerRef} className={styles.othersListScroll}>
          {reviewList.loading
            ? Array.from({ length: 2 }).map((_, index) => (
                <Skeleton
                  key={`course-review-skeleton-${index}`}
                  variant="rounded"
                  height={180}
                  className={styles.reviewUserBox}
                />
              ))
            : null}

          {!reviewList.loading
            ? otherReviews.map((review) => (
                <CourseReviewUserBox
                  key={review.id}
                  review={review}
                  authorLabel={resolveEndUserReviewAuthorLabel(review)}
                  canEdit={false}
                  limitCommentsPreview
                  courseId={courseId}
                  onSubmitted={reviewList.refetch}
                />
              ))
            : null}

          {showEmptyState ? (
            <div className={styles.emptyState}>
              <ReviewsRoundedIcon color="primary" />
              <h3>هنوز نظری ثبت نشده</h3>
              <p>اولین نفری باشید که تجربه خود را از این دوره به اشتراک می‌گذارد.</p>
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

export default CourseReviewsSection;
