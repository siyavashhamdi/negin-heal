import { FilterQuery, Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  APP_SETTING_KEY,
  PAYMENT_CHECKOUT_SETTING_KEYS,
} from "../../constants/app-setting.constant";
import { PAGINATION_CONSTANT } from "../../constants/pagination.constant";
import { AppSettingValueType, UserCoursePaymentMethod } from "../../enums";
import { SortingOrder } from "../../common/pagination/input";
import { buildSortOptions } from "../../common/pagination/utils";
import { AppSetting, AppSettingDocument } from "../../database/schemas";
import {
  AppSettingDetailGqlInput,
  AppSettingKeyListGqlInput,
  AppSettingKeyListSortOptionInput,
  AppSettingUpdateGqlInput,
} from "./graphql/inputs";
import {
  AppSettingKeyListPaginatedOffsetGqlResponse,
  AppSettingKeyListSummaryGqlResponse,
  AppSettingMutationGqlResponse,
} from "./graphql/responses";
import {
  AppAboutPageConfig,
  AppPrivacyPolicyPageConfig,
  AppTermsOfUsePageConfig,
  AppVersionConfig,
  CryptoWalletConfig,
  PaymentCardConfig,
  PaymentCheckoutConfig,
  PaymentMethodConfig,
  StoredAppSettingJsonValue,
  StoredCryptoWalletValue,
  StoredPaymentCardValue,
  StoredPaymentMethodValue,
  StoredSupportContactConfigValue,
  StoredSupportFaqItemValue,
  StoredSupportFaqPageValue,
  StoredSupportFaqSectionValue,
  StoredUsdtIrtRateValue,
  SupportContactChannelConfig,
  SupportContactChannelType,
  SupportContactConfig,
  SupportFaqItemConfig,
  SupportFaqPageConfig,
  SupportFaqSectionConfig,
  UsdtIrtRateConfig,
} from "./app-settings.types";

const DEFAULT_PAYMENT_METHODS: readonly PaymentMethodConfig[] = [
  {
    method: UserCoursePaymentMethod.GATEWAY,
    isVisible: true,
    isActive: true,
    isRecommended: true,
  },
  {
    method: UserCoursePaymentMethod.CARD_TO_CARD,
    isVisible: true,
    isActive: true,
    isRecommended: false,
  },
  {
    method: UserCoursePaymentMethod.CRYPTOCURRENCY,
    isVisible: true,
    isActive: true,
    isRecommended: false,
  },
];

const DEFAULT_USDT_IRT_RATE: UsdtIrtRateConfig = {
  valueIrt: 0,
  feeUsdt: 0,
  coefficient: 1,
};

const EMPTY_SUPPORT_FAQ_PAGE: SupportFaqPageConfig = {
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

const SUPPORT_CONTACT_COPY: Record<
  Exclude<SupportContactChannelType, "TICKET">,
  Pick<SupportContactChannelConfig, "label" | "description">
> = {
  WHATSAPP: {
    label: "واتساپ",
    description: "برای هماهنگی سریع و سوال‌های کوتاه در ساعات کاری.",
  },
  TELEGRAM: {
    label: "تلگرام",
    description: "ارسال پیام مستقیم و دریافت راهنمایی مرحله‌به‌مرحله.",
  },
  INSTAGRAM: {
    label: "اینستاگرام",
    description: "پیگیری اخبار، اعلان‌ها و ارتباط از طریق پیام مستقیم.",
  },
  EMAIL: {
    label: "ایمیل",
    description: "برای ارسال توضیحات کامل، مستندات یا پیوست‌های مرتبط.",
  },
  PHONE: {
    label: "تماس تلفنی",
    description: "برای موارد فوری که نیاز به راهنمایی مستقیم دارند.",
  },
};

const DEFAULT_APP_ABOUT_PAGE_HTML = "";

type AppSettingKeyListSortField = Extract<
  keyof AppSettingKeyListSortOptionInput,
  string
>;

type AppSettingKeyListRecord = Pick<
  AppSetting,
  | "_id"
  | "key"
  | "label"
  | "valueType"
  | "description"
  | "isActive"
  | "audit"
>;

type AppSettingMutationRecord = Pick<
  AppSetting,
  | "_id"
  | "key"
  | "label"
  | "value"
  | "valueType"
  | "description"
  | "isActive"
  | "audit"
>;

type AppSettingUpdateOperation = {
  $set?: Record<string, unknown>;
  $unset?: Record<string, 1>;
};

@Injectable()
export class AppSettingsService {
  constructor(
    @InjectModel(AppSetting.name)
    private readonly appSettingModel: Model<AppSettingDocument>,
  ) {}

  async listKeys(
    input: AppSettingKeyListGqlInput,
  ): Promise<AppSettingKeyListPaginatedOffsetGqlResponse> {
    const { filters, options } = input || {};
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_LIMIT;
    const skip = options?.skip ?? PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_SKIP;
    const filterQuery = this.buildKeyListFilterQuery(filters);
    const sortOptions = this.resolveAppSettingKeyListSortOptions(options?.sort);

    const [settings, total] = await Promise.all([
      this.appSettingModel
        .find(filterQuery)
        .select("-value")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean<AppSettingKeyListRecord[]>()
        .exec(),
      this.appSettingModel.countDocuments(filterQuery).exec(),
    ]);

    return {
      items: settings.map((setting) =>
        this.toAppSettingKeyListSummaryResponse(setting),
      ),
      pagination: {
        limit,
        skip,
        total,
        count: settings.length,
      },
    };
  }

  async getDetail(
    input: AppSettingDetailGqlInput,
  ): Promise<AppSettingMutationGqlResponse> {
    const setting = await this.appSettingModel
      .findOne({
        _id: input.id,
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      })
      .lean<AppSettingMutationRecord>()
      .exec();

    if (!setting) {
      throw new NotFoundException("App setting not found");
    }

    return this.toAppSettingMutationResponse(setting);
  }

  async update(
    input: AppSettingUpdateGqlInput,
  ): Promise<AppSettingMutationGqlResponse> {
    const existingSetting = await this.appSettingModel
      .findOne({
        _id: input.id,
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      })
      .exec();

    if (!existingSetting) {
      throw new NotFoundException("App setting not found");
    }

    const update = this.buildAppSettingUpdateOperation(
      input,
      existingSetting.toObject() as AppSettingMutationRecord,
    );

    if (!update.$set && !update.$unset) {
      return this.toAppSettingMutationResponse(
        existingSetting.toObject() as AppSettingMutationRecord,
      );
    }

    const updatedSetting = await this.appSettingModel
      .findByIdAndUpdate(input.id, update, {
        new: true,
        runValidators: true,
      })
      .lean<AppSettingMutationRecord>()
      .exec();

    if (!updatedSetting) {
      throw new NotFoundException("App setting not found");
    }

    return this.toAppSettingMutationResponse(updatedSetting);
  }

  async getPaymentCheckoutConfig(): Promise<PaymentCheckoutConfig> {
    const settings = await this.appSettingModel
      .find({
        key: { $in: [...PAYMENT_CHECKOUT_SETTING_KEYS] },
        isActive: true,
      })
      .lean()
      .exec();

    const settingsByKey = new Map(
      settings.map((setting) => [setting.key, setting]),
    );

    return {
      paymentCards: this.buildPaymentCards(settingsByKey),
      cryptoWallets: this.buildCryptoWallets(settingsByKey),
      paymentMethods: this.parsePaymentMethods(
        settingsByKey.get(APP_SETTING_KEY.PAYMENT_METHODS)?.value,
      ),
      usdtIrtRate: this.parseUsdtIrtRate(
        settingsByKey.get(APP_SETTING_KEY.USDT_IRT_RATE)?.value,
      ),
    };
  }

  async getSupportContactConfig(): Promise<SupportContactConfig> {
    const storedConfig =
      await this.getActiveJsonSettingValue<StoredSupportContactConfigValue>(
        APP_SETTING_KEY.SUPPORT_CONTACT,
      );

    if (!this.isPlainObject<StoredSupportContactConfigValue>(storedConfig)) {
      return this.createEmptySupportContactConfig();
    }

    return {
      eyebrow: this.normalizeOptionalText(storedConfig.eyebrow),
      heading: this.normalizeOptionalText(storedConfig.heading),
      subtitle: this.normalizeOptionalText(storedConfig.subtitle),
      availabilityLabel: this.normalizeOptionalText(
        storedConfig.availabilityLabel,
      ),
      responseTimeLabel: this.normalizeOptionalText(
        storedConfig.responseTimeLabel,
      ),
      faqTitle: this.normalizeOptionalText(storedConfig.faqTitle),
      faqDescription: this.normalizeOptionalText(storedConfig.faqDescription),
      contactSectionEyebrow: this.normalizeOptionalText(
        storedConfig.contactSectionEyebrow,
      ),
      contactSectionHeading: this.normalizeOptionalText(
        storedConfig.contactSectionHeading,
      ),
      contactSectionSubtitle: this.normalizeOptionalText(
        storedConfig.contactSectionSubtitle,
      ),
      tipsEyebrow: this.normalizeOptionalText(storedConfig.tipsEyebrow),
      tipsHeading: this.normalizeOptionalText(storedConfig.tipsHeading),
      channels: [
        this.buildSupportTicketChannel(
          storedConfig.ticketTitle,
          storedConfig.ticketDescription,
        ),
        ...this.buildSupportContactChannels(storedConfig),
      ].filter(
        (channel): channel is SupportContactChannelConfig => channel != null,
      ),
      quickTips: this.normalizeQuickTips(storedConfig.quickTips),
      faqPage: this.normalizeSupportFaqPage(storedConfig.faqPage),
    };
  }

  async getAppAboutPageConfig(): Promise<AppAboutPageConfig> {
    const value = await this.getActiveSettingValue(
      APP_SETTING_KEY.APP_ABOUT_PAGE,
      AppSettingValueType.STRING,
    );
    const html = this.normalizeOptionalText(value);

    return {
      html: html || DEFAULT_APP_ABOUT_PAGE_HTML,
    };
  }

  async getAppPrivacyPolicyPageConfig(): Promise<AppPrivacyPolicyPageConfig> {
    const value = await this.getActiveSettingValue(
      APP_SETTING_KEY.APP_PRIVACY_POLICY_PAGE,
      AppSettingValueType.STRING,
    );

    return {
      html: this.normalizeOptionalText(value),
    };
  }

  async getAppTermsOfUsePageConfig(): Promise<AppTermsOfUsePageConfig> {
    const value = await this.getActiveSettingValue(
      APP_SETTING_KEY.APP_TERMS_OF_USE_PAGE,
      AppSettingValueType.STRING,
    );

    return {
      html: this.normalizeOptionalText(value),
    };
  }

  async getAppVersionConfig(): Promise<AppVersionConfig> {
    const value = await this.getActiveSettingValue(
      APP_SETTING_KEY.APP_VERSION,
      AppSettingValueType.STRING,
    );

    return {
      value: this.normalizeOptionalText(value),
    };
  }

  private createEmptySupportContactConfig(): SupportContactConfig {
    return {
      eyebrow: "",
      heading: "",
      subtitle: "",
      availabilityLabel: "",
      responseTimeLabel: "",
      faqTitle: "",
      faqDescription: "",
      contactSectionEyebrow: "",
      contactSectionHeading: "",
      contactSectionSubtitle: "",
      tipsEyebrow: "",
      tipsHeading: "",
      channels: [],
      quickTips: [],
      faqPage: EMPTY_SUPPORT_FAQ_PAGE,
    };
  }

  private buildPaymentCards(
    settingsByKey: Map<string, Pick<AppSetting, "key" | "value" | "valueType">>,
  ): PaymentCardConfig[] {
    const value = settingsByKey.get(APP_SETTING_KEY.PAYMENT_CARDS)?.value;
    const parsed = this.parseJsonSettingValue<StoredPaymentCardValue[]>(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((card) => this.normalizePaymentCard(card))
      .filter((card): card is PaymentCardConfig => card != null);
  }

  private buildCryptoWallets(
    settingsByKey: Map<string, Pick<AppSetting, "key" | "value" | "valueType">>,
  ): CryptoWalletConfig[] {
    const value = settingsByKey.get(APP_SETTING_KEY.USDT_WALLETS)?.value;
    const parsed = this.parseJsonSettingValue<StoredCryptoWalletValue[]>(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((wallet) => this.normalizeCryptoWallet(wallet))
      .filter((wallet): wallet is CryptoWalletConfig => wallet != null);
  }

  private parsePaymentMethods(value?: unknown): PaymentMethodConfig[] {
    const parsed =
      this.parseJsonSettingValue<StoredPaymentMethodValue[]>(value);
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_PAYMENT_METHODS];
    }

    const paymentMethods = parsed
      .map((methodConfig) => this.normalizePaymentMethod(methodConfig))
      .filter(
        (methodConfig): methodConfig is PaymentMethodConfig =>
          methodConfig != null,
      );

    return paymentMethods.length > 0
      ? paymentMethods
      : [...DEFAULT_PAYMENT_METHODS];
  }

  private normalizePaymentMethod(
    methodConfig: StoredPaymentMethodValue,
  ): PaymentMethodConfig | null {
    const method = this.normalizePaymentMethodKey(methodConfig.method);
    if (!method) {
      return null;
    }

    return {
      method,
      isVisible: methodConfig.isVisible ?? true,
      isActive: methodConfig.isActive ?? true,
      isRecommended: methodConfig.isRecommended ?? false,
    };
  }

  private normalizePaymentMethodKey(
    method?: string,
  ): UserCoursePaymentMethod | null {
    const normalizedMethod = method?.trim().toUpperCase();
    if (!normalizedMethod) {
      return null;
    }

    const methodMap: Record<string, UserCoursePaymentMethod> = {
      GATEWAY: UserCoursePaymentMethod.GATEWAY,
      CARD_TO_CARD: UserCoursePaymentMethod.CARD_TO_CARD,
      CRYPTOCURRENCY: UserCoursePaymentMethod.CRYPTOCURRENCY,
      FREE: UserCoursePaymentMethod.FREE,
    };

    return methodMap[normalizedMethod] ?? null;
  }

  private normalizePaymentCard(
    card: StoredPaymentCardValue,
  ): PaymentCardConfig | null {
    const cardNumber = card.cardNumber?.trim() ?? "";
    const holderName = card.cardHolderName?.trim() ?? "";
    const bankName = card.bankName?.trim() ?? "";

    if (!cardNumber && !holderName && !bankName) {
      return null;
    }

    return {
      cardNumber,
      holderName,
      bankName,
    };
  }

  private normalizeCryptoWallet(
    wallet: StoredCryptoWalletValue,
  ): CryptoWalletConfig | null {
    const address = wallet.address?.trim() ?? "";
    const network = wallet.network?.trim().toUpperCase();

    if (!address || (network !== "TRC20" && network !== "BEP20")) {
      return null;
    }

    return {
      address,
      network,
    };
  }

  private buildSupportContactChannels(
    storedConfig: StoredSupportContactConfigValue,
  ): SupportContactChannelConfig[] {
    return (
      [
        ["INSTAGRAM", storedConfig.instagram],
        ["TELEGRAM", storedConfig.telegram],
        ["WHATSAPP", storedConfig.whatsapp],
        ["EMAIL", storedConfig.email],
        ["PHONE", storedConfig.phone],
      ] as const
    )
      .map(([type, value]) => this.buildSupportContactChannel(type, value))
      .filter(
        (channel): channel is SupportContactChannelConfig => channel != null,
      );
  }

  private buildSupportTicketChannel(
    rawTitle: unknown,
    rawDescription: unknown,
  ): SupportContactChannelConfig | null {
    const title = this.normalizeOptionalText(rawTitle);
    if (!title) {
      return null;
    }

    return {
      type: "TICKET",
      label: title,
      value: "",
      href: "/support/tickets",
      description: this.normalizeOptionalText(rawDescription),
      isActive: true,
      isPrimary: true,
    };
  }

  private buildSupportContactChannel(
    type: Exclude<SupportContactChannelType, "TICKET">,
    rawValue: unknown,
  ): SupportContactChannelConfig | null {
    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    if (!value) {
      return null;
    }

    return {
      type,
      label: SUPPORT_CONTACT_COPY[type].label,
      value: this.buildSupportContactDisplayValue(type, value),
      href: this.buildSupportContactHref(type, value),
      description: SUPPORT_CONTACT_COPY[type].description,
      isActive: true,
      isPrimary: false,
    };
  }

  private buildSupportContactDisplayValue(
    type: Exclude<SupportContactChannelType, "TICKET">,
    value: string,
  ): string {
    if (type === "TELEGRAM") {
      const username = this.extractTelegramUsername(value);
      return username ? `@${username}` : value;
    }

    if (type === "INSTAGRAM") {
      const username = this.extractInstagramUsername(value);
      return username ? `@${username}` : value;
    }

    if (type === "WHATSAPP") {
      const phoneDigits = this.extractWhatsappPhoneDigits(value);
      return phoneDigits ? `+${phoneDigits}` : value;
    }

    return value;
  }

  private buildSupportContactHref(
    type: Exclude<SupportContactChannelType, "TICKET">,
    value: string,
  ): string {
    if (
      /^https?:\/\//i.test(value) ||
      value.startsWith("mailto:") ||
      value.startsWith("tel:")
    ) {
      return value;
    }

    if (type === "WHATSAPP") {
      const phoneDigits = value.replace(/\D/g, "");
      return phoneDigits ? `https://wa.me/${phoneDigits}` : value;
    }

    if (type === "TELEGRAM") {
      return `https://t.me/${value.replace(/^@/, "")}`;
    }

    if (type === "INSTAGRAM") {
      const username = this.extractInstagramUsername(value);
      return username ? `https://instagram.com/${username}` : value;
    }

    if (type === "EMAIL") {
      return `mailto:${value}`;
    }

    const phoneValue = value.replace(/[^\d+]/g, "");
    return phoneValue ? `tel:${phoneValue}` : value;
  }

  private extractInstagramUsername(value: string): string | null {
    const trimmedValue = value.trim();
    if (trimmedValue.startsWith("@")) {
      return trimmedValue.slice(1).trim() || null;
    }

    try {
      const url = new URL(trimmedValue);
      const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
      if (hostname !== "instagram.com") {
        return null;
      }

      const pathSegments = url.pathname.split("/").filter(Boolean);
      const username = pathSegments[0];
      if (!username || ["p", "reel", "reels", "stories"].includes(username)) {
        return null;
      }

      return username.replace(/^@/, "") || null;
    } catch {
      return trimmedValue.replace(/^@/, "") || null;
    }
  }

  private extractTelegramUsername(value: string): string | null {
    const trimmedValue = value.trim();
    if (trimmedValue.startsWith("@")) {
      return trimmedValue.slice(1).trim() || null;
    }

    try {
      const url = new URL(trimmedValue);
      const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
      if (hostname !== "t.me" && hostname !== "telegram.me") {
        return null;
      }

      const pathSegments = url.pathname.split("/").filter(Boolean);
      const username =
        pathSegments[0] === "s" ? pathSegments[1] : pathSegments[0];
      return username?.replace(/^@/, "") ?? null;
    } catch {
      return null;
    }
  }

  private extractWhatsappPhoneDigits(value: string): string | null {
    try {
      const url = new URL(value);
      const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

      if (hostname === "wa.me") {
        return url.pathname.replace(/\D/g, "") || null;
      }

      if (hostname.endsWith("whatsapp.com")) {
        return url.searchParams.get("phone")?.replace(/\D/g, "") || null;
      }
    } catch {
      // The value may already be a plain phone number.
    }

    return value.replace(/\D/g, "") || null;
  }

  private normalizeQuickTips(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0);
  }

  private normalizeSupportFaqPage(value: unknown): SupportFaqPageConfig {
    if (!this.isPlainObject<StoredSupportFaqPageValue>(value)) {
      return EMPTY_SUPPORT_FAQ_PAGE;
    }

    return {
      eyebrow: this.normalizeOptionalText(value.eyebrow),
      heading: this.normalizeOptionalText(value.heading),
      subtitle: this.normalizeOptionalText(value.subtitle),
      searchLabel: this.normalizeOptionalText(value.searchLabel),
      searchPlaceholder: this.normalizeOptionalText(value.searchPlaceholder),
      resultCountLabel: this.normalizeOptionalText(value.resultCountLabel),
      noResultsLabel: this.normalizeOptionalText(value.noResultsLabel),
      emptyTitle: this.normalizeOptionalText(value.emptyTitle),
      emptyDescription: this.normalizeOptionalText(value.emptyDescription),
      emptyActionLabel: this.normalizeOptionalText(value.emptyActionLabel),
      sections: this.normalizeSupportFaqSections(value.sections),
    };
  }

  private normalizeSupportFaqSections(
    value: unknown,
  ): SupportFaqSectionConfig[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((section) => this.normalizeSupportFaqSection(section))
      .filter((section): section is SupportFaqSectionConfig => section != null);
  }

  private normalizeSupportFaqSection(
    value: unknown,
  ): SupportFaqSectionConfig | null {
    if (!this.isPlainObject<StoredSupportFaqSectionValue>(value)) {
      return null;
    }

    const id = this.normalizeOptionalText(value.id);
    const title = this.normalizeOptionalText(value.title);
    const description = this.normalizeOptionalText(value.description);
    const items = this.normalizeSupportFaqItems(value.items);

    if (!id || !title || items.length === 0) {
      return null;
    }

    return {
      id,
      title,
      description,
      items,
    };
  }

  private normalizeSupportFaqItems(value: unknown): SupportFaqItemConfig[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => this.normalizeSupportFaqItem(item))
      .filter((item): item is SupportFaqItemConfig => item != null);
  }

  private normalizeSupportFaqItem(value: unknown): SupportFaqItemConfig | null {
    if (!this.isPlainObject<StoredSupportFaqItemValue>(value)) {
      return null;
    }

    const id = this.normalizeOptionalText(value.id);
    const question = this.normalizeOptionalText(value.question);
    const answer = this.normalizeOptionalText(value.answer);

    if (!id || !question || !answer) {
      return null;
    }

    return {
      id,
      question,
      answer,
    };
  }

  private parseUsdtIrtRate(value?: unknown): UsdtIrtRateConfig {
    const parsed = this.parseJsonSettingValue<StoredUsdtIrtRateValue>(value);

    if (this.isPlainObject(parsed)) {
      return {
        valueIrt: this.normalizePositiveNumber(
          parsed.valueIrt ?? parsed.value,
          DEFAULT_USDT_IRT_RATE.valueIrt,
        ),
        feeUsdt: this.normalizeNonNegativeNumber(
          parsed.feeUsdt ?? parsed.fee,
          DEFAULT_USDT_IRT_RATE.feeUsdt,
        ),
        coefficient: this.normalizePositiveNumber(
          parsed.coefficient,
          DEFAULT_USDT_IRT_RATE.coefficient,
        ),
      };
    }

    const legacyRate = Number(value);
    return {
      ...DEFAULT_USDT_IRT_RATE,
      valueIrt: Number.isFinite(legacyRate) && legacyRate > 0 ? legacyRate : 0,
    };
  }

  private normalizePositiveNumber(value: unknown, fallback: number): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0
      ? numericValue
      : fallback;
  }

  private normalizeNonNegativeNumber(value: unknown, fallback: number): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue >= 0
      ? numericValue
      : fallback;
  }

  private normalizeOptionalText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
  }

  private buildAppSettingUpdateOperation(
    input: AppSettingUpdateGqlInput,
    existingSetting: AppSettingMutationRecord,
  ): AppSettingUpdateOperation {
    const updateSet: Record<string, unknown> = {};
    const updateUnset: Record<string, 1> = {};
    const hasValue = this.hasOwnInputField(input, "value");
    const nextValueType = input.valueType ?? existingSetting.valueType;
    const valueTypeChanged =
      input.valueType != null && input.valueType !== existingSetting.valueType;

    if (valueTypeChanged && !hasValue) {
      throw new BadRequestException(
        "Value is required when changing the app setting value type",
      );
    }

    if (input.label !== undefined) {
      updateSet.label = this.normalizeRequiredText(input.label, "Label");
    }

    if (this.hasOwnInputField(input, "description")) {
      if (input.description === null) {
        updateUnset.description = 1;
      } else {
        updateSet.description = this.normalizeOptionalText(input.description);
      }
    }

    if (input.valueType !== undefined) {
      updateSet.valueType = input.valueType;
    }

    if (typeof input.isActive === "boolean") {
      updateSet.isActive = input.isActive;
    }

    if (hasValue) {
      updateSet.value = this.normalizeSettingValue(input.value, nextValueType);
    }

    return {
      ...(Object.keys(updateSet).length > 0 ? { $set: updateSet } : {}),
      ...(Object.keys(updateUnset).length > 0 ? { $unset: updateUnset } : {}),
    };
  }

  private normalizeSettingValue(
    value: unknown,
    valueType: AppSettingValueType,
  ): unknown {
    switch (valueType) {
      case AppSettingValueType.STRING:
        return this.normalizeStringSettingValue(value);
      case AppSettingValueType.NUMBER:
        return this.normalizeNumberSettingValue(value);
      case AppSettingValueType.BOOLEAN:
        return this.normalizeBooleanSettingValue(value);
      case AppSettingValueType.JSON:
        return this.normalizeJsonSettingValue(value);
      default:
        throw new BadRequestException("Unsupported app setting value type");
    }
  }

  private normalizeStringSettingValue(value: unknown): string {
    if (typeof value !== "string") {
      throw new BadRequestException(
        "String app setting value must be provided as a string",
      );
    }

    return value;
  }

  private normalizeNumberSettingValue(value: unknown): number {
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw new BadRequestException(
          "Number app setting value must be a finite number",
        );
      }

      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsedValue = Number(value.trim());
      if (!Number.isFinite(parsedValue)) {
        throw new BadRequestException(
          "Number app setting value must be a finite number",
        );
      }

      return parsedValue;
    }

    throw new BadRequestException(
      "Number app setting value must be a finite number",
    );
  }

  private normalizeBooleanSettingValue(value: unknown): boolean {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue === "true") {
        return true;
      }
      if (normalizedValue === "false") {
        return false;
      }
    }

    throw new BadRequestException(
      "Boolean app setting value must be a boolean",
    );
  }

  private normalizeJsonSettingValue(
    value: unknown,
  ): StoredAppSettingJsonValue {
    if (typeof value === "string") {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        throw new BadRequestException(
          "JSON app setting value must be a valid JSON value",
        );
      }

      try {
        return this.assertJsonSettingValue(JSON.parse(trimmedValue));
      } catch {
        throw new BadRequestException(
          "JSON app setting value must be valid JSON",
        );
      }
    }

    return this.assertJsonSettingValue(value);
  }

  private assertJsonSettingValue(value: unknown): StoredAppSettingJsonValue {
    if (value == null) {
      throw new BadRequestException(
        "JSON app setting value must be a valid JSON value",
      );
    }

    if (Array.isArray(value)) {
      return value;
    }

    const valueKind = typeof value;
    if (
      valueKind === "string" ||
      valueKind === "number" ||
      valueKind === "boolean" ||
      this.isPlainObject(value)
    ) {
      if (valueKind === "number" && !Number.isFinite(value)) {
        throw new BadRequestException(
          "JSON app setting value must be a valid JSON value",
        );
      }

      return value as StoredAppSettingJsonValue;
    }

    throw new BadRequestException(
      "JSON app setting value must be a valid JSON value",
    );
  }

  private toAppSettingMutationResponse(
    setting: AppSettingMutationRecord,
  ): AppSettingMutationGqlResponse {
    return {
      id: setting._id,
      key: setting.key,
      label: setting.label,
      valueType: setting.valueType,
      value: setting.value,
      description: setting.description,
      isActive: setting.isActive,
      createdAt: setting.audit?.createdAt,
      updatedAt: setting.audit?.updatedAt,
    };
  }

  private normalizeRequiredText(value: unknown, fieldName: string): string {
    const normalizedValue = this.normalizeOptionalText(value);
    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return normalizedValue;
  }

  private hasOwnInputField<T extends object>(
    input: T,
    field: keyof T,
  ): boolean {
    return Object.prototype.hasOwnProperty.call(input, field);
  }

  private buildKeyListFilterQuery(
    filters?: AppSettingKeyListGqlInput["filters"],
  ): FilterQuery<AppSetting> {
    const query: FilterQuery<AppSetting> = {
      $and: [
        {
          $or: [
            { "audit.deletedAt": null },
            { "audit.deletedAt": { $exists: false } },
          ],
        },
      ],
    };

    if (!filters) {
      return query;
    }

    if (filters.query?.trim()) {
      const searchRegex = this.createContainsRegex(filters.query);
      this.addKeyListOrFilter(query, [
        { key: searchRegex },
        { label: searchRegex },
        { description: searchRegex },
      ]);
    }

    if (filters.id) {
      query._id = new Types.ObjectId(filters.id);
    }

    this.addKeyListContainsFilter(query, "key", filters.key);
    this.addKeyListContainsFilter(query, "label", filters.label);

    if (filters.valueType) {
      query.valueType = filters.valueType;
    }

    if (typeof filters.isActive === "boolean") {
      query.isActive = filters.isActive;
    }

    this.addKeyListDateRangeFilter(
      query,
      "audit.createdAt",
      filters.createdAtFrom,
      filters.createdAtTo,
    );
    this.addKeyListDateRangeFilter(
      query,
      "audit.updatedAt",
      filters.updatedAtFrom,
      filters.updatedAtTo,
    );

    return query;
  }

  private resolveAppSettingKeyListSortOptions(
    sort?: AppSettingKeyListSortOptionInput,
  ): Record<string, 1 | -1> {
    const sortOptions = buildSortOptions<AppSettingKeyListSortField>(
      sort ?? {},
      {
        createdAt: "audit.createdAt",
        updatedAt: "audit.updatedAt",
        key: "key",
        label: "label",
        valueType: "valueType",
        isActive: "isActive",
      },
      { createdAt: SortingOrder.DESC },
    );

    sortOptions._id = Object.values(sortOptions)[0] ?? -1;

    return sortOptions;
  }

  private toAppSettingKeyListSummaryResponse(
    setting: AppSettingKeyListRecord,
  ): AppSettingKeyListSummaryGqlResponse {
    return {
      id: setting._id,
      key: setting.key,
      label: setting.label,
      valueType: setting.valueType,
      description: setting.description,
      isActive: setting.isActive,
      createdAt: setting.audit?.createdAt,
      updatedAt: setting.audit?.updatedAt,
    };
  }

  private addKeyListContainsFilter(
    query: FilterQuery<AppSetting>,
    path: string,
    value?: string,
  ): void {
    if (value?.trim()) {
      query[path] = this.createContainsRegex(value);
    }
  }

  private addKeyListOrFilter(
    query: FilterQuery<AppSetting>,
    conditions: FilterQuery<AppSetting>[],
  ): void {
    query.$and = [
      ...(Array.isArray(query.$and) ? query.$and : []),
      { $or: conditions },
    ];
  }

  private addKeyListDateRangeFilter(
    query: FilterQuery<AppSetting>,
    path: string,
    from?: string,
    to?: string,
  ): void {
    const range: Record<string, Date> = {};
    const fromDate = this.parseKeyListFilterDate(from, false);
    const toDate = this.parseKeyListFilterDate(to, true);

    if (fromDate) {
      range.$gte = fromDate;
    }

    if (toDate) {
      range.$lte = toDate;
    }

    if (Object.keys(range).length > 0) {
      query[path] = range;
    }
  }

  private parseKeyListFilterDate(
    value: string | undefined,
    endOfDay: boolean,
  ): Date | undefined {
    if (!value?.trim()) {
      return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      date.setHours(23, 59, 59, 999);
    }

    return date;
  }

  private createContainsRegex(value: string): {
    $regex: string;
    $options: "i";
  } {
    return {
      $regex: this.escapeRegex(value),
      $options: "i",
    };
  }

  private escapeRegex(value: string): string {
    return value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async getActiveSettingValue(
    key: string,
    expectedValueType?: AppSettingValueType,
  ): Promise<unknown | null> {
    const setting = await this.appSettingModel
      .findOne({ key, isActive: true })
      .lean()
      .exec();

    if (!setting) {
      return null;
    }

    if (expectedValueType && setting.valueType !== expectedValueType) {
      return null;
    }

    return setting.value;
  }

  async getActiveJsonSettingValue<T extends StoredAppSettingJsonValue>(
    key: string,
  ): Promise<T | null> {
    const value = await this.getActiveSettingValue(
      key,
      AppSettingValueType.JSON,
    );
    return this.parseJsonSettingValue<T>(value);
  }

  private parseJsonSettingValue<T extends StoredAppSettingJsonValue>(
    value: unknown,
  ): T | null {
    if (value == null) {
      return null;
    }

    if (typeof value !== "string") {
      return value as T;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }

    try {
      return JSON.parse(trimmedValue) as T;
    } catch {
      return null;
    }
  }

  private isPlainObject<T extends object>(value: unknown): value is T {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
