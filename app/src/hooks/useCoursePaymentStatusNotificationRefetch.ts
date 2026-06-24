import { useCallback, useEffect, useRef } from "react";

import { GENERAL_SUBSCRIPTION_UPDATE_TYPES } from "../constants";
import {
  useGeneralUpdatesSubscription,
  type GeneralUpdateEvent,
} from "./useGeneralUpdatesSubscription";
import { parseCoursePaymentStatusNotificationCourseId } from "../utilities/course-payment-notification.util";

type UseCoursePaymentStatusNotificationRefetchOptions = {
  readonly enabled?: boolean;
  readonly courseId?: string | null;
  readonly refetch: () => void;
};

/**
 * Refetches course data when a payment-status notification arrives for the
 * active course (or any course when `courseId` is omitted).
 */
export function useCoursePaymentStatusNotificationRefetch({
  enabled = true,
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

  const handleNotificationUpdate = useCallback((event: GeneralUpdateEvent): void => {
    const matchedCourseId = parseCoursePaymentStatusNotificationCourseId(event.payload);
    if (!matchedCourseId) {
      return;
    }

    const activeCourseId = courseIdRef.current?.trim() || null;
    if (activeCourseId && matchedCourseId !== activeCourseId) {
      return;
    }

    refetchRef.current();
  }, []);

  useGeneralUpdatesSubscription({
    enabled,
    updateTypes: [GENERAL_SUBSCRIPTION_UPDATE_TYPES.NOTIFICATION],
    onNotification: handleNotificationUpdate,
  });
}

/** @deprecated Use `useCoursePaymentStatusNotificationRefetch` instead. */
export const useCoursePaymentPaidNotificationRefetch =
  useCoursePaymentStatusNotificationRefetch;
