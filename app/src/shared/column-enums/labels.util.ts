const EMPTY_DEFAULT = "—";

export const STATUS_LABELS: Record<string, string> = {
  "1": "تایید شده",
  "2": "رد شده",
  "3": "در انتظار بررسی",
  "4": "غیرفعال",
};

export const BANK_STATUS_LABELS: Record<string, string> = {
  "1": "تایید شده",
  "2": "رد شده",
  "3": "در انتظار بررسی",
};

export const JOB_TYPE_LABELS: Record<string, string> = {
  dbv: "توزیعی",
  tcl: "خدمات فنی",
  prd: "تولیدی",
  srv: "خدماتی",
};

export const ISIC_INQUIRYS_LABELS: Record<string, string> = {
  health_inquiry: "استعلام بهداشت",
  places_inquiry: "استعلام اماکن",
  tax_inquiry: "استعلام مالیات 186",
};

export const ISIC_PROPS_LABELS: Record<string, string> = {
  technical_jobs: "رسته فنی",
  transport: "حمل و نقل",
  trading_system: "سامانه جامع تجارت",
  fuel: "سهمیه نفت سفید",
  kerosene: "سهمیه نفت کوره",
  nationally: "رسته کشوری",
  facilities: "تسهیلات",
  virtual: "رسته مجازی",
  bread: "رسته آرد و نان",
  ethanol: "سهمیه اتانول",
  gasoline: "سهمیه نفت گازوئیل",
  health: "وزارت بهداشت",
  heavy_machine: "ماشین‌آلات سنگین",
  liquid_gas: "سهمیه نفت گاز مایع",
  tobacco_license: "مجوز محصولات دخانی",
};

export const GENDER_LABELS: Record<string, string> = {
  m: "مرد",
  f: "زن",
};

export const MARITAL_STATUS_LABELS: Record<string, string> = {
  mr: "متاهل",
  sg: "مجرد",
  dv: "مطلقه",
  wd: "بیوه",
};

export const MILITARY_STATUS_LABELS: Record<string, string> = {
  crd: "دارای کارت پایان خدمت",
  med: "معافیت پزشکی",
  edu: "معافیت تحصیلی",
  inc: "مشمول خدمت",
  nic: "غیر مشمول",
  non: "نامشخص",
  "1": "معافیت دو برادری",
  "3": "خرید خدمت",
  "6": "معافیت کفالت",
  "7": "معافیت رهبری",
  "8": "معافیت ویژه مشمولین خارج از کشور",
  "9": "مخافیت موارد خاص",
  "11": "معافیت سه برادر",
};

export const HOUSEHOLDS_LABELS: Record<string, string> = {
  t: "بله",
  f: "خیر",
};

export const ENACTMENT_TYPE_LABELS: Record<string, string> = {
  "1": "اطلاعی",
  "3": "اقدامی",
};

export const ENACTMENT_MODE_LABELS: Record<string, string> = {
  "1": "عادی",
  "2": "محرمانه",
};

export const ENACTMENT_READ_LABELS: Record<string, string> = {
  t: "مشاهده شده",
  f: "مشاهده نشده",
};

function normalizeCode(code: string | number | boolean | null | undefined): string {
  if (code === null || code === undefined) {
    return "";
  }
  if (typeof code === "boolean") {
    return code ? "t" : "f";
  }
  return String(code).trim().toLowerCase();
}

function labelFromMap(
  map: Record<string, string>,
  code: string | number | boolean | null | undefined,
  empty: string
): string {
  const normalized = normalizeCode(code);
  if (normalized === "") {
    return empty;
  }
  if (map[normalized] != null) {
    return map[normalized];
  }
  const entry = Object.entries(map).find(([key]) => key.toLowerCase() === normalized);
  return entry?.[1] ?? empty;
}

export function selectOptionsFromMap(
  map: Record<string, string>,
  options?: { emptyLabel?: string; includeEmpty?: boolean }
): { value: string; label: string }[] {
  const includeEmpty = options?.includeEmpty ?? true;
  const emptyLabel = options?.emptyLabel ?? EMPTY_DEFAULT;
  const entries = Object.entries(map).map(([value, label]) => ({ value, label }));
  if (!includeEmpty) {
    return entries;
  }
  return [{ value: "", label: emptyLabel }, ...entries];
}

export function statusLabel(
  code: number | string | null | undefined,
  empty = EMPTY_DEFAULT
): string {
  return labelFromMap(STATUS_LABELS, code, empty);
}

export function bankStatusLabel(
  code: number | string | null | undefined,
  empty = EMPTY_DEFAULT
): string {
  return labelFromMap(BANK_STATUS_LABELS, code, empty);
}

export function jobTypeLabel(code: string | null | undefined, empty = EMPTY_DEFAULT): string {
  const v = (code ?? "").trim();
  if (v === "") {
    return empty;
  }
  return labelFromMap(JOB_TYPE_LABELS, v, v);
}

export function jobTypeFilterOptions(): { value: string; label: string }[] {
  return selectOptionsFromMap(JOB_TYPE_LABELS, { includeEmpty: false });
}

export function genderLabel(code: string | null | undefined, empty = EMPTY_DEFAULT): string {
  const v = (code ?? "").trim();
  if (v === "") {
    return empty;
  }
  return labelFromMap(GENDER_LABELS, v, v);
}

export function genderSelectOptions(
  emptyLabel = EMPTY_DEFAULT
): { value: string; label: string }[] {
  return selectOptionsFromMap(GENDER_LABELS, { emptyLabel });
}

export function maritalStatusLabel(code: string | null | undefined, empty = EMPTY_DEFAULT): string {
  const v = (code ?? "").trim();
  if (v === "") {
    return empty;
  }
  return labelFromMap(MARITAL_STATUS_LABELS, v, v);
}

export function maritalStatusSelectOptions(
  emptyLabel = EMPTY_DEFAULT
): { value: string; label: string }[] {
  return selectOptionsFromMap(MARITAL_STATUS_LABELS, { emptyLabel });
}

export function militaryStatusLabel(
  code: string | null | undefined,
  empty = EMPTY_DEFAULT
): string {
  const v = (code ?? "").trim();
  if (v === "") {
    return empty;
  }
  return labelFromMap(MILITARY_STATUS_LABELS, v, v);
}

export function militaryStatusSelectOptions(
  emptyLabel = EMPTY_DEFAULT
): { value: string; label: string }[] {
  return selectOptionsFromMap(MILITARY_STATUS_LABELS, { emptyLabel });
}

export function householdsLabel(code: string | null | undefined, empty = EMPTY_DEFAULT): string {
  const v = (code ?? "").trim();
  if (v === "") {
    return empty;
  }
  return labelFromMap(HOUSEHOLDS_LABELS, v, v);
}

export function householdsSelectOptions(
  emptyLabel = EMPTY_DEFAULT
): { value: string; label: string }[] {
  return selectOptionsFromMap(HOUSEHOLDS_LABELS, { emptyLabel });
}

export function enactmentTypeLabel(
  code: number | string | null | undefined,
  empty = EMPTY_DEFAULT
): string {
  if (code === null || code === undefined || code === "") {
    return empty;
  }
  return labelFromMap(ENACTMENT_TYPE_LABELS, code, String(code));
}

export function enactmentTypeFilterOptions(): { value: string; label: string }[] {
  return selectOptionsFromMap(ENACTMENT_TYPE_LABELS, { includeEmpty: false });
}

export function enactmentModeLabel(
  code: number | string | null | undefined,
  empty = EMPTY_DEFAULT
): string {
  if (code === null || code === undefined || code === "") {
    return empty;
  }
  return labelFromMap(ENACTMENT_MODE_LABELS, code, String(code));
}

export function enactmentModeFilterOptions(): { value: string; label: string }[] {
  return selectOptionsFromMap(ENACTMENT_MODE_LABELS, { includeEmpty: false });
}

export function enactmentReadLabel(code: string | null | undefined, empty = EMPTY_DEFAULT): string {
  const v = (code ?? "").trim();
  if (v === "" || v === "-") {
    return empty;
  }
  return labelFromMap(ENACTMENT_READ_LABELS, v, v);
}

export function enactmentReadFilterOptions(): { value: string; label: string }[] {
  return selectOptionsFromMap(ENACTMENT_READ_LABELS, { includeEmpty: false });
}

export const ISIC_INQUIRY_FILTER_OPTIONS = selectOptionsFromMap(ISIC_INQUIRYS_LABELS, {
  includeEmpty: false,
});

export const ISIC_PROP_FILTER_OPTIONS = selectOptionsFromMap(ISIC_PROPS_LABELS, {
  includeEmpty: false,
});

export const JOB_TYPE_FILTER_OPTIONS = selectOptionsFromMap(JOB_TYPE_LABELS, {
  includeEmpty: false,
});
