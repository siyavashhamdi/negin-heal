import { parseJalaliParamDate } from "../../utilities/jalali-date-param.util";

export type CouponDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type SortingOrder = "ASC" | "DESC";

export type CouponListItemRow = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly discountType: CouponDiscountType;
  readonly discountValue: number;
  readonly startsAt?: string | null;
  readonly expiresAt?: string | null;
  readonly isFirstPurchaseOnly: boolean;
  readonly isActive: boolean;
  readonly totalUsageCount: number;
  readonly remainingTotalUsageCount?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type CouponDetailRow = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description?: string | null;
  readonly discountType: CouponDiscountType;
  readonly discountValue: number;
  readonly startsAt?: string | null;
  readonly expiresAt?: string | null;
  readonly totalUsageLimit?: number | null;
  readonly perUserUsageLimit?: number | null;
  readonly applicableProductIds: readonly string[];
  readonly isFirstPurchaseOnly: boolean;
  readonly isActive: boolean;
  readonly totalUsageCount: number;
  readonly remainingTotalUsageCount?: number | null;
  readonly createdBy?: string | null;
  readonly updatedBy?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type CouponDetailQuery = {
  couponDetail: CouponDetailRow;
};

export type CouponDetailQueryVariables = {
  input: {
    id: string;
  };
};

export type CouponListRecord = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly discountType: CouponDiscountType;
  readonly discountValue: number;
  readonly startsAt: string;
  readonly expiresAt: string;
  readonly isFirstPurchaseOnly: boolean;
  readonly isActive: boolean;
  readonly totalUsageCount: number;
  readonly remainingTotalUsageCount: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CouponRecord = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly discountType: CouponDiscountType;
  readonly discountValue: number;
  readonly startsAt: string;
  readonly expiresAt: string;
  readonly totalUsageLimit: number | null;
  readonly perUserUsageLimit: number | null;
  readonly applicableProductIds: readonly string[];
  readonly applicableProductIdsText: string;
  readonly isFirstPurchaseOnly: boolean;
  readonly isActive: boolean;
  readonly totalUsageCount: number;
  readonly remainingTotalUsageCount: number | null;
  readonly createdBy: string;
  readonly updatedBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CouponListQuery = {
  couponList: {
    items: CouponListItemRow[];
    pagination: {
      limit: number;
      skip: number;
      total: number;
      count: number;
    };
  };
};

export type CouponListSortField =
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

export type CouponListFilters = {
  query: string;
  id: string;
  code: string;
  title: string;
  discountType: CouponDiscountType | "ALL";
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
  applicableProductId: string;
  isFirstPurchaseOnly: "ALL" | "true" | "false";
  isActive: "ALL" | "true" | "false";
  createdBy: string;
  updatedBy: string;
  createdAtFrom: string;
  createdAtTo: string;
  updatedAtFrom: string;
  updatedAtTo: string;
};

export type CouponListQueryVariables = {
  input: {
    filters?: {
      query?: string | null;
      id?: string | null;
      code?: string | null;
      title?: string | null;
      discountType?: CouponDiscountType | null;
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
      applicableProductId?: string | null;
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
      sort?: Partial<Record<CouponListSortField, SortingOrder>>;
    };
  };
};

export type CouponCreateMutation = {
  readonly couponCreate: { readonly id: string };
};

export type CouponUpdateMutation = {
  readonly couponUpdate: { readonly id: string };
};

export type CouponDeleteMutation = {
  readonly couponDelete: boolean;
};

export type CouponFormState = {
  code: string;
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: string;
  startsAt: string;
  expiresAt: string;
  totalUsageLimit: string;
  perUserUsageLimit: string;
  applicableProductIds: string[];
  isFirstPurchaseOnly: boolean;
  isActive: boolean;
};

export type CouponCreateMutationVariables = {
  input: {
    code: string;
    title: string;
    description?: string | null;
    discountType: CouponDiscountType;
    discountValue: number;
    startsAt?: string | null;
    expiresAt?: string | null;
    totalUsageLimit?: number | null;
    perUserUsageLimit?: number | null;
    applicableProductIds?: string[] | null;
    isFirstPurchaseOnly?: boolean;
    isActive?: boolean;
  };
};

export type CouponUpdateMutationVariables = {
  input: CouponCreateMutationVariables["input"] & {
    id: string;
  };
};

export type CouponDeleteMutationVariables = {
  input: {
    id: string;
  };
};

export const EMPTY_COUPON_LIST_FILTERS: CouponListFilters = {
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
  applicableProductId: "",
  isFirstPurchaseOnly: "ALL",
  isActive: "ALL",
  createdBy: "",
  updatedBy: "",
  createdAtFrom: "",
  createdAtTo: "",
  updatedAtFrom: "",
  updatedAtTo: "",
};

export const EMPTY_COUPON_FORM: CouponFormState = {
  code: "",
  title: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  startsAt: "",
  expiresAt: "",
  totalUsageLimit: "",
  perUserUsageLimit: "",
  applicableProductIds: [],
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

function normalizeProductIds(value: readonly string[]): string[] | null {
  const ids = value.map((item) => item.trim()).filter(Boolean);
  return ids.length > 0 ? Array.from(new Set(ids)) : null;
}

export function mapCouponListRowToRecord(row: CouponListItemRow): CouponListRecord {
  return {
    id: String(row.id),
    code: row.code?.trim() || EMPTY_DISPLAY,
    title: row.title?.trim() || EMPTY_DISPLAY,
    discountType: row.discountType,
    discountValue: row.discountValue,
    startsAt: row.startsAt ?? "",
    expiresAt: row.expiresAt ?? "",
    isFirstPurchaseOnly: row.isFirstPurchaseOnly,
    isActive: row.isActive,
    totalUsageCount: row.totalUsageCount,
    remainingTotalUsageCount:
      typeof row.remainingTotalUsageCount === "number" ? row.remainingTotalUsageCount : null,
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

export function mapCouponDetailRowToRecord(row: CouponDetailRow): CouponRecord {
  const applicableProductIds = row.applicableProductIds ?? [];

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
    applicableProductIds,
    applicableProductIdsText:
      applicableProductIds.length > 0 ? applicableProductIds.join("، ") : "همه دوره‌ها",
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

export function buildCouponListQueryVariables(
  search: string,
  appliedFilters: CouponListFilters,
  sort: Partial<Record<CouponListSortField, SortingOrder>>,
  page: number,
  pageSize: number
): CouponListQueryVariables {
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
        applicableProductId: trimToNull(appliedFilters.applicableProductId),
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

export function hasCouponFiltersApplied(filters: CouponListFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "discountType" || key === "isFirstPurchaseOnly" || key === "isActive") {
      return value !== "ALL";
    }
    return String(value).trim() !== "";
  });
}

export function buildInitialCouponForm(record?: CouponRecord | null): CouponFormState {
  if (!record) {
    return { ...EMPTY_COUPON_FORM };
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
    applicableProductIds: [...record.applicableProductIds],
    isFirstPurchaseOnly: record.isFirstPurchaseOnly,
    isActive: record.isActive,
  };
}

export function buildCouponCreateVariables(form: CouponFormState): CouponCreateMutationVariables {
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
      applicableProductIds: normalizeProductIds(form.applicableProductIds),
      isFirstPurchaseOnly: form.isFirstPurchaseOnly,
      isActive: form.isActive,
    },
  };
}

export function buildCouponUpdateVariables(
  record: CouponRecord,
  form: CouponFormState
): CouponUpdateMutationVariables {
  return {
    input: {
      ...buildCouponCreateVariables(form).input,
      id: record.id,
    },
  };
}
