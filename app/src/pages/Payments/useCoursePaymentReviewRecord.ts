import { useEffect, useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client/react";

import { COURSE_PAYMENT_DETAIL_QUERY } from "../../graphql/queries/coursePaymentDetail.query";
import {
  mapCoursePaymentDetailRowToRecord,
  type CoursePaymentDetailQuery,
  type CoursePaymentDetailQueryVariables,
  type CoursePaymentRecord,
} from "./payments-list.api";

type UseCoursePaymentReviewRecordResult = {
  readonly record: CoursePaymentRecord | null;
  readonly isInitialLoading: boolean;
};

/**
 * Loads a single payment for the review dialog. Fires exactly one network request each time
 * reviewPaymentId becomes active (including reopening after close), and ignores parent re-renders.
 */
export function useCoursePaymentReviewRecord(
  reviewPaymentId: string | null,
): UseCoursePaymentReviewRecordResult {
  const [record, setRecord] = useState<CoursePaymentRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const [loadPaymentDetail] = useLazyQuery<
    CoursePaymentDetailQuery,
    CoursePaymentDetailQueryVariables
  >(COURSE_PAYMENT_DETAIL_QUERY, {
    fetchPolicy: "network-only",
  });

  const loadPaymentDetailRef = useRef(loadPaymentDetail);
  useEffect(() => {
    loadPaymentDetailRef.current = loadPaymentDetail;
  }, [loadPaymentDetail]);

  useEffect(() => {
    if (!reviewPaymentId) {
      setRecord(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const paymentId = reviewPaymentId;

    setRecord(null);
    setLoading(true);

    void loadPaymentDetailRef
      .current({
        variables: { input: { id: paymentId } },
      })
      .then((result) => {
        if (cancelled) {
          return;
        }

        const detail = result.data?.coursePaymentDetail;
        if (!detail || detail.id !== paymentId) {
          setRecord(null);
          return;
        }

        setRecord(mapCoursePaymentDetailRowToRecord(detail));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reviewPaymentId]);

  const isInitialLoading = Boolean(reviewPaymentId) && loading && record == null;

  return { record, isInitialLoading };
}
