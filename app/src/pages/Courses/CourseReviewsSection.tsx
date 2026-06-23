import ReviewsRoundedIcon from "@mui/icons-material/ReviewsRounded";
import { Alert, Button, CircularProgress, Skeleton, Typography } from "@mui/material";
import { useMemo, type ReactElement } from "react";

import { useAuth } from "../../contexts/AuthContext";
import CourseReviewSummary from "./CourseReviewSummary";
import CourseReviewUserBox from "./CourseReviewUserBox";
import {
  findOwnAdminCourseReview,
  findOwnCourseReview,
  isStaffCourseReviewer,
  mapAdminCourseReviewToEndUserRecord,
  resolveEndUserReviewAuthorLabel,
  type AdminCourseReviewRecord,
  type EndUserCourseReviewRecord,
} from "./course-reviews.api";
import { type CourseReviewListController } from "./useCourseReviewList";
import styles from "./styles/CourseReviewsSection.module.scss";

type CourseReviewsSectionProps = {
  readonly courseId: string;
  readonly reviewList: CourseReviewListController;
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
  reviewList,
  canSubmitReview,
  isReviewsSectionVisible,
  isReviewSubmissionEnabled,
  isFree = false,
}: CourseReviewsSectionProps): ReactElement => {
  const { user } = useAuth();
  const isStaff = isStaffCourseReviewer(user?.roles);
  const isSectionDisabledForViewer = !isStaff && !isReviewsSectionVisible;
  const isSubmissionDisabledForViewer = !isStaff && !isReviewSubmissionEnabled;

  const ownReview = useMemo((): EndUserCourseReviewRecord | null => {
    if (isStaff) {
      const ownAdminReview = findOwnAdminCourseReview(
        reviewList.items as AdminCourseReviewRecord[],
        user?.id,
      );
      if (!ownAdminReview || !user?.id) {
        return null;
      }

      return mapAdminCourseReviewToEndUserRecord(ownAdminReview, user.id);
    }

    return findOwnCourseReview(reviewList.items as EndUserCourseReviewRecord[]);
  }, [isStaff, reviewList.items, user?.id]);

  const otherReviews = useMemo((): EndUserCourseReviewRecord[] => {
    if (isStaff) {
      if (!user?.id) {
        return [];
      }

      return (reviewList.items as AdminCourseReviewRecord[])
        .filter((review) => review.userId !== user.id)
        .map((review) => mapAdminCourseReviewToEndUserRecord(review, user.id));
    }

    const ownReviewId = ownReview?.id;
    return (reviewList.items as EndUserCourseReviewRecord[]).filter((review) =>
      isOtherUserReview(review, ownReviewId),
    );
  }, [isStaff, ownReview?.id, reviewList.items, user?.id]);

  const summaryStats = reviewList.ratingSummary;

  const isOwnReviewSubmissionBlocked = Boolean(ownReview?.isSubmissionBlocked);
  const showOwnBox = (canSubmitReview && !isOwnReviewSubmissionBlocked) || Boolean(ownReview);
  const showEditableOwnBox = canSubmitReview && !isOwnReviewSubmissionBlocked;
  const showReadOnlyOwnBox =
    !canSubmitReview && Boolean(ownReview) && !isOwnReviewSubmissionBlocked;
  const showOwnReviewBlockedNotice = canSubmitReview && isOwnReviewSubmissionBlocked;
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
          isPartialSample={false}
          showDistribution={false}
          showAverageNumber={false}
          showReviewCount={false}
        />

        {isSubmissionDisabledForViewer ? (
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

        {showOwnReviewBlockedNotice ? (
          <Alert severity="warning" className={styles.roleNotice}>
            امکان ثبت نظر برای شما وجود ندارد.
          </Alert>
        ) : null}

        {reviewList.loading && showReadOnlyOwnBox ? (
          <Skeleton variant="rounded" height={180} className={styles.reviewUserBox} />
        ) : null}

        {showEditableOwnBox ? (
          <CourseReviewUserBox
            review={ownReview}
            authorLabel="شما"
            canEdit
            isOwnViewerBox
            isRatingHidden={ownReview?.isRatingHidden}
            isSubmissionBlocked={ownReview?.isSubmissionBlocked}
            limitCommentsPreview
            courseId={courseId}
            onSubmitted={reviewList.refetch}
          />
        ) : null}

        {!reviewList.loading && showReadOnlyOwnBox ? (
          <CourseReviewUserBox
            review={ownReview}
            authorLabel="شما"
            canEdit={false}
            isOwnViewerBox
            isRatingHidden={ownReview?.isRatingHidden}
            isSubmissionBlocked={ownReview?.isSubmissionBlocked}
            limitCommentsPreview
            courseId={courseId}
            onSubmitted={reviewList.refetch}
          />
        ) : null}
      </div>

      {showOthersScroll ? (
        <div className={styles.adminListFlow}>
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
