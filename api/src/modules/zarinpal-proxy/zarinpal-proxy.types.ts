export type ZarinPalProxyMetadata = {
  email: string;
  mobile: string;
  productId: string;
  userId: string;
  username: string;
};

export type ZarinPalProxyRequestInput = {
  amountIrt: number;
  callbackUrl: string;
  description: string;
  metadata: ZarinPalProxyMetadata;
};

export type ZarinPalProxyRequestResult = {
  authority: string;
  paymentUrl: string;
  amountIrr: number;
};

export type ZarinPalProxyVerifyInput = {
  authority: string;
  amountIrt: number;
  status?: string;
};

export type ZarinPalProxyVerifyStatus = "success" | "failed" | "cancelled";

export type ZarinPalProxyVerifyResult = {
  status: ZarinPalProxyVerifyStatus;
  refId?: string;
  message?: string;
  zarinpalCode?: number;
};

type ZarinPalProxyErrorBody = {
  ok?: boolean;
  error?: string;
  message?: string;
  zarinpalCode?: number;
};

export type ZarinPalProxyRequestBody = ZarinPalProxyErrorBody & {
  authority?: string;
  paymentUrl?: string;
  amountIrr?: number;
};

export type ZarinPalProxyVerifyBody = ZarinPalProxyErrorBody & {
  status?: ZarinPalProxyVerifyStatus;
  refId?: string | null;
};

export type ZarinPalProxyHttpError = {
  response?: {
    data?: ZarinPalProxyRequestBody | ZarinPalProxyVerifyBody;
    statusText?: string;
  };
  message?: string;
};
