import { useCallback, useEffect, useState } from "react";

import { PRODUCT_REVIEW_SUBMIT_MUTATION } from "../../graphql/mutations/productReviewSubmit.mutation";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import {
  type ProductReviewReplyVisibility,
  type ProductReviewSubmitMutation,
  type ProductReviewSubmitMutationVariables,
} from "./product-reviews.api";

const MAX_REPLY_LENGTH = 2000;

type UseAdminProductReviewReplyOptions = {
  readonly productId: string;
  readonly reviewUserId: string;
  readonly defaultReplyVisibility: ProductReviewReplyVisibility;
  readonly onSubmitted: () => void;
};

export function useAdminProductReviewReply({
  productId,
  reviewUserId,
  defaultReplyVisibility,
  onSubmitted,
}: UseAdminProductReviewReplyOptions) {
  const { showSuccess } = useSnackbar();
  const [reply, setReply] = useState("");
  const [replyVisibility, setReplyVisibility] =
    useState<ProductReviewReplyVisibility>(defaultReplyVisibility);

  useEffect(() => {
    setReplyVisibility(defaultReplyVisibility);
  }, [defaultReplyVisibility, reviewUserId]);

  const [submitReply, submitResult] = useMutationWithSnackbar<
    ProductReviewSubmitMutation,
    ProductReviewSubmitMutationVariables
  >(PRODUCT_REVIEW_SUBMIT_MUTATION, {
    onSuccess: () => {
      showSuccess("پیام شما ثبت شد.");
      setReply("");
      onSubmitted();
    },
  });

  const handleReplyChange = useCallback((value: string): void => {
    setReply(value.slice(0, MAX_REPLY_LENGTH));
  }, []);

  const submitAdminReply = useCallback((): void => {
    const trimmedReply = reply.trim();
    if (!trimmedReply || !reviewUserId || submitResult.loading) {
      return;
    }

    void submitReply({
      variables: {
        input: {
          productId,
          userId: reviewUserId,
          comment: trimmedReply,
          messageVisibility: replyVisibility,
        },
      },
    });
  }, [productId, reply, replyVisibility, reviewUserId, submitReply, submitResult.loading]);

  return {
    handleReplyChange,
    handleReplyVisibilityChange: setReplyVisibility,
    isSubmitting: submitResult.loading,
    reply,
    replyLength: reply.length,
    replyVisibility,
    maxReplyLength: MAX_REPLY_LENGTH,
    submitAdminReply,
  };
}
