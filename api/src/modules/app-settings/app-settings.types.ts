import { UserCoursePaymentMethod } from "../../enums";

export type StoredAppSettingJsonValue = object | string | number | boolean;

export type PaymentCardConfig = {
  cardNumber: string;
  holderName: string;
  bankName: string;
};

export type CryptoWalletConfig = {
  address: string;
  network: "TRC20" | "BEP20";
};

export type PaymentMethodConfig = {
  method: UserCoursePaymentMethod;
  isVisible: boolean;
  isActive: boolean;
  isRecommended: boolean;
};

export type UsdtIrtRateConfig = {
  valueIrt: number;
  feeUsdt: number;
  coefficient: number;
};

export type PaymentCheckoutConfig = {
  paymentCards: PaymentCardConfig[];
  cryptoWallets: CryptoWalletConfig[];
  paymentMethods: PaymentMethodConfig[];
  usdtIrtRate: UsdtIrtRateConfig;
};

export type StoredPaymentCardValue = {
  cardNumber?: string;
  cardHolderName?: string;
  bankName?: string;
};

export type StoredCryptoWalletValue = {
  address?: string;
  network?: string;
};

export type StoredPaymentMethodValue = {
  method?: string;
  isVisible?: boolean;
  isActive?: boolean;
  isRecommended?: boolean;
};

export type StoredUsdtIrtRateValue = {
  value?: number;
  fee?: number;
  valueIrt?: number;
  feeUsdt?: number;
  coefficient?: number;
};
