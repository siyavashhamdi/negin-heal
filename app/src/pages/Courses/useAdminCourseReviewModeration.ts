import { useCallback } from "react";

import { COURSE_REVIEW_MODERATION_UPDATE_MUTATION } from "../../graphql/mutations/courseReviewModerationUpdate.mutation";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import {
  type CourseReviewModerationTarget,
  type CourseReviewModerationUpdateMutation,
  type CourseReviewModerationUpdateMutationVariables,
  type CourseReviewVisibility,
} from "./course-reviews.api";

type UseAdminCourseReviewModerationOptions = {
  readonly reviewId: string;
  readonly onUpdated: () => void;
};

export function useAdminCourseReviewModeration({
  reviewId,
  onUpdated,
}: UseAdminCourseReviewModerationOptions) {
  const { showSuccess } = useSnackbar();

  const [updateModeration, updateResult] = useMutationWithSnackbar<
    CourseReviewModerationUpdateMutation,
    CourseReviewModerationUpdateMutationVariables
  >(COURSE_REVIEW_MODERATION_UPDATE_MUTATION, {
    onSuccess: () => {
      showSuccess("وضعیت نمایش به‌روزرسانی شد.");
      onUpdated();
    },
  });

  const updateVisibility = useCallback(
    (
      target: CourseReviewModerationTarget,
      visibility: CourseReviewVisibility,
      messageKey?: string,
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
    [reviewId, updateModeration, updateResult.loading],
  );

  return {
    isUpdating: updateResult.loading,
    updateVisibility,
  };
}
