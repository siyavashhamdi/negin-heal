import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Button, CircularProgress, IconButton, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { useSnackbar } from "../../hooks/useSnackbar";
import AppTooltip from "../../shared/AppTooltip";
import StarRating from "../../shared/rating/StarRating";
import ProductReviewCaptchaDialog from "./ProductReviewCaptchaDialog";
import ProductReviewThreadBubble from "./ProductReviewThreadBubble";
import {
  buildProductReviewDisplayThreadEntries,
  buildProductReviewThreadSegments,
  resolveProductReviewThreadPreviewEntries,
} from "./product-review-thread.util";
import { scrollToProductReviewBoxEnd } from "./product-review-box-scroll.util";
import {
  PRODUCT_REVIEW_COMMENT_PREVIEW_LIMIT,
  type EndUserProductReviewRecord,
} from "./product-reviews.api";
import { useProductReviewSubmit } from "./useProductReviewSubmit";
import styles from "./styles/ProductReviewsSection.module.scss";

const MAX_COMMENT_LENGTH = 2000;

type ProductReviewUserBoxProps = {
  readonly review: EndUserProductReviewRecord | null;
  readonly authorLabel: string;
  readonly canEdit: boolean;
  readonly isOwnViewerBox?: boolean;
  readonly isRatingHidden?: boolean;
  readonly isSubmissionBlocked?: boolean;
  readonly limitCommentsPreview?: boolean;
  readonly productId: string;
  readonly onSubmitted: () => void | Promise<void>;
};

const ProductReviewUserBox = ({
  review,
  authorLabel,
  canEdit,
  isOwnViewerBox = false,
  isRatingHidden = false,
  isSubmissionBlocked = false,
  limitCommentsPreview = true,
  productId,
  onSubmitted,
}: ProductReviewUserBoxProps): ReactElement => {
  const { showSuccess } = useSnackbar();
  const persistedStars = review?.rating?.stars ?? 0;
  const hasExistingRating = Boolean(review?.rating);
  const hasExistingReview = Boolean(review);
  const hasPersistedStars = persistedStars >= 1;
  const [stars, setStars] = useState(persistedStars);
  const [comment, setComment] = useState("");
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const showNoStarsYet = !hasPersistedStars && stars < 1;
  const commentFormRef = useRef<HTMLDivElement | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const boxEndRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollToEndRef = useRef(false);

  const scrollToBoxEnd = useCallback((focusCommentInput = false): void => {
    if (focusCommentInput) {
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          commentFormRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          commentInputRef.current?.focus();
        }, 120);
      });
      return;
    }

    scrollToProductReviewBoxEnd(boxEndRef.current);
  }, []);

  useEffect(() => {
    setCommentsExpanded(false);
  }, [productId]);

  const {
    captchaDialogOpen,
    captchaEnabled,
    captchaVersion,
    captchaValid,
    clearStarAutoSubmitBlock,
    closeCaptchaDialog,
    confirmCaptchaDialog,
    handleCaptchaChange,
    isSubmitting,
    pendingIsStarUpdate,
    pendingSubmitStars,
    submitComment,
    submitStars,
    successMessageRef,
  } = useProductReviewSubmit({
    productId,
    persistedStars,
    hasExistingRating,
    hasExistingReview,
    onSubmitted: async () => {
      showSuccess(successMessageRef.current);
      setComment("");
      await onSubmitted();
    },
  });

  useEffect(() => {
    setStars(persistedStars);
    clearStarAutoSubmitBlock();
  }, [clearStarAutoSubmitBlock, review?.id, persistedStars]);

  const threadEntries = useMemo(() => buildProductReviewDisplayThreadEntries(review), [review]);
  const hiddenCommentCount = Math.max(
    0,
    threadEntries.length - PRODUCT_REVIEW_COMMENT_PREVIEW_LIMIT
  );
  const shouldCollapseComments =
    limitCommentsPreview && hiddenCommentCount > 0 && !commentsExpanded;
  const canEditReview = canEdit && !isSubmissionBlocked && !isRatingHidden;
  const visibleThreadEntries = useMemo(
    () =>
      resolveProductReviewThreadPreviewEntries(
        threadEntries,
        PRODUCT_REVIEW_COMMENT_PREVIEW_LIMIT,
        shouldCollapseComments,
        isOwnViewerBox ? "newest" : "oldest"
      ),
    [isOwnViewerBox, shouldCollapseComments, threadEntries]
  );
  const visibleThreadSegments = useMemo(() => {
    const segments = buildProductReviewThreadSegments(visibleThreadEntries);

    if (!isOwnViewerBox || !canEditReview) {
      return segments;
    }

    return segments.filter((segment) => segment.body.trim().length > 0);
  }, [canEditReview, isOwnViewerBox, visibleThreadEntries]);

  useEffect(() => {
    if (!pendingScrollToEndRef.current) {
      return;
    }

    pendingScrollToEndRef.current = false;
    scrollToProductReviewBoxEnd(boxEndRef.current, { delayMs: 200 });
  }, [threadEntries.length]);
  const trimmedComment = comment.trim();
  const canSubmitComment = trimmedComment.length > 0 && canEditReview && !isSubmitting;

  useEffect(() => {
    if (
      !canEditReview ||
      isSubmitting ||
      captchaDialogOpen ||
      stars < 1 ||
      stars === persistedStars
    ) {
      return;
    }

    submitStars(stars);
  }, [canEditReview, captchaDialogOpen, isSubmitting, persistedStars, stars, submitStars]);

  const handleStarChange = (nextStars: number): void => {
    setStars(nextStars);
  };

  const handleCommentSubmit = (): void => {
    if (!canSubmitComment) {
      return;
    }

    pendingScrollToEndRef.current = true;
    submitComment(stars, trimmedComment);
  };

  const handleCaptchaDialogClose = (): void => {
    if (pendingIsStarUpdate) {
      setStars(persistedStars);
    }

    closeCaptchaDialog();
  };

  const handleScrollToCommentForm = (): void => {
    scrollToBoxEnd(true);
  };

  const renderCommentForm = (): ReactElement => (
    <div ref={commentFormRef} className={styles.reviewCommentForm}>
      <div className={styles.reviewCommentInputShell}>
        <div className={styles.reviewCommentInputArea}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            placeholder="نظر خود را بنویسید…"
            value={comment}
            disabled={isSubmitting}
            inputRef={commentInputRef}
            onChange={(event) => setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
            className={styles.reviewCommentInput}
          />
          <div className={styles.reviewCommentSendOverlay}>
            <AppTooltip title="ثبت نظر" arrow>
              <span className={styles.reviewCommentSendTooltipAnchor}>
                <IconButton
                  type="button"
                  color="primary"
                  disabled={!canSubmitComment}
                  onClick={handleCommentSubmit}
                  aria-label="ثبت نظر"
                  className={styles.reviewCommentSendButton}
                >
                  {isSubmitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SendRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </AppTooltip>
          </div>
        </div>
        <Typography
          component="p"
          variant="caption"
          color="text.secondary"
          className={styles.reviewCommentHelper}
        >
          {`${comment.length.toLocaleString("fa-IR")} / ${MAX_COMMENT_LENGTH.toLocaleString("fa-IR")}`}
        </Typography>
      </div>
    </div>
  );

  return (
    <>
      <article className={styles.reviewUserBoxPlain} aria-label={`نظر ${authorLabel}`}>
        {canEditReview ? (
          <div className={styles.reviewUserStarsPanel}>
            <div className={styles.reviewUserStarsRow}>
              <div className={styles.reviewUserStarsRowLead}>
                <Typography component="h3" className={styles.reviewUserAuthor}>
                  نظر شما:
                </Typography>
                {showNoStarsYet ? (
                  <Typography
                    component="span"
                    variant="body2"
                    className={styles.reviewUserStarsEmpty}
                  >
                    هنوز امتیازی ثبت نکرده‌اید.
                  </Typography>
                ) : null}
              </div>
              <StarRating
                mode="input"
                value={stars}
                size="large"
                disabled={isSubmitting}
                onChange={handleStarChange}
              />
            </div>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              className={styles.reviewScrollToCommentButton}
              onClick={handleScrollToCommentForm}
            >
              ثبت نظر
            </Button>
            {isSubmitting ? <CircularProgress size={16} aria-label="در حال ذخیره" /> : null}
          </div>
        ) : null}

        {visibleThreadSegments.length > 0 ? (
          <div className={styles.reviewCommentsList}>
            <ProductReviewThreadBubble
              segments={visibleThreadSegments}
              isReviewMine={canEdit || Boolean(review?.isMine)}
              hideSegmentStars={isOwnViewerBox && canEditReview}
              expandControlPlacement={isOwnViewerBox ? "top" : "bottom"}
              expandControl={
                limitCommentsPreview && hiddenCommentCount > 0
                  ? {
                      expanded: commentsExpanded,
                      hiddenCount: hiddenCommentCount,
                      onToggle: () => setCommentsExpanded((previous) => !previous),
                    }
                  : undefined
              }
            />
          </div>
        ) : null}

        {canEditReview ? renderCommentForm() : null}
        <div ref={boxEndRef} className={styles.reviewUserBoxEndAnchor} aria-hidden="true" />
      </article>

      {captchaEnabled ? (
        <ProductReviewCaptchaDialog
          open={captchaDialogOpen}
          captchaVersion={captchaVersion}
          submitting={isSubmitting}
          canConfirm={captchaValid}
          selectedStars={pendingSubmitStars}
          onClose={handleCaptchaDialogClose}
          onConfirm={confirmCaptchaDialog}
          onCaptchaChange={handleCaptchaChange}
        />
      ) : null}
    </>
  );
};

export default ProductReviewUserBox;
