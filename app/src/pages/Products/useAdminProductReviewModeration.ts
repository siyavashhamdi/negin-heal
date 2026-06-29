import { useCallback } from "react";

import { PRODUCT_REVIEW_MODERATION_UPDATE_MUTATION } from "../../graphql/mutations/productReviewModerationUpdate.mutation";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import {
  type ProductReviewModerationTarget,
  type ProductReviewModerationUpdateMutation,
  type ProductReviewModerationUpdateMutationVariables,
  type ProductReviewVisibility,
} from "./product-reviews.api";

type UseAdminProductReviewModerationOptions = {
  readonly reviewId: string;
  readonly onUpdated: () => void;
};

export function useAdminProductReviewModeration({
  reviewId,
  onUpdated,
}: UseAdminProductReviewModerationOptions) {
  const { showSuccess } = useSnackbar();

  const [updateModeration, updateResult] = useMutationWithSnackbar<
    ProductReviewModerationUpdateMutation,
    ProductReviewModerationUpdateMutationVariables
  >(PRODUCT_REVIEW_MODERATION_UPDATE_MUTATION, {
    onSuccess: () => {
      showSuccess("وضعیت نمایش به‌روزرسانی شد.");
      onUpdated();
    },
  });

  const updateVisibility = useCallback(
    (
      target: ProductReviewModerationTarget,
      visibility: ProductReviewVisibility,
      messageKey?: string
    ): void => {
      if (updateResult.loading) {
        return;
      }

      void updateModeration({
        variables: {
          input: {
            reviewId,
            target,
            visibility,
            ...(messageKey ? { messageKey } : {}),
          },
        },
      });
    },
    [reviewId, updateModeration, updateResult.loading]
  );

  return {
    isUpdating: updateResult.loading,
    updateVisibility,
  };
}
