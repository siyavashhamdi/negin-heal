import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";

import { COUPON_DETAIL_QUERY } from "../../graphql/queries/couponDetail.query";
import {
  mapCouponDetailRowToRecord,
  type CouponDetailQuery,
  type CouponDetailQueryVariables,
  type CouponRecord,
} from "./coupons-list.api";

type UseCouponEditRecordResult = {
  readonly record: CouponRecord | null;
  readonly isInitialLoading: boolean;
};

/**
 * Loads a single coupon for the edit dialog. Uses cache-first so reopening the same
 * coupon does not repeat network requests on parent re-renders.
 */
export function useCouponEditRecord(editCouponId: string | null): UseCouponEditRecordResult {
  const variables = useMemo<CouponDetailQueryVariables | undefined>(
    () => (editCouponId ? { input: { id: editCouponId } } : undefined),
    [editCouponId]
  );

  const { data, previousData, loading } = useQuery<CouponDetailQuery, CouponDetailQueryVariables>(
    COUPON_DETAIL_QUERY,
    {
      variables,
      skip: !editCouponId,
      fetchPolicy: "cache-first",
    }
  );

  const record = useMemo(() => {
    if (!editCouponId) {
      return null;
    }

    const detail = data?.couponDetail ?? previousData?.couponDetail;
    if (!detail || detail.id !== editCouponId) {
      return null;
    }

    return mapCouponDetailRowToRecord(detail);
  }, [data?.couponDetail, editCouponId, previousData?.couponDetail]);

  const isInitialLoading = Boolean(editCouponId) && loading && record == null;

  return { record, isInitialLoading };
}
