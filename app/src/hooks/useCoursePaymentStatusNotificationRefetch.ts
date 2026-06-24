import { useEffect, useRef } from "react";

import { GENERAL_SUBSCRIPTION_UPDATE_TYPES } from "../constants";
import { subscribeGeneralUpdates } from "../lib/general-updates-listeners";
import { parseCoursePaymentStatusNotificationCourseId } from "../utilities/course-payment-notification.util";

type UseCoursePaymentStatusNotificationRefetchOptions = {
  readonly enabled?: boolean;
  readonly courseId?: string | null;
  readonly refetch: () => void;
};

/**
 * Refetches course data when a payment-status notification arrives for the
 * active course (or any course when `courseId` is omitted).
 *
 * Listens via MainLayout's general-updates subscription — does not open its own GQL subscription.
 */
export function useCoursePaymentStatusNotificationRefetch({
  enabled = false,
  courseId,
  refetch,
}: UseCoursePaymentStatusNotificationRefetchOptions): void {
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
      return undefined;
    }

    return subscribeGeneralUpdates((event) => {
      if (event.updateType !== GENERAL_SUBSCRIPTION_UPDATE_TYPES.NOTIFICATION) {
        return;
      }

      const matchedCourseId = parseCoursePaymentStatusNotificationCourseId(event.payload);
      if (!matchedCourseId) {
        return;
      }

      const activeCourseId = courseIdRef.current?.trim() || null;
      if (activeCourseId && matchedCourseId !== activeCourseId) {
        return;
      }

      refetchRef.current();
    });
  }, [enabled]);
}

/** @deprecated Use `useCoursePaymentStatusNotificationRefetch` instead. */
export const useCoursePaymentPaidNotificationRefetch =
  useCoursePaymentStatusNotificationRefetch;
