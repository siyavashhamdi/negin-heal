import type { AppSettingValueType } from "../system-settings-list.api";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type AppSettingDetail = {
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly valueType: AppSettingValueType;
  readonly value: unknown;
  readonly description?: string | null;
  readonly isActive: boolean;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type AppSettingDetailQuery = {
  readonly appSettingDetail: AppSettingDetail;
};

export type AppSettingDetailQueryVariables = {
  readonly input: {
    readonly id: string;
  };
};

export type AppSettingUpdateMutation = {
  readonly appSettingUpdate: AppSettingDetail;
};

export type AppSettingUpdateMutationVariables = {
  readonly input: {
    readonly id: string;
    readonly label?: string;
    readonly description?: string | null;
    readonly valueType?: AppSettingValueType;
    readonly value?: unknown;
    readonly isActive?: boolean;
  };
};

export type PaymentCardForm = {
  cardNumber: string;
  cardHolderName: string;
  bankName: string;
};

export type PaymentMethodForm = {
  method: "GATEWAY" | "CARD_TO_CARD" | "CRYPTOCURRENCY" | "FREE";
  isVisible: boolean;
  isActive: boolean;
  isRecommended: boolean;
};

export type UsdtWalletForm = {
  network: "TRC20" | "BEP20";
  address: string;
};

export type UsdtIrtRateForm = {
  valueIrt: string;
  feeUsdt: string;
  coefficient: string;
};

export type ZarinpalConfigForm = {
  merchantId: string;
  requestUrl: string;
  verifyUrl: string;
  startPayUrl: string;
  minAmountIrr: string;
  proxyBaseUrl: string;
  proxyApiKey: string;
};

export type EmailSmtpConfigForm = {
  host: string;
  port: string;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
};

export type BackupConfigForm = {
  rarPassword: string;
};

export type TelegramConfigForm = {
  botToken: string;
  chatId: string;
  apiBaseUrl: string;
};

export type EmailTemplateForm = {
  name: string;
  subject: string;
  html: string;
};

export type SupportFaqItemForm = {
  id: string;
  question: string;
  answer: string;
};

export type SupportFaqSectionForm = {
  id: string;
  title: string;
  description: string;
  items: SupportFaqItemForm[];
};

export type SupportFaqPageForm = {
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
  sections: SupportFaqSectionForm[];
};

export type SupportContactForm = {
  eyebrow: string;
  heading: string;
  subtitle: string;
  availabilityLabel: string;
  responseTimeLabel: string;
  whatsapp: string;
  telegram: string;
  instagram: string;
  email: string;
  phone: string;
  faqTitle: string;
  faqDescription: string;
  ticketTitle: string;
  ticketDescription: string;
  contactSectionEyebrow: string;
  contactSectionHeading: string;
  contactSectionSubtitle: string;
  tipsEyebrow: string;
  tipsHeading: string;
  quickTips: string[];
  faqPage: SupportFaqPageForm;
};

export type JsonFormState =
  | { kind: "paymentCards"; cards: PaymentCardForm[] }
  | { kind: "paymentMethods"; methods: PaymentMethodForm[] }
  | { kind: "usdtWallets"; wallets: UsdtWalletForm[] }
  | { kind: "usdtIrtRate"; rate: UsdtIrtRateForm }
  | { kind: "zarinpalConfig"; config: ZarinpalConfigForm }
  | { kind: "emailSmtpConfig"; config: EmailSmtpConfigForm }
  | { kind: "backupConfig"; config: BackupConfigForm }
  | { kind: "telegramConfig"; config: TelegramConfigForm }
  | { kind: "emailTemplates"; templates: EmailTemplateForm[] }
  | { kind: "supportContact"; config: SupportContactForm }
  | { kind: "rawJson"; value: string };

export type AppSettingEditFormState = {
  label: string;
  description: string;
  isActive: boolean;
  valueType: AppSettingValueType;
  scalarValue: string;
  booleanValue: boolean;
  jsonValue: JsonFormState | null;
};

export type UpdateEditFormState = (patch: Partial<AppSettingEditFormState>) => void;
export type UpdateJsonFormState = (updater: (jsonValue: JsonFormState) => JsonFormState) => void;
