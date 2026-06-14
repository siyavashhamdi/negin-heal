import { BaseMigration, registerMigration } from "./core";
import { AppSettingValueType, UserCoursePaymentMethod } from "../enums";
import { APP_SETTING_KEY } from "../constants";

type DefaultAppSettingSeed = {
  key: string;
  label: string;
  value: unknown;
  valueType: AppSettingValueType;
  description?: string;
  isActive: boolean;
};

const DEFAULT_PAYMENT_CARDS_VALUE = [
  {
    cardNumber: "1111-1111-1111-1111",
    cardHolderName: "ایکس ایکسی",
    bankName: "بلو بانک",
  },
  {
    cardNumber: "2222-2222-2222-2222",
    cardHolderName: "ایکس ایکسی",
    bankName: "بانک تجارت",
  },
  {
    cardNumber: "3333-3333-3333-3333",
    cardHolderName: "ایکس ایکسی",
    bankName: "بانک ملت",
  },
];

const DEFAULT_USDT_WALLETS_VALUE = [
  {
    network: "TRC20",
    address: "TJRy6k7QwZb9v5k8h2mR3pLxA1nC7dF8Gh",
  },
  {
    network: "BEP20",
    address: "0x4E9ce36E442e55EcD9025B9a6E0D88485d628A67",
  },
];

const DEFAULT_USDT_IRT_RATE_VALUE = {
  valueIrt: 172000,
  feeUsdt: 0.7,
  coefficient: 1,
};

const DEFAULT_ZARINPAL_CONFIG_VALUE = {
  merchantId: "c9da7b93-60c6-41fe-91f0-d7f873d04708",
  requestUrl: "https://sandbox.zarinpal.com/pg/v4/payment/request.json",
  verifyUrl: "https://sandbox.zarinpal.com/pg/v4/payment/verify.json",
  startPayUrl: "https://sandbox.zarinpal.com/pg/StartPay",
  callbackBaseUrl: "http://localhost:8080",
  minAmountIrr: 10000,
};

const DEFAULT_EMAIL_SMTP_CONFIG_VALUE = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  username: "neginheal.manager@gmail.com",
  password: "mutq tcvi nxqe jszy",
  fromName: "Negin Heal",
  fromEmail: "neginheal.manager@gmail.com",
};

export const DEFAULT_PAYMENT_METHODS_VALUE = [
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

const DEFAULT_APP_SETTINGS: readonly DefaultAppSettingSeed[] = [
  {
    key: APP_SETTING_KEY.PAYMENT_CARDS,
    label: "شماره کارت‌های پرداخت",
    value: DEFAULT_PAYMENT_CARDS_VALUE,
    valueType: AppSettingValueType.JSON,
    description: "لیست شماره کارت‌ها، نام صاحبان کارت و نام بانک‌ها",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.PAYMENT_METHODS,
    label: "روش‌های پرداخت",
    value: DEFAULT_PAYMENT_METHODS_VALUE,
    valueType: AppSettingValueType.JSON,
    description: "وضعیت نمایش، فعال بودن و پیشنهادی بودن روش‌های پرداخت",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.USDT_WALLETS,
    label: "کیف پول‌های USDT",
    value: DEFAULT_USDT_WALLETS_VALUE,
    valueType: AppSettingValueType.JSON,
    description: "لیست آدرس‌های کیف پول USDT و شبکه‌های آن‌ها",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.USDT_IRT_RATE,
    label: "نرخ تبدیل تومان به دلار امریکا",
    value: DEFAULT_USDT_IRT_RATE_VALUE,
    valueType: AppSettingValueType.JSON,
    description:
      "تنظیمات نرخ تبدیل تومان به USDT شامل نرخ پایه، کارمزد و ضریب محاسبه",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.ZARINPAL_CONFIG,
    label: "تنظیمات درگاه زرین‌پال",
    value: DEFAULT_ZARINPAL_CONFIG_VALUE,
    valueType: AppSettingValueType.JSON,
    description:
      "تنظیمات اتصال زرین‌پال شامل مرچنت آیدی، آدرس‌های request، verify، StartPay، callback و حداقل مبلغ ریالی",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.EMAIL_SMTP_CONFIG,
    label: "تنظیمات سرویس ایمیل",
    value: DEFAULT_EMAIL_SMTP_CONFIG_VALUE,
    valueType: AppSettingValueType.JSON,
    description: "تنظیمات ارسال ایمیل شامل SMTP، نام فرستنده و ایمیل فرستنده",
    isActive: true,
  },
] as const;

const DEFAULT_APP_SETTING_KEYS = DEFAULT_APP_SETTINGS.map(
  (setting) => setting.key,
);

/**
 * Migration: Seed Default App Settings
 *
 * Seeds payment-related app settings used by checkout flows.
 * This migration is idempotent and skips settings that already exist.
 */
export class Migration002_SeedDefaultAppSettings extends BaseMigration {
  version = 2;
  name = "SeedDefaultAppSettings";

  async up(): Promise<void> {
    if (!this.connection?.db) {
      throw new Error("Database connection not available");
    }

    const appSettingsCollection = this.connection.db.collection("app_settings");

    console.log(
      `🔄 Starting migration ${this.version} (${this.name}) - Seeding ${DEFAULT_APP_SETTINGS.length} app settings...`,
    );

    let createdCount = 0;
    let skippedCount = 0;

    for (const setting of DEFAULT_APP_SETTINGS) {
      const existingSetting = await appSettingsCollection.findOne({
        key: setting.key,
      });

      if (existingSetting) {
        if (
          setting.valueType === AppSettingValueType.JSON &&
          typeof existingSetting.value === "string"
        ) {
          const parsedValue = this.parseJsonSettingValue(existingSetting.value);
          if (parsedValue !== null) {
            await appSettingsCollection.updateOne(
              { _id: existingSetting._id },
              {
                $set: {
                  value: parsedValue,
                  "audit.updatedAt": new Date(),
                },
              },
            );
            console.log(`🔁 Converted app setting ${setting.key} to JSON`);
          }
        }

        console.log(`ℹ️  App setting ${setting.key} already exists, skipping`);
        skippedCount++;
        continue;
      }

      await appSettingsCollection.insertOne({
        key: setting.key,
        label: setting.label,
        value: setting.value,
        valueType: setting.valueType,
        description: setting.description ?? null,
        isActive: setting.isActive,
        audit: {
          createdAt: new Date(),
        },
        deletedAt: null,
        deletedBy: null,
      });

      console.log(`✅ Created app setting: ${setting.key}`);
      createdCount++;
    }

    console.log(
      `✅ Migration ${this.version} (${this.name}) completed successfully - Created: ${createdCount}, Skipped: ${skippedCount}`,
    );
  }

  async down(): Promise<void> {
    if (!this.connection?.db) {
      throw new Error("Database connection not available");
    }

    const appSettingsCollection = this.connection.db.collection("app_settings");

    console.log(
      `🔄 Rolling back migration ${this.version} (${this.name}) - Removing default app settings...`,
    );

    const result = await appSettingsCollection.deleteMany({
      key: { $in: DEFAULT_APP_SETTING_KEYS },
    });

    console.log(
      `✅ Migration ${this.version} (${this.name}) rolled back - Removed ${result.deletedCount} setting(s)`,
    );
  }

  private parseJsonSettingValue(value: string): unknown | null {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }

    try {
      return JSON.parse(trimmedValue) as unknown;
    } catch {
      return null;
    }
  }
}

registerMigration(Migration002_SeedDefaultAppSettings);
