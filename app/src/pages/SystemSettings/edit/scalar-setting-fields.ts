export type ScalarNumberFieldConfig = {
  readonly label: string;
  readonly helperText?: string;
  readonly min?: number;
};

export const SCALAR_NUMBER_FIELD_CONFIG: Record<string, ScalarNumberFieldConfig> = {
  PASSWORD_RESET_TOKEN_TTL_MINUTES: {
    label: "مدت اعتبار کد بازیابی (دقیقه)",
    helperText: "پس از این مدت، کد بازیابی گذرواژه منقضی می‌شود.",
    min: 1,
  },
  TICKET_AUTO_CLOSE_AFTER_ANSWERED_HOURS: {
    label: "بستن خودکار تیکت پاسخ‌داده‌شده (ساعت)",
    helperText: "پس از پاسخ پشتیبانی، تیکت پس از این مدت به‌صورت خودکار بسته می‌شود.",
    min: 1,
  },
};

export const POSITIVE_INTEGER_NUMBER_SETTING_KEYS = new Set(
  Object.keys(SCALAR_NUMBER_FIELD_CONFIG)
);
