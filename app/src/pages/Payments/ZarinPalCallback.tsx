import { useEffect, type ReactElement } from "react";
import { Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resolveApiBaseUrl } from "../../utils/apiBaseUrl.util";
import {
  PRODUCT_ROUTE_ID_PARAM,
  PRODUCTS_ROUTE_PATH,
  productDetailPath,
  productsPaymentZarinPalVerifyApiPath,
} from "../../routing/product-route-path";

type ZarinPalVerificationResult = {
  readonly status: "success" | "failed" | "cancelled";
  readonly courseId?: string;
  readonly refId?: string;
  readonly reason?: string;
};

function getApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

function buildPaymentResultUrl(
  result: ZarinPalVerificationResult,
  callbackProductId?: string | null
): string {
  const resultParams = new URLSearchParams({ payment: result.status });
  const productId = result.courseId || callbackProductId;

  if (result.refId) {
    resultParams.set("refId", result.refId);
  }
  if (result.reason) {
    resultParams.set("reason", result.reason);
  }

  if (productId) {
    return `${productDetailPath(productId)}?${resultParams.toString()}`;
  }

  return `${PRODUCTS_ROUTE_PATH}?${resultParams.toString()}`;
}

const ZarinPalCallback = (): ReactElement => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyPayment = async (): Promise<void> => {
      const verifyParams = new URLSearchParams();
      const authority = searchParams.get("Authority");
      const status = searchParams.get("Status");
      const callbackProductId =
        searchParams.get(PRODUCT_ROUTE_ID_PARAM) ?? searchParams.get("productId");

      if (authority) {
        verifyParams.set("Authority", authority);
      }
      if (status) {
        verifyParams.set("Status", status);
      }

      try {
        const response = await fetch(
          `${getApiBaseUrl()}${productsPaymentZarinPalVerifyApiPath()}?${verifyParams.toString()}`,
          { credentials: "include" }
        );
        const result = (await response.json()) as ZarinPalVerificationResult;

        navigate(buildPaymentResultUrl(result, callbackProductId), { replace: true });
      } catch {
        const fallbackPath = callbackProductId
          ? productDetailPath(callbackProductId)
          : PRODUCTS_ROUTE_PATH;
        navigate(`${fallbackPath}?payment=failed&reason=ZARINPAL_VERIFICATION_ERROR`, {
          replace: true,
        });
      }
    };

    void verifyPayment();
  }, [navigate, searchParams]);

  return (
    <Stack minHeight="60vh" alignItems="center" justifyContent="center" padding={2}>
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography component="h1" variant="h6">
              در حال تایید پرداخت
            </Typography>
            <Typography color="text.secondary">
              لطفاً چند لحظه صبر کنید. نتیجه پرداخت از درگاه بررسی می‌شود.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default ZarinPalCallback;
