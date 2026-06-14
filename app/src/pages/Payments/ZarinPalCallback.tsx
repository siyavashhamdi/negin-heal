import { useEffect, type ReactElement } from "react";
import { Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_CONFIG } from "../../config/env";

type ZarinPalVerificationResult = {
  readonly status: "success" | "failed" | "cancelled";
  readonly courseId?: string;
  readonly refId?: string;
  readonly reason?: string;
};

function getApiBaseUrl(): string {
  return API_CONFIG.API_BASE_URL.replace(/\/$/, "");
}

function buildPaymentResultUrl(
  result: ZarinPalVerificationResult,
  callbackCourseId?: string | null
): string {
  const resultParams = new URLSearchParams({ payment: result.status });
  const courseId = result.courseId || callbackCourseId;

  if (result.refId) {
    resultParams.set("refId", result.refId);
  }
  if (result.reason) {
    resultParams.set("reason", result.reason);
  }

  if (courseId) {
    return `/courses/${courseId}?${resultParams.toString()}`;
  }

  return `/dashboard?${resultParams.toString()}`;
}

const ZarinPalCallback = (): ReactElement => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyPayment = async (): Promise<void> => {
      const verifyParams = new URLSearchParams();
      const authority = searchParams.get("Authority");
      const status = searchParams.get("Status");
      const callbackCourseId = searchParams.get("courseId");

      if (authority) {
        verifyParams.set("Authority", authority);
      }
      if (status) {
        verifyParams.set("Status", status);
      }

      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/courses/payment/zarinpal/verify?${verifyParams.toString()}`,
          { credentials: "include" }
        );
        const result = (await response.json()) as ZarinPalVerificationResult;

        navigate(buildPaymentResultUrl(result, callbackCourseId), { replace: true });
      } catch {
        const fallbackPath = callbackCourseId ? `/courses/${callbackCourseId}` : "/dashboard";
        navigate(`${fallbackPath}?payment=failed&reason=verification-request-failed`, {
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
