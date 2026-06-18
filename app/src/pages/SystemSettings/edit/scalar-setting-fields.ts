export type ScalarNumberFieldConfig = {
  readonly label: string;
  readonly helperText?: string;
  readonly min?: number;
};

export const SCALAR_NUMBER_FIELD_CONFIG: Record<string, ScalarNumberFieldConfig> = {
  PASSWORD_RESET_TOKEN_TTL_MINUTES: {
    label: "مدت اعتبار لینک بازیابی (دقیقه)",
    helperText: "پس از این مدت، لینک بازیابی رمز عبور منقضی می‌شود.",
    min: 1,
  },
  TICKET_AUTO_CLOSE_AFTER_ANSWERED_HOURS: {
    label: "مدت بستن خودکار تیکت پاسخ‌داده‌شده (ساعت)",
    helperText:
      "تیکت‌هایی که پشتیبانی پاسخ داده و کاربر در این مدت پیام جدیدی نفرستاده، به‌صورت خودکار بسته می‌شوند.",
    min: 1,
  },
};

export const POSITIVE_INTEGER_NUMBER_SETTING_KEYS = new Set(
  Object.keys(SCALAR_NUMBER_FIELD_CONFIG),
);
