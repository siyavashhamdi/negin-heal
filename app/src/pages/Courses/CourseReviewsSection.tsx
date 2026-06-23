import ReviewsRoundedIcon from "@mui/icons-material/ReviewsRounded";
import { Alert, Button, CircularProgress, Skeleton, Typography } from "@mui/material";
import { useMemo, type ReactElement } from "react";

import { useAuth } from "../../contexts/AuthContext";
import CourseReviewSummary from "./CourseReviewSummary";
import CourseReviewUserBox from "./CourseReviewUserBox";
import {
  canUseAdminCourseReviewList,
  computeCourseReviewSummaryStats,
  findOwnAdminCourseReview,
  findOwnCourseReview,
  isStaffCourseReviewer,
  mapAdminCourseReviewToEndUserRecord,
  resolveEndUserReviewAuthorLabel,
  type EndUserCourseReviewRecord,
} from "./course-reviews.api";
import { useCourseReviewList } from "./useCourseReviewList";
import styles from "./styles/CourseReviewsSection.module.scss";

type CourseReviewsSectionProps = {
  readonly courseId: string;
  readonly canSubmitReview: boolean;
  readonly isReviewsSectionVisible: boolean;
  readonly isReviewSubmissionEnabled: boolean;
  readonly isFree?: boolean;
};

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
  isReviewsSectionVisible,
  isReviewSubmissionEnabled,
  isFree = false,
}: CourseReviewsSectionProps): ReactElement => {
  const { user, isAuthenticated } = useAuth();
  const isStaff = isStaffCourseReviewer(user?.roles);
  const isSectionDisabledForViewer = !isStaff && !isReviewsSectionVisible;
  const isSubmissionDisabledForViewer = !isStaff && !isReviewSubmissionEnabled;
  const listMode = isStaff ? "admin" : "endUser";

  const reviewList = useCourseReviewList({
    courseId,
    mode: listMode,
    enabled:
      Boolean(courseId) &&
      !isSectionDisabledForViewer &&
      (listMode === "admin"
        ? isAuthenticated && canUseAdminCourseReviewList(user?.roles)
        : true),
    starsFilter: null,
  });

  const ownReview = useMemo((): EndUserCourseReviewRecord | null => {
    if (isStaff) {
      const ownAdminReview = findOwnAdminCourseReview(reviewList.items, user?.id);
      if (!ownAdminReview || !user?.id) {
        return null;
      }

      return mapAdminCourseReviewToEndUserRecord(ownAdminReview, user.id);
    }

    return findOwnCourseReview(reviewList.items);
  }, [isStaff, reviewList.items, user?.id]);

  const otherReviews = useMemo((): EndUserCourseReviewRecord[] => {
    if (isStaff) {
      if (!user?.id) {
        return [];
      }

      return reviewList.items
        .filter((review) => review.userId !== user.id)
        .map((review) => mapAdminCourseReviewToEndUserRecord(review, user.id));
    }

    const ownReviewId = ownReview?.id;
    return reviewList.items.filter((review) => isOtherUserReview(review, ownReviewId));
  }, [isStaff, ownReview?.id, reviewList.items, user?.id]);

  const summaryStats = useMemo(
    () => computeCourseReviewSummaryStats(reviewList.items, reviewList.totalCount),
    [reviewList.items, reviewList.totalCount],
  );

  const showOwnBox = canSubmitReview || Boolean(ownReview);
  const showOthersScroll =
    reviewList.loading ||
    otherReviews.length > 0 ||
    reviewList.hasNextPage ||
    reviewList.isFetchingMore;

  const showEmptyState =
    !reviewList.loading && !reviewList.error && !showOwnBox && otherReviews.length === 0;

  if (isSectionDisabledForViewer) {
    return (
      <Alert severity="warning" className={styles.roleNotice}>
        مشاهده و ثبت نظر برای این دوره در حال حاضر امکان‌پذیر نیست.
      </Alert>
    );
  }

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

        {!isAuthenticated ? (
          <Alert severity="info" className={styles.roleNotice}>
            برای ثبت امتیاز و نظر وارد حساب کاربری شوید.
          </Alert>
        ) : isSubmissionDisabledForViewer ? (
          <Alert severity="info" className={styles.roleNotice}>
            امکان ثبت امتیاز و نظر جدید برای این دوره غیرفعال است.
          </Alert>
        ) : !canSubmitReview && !isStaff && !isFree ? (
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
            authorLabel="شما"
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
              <p>
                {canSubmitReview || isStaff
                  ? "اولین نفری باشید که تجربه خود را از این دوره به اشتراک می‌گذارد."
                  : "هنوز نظری برای نمایش وجود ندارد."}
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

export default CourseReviewsSection;
