import { useCallback, useEffect, useState } from "react";

import { COURSE_REVIEW_SUBMIT_MUTATION } from "../../graphql/mutations/courseReviewSubmit.mutation";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import {
  type CourseReviewReplyVisibility,
  type CourseReviewSubmitMutation,
  type CourseReviewSubmitMutationVariables,
} from "./course-reviews.api";

const MAX_REPLY_LENGTH = 2000;

type UseAdminCourseReviewReplyOptions = {
  readonly courseId: string;
  readonly reviewUserId: string;
  readonly defaultReplyVisibility: CourseReviewReplyVisibility;
  readonly onSubmitted: () => void;
};

export function useAdminCourseReviewReply({
  courseId,
  reviewUserId,
  defaultReplyVisibility,
  onSubmitted,
}: UseAdminCourseReviewReplyOptions) {
  const { showSuccess } = useSnackbar();
  const [reply, setReply] = useState("");
  const [replyVisibility, setReplyVisibility] =
    useState<CourseReviewReplyVisibility>(defaultReplyVisibility);

  useEffect(() => {
    setReplyVisibility(defaultReplyVisibility);
  }, [defaultReplyVisibility, reviewUserId]);

  const [submitReply, submitResult] = useMutationWithSnackbar<
    CourseReviewSubmitMutation,
    CourseReviewSubmitMutationVariables
  >(COURSE_REVIEW_SUBMIT_MUTATION, {
    onSuccess: () => {
      showSuccess("پاسخ شما ثبت شد.");
      setReply("");
      onSubmitted();
    },
  });

  const handleReplyChange = useCallback((value: string): void => {
    setReply(value.slice(0, MAX_REPLY_LENGTH));
  }, []);

  const submitAdminReply = useCallback((): void => {
    const trimmedReply = reply.trim();
    if (!trimmedReply || submitResult.loading) {
      return;
    }

    void submitReply({
      variables: {
        input: {
          courseId,
          userId: reviewUserId,
          comment: trimmedReply,
          messageVisibility: replyVisibility,
        },
      },
    });
  }, [
    courseId,
    reply,
    replyVisibility,
    reviewUserId,
    submitReply,
    submitResult.loading,
  ]);

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
