import { parseJalaliParamDate } from "../../utilities/jalali-date-param.util";

export type AppSettingValueType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
export type SortingOrder = "ASC" | "DESC";

export type AppSettingKeyListItemRow = {
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly valueType: AppSettingValueType;
  readonly description?: string | null;
  readonly isActive: boolean;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type AppSettingRecord = {
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly valueType: AppSettingValueType;
  readonly description: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type AppSettingKeyListQuery = {
  appSettingKeyList: {
    items: AppSettingKeyListItemRow[];
    pagination: {
      limit: number;
      skip: number;
      total: number;
      count: number;
    };
  };
};

export type AppSettingListFilters = {
  query: string;
  id: string;
  key: string;
  label: string;
  valueType: AppSettingValueType | "ALL";
  isActive: "ALL" | "true" | "false";
  createdAtFrom: string;
  createdAtTo: string;
  updatedAtFrom: string;
  updatedAtTo: string;
};

export type AppSettingListSortField =
  | "createdAt"
  | "updatedAt"
  | "key"
  | "label"
  | "valueType"
  | "isActive";

export type AppSettingListQueryVariables = {
  input: {
    filters?: {
      query?: string | null;
      id?: string | null;
      key?: string | null;
      label?: string | null;
      valueType?: AppSettingValueType | null;
      isActive?: boolean | null;
      createdAtFrom?: string | null;
      createdAtTo?: string | null;
      updatedAtFrom?: string | null;
      updatedAtTo?: string | null;
    };
    options: {
      limit: number;
      skip: number;
      sort?: Partial<Record<AppSettingListSortField, SortingOrder>>;
    };
  };
};

export const EMPTY_APP_SETTING_LIST_FILTERS: AppSettingListFilters = {
  query: "",
  id: "",
  key: "",
  label: "",
  valueType: "ALL",
  isActive: "ALL",
  createdAtFrom: "",
  createdAtTo: "",
  updatedAtFrom: "",
  updatedAtTo: "",
};

const EMPTY_DISPLAY = "-";

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function enumToNull<TValue extends string>(value: TValue | "ALL"): TValue | null {
  return value === "ALL" ? null : value;
}

function booleanFilterToNull(value: AppSettingListFilters["isActive"]): boolean | null {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
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

export function mapAppSettingKeyListItemRowToRecord(
  row: AppSettingKeyListItemRow
): AppSettingRecord {
  return {
    id: String(row.id),
    key: row.key?.trim() || EMPTY_DISPLAY,
    label: row.label?.trim() || EMPTY_DISPLAY,
    valueType: row.valueType,
    description: row.description?.trim() || EMPTY_DISPLAY,
    isActive: row.isActive,
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

/** @deprecated Use AppSettingKeyListItemRow instead. */
export type AppSettingKeyListRow = AppSettingKeyListItemRow;

/** @deprecated Use mapAppSettingKeyListItemRowToRecord instead. */
export const mapAppSettingKeyListRowToRecord = mapAppSettingKeyListItemRowToRecord;

export function buildAppSettingListQueryVariables(
  search: string,
  appliedFilters: AppSettingListFilters,
  sort: Partial<Record<AppSettingListSortField, SortingOrder>>,
  page: number,
  pageSize: number
): AppSettingListQueryVariables {
  return {
    input: {
      filters: {
        query: trimToNull(search) ?? trimToNull(appliedFilters.query),
        id: trimToNull(appliedFilters.id),
        key: trimToNull(appliedFilters.key),
        label: trimToNull(appliedFilters.label),
        valueType: enumToNull(appliedFilters.valueType),
        isActive: booleanFilterToNull(appliedFilters.isActive),
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

export function hasAppSettingFiltersApplied(filters: AppSettingListFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "valueType" || key === "isActive") {
      return value !== "ALL";
    }
    return String(value).trim() !== "";
  });
}
