import { useEffect, useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client/react";

import { PRODUCT_PAYMENT_DETAIL_QUERY } from "../../graphql/queries/productPaymentDetail.query";
import {
  mapProductPaymentDetailRowToRecord,
  type ProductPaymentDetailQuery,
  type ProductPaymentDetailQueryVariables,
  type ProductPaymentRecord,
} from "./payments-list.api";

type UseProductPaymentReviewRecordResult = {
  readonly record: ProductPaymentRecord | null;
  readonly isInitialLoading: boolean;
};

/**
 * Loads a single payment for the review dialog. Fires exactly one network request each time
 * reviewPaymentId becomes active (including reopening after close), and ignores parent re-renders.
 */
export function useProductPaymentReviewRecord(
  reviewPaymentId: string | null
): UseProductPaymentReviewRecordResult {
  const [record, setRecord] = useState<ProductPaymentRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const [loadPaymentDetail] = useLazyQuery<
    ProductPaymentDetailQuery,
    ProductPaymentDetailQueryVariables
  >(PRODUCT_PAYMENT_DETAIL_QUERY, {
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

        const detail = result.data?.productPaymentDetail;
        if (!detail || detail.id !== paymentId) {
          setRecord(null);
          return;
        }

        setRecord(mapProductPaymentDetailRowToRecord(detail));
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
