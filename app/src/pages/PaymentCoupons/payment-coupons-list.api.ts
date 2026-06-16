import { parseJalaliParamDate } from "../../utilities/jalali-date-param.util";

export type PaymentCouponDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type SortingOrder = "ASC" | "DESC";

export type PaymentCouponListRow = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description?: string | null;
  readonly discountType: PaymentCouponDiscountType;
  readonly discountValue: number;
  readonly startsAt?: string | null;
  readonly expiresAt?: string | null;
  readonly totalUsageLimit?: number | null;
  readonly perUserUsageLimit?: number | null;
  readonly applicableCourseIds: readonly string[];
  readonly isFirstPurchaseOnly: boolean;
  readonly isActive: boolean;
  readonly totalUsageCount: number;
  readonly remainingTotalUsageCount?: number | null;
  readonly createdBy?: string | null;
  readonly updatedBy?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type PaymentCouponRecord = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly discountType: PaymentCouponDiscountType;
  readonly discountValue: number;
  readonly startsAt: string;
  readonly expiresAt: string;
  readonly totalUsageLimit: number | null;
  readonly perUserUsageLimit: number | null;
  readonly applicableCourseIds: readonly string[];
  readonly applicableCourseIdsText: string;
  readonly isFirstPurchaseOnly: boolean;
  readonly isActive: boolean;
  readonly totalUsageCount: number;
  readonly remainingTotalUsageCount: number | null;
  readonly createdBy: string;
  readonly updatedBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type PaymentCouponListQuery = {
  paymentCouponList: {
    items: PaymentCouponListRow[];
    pagination: {
      limit: number;
      skip: number;
      total: number;
      count: number;
    };
  };
};

export type PaymentCouponListSortField =
  | "createdAt"
  | "updatedAt"
  | "code"
  | "title"
  | "discountType"
  | "discountValue"
  | "startsAt"
  | "expiresAt"
  | "totalUsageLimit"
  | "perUserUsageLimit"
  | "isFirstPurchaseOnly"
  | "isActive";

export type PaymentCouponListFilters = {
  query: string;
  id: string;
  code: string;
  title: string;
  discountType: PaymentCouponDiscountType | "ALL";
  discountValueMin: string;
  discountValueMax: string;
  startsAtFrom: string;
  startsAtTo: string;
  expiresAtFrom: string;
  expiresAtTo: string;
  totalUsageLimitMin: string;
  totalUsageLimitMax: string;
  perUserUsageLimitMin: string;
  perUserUsageLimitMax: string;
  applicableCourseId: string;
  isFirstPurchaseOnly: "ALL" | "true" | "false";
  isActive: "ALL" | "true" | "false";
  createdBy: string;
  updatedBy: string;
  createdAtFrom: string;
  createdAtTo: string;
  updatedAtFrom: string;
  updatedAtTo: string;
};

export type PaymentCouponListQueryVariables = {
  input: {
    filters?: {
      query?: string | null;
      id?: string | null;
      code?: string | null;
      title?: string | null;
      discountType?: PaymentCouponDiscountType | null;
      discountValueMin?: number | null;
      discountValueMax?: number | null;
      startsAtFrom?: string | null;
      startsAtTo?: string | null;
      expiresAtFrom?: string | null;
      expiresAtTo?: string | null;
      totalUsageLimitMin?: number | null;
      totalUsageLimitMax?: number | null;
      perUserUsageLimitMin?: number | null;
      perUserUsageLimitMax?: number | null;
      applicableCourseId?: string | null;
      isFirstPurchaseOnly?: boolean | null;
      isActive?: boolean | null;
      createdBy?: string | null;
      updatedBy?: string | null;
      createdAtFrom?: string | null;
      createdAtTo?: string | null;
      updatedAtFrom?: string | null;
      updatedAtTo?: string | null;
    };
    options: {
      limit: number;
      skip: number;
      sort?: Partial<Record<PaymentCouponListSortField, SortingOrder>>;
    };
  };
};

export type PaymentCouponCreateMutation = {
  readonly paymentCouponCreate: PaymentCouponListRow;
};

export type PaymentCouponUpdateMutation = {
  readonly paymentCouponUpdate: PaymentCouponListRow;
};

export type PaymentCouponDeleteMutation = {
  readonly paymentCouponDelete: boolean;
};

export type PaymentCouponFormState = {
  code: string;
  title: string;
  description: string;
  discountType: PaymentCouponDiscountType;
  discountValue: string;
  startsAt: string;
  expiresAt: string;
  totalUsageLimit: string;
  perUserUsageLimit: string;
  applicableCourseIds: string;
  isFirstPurchaseOnly: boolean;
  isActive: boolean;
};

export type PaymentCouponCreateMutationVariables = {
  input: {
    code: string;
    title: string;
    description?: string | null;
    discountType: PaymentCouponDiscountType;
    discountValue: number;
    startsAt?: string | null;
    expiresAt?: string | null;
    totalUsageLimit?: number | null;
    perUserUsageLimit?: number | null;
    applicableCourseIds?: string[] | null;
    isFirstPurchaseOnly?: boolean;
    isActive?: boolean;
  };
};

export type PaymentCouponUpdateMutationVariables = {
  input: PaymentCouponCreateMutationVariables["input"] & {
    id: string;
  };
};

export type PaymentCouponDeleteMutationVariables = {
  input: {
    id: string;
  };
};

export const EMPTY_PAYMENT_COUPON_LIST_FILTERS: PaymentCouponListFilters = {
  query: "",
  id: "",
  code: "",
  title: "",
  discountType: "ALL",
  discountValueMin: "",
  discountValueMax: "",
  startsAtFrom: "",
  startsAtTo: "",
  expiresAtFrom: "",
  expiresAtTo: "",
  totalUsageLimitMin: "",
  totalUsageLimitMax: "",
  perUserUsageLimitMin: "",
  perUserUsageLimitMax: "",
  applicableCourseId: "",
  isFirstPurchaseOnly: "ALL",
  isActive: "ALL",
  createdBy: "",
  updatedBy: "",
  createdAtFrom: "",
  createdAtTo: "",
  updatedAtFrom: "",
  updatedAtTo: "",
};

export const EMPTY_PAYMENT_COUPON_FORM: PaymentCouponFormState = {
  code: "",
  title: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  startsAt: "",
  expiresAt: "",
  totalUsageLimit: "",
  perUserUsageLimit: "",
  applicableCourseIds: "",
  isFirstPurchaseOnly: false,
  isActive: true,
};

const EMPTY_DISPLAY = "—";

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function enumToNull<TValue extends string>(value: TValue | "ALL"): TValue | null {
  return value === "ALL" ? null : value;
}

function booleanFilterToNull(value: "ALL" | "true" | "false"): boolean | null {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
}

function numberFilterToNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateFilterToIsoDate(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const jalaliDate = parseJalaliParamDate(trimmed);
  if (!jalaliDate) {
    return trimmed;
  }

  const gregorianDate = jalaliDate.toDate();
  const year = String(gregorianDate.getFullYear()).padStart(4, "0");
  const month = String(gregorianDate.getMonth() + 1).padStart(2, "0");
  const day = String(gregorianDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateTimeLocalToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }

  return date.toISOString();
}

function isoToDateTimeLocal(value: string): string {
  if (!value.trim()) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function nullableNumberInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCourseIds(value: string): string[] | null {
  const ids = value
    .split(/[\n,،]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return ids.length > 0 ? Array.from(new Set(ids)) : null;
}

export function mapPaymentCouponListRowToRecord(row: PaymentCouponListRow): PaymentCouponRecord {
  const applicableCourseIds = row.applicableCourseIds ?? [];

  return {
    id: String(row.id),
    code: row.code?.trim() || EMPTY_DISPLAY,
    title: row.title?.trim() || EMPTY_DISPLAY,
    description: row.description?.trim() || "",
    discountType: row.discountType,
    discountValue: row.discountValue,
    startsAt: row.startsAt ?? "",
    expiresAt: row.expiresAt ?? "",
    totalUsageLimit: typeof row.totalUsageLimit === "number" ? row.totalUsageLimit : null,
    perUserUsageLimit: typeof row.perUserUsageLimit === "number" ? row.perUserUsageLimit : null,
    applicableCourseIds,
    applicableCourseIdsText:
      applicableCourseIds.length > 0 ? applicableCourseIds.join("، ") : "همه دوره‌ها",
    isFirstPurchaseOnly: row.isFirstPurchaseOnly,
    isActive: row.isActive,
    totalUsageCount: row.totalUsageCount,
    remainingTotalUsageCount:
      typeof row.remainingTotalUsageCount === "number" ? row.remainingTotalUsageCount : null,
    createdBy: row.createdBy ?? "",
    updatedBy: row.updatedBy ?? "",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

export function buildPaymentCouponListQueryVariables(
  search: string,
  appliedFilters: PaymentCouponListFilters,
  sort: Partial<Record<PaymentCouponListSortField, SortingOrder>>,
  page: number,
  pageSize: number
): PaymentCouponListQueryVariables {
  return {
    input: {
      filters: {
        query: trimToNull(search) ?? trimToNull(appliedFilters.query),
        id: trimToNull(appliedFilters.id),
        code: trimToNull(appliedFilters.code),
        title: trimToNull(appliedFilters.title),
        discountType: enumToNull(appliedFilters.discountType),
        discountValueMin: numberFilterToNull(appliedFilters.discountValueMin),
        discountValueMax: numberFilterToNull(appliedFilters.discountValueMax),
        startsAtFrom: dateFilterToIsoDate(appliedFilters.startsAtFrom),
        startsAtTo: dateFilterToIsoDate(appliedFilters.startsAtTo),
        expiresAtFrom: dateFilterToIsoDate(appliedFilters.expiresAtFrom),
        expiresAtTo: dateFilterToIsoDate(appliedFilters.expiresAtTo),
        totalUsageLimitMin: numberFilterToNull(appliedFilters.totalUsageLimitMin),
        totalUsageLimitMax: numberFilterToNull(appliedFilters.totalUsageLimitMax),
        perUserUsageLimitMin: numberFilterToNull(appliedFilters.perUserUsageLimitMin),
        perUserUsageLimitMax: numberFilterToNull(appliedFilters.perUserUsageLimitMax),
        applicableCourseId: trimToNull(appliedFilters.applicableCourseId),
        isFirstPurchaseOnly: booleanFilterToNull(appliedFilters.isFirstPurchaseOnly),
        isActive: booleanFilterToNull(appliedFilters.isActive),
        createdBy: trimToNull(appliedFilters.createdBy),
        updatedBy: trimToNull(appliedFilters.updatedBy),
        createdAtFrom: dateFilterToIsoDate(appliedFilters.createdAtFrom),
        createdAtTo: dateFilterToIsoDate(appliedFilters.createdAtTo),
        updatedAtFrom: dateFilterToIsoDate(appliedFilters.updatedAtFrom),
        updatedAtTo: dateFilterToIsoDate(appliedFilters.updatedAtTo),
      },
      options: {
        limit: pageSize,
        skip: (page - 1) * pageSize,
        sort,
      },
    },
  };
}

export function hasPaymentCouponFiltersApplied(filters: PaymentCouponListFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "discountType" || key === "isFirstPurchaseOnly" || key === "isActive") {
      return value !== "ALL";
    }
    return String(value).trim() !== "";
  });
}

export function buildInitialPaymentCouponForm(
  record?: PaymentCouponRecord | null
): PaymentCouponFormState {
  if (!record) {
    return { ...EMPTY_PAYMENT_COUPON_FORM };
  }

  return {
    code: record.code === EMPTY_DISPLAY ? "" : record.code,
    title: record.title === EMPTY_DISPLAY ? "" : record.title,
    description: record.description,
    discountType: record.discountType,
    discountValue: String(record.discountValue),
    startsAt: isoToDateTimeLocal(record.startsAt),
    expiresAt: isoToDateTimeLocal(record.expiresAt),
    totalUsageLimit: record.totalUsageLimit == null ? "" : String(record.totalUsageLimit),
    perUserUsageLimit: record.perUserUsageLimit == null ? "" : String(record.perUserUsageLimit),
    applicableCourseIds: record.applicableCourseIds.join("\n"),
    isFirstPurchaseOnly: record.isFirstPurchaseOnly,
    isActive: record.isActive,
  };
}

export function buildPaymentCouponCreateVariables(
  form: PaymentCouponFormState
): PaymentCouponCreateMutationVariables {
  return {
    input: {
      code: form.code.trim(),
      title: form.title.trim(),
      description: trimToNull(form.description),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      startsAt: dateTimeLocalToIso(form.startsAt),
      expiresAt: dateTimeLocalToIso(form.expiresAt),
      totalUsageLimit: nullableNumberInput(form.totalUsageLimit),
      perUserUsageLimit: nullableNumberInput(form.perUserUsageLimit),
      applicableCourseIds: parseCourseIds(form.applicableCourseIds),
      isFirstPurchaseOnly: form.isFirstPurchaseOnly,
      isActive: form.isActive,
    },
  };
}

export function buildPaymentCouponUpdateVariables(
  record: PaymentCouponRecord,
  form: PaymentCouponFormState
): PaymentCouponUpdateMutationVariables {
  return {
    input: {
      ...buildPaymentCouponCreateVariables(form).input,
      id: record.id,
    },
  };
}
