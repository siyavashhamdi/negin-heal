import { UserProductPaymentMethod } from "../../enums";

export type StoredAppSettingJsonValue = object | string | number | boolean;

export type SupportContactChannelType =
  | "WHATSAPP"
  | "TELEGRAM"
  | "INSTAGRAM"
  | "TICKET"
  | "EMAIL"
  | "PHONE";

export type SupportContactChannelConfig = {
  type: SupportContactChannelType;
  label: string;
  value: string;
  href: string;
  description: string;
  isActive: boolean;
  isPrimary: boolean;
};

export type SupportFaqItemConfig = {
  id: string;
  question: string;
  answer: string;
};

export type SupportFaqSectionConfig = {
  id: string;
  title: string;
  description: string;
  items: SupportFaqItemConfig[];
};

export type SupportFaqPageConfig = {
  eyebrow: string;
  heading: string;
  subtitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  resultCountLabel: string;
  noResultsLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel: string;
  sections: SupportFaqSectionConfig[];
};

export type SupportContactConfig = {
  eyebrow: string;
  heading: string;
  subtitle: string;
  availabilityLabel: string;
  responseTimeLabel: string;
  faqTitle: string;
  faqDescription: string;
  contactSectionEyebrow: string;
  contactSectionHeading: string;
  contactSectionSubtitle: string;
  tipsEyebrow: string;
  tipsHeading: string;
  channels: SupportContactChannelConfig[];
  quickTips: string[];
  faqPage: SupportFaqPageConfig;
};

export type AppAboutPageConfig = {
  html: string;
};

export type AppPrivacyPolicyPageConfig = {
  html: string;
};

export type AppTermsOfUsePageConfig = {
  html: string;
};

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
  method: UserProductPaymentMethod;
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

export type StoredBackupConfigValue = {
  rarPassword?: string;
};

export type StoredTelegramConfigValue = {
  botToken?: string;
  chatId?: string;
  apiBaseUrl?: string;
};

export type BackupConfig = {
  rarPassword: string;
};

export type TelegramConfig = {
  botToken: string;
  chatId: string;
  apiBaseUrl: string;
};

export type StoredSupportContactConfigValue = {
  eyebrow?: unknown;
  heading?: unknown;
  subtitle?: unknown;
  availabilityLabel?: unknown;
  responseTimeLabel?: unknown;
  whatsapp?: unknown;
  telegram?: unknown;
  instagram?: unknown;
  faqTitle?: unknown;
  faqDescription?: unknown;
  ticketTitle?: unknown;
  ticketDescription?: unknown;
  contactSectionEyebrow?: unknown;
  contactSectionHeading?: unknown;
  contactSectionSubtitle?: unknown;
  tipsEyebrow?: unknown;
  tipsHeading?: unknown;
  email?: unknown;
  phone?: unknown;
  quickTips?: unknown;
  faqPage?: unknown;
};

export type StoredSupportFaqItemValue = {
  id?: unknown;
  question?: unknown;
  answer?: unknown;
};

export type StoredSupportFaqSectionValue = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  items?: unknown;
};

export type StoredSupportFaqPageValue = {
  eyebrow?: unknown;
  heading?: unknown;
  subtitle?: unknown;
  searchLabel?: unknown;
  searchPlaceholder?: unknown;
  resultCountLabel?: unknown;
  noResultsLabel?: unknown;
  emptyTitle?: unknown;
  emptyDescription?: unknown;
  emptyActionLabel?: unknown;
  sections?: unknown;
};
