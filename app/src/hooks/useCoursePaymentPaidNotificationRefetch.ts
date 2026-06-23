import { useEffect, useRef } from "react";

import { GENERAL_SUBSCRIPTION_UPDATE_TYPES } from "../constants";
import { subscribeGeneralUpdates } from "../lib/general-updates-listeners";
import { parseCoursePaymentPaidNotificationCourseId } from "../utilities/course-payment-notification.util";

type UseCoursePaymentPaidNotificationRefetchOptions = {
  readonly enabled?: boolean;
  readonly courseId?: string | null;
  readonly refetch: () => void;
};

export const useCoursePaymentPaidNotificationRefetch = ({
  enabled = true,
  courseId,
  refetch,
}: UseCoursePaymentPaidNotificationRefetchOptions): void => {
  const courseIdRef = useRef(courseId);
  const refetchRef = useRef(refetch);

  useEffect(() => {
    courseIdRef.current = courseId;
  }, [courseId]);

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return subscribeGeneralUpdates((update) => {
      if (update.updateType !== GENERAL_SUBSCRIPTION_UPDATE_TYPES.NOTIFICATION) {
        return;
      }

      const paidCourseId = parseCoursePaymentPaidNotificationCourseId(update.payload);
      if (!paidCourseId) {
        return;
      }

      const activeCourseId = courseIdRef.current?.trim() || null;
      if (activeCourseId && paidCourseId !== activeCourseId) {
        return;
      }

      refetchRef.current();
    });
  }, [enabled]);
};
