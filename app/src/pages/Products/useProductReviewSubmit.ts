import { useCallback, useRef, useState } from "react";

import { API_CONFIG } from "../../config/env";
import { useAuth } from "../../contexts/AuthContext";
import { PRODUCT_REVIEW_SUBMIT_MUTATION } from "../../graphql/mutations/productReviewSubmit.mutation";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import { extractGraphQLErrorCode } from "../../utilities/graphql-error.util";
import {
  isStaffProductReviewer,
  type ProductReviewSubmitMutation,
  type ProductReviewSubmitMutationVariables,
} from "./product-reviews.api";

const CAPTCHA_ERROR_CODES = new Set(["CAPTCHA_REQUIRED", "CAPTCHA_EXPIRED", "CAPTCHA_INVALID"]);

type UseProductReviewSubmitOptions = {
  readonly productId: string;
  readonly persistedStars: number;
  readonly hasExistingRating: boolean;
  readonly hasExistingReview: boolean;
  readonly onSubmitted: () => void | Promise<void>;
};

type PendingReviewSubmit = {
  readonly stars?: number;
  readonly comment?: string;
  readonly successMessage: string;
};

export function useProductReviewSubmit({
  productId,
  persistedStars,
  hasExistingRating,
  hasExistingReview,
  onSubmitted,
}: UseProductReviewSubmitOptions) {
  const { user } = useAuth();
  const { showError } = useSnackbar();
  const captchaEnabled = API_CONFIG.CAPTCHA_ENABLED && !isStaffProductReviewer(user?.roles);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const [captchaDialogOpen, setCaptchaDialogOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<PendingReviewSubmit | null>(null);
  const pendingSubmitRef = useRef<PendingReviewSubmit | null>(null);
  const blockStarAutoSubmitRef = useRef(false);
  const successMessageRef = useRef("ثبت با موفقیت انجام شد.");

  pendingSubmitRef.current = pendingSubmit;

  const resetCaptcha = useCallback((): void => {
    setCaptchaId("");
    setCaptchaValue("");
    setCaptchaValid(false);
    setCaptchaVersion((previous) => previous + 1);
  }, []);

  const closeCaptchaDialog = useCallback(
    (options?: { readonly resetCaptcha?: boolean }): void => {
      setCaptchaDialogOpen(false);
      setPendingSubmit(null);

      if (options?.resetCaptcha === false) {
        setCaptchaId("");
        setCaptchaValue("");
        setCaptchaValid(false);
        return;
      }

      resetCaptcha();
    },
    [resetCaptcha]
  );

  const clearStarAutoSubmitBlock = useCallback((): void => {
    blockStarAutoSubmitRef.current = false;
  }, []);

  const [submitReview, submitResult] = useMutationWithSnackbar<
    ProductReviewSubmitMutation,
    ProductReviewSubmitMutationVariables
  >(PRODUCT_REVIEW_SUBMIT_MUTATION, {
    onSuccess: async () => {
      const pending = pendingSubmitRef.current;
      const wasStarOnlySubmit = Boolean(
        pending && !pending.comment && typeof pending.stars === "number"
      );

      if (wasStarOnlySubmit) {
        blockStarAutoSubmitRef.current = true;
      }

      closeCaptchaDialog({ resetCaptcha: false });
      await onSubmitted();
    },
    onError: (error) => {
      const errorCode = extractGraphQLErrorCode(error);
      if (captchaEnabled && typeof errorCode === "string" && CAPTCHA_ERROR_CODES.has(errorCode)) {
        resetCaptcha();
      }
    },
  });

  const handleCaptchaChange = useCallback(
    (input: { captchaId: string; value: string; isValid: boolean }): void => {
      setCaptchaId(input.captchaId);
      setCaptchaValue(input.value);
      setCaptchaValid(input.isValid);
    },
    []
  );

  const runSubmit = useCallback(
    (input: PendingReviewSubmit): void => {
      const hasStarInput = typeof input.stars === "number" && input.stars >= 1 && input.stars <= 5;
      const hasCommentInput = Boolean(input.comment?.trim());

      if ((!hasStarInput && !hasCommentInput) || submitResult.loading) {
        return;
      }

      if (captchaEnabled && !captchaValid) {
        showError("لطفاً کد امنیتی را وارد کنید.");
        return;
      }

      successMessageRef.current = input.successMessage;

      void submitReview({
        variables: {
          input: {
            productId,
            ...(hasStarInput ? { stars: input.stars } : {}),
            comment: input.comment,
            captchaId: captchaEnabled ? captchaId : undefined,
            captchaValue: captchaEnabled ? captchaValue : undefined,
          },
        },
      });
    },
    [
      captchaEnabled,
      captchaId,
      captchaValid,
      captchaValue,
      productId,
      showError,
      submitResult.loading,
      submitReview,
    ]
  );

  const queueSubmit = useCallback(
    (input: PendingReviewSubmit): void => {
      if (captchaEnabled) {
        setPendingSubmit(input);
        setCaptchaDialogOpen(true);
        return;
      }

      runSubmit(input);
    },
    [captchaEnabled, runSubmit]
  );

  const submitStars = useCallback(
    (stars: number): boolean => {
      if (blockStarAutoSubmitRef.current) {
        return false;
      }

      if (stars < 1 || stars > 5 || stars === persistedStars) {
        return false;
      }

      queueSubmit({
        stars,
        successMessage: hasExistingRating ? "امتیاز شما به‌روزرسانی شد." : "امتیاز شما ثبت شد.",
      });
      return true;
    },
    [hasExistingRating, persistedStars, queueSubmit]
  );

  const submitComment = useCallback(
    (stars: number, comment: string): void => {
      const trimmedComment = comment.trim();
      if (!trimmedComment) {
        return;
      }

      const hasStarInput = stars >= 1 && stars <= 5;

      queueSubmit({
        ...(hasStarInput ? { stars } : {}),
        comment: trimmedComment,
        successMessage: hasExistingReview ? "نظر جدید ثبت شد." : "نظر شما ثبت شد.",
      });
    },
    [hasExistingReview, queueSubmit]
  );

  const confirmCaptchaDialog = useCallback((): void => {
    if (!pendingSubmit) {
      return;
    }

    runSubmit(pendingSubmit);
  }, [pendingSubmit, runSubmit]);

  return {
    captchaDialogOpen,
    captchaEnabled,
    captchaVersion,
    captchaValid,
    clearStarAutoSubmitBlock,
    closeCaptchaDialog,
    confirmCaptchaDialog,
    handleCaptchaChange,
    isSubmitting: submitResult.loading,
    pendingIsStarUpdate: Boolean(
      pendingSubmit && !pendingSubmit.comment && typeof pendingSubmit.stars === "number"
    ),
    pendingSubmitStars: pendingSubmit?.stars ?? 0,
    submitComment,
    submitStars,
    successMessageRef,
  };
}
