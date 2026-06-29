import { useEffect, useRef } from "react";

import { GENERAL_SUBSCRIPTION_UPDATE_TYPES } from "../constants";
import { subscribeGeneralUpdates } from "../lib/general-updates-listeners";
import { parseProductPaymentStatusNotificationProductId } from "../utilities/product-payment-notification.util";

type UseProductPaymentStatusNotificationRefetchOptions = {
  readonly enabled?: boolean;
  readonly productId?: string | null;
  readonly refetch: () => void;
};

/**
 * Refetches product data when a payment-status notification arrives for the
 * active product (or any product when `productId` is omitted).
 *
 * Listens via MainLayout's general-updates subscription — does not open its own GQL subscription.
 */
export function useProductPaymentStatusNotificationRefetch({
  enabled = false,
  productId,
  refetch,
}: UseProductPaymentStatusNotificationRefetchOptions): void {
  const productIdRef = useRef(productId);
  const refetchRef = useRef(refetch);

  useEffect(() => {
    productIdRef.current = productId;
  }, [productId]);

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

      const matchedProductId = parseProductPaymentStatusNotificationProductId(event.payload);
      if (!matchedProductId) {
        return;
      }

      const activeProductId = productIdRef.current?.trim() || null;
      if (activeProductId && matchedProductId !== activeProductId) {
        return;
      }

      refetchRef.current();
    });
  }, [enabled]);
}

/** @deprecated Use `useProductPaymentStatusNotificationRefetch` instead. */
export const useProductPaymentPaidNotificationRefetch = useProductPaymentStatusNotificationRefetch;
