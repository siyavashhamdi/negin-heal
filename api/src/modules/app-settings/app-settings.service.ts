import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";

import {
  APP_SETTING_KEY,
  PAYMENT_CHECKOUT_SETTING_KEYS,
} from "../../constants/app-setting.constant";
import { AppSettingValueType, UserCoursePaymentMethod } from "../../enums";
import { AppSetting, AppSettingDocument } from "../../database/schemas";
import {
  CryptoWalletConfig,
  PaymentCardConfig,
  PaymentCheckoutConfig,
  PaymentMethodConfig,
  StoredAppSettingJsonValue,
  StoredCryptoWalletValue,
  StoredPaymentCardValue,
  StoredPaymentMethodValue,
  StoredUsdtIrtRateValue,
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

@Injectable()
export class AppSettingsService {
  constructor(
    @InjectModel(AppSetting.name)
    private readonly appSettingModel: Model<AppSettingDocument>,
  ) {}

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
