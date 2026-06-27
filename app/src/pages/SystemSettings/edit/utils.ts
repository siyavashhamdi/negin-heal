import type {
  AppSettingDetail,
  AppSettingEditFormState,
  AppSettingUpdateMutationVariables,
  BackupConfigForm,
  EmailSmtpConfigForm,
  EmailTemplateForm,
  JsonFormState,
  JsonValue,
  PaymentCardForm,
  PaymentMethodForm,
  SupportContactForm,
  SupportFaqItemForm,
  SupportFaqPageForm,
  SupportFaqSectionForm,
  TelegramConfigForm,
  UsdtIrtRateForm,
  UsdtWalletForm,
  ZarinpalConfigForm,
} from "./types";
import { POSITIVE_INTEGER_NUMBER_SETTING_KEYS } from "./scalar-setting-fields";

const EMPTY_SUPPORT_FAQ_PAGE: SupportFaqPageForm = {
  eyebrow: "",
  heading: "",
  subtitle: "",
  searchLabel: "",
  searchPlaceholder: "",
  resultCountLabel: "",
  noResultsLabel: "",
  emptyTitle: "",
  emptyDescription: "",
  emptyActionLabel: "",
  sections: [],
};

const EMPTY_SUPPORT_CONTACT: SupportContactForm = {
  eyebrow: "",
  heading: "",
  subtitle: "",
  availabilityLabel: "",
  responseTimeLabel: "",
  whatsapp: "",
  telegram: "",
  instagram: "",
  email: "",
  phone: "",
  faqTitle: "",
  faqDescription: "",
  ticketTitle: "",
  ticketDescription: "",
  contactSectionEyebrow: "",
  contactSectionHeading: "",
  contactSectionSubtitle: "",
  tipsEyebrow: "",
  tipsHeading: "",
  quickTips: [],
  faqPage: EMPTY_SUPPORT_FAQ_PAGE,
};

export const PAYMENT_METHOD_OPTIONS: readonly PaymentMethodForm["method"][] = [
  "GATEWAY",
  "CARD_TO_CARD",
  "CRYPTOCURRENCY",
  "FREE",
];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethodForm["method"], string> = {
  GATEWAY: "درگاه",
  CARD_TO_CARD: "کارت به کارت",
  CRYPTOCURRENCY: "رمزارز",
  FREE: "رایگان",
};

export const WALLET_NETWORK_OPTIONS: readonly UsdtWalletForm["network"][] = ["TRC20", "BEP20"];

export function createEmptyPaymentCard(): PaymentCardForm {
  return { cardNumber: "", cardHolderName: "", bankName: "" };
}

export function createEmptyPaymentMethod(): PaymentMethodForm {
  return {
    method: "GATEWAY",
    isVisible: true,
    isActive: true,
    isRecommended: false,
  };
}

export function createEmptyUsdtWallet(): UsdtWalletForm {
  return { network: "TRC20", address: "" };
}

export function createEmptyEmailTemplate(): EmailTemplateForm {
  return { name: "", subject: "", html: "" };
}

export function createEmptyQuickTip(): string {
  return "";
}

export function createEmptyFaqItem(): SupportFaqItemForm {
  return { id: "", question: "", answer: "" };
}

export function createEmptyFaqSection(): SupportFaqSectionForm {
  return { id: "", title: "", description: "", items: [createEmptyFaqItem()] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function numberText(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return typeof value === "string" ? value : "";
}

function normalizePaymentCards(value: unknown): PaymentCardForm[] {
  if (!Array.isArray(value)) {
    return [createEmptyPaymentCard()];
  }
  const cards = value.map((item) => {
    const card = isRecord(item) ? item : {};
    return {
      cardNumber: text(card.cardNumber),
      cardHolderName: text(card.cardHolderName),
      bankName: text(card.bankName),
    };
  });
  return cards.length > 0 ? cards : [createEmptyPaymentCard()];
}

function normalizePaymentMethods(value: unknown): PaymentMethodForm[] {
  if (!Array.isArray(value)) {
    return [createEmptyPaymentMethod()];
  }
  const methods = value.map((item) => {
    const method = isRecord(item) ? item : {};
    const rawMethod = text(method.method).toUpperCase() as PaymentMethodForm["method"];
    return {
      method: PAYMENT_METHOD_OPTIONS.includes(rawMethod) ? rawMethod : "GATEWAY",
      isVisible: bool(method.isVisible, true),
      isActive: bool(method.isActive, true),
      isRecommended: bool(method.isRecommended),
    };
  });
  return methods.length > 0 ? methods : [createEmptyPaymentMethod()];
}

function normalizeUsdtWallets(value: unknown): UsdtWalletForm[] {
  if (!Array.isArray(value)) {
    return [createEmptyUsdtWallet()];
  }
  const wallets = value.map((item) => {
    const wallet = isRecord(item) ? item : {};
    const network = text(wallet.network).toUpperCase() as UsdtWalletForm["network"];
    return {
      network: WALLET_NETWORK_OPTIONS.includes(network) ? network : "TRC20",
      address: text(wallet.address),
    };
  });
  return wallets.length > 0 ? wallets : [createEmptyUsdtWallet()];
}

function normalizeUsdtIrtRate(value: unknown): UsdtIrtRateForm {
  const rate = isRecord(value) ? value : {};
  return {
    valueIrt: numberText(rate.valueIrt ?? rate.value),
    feeUsdt: numberText(rate.feeUsdt ?? rate.fee),
    coefficient: numberText(rate.coefficient),
  };
}

function normalizeZarinpalConfig(value: unknown): ZarinpalConfigForm {
  const config = isRecord(value) ? value : {};
  return {
    merchantId: text(config.merchantId),
    requestUrl: text(config.requestUrl),
    verifyUrl: text(config.verifyUrl),
    startPayUrl: text(config.startPayUrl),
    minAmountIrr: numberText(config.minAmountIrr),
    proxyBaseUrl: text(config.proxyBaseUrl),
    proxyApiKey: text(config.proxyApiKey),
  };
}

function normalizeEmailSmtpConfig(value: unknown): EmailSmtpConfigForm {
  const config = isRecord(value) ? value : {};
  return {
    host: text(config.host),
    port: numberText(config.port),
    secure: bool(config.secure),
    username: text(config.username),
    password: text(config.password),
    fromName: text(config.fromName),
    fromEmail: text(config.fromEmail),
  };
}

function normalizeBackupConfig(value: unknown): BackupConfigForm {
  const config = isRecord(value) ? value : {};
  return {
    rarPassword: text(config.rarPassword),
  };
}

function normalizeTelegramConfig(value: unknown): TelegramConfigForm {
  const config = isRecord(value) ? value : {};
  return {
    botToken: text(config.botToken),
    chatId: text(config.chatId),
    apiBaseUrl: text(config.apiBaseUrl) || "https://api.telegram.org",
  };
}

function normalizeEmailTemplates(value: unknown): EmailTemplateForm[] {
  if (!Array.isArray(value)) {
    return [createEmptyEmailTemplate()];
  }
  const templates = value.map((item) => {
    const template = isRecord(item) ? item : {};
    return {
      name: text(template.name),
      subject: text(template.subject),
      html: text(template.html),
    };
  });
  return templates.length > 0 ? templates : [createEmptyEmailTemplate()];
}

function normalizeFaqItems(value: unknown): SupportFaqItemForm[] {
  if (!Array.isArray(value)) {
    return [createEmptyFaqItem()];
  }
  const items = value.map((item) => {
    const faqItem = isRecord(item) ? item : {};
    return {
      id: text(faqItem.id),
      question: text(faqItem.question),
      answer: text(faqItem.answer),
    };
  });
  return items.length > 0 ? items : [createEmptyFaqItem()];
}

function normalizeFaqSections(value: unknown): SupportFaqSectionForm[] {
  if (!Array.isArray(value)) {
    return [createEmptyFaqSection()];
  }
  const sections = value.map((item) => {
    const section = isRecord(item) ? item : {};
    return {
      id: text(section.id),
      title: text(section.title),
      description: text(section.description),
      items: normalizeFaqItems(section.items),
    };
  });
  return sections.length > 0 ? sections : [createEmptyFaqSection()];
}

function normalizeFaqPage(value: unknown): SupportFaqPageForm {
  const faqPage = isRecord(value) ? value : {};
  return {
    eyebrow: text(faqPage.eyebrow),
    heading: text(faqPage.heading),
    subtitle: text(faqPage.subtitle),
    searchLabel: text(faqPage.searchLabel),
    searchPlaceholder: text(faqPage.searchPlaceholder),
    resultCountLabel: text(faqPage.resultCountLabel),
    noResultsLabel: text(faqPage.noResultsLabel),
    emptyTitle: text(faqPage.emptyTitle),
    emptyDescription: text(faqPage.emptyDescription),
    emptyActionLabel: text(faqPage.emptyActionLabel),
    sections: normalizeFaqSections(faqPage.sections),
  };
}

function normalizeSupportContact(value: unknown): SupportContactForm {
  const config = isRecord(value) ? value : {};
  const quickTips = Array.isArray(config.quickTips)
    ? config.quickTips.map((item) => text(item))
    : [createEmptyQuickTip()];
  return {
    ...EMPTY_SUPPORT_CONTACT,
    eyebrow: text(config.eyebrow),
    heading: text(config.heading),
    subtitle: text(config.subtitle),
    availabilityLabel: text(config.availabilityLabel),
    responseTimeLabel: text(config.responseTimeLabel),
    whatsapp: text(config.whatsapp),
    telegram: text(config.telegram),
    instagram: text(config.instagram),
    email: text(config.email),
    phone: text(config.phone),
    faqTitle: text(config.faqTitle),
    faqDescription: text(config.faqDescription),
    ticketTitle: text(config.ticketTitle),
    ticketDescription: text(config.ticketDescription),
    contactSectionEyebrow: text(config.contactSectionEyebrow),
    contactSectionHeading: text(config.contactSectionHeading),
    contactSectionSubtitle: text(config.contactSectionSubtitle),
    tipsEyebrow: text(config.tipsEyebrow),
    tipsHeading: text(config.tipsHeading),
    quickTips: quickTips.length > 0 ? quickTips : [createEmptyQuickTip()],
    faqPage: normalizeFaqPage(config.faqPage),
  };
}

function normalizeJsonForm(key: string, value: unknown): JsonFormState {
  switch (key) {
    case "PAYMENT_CARDS":
      return { kind: "paymentCards", cards: normalizePaymentCards(value) };
    case "PAYMENT_METHODS":
      return { kind: "paymentMethods", methods: normalizePaymentMethods(value) };
    case "USDT_WALLETS":
      return { kind: "usdtWallets", wallets: normalizeUsdtWallets(value) };
    case "USDT_IRT_RATE":
      return { kind: "usdtIrtRate", rate: normalizeUsdtIrtRate(value) };
    case "ZARINPAL_CONFIG":
      return { kind: "zarinpalConfig", config: normalizeZarinpalConfig(value) };
    case "EMAIL_SMTP_CONFIG":
      return { kind: "emailSmtpConfig", config: normalizeEmailSmtpConfig(value) };
    case "BACKUP_CONFIG":
      return { kind: "backupConfig", config: normalizeBackupConfig(value) };
    case "TELEGRAM_CONFIG":
      return { kind: "telegramConfig", config: normalizeTelegramConfig(value) };
    case "EMAIL_TEMPLATES":
      return { kind: "emailTemplates", templates: normalizeEmailTemplates(value) };
    case "SUPPORT_CONTACT":
      return { kind: "supportContact", config: normalizeSupportContact(value) };
    default:
      return { kind: "rawJson", value: JSON.stringify(value ?? {}, null, 2) };
  }
}

function positiveInteger(value: string, label: string): number {
  const parsed = finiteNumber(value, label);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} باید عدد صحیح بزرگ‌تر از صفر باشد.`);
  }
  return parsed;
}

export function buildInitialEditForm(setting: AppSettingDetail): AppSettingEditFormState {
  return {
    label: setting.label,
    description: setting.description ?? "",
    isActive: setting.isActive,
    valueType: setting.valueType,
    scalarValue: setting.valueType === "BOOLEAN" ? "" : text(setting.value),
    booleanValue: bool(setting.value),
    jsonValue: setting.valueType === "JSON" ? normalizeJsonForm(setting.key, setting.value) : null,
  };
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} الزامی است.`);
  }
  return normalized;
}

function optionalText(value: string): string {
  return value.trim();
}

function finiteNumber(value: string, label: string): number {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} الزامی است.`);
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} باید عدد معتبر باشد.`);
  }
  return parsed;
}

function serializeJsonForm(jsonForm: JsonFormState): JsonValue {
  switch (jsonForm.kind) {
    case "paymentCards":
      return jsonForm.cards.map((card) => ({
        cardNumber: requiredText(card.cardNumber, "شماره کارت"),
        cardHolderName: requiredText(card.cardHolderName, "نام صاحب کارت"),
        bankName: requiredText(card.bankName, "نام بانک"),
      }));
    case "paymentMethods":
      return jsonForm.methods.map((method) => ({
        method: method.method,
        isVisible: method.isVisible,
        isActive: method.isActive,
        isRecommended: method.isRecommended,
      }));
    case "usdtWallets":
      return jsonForm.wallets.map((wallet) => ({
        network: wallet.network,
        address: requiredText(wallet.address, "آدرس کیف پول"),
      }));
    case "usdtIrtRate":
      return {
        valueIrt: finiteNumber(jsonForm.rate.valueIrt, "نرخ تومان"),
        feeUsdt: finiteNumber(jsonForm.rate.feeUsdt, "کارمزد USDT"),
        coefficient: finiteNumber(jsonForm.rate.coefficient, "ضریب"),
      };
    case "zarinpalConfig": {
      const proxyBaseUrl = optionalText(jsonForm.config.proxyBaseUrl);
      const proxyApiKey = optionalText(jsonForm.config.proxyApiKey);

      if (proxyBaseUrl !== "" && proxyApiKey === "") {
        throw new Error("کلید API پروکسی الزامی است وقتی آدرس پروکسی تنظیم شده باشد.");
      }

      if (proxyBaseUrl === "" && proxyApiKey !== "") {
        throw new Error("آدرس پروکسی زرین‌پال الزامی است وقتی کلید API پروکسی تنظیم شده باشد.");
      }

      return {
        merchantId: requiredText(jsonForm.config.merchantId, "مرچنت آیدی"),
        requestUrl: requiredText(jsonForm.config.requestUrl, "آدرس Request"),
        verifyUrl: requiredText(jsonForm.config.verifyUrl, "آدرس Verify"),
        startPayUrl: requiredText(jsonForm.config.startPayUrl, "آدرس StartPay"),
        minAmountIrr: finiteNumber(jsonForm.config.minAmountIrr, "حداقل مبلغ ریالی"),
        proxyBaseUrl,
        proxyApiKey,
      };
    }
    case "emailSmtpConfig":
      return {
        host: requiredText(jsonForm.config.host, "هاست SMTP"),
        port: finiteNumber(jsonForm.config.port, "پورت SMTP"),
        secure: jsonForm.config.secure,
        username: requiredText(jsonForm.config.username, "نام کاربری ایمیل"),
        password: requiredText(jsonForm.config.password, "گذرواژه ایمیل"),
        fromName: requiredText(jsonForm.config.fromName, "نام فرستنده"),
        fromEmail: requiredText(jsonForm.config.fromEmail, "ایمیل فرستنده"),
      };
    case "backupConfig":
      return {
        rarPassword: requiredText(jsonForm.config.rarPassword, "رمز آرشیو RAR"),
      };
    case "telegramConfig":
      return {
        botToken: requiredText(jsonForm.config.botToken, "توکن ربات تلگرام"),
        chatId: requiredText(jsonForm.config.chatId, "شناسه چت تلگرام"),
        apiBaseUrl: requiredText(jsonForm.config.apiBaseUrl, "آدرس API تلگرام"),
      };
    case "emailTemplates":
      return jsonForm.templates.map((template) => ({
        name: requiredText(template.name, "نام قالب"),
        subject: requiredText(template.subject, "موضوع قالب"),
        html: requiredText(template.html, "HTML قالب"),
      }));
    case "supportContact":
      return {
        eyebrow: optionalText(jsonForm.config.eyebrow),
        heading: requiredText(jsonForm.config.heading, "تیتر پشتیبانی"),
        subtitle: optionalText(jsonForm.config.subtitle),
        availabilityLabel: optionalText(jsonForm.config.availabilityLabel),
        responseTimeLabel: optionalText(jsonForm.config.responseTimeLabel),
        whatsapp: optionalText(jsonForm.config.whatsapp),
        telegram: optionalText(jsonForm.config.telegram),
        instagram: optionalText(jsonForm.config.instagram),
        email: optionalText(jsonForm.config.email),
        phone: optionalText(jsonForm.config.phone),
        faqTitle: optionalText(jsonForm.config.faqTitle),
        faqDescription: optionalText(jsonForm.config.faqDescription),
        ticketTitle: optionalText(jsonForm.config.ticketTitle),
        ticketDescription: optionalText(jsonForm.config.ticketDescription),
        contactSectionEyebrow: optionalText(jsonForm.config.contactSectionEyebrow),
        contactSectionHeading: optionalText(jsonForm.config.contactSectionHeading),
        contactSectionSubtitle: optionalText(jsonForm.config.contactSectionSubtitle),
        tipsEyebrow: optionalText(jsonForm.config.tipsEyebrow),
        tipsHeading: optionalText(jsonForm.config.tipsHeading),
        quickTips: jsonForm.config.quickTips.map(optionalText).filter(Boolean),
        faqPage: {
          eyebrow: optionalText(jsonForm.config.faqPage.eyebrow),
          heading: optionalText(jsonForm.config.faqPage.heading),
          subtitle: optionalText(jsonForm.config.faqPage.subtitle),
          searchLabel: optionalText(jsonForm.config.faqPage.searchLabel),
          searchPlaceholder: optionalText(jsonForm.config.faqPage.searchPlaceholder),
          resultCountLabel: optionalText(jsonForm.config.faqPage.resultCountLabel),
          noResultsLabel: optionalText(jsonForm.config.faqPage.noResultsLabel),
          emptyTitle: optionalText(jsonForm.config.faqPage.emptyTitle),
          emptyDescription: optionalText(jsonForm.config.faqPage.emptyDescription),
          emptyActionLabel: optionalText(jsonForm.config.faqPage.emptyActionLabel),
          sections: jsonForm.config.faqPage.sections.map((section) => ({
            id: requiredText(section.id, "شناسه دسته سوالات"),
            title: requiredText(section.title, "عنوان دسته سوالات"),
            description: optionalText(section.description),
            items: section.items.map((item) => ({
              id: requiredText(item.id, "شناسه سوال"),
              question: requiredText(item.question, "متن سوال"),
              answer: requiredText(item.answer, "پاسخ سوال"),
            })),
          })),
        },
      };
    case "rawJson":
      try {
        return JSON.parse(jsonForm.value) as JsonValue;
      } catch {
        throw new Error("JSON واردشده معتبر نیست.");
      }
    default:
      throw new Error("نوع JSON تنظیمات پشتیبانی نمی‌شود.");
  }
}

export function buildUpdateVariables(
  setting: AppSettingDetail,
  form: AppSettingEditFormState
): AppSettingUpdateMutationVariables {
  const label = requiredText(form.label, "عنوان");
  let value: unknown;

  if (form.valueType === "STRING") {
    value = form.scalarValue;
  } else if (form.valueType === "NUMBER") {
    value = POSITIVE_INTEGER_NUMBER_SETTING_KEYS.has(setting.key)
      ? positiveInteger(form.scalarValue, "مقدار عددی")
      : finiteNumber(form.scalarValue, "مقدار عددی");
  } else if (form.valueType === "BOOLEAN") {
    value = form.booleanValue;
  } else {
    if (!form.jsonValue) {
      throw new Error("ساختار JSON آماده نیست.");
    }
    value = serializeJsonForm(form.jsonValue);
  }

  return {
    input: {
      id: setting.id,
      label,
      description: form.description.trim() || null,
      valueType: form.valueType,
      value,
      isActive: form.isActive,
    },
  };
}
