import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";

export type CourseItemType = "ARTICLE" | "VIDEO" | "VOICE" | "IMAGE";
export type CourseReleaseType = "IMMEDIATE" | "GRADUAL";
export type CourseDiscountType = "PERCENTAGE" | "FIXED_AMOUNT_IRT";
export type SortOrder = "ASC" | "DESC";

export type CourseListItemRow = {
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly coverImageAccessUrl?: FileAccessUrl | null;
  readonly priceIrt?: number | null;
  readonly discount?: {
    readonly type: CourseDiscountType;
    readonly value: number;
  } | null;
  readonly isActive?: boolean;
  readonly sortOrder?: number | null;
  readonly tags: string[];
  readonly releaseType: CourseReleaseType;
  readonly chapterCount: number;
  readonly itemCount: number;
  readonly itemTypes: CourseItemType[];
  readonly isPurchased?: boolean | null;
};

export type CourseDetailChapterRow = {
  readonly title: string;
  readonly description?: string | null;
  readonly visibleAfterMinutes?: number | null;
  readonly isFree: boolean;
  readonly sortOrder?: number | null;
  readonly items: Array<{
    readonly title: string;
    readonly sortOrder?: number | null;
    readonly fileAccessUrl?: FileAccessUrl | null;
    readonly article?: string | null;
    readonly type: CourseItemType;
  }>;
};

export type CourseDetailItemRow = {
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly coverImageAccessUrl?: FileAccessUrl | null;
  readonly priceIrt?: number | null;
  readonly discount?: {
    readonly type: CourseDiscountType;
    readonly value: number;
  } | null;
  readonly isActive?: boolean;
  readonly tags: string[];
  readonly chapters: CourseDetailChapterRow[];
};

export type CourseDetailQuery = {
  courseDetail: CourseDetailItemRow;
};

export type CourseDetailQueryVariables = {
  input: {
    id: string;
  };
};

export type CourseListQuery = {
  courseList: {
    items: CourseListItemRow[];
    pagination: {
      limit: number;
      total: number;
      count: number;
      startCursor?: string | null;
      endCursor?: string | null;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
};

type CourseListFilterInput = {
  query?: string | null;
  isActive?: boolean | null;
  releaseType?: CourseReleaseType | null;
  itemType?: CourseItemType | null;
  hasPrice?: boolean | null;
  hasFreeChapter?: boolean | null;
  isPurchased?: boolean | null;
  includeUserId?: string | null;
  minPriceIrt?: number | null;
  maxPriceIrt?: number | null;
  tagsAny?: string[] | null;
};

type CourseListSortInput = {
  createdAt?: SortOrder;
  updatedAt?: SortOrder;
  title?: SortOrder;
  priceIrt?: SortOrder;
  isActive?: SortOrder;
  sortOrder?: SortOrder;
};

export type CourseListQueryVariables = {
  input: {
    filters?: CourseListFilterInput;
    options: {
      limit: number;
      startCursor?: string | null;
      sort?: CourseListSortInput;
    };
  };
};

export type CourseListRecord = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly coverImageAccessUrl: FileAccessUrl | null;
  readonly priceIrt: number | null;
  readonly discount: {
    readonly type: CourseDiscountType;
    readonly value: number;
  } | null;
  readonly isActive: boolean;
  readonly sortOrder: number;
  readonly tags: string[];
  readonly releaseType: CourseReleaseType;
  readonly itemTypes: CourseItemType[];
  readonly chapterCount: number;
  readonly itemCount: number;
  readonly isPurchased: boolean;
};

export type CourseEditRecord = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly coverImageAccessUrl: FileAccessUrl | null;
  readonly priceIrt: number | null;
  readonly discount: {
    readonly type: CourseDiscountType;
    readonly value: number;
  } | null;
  readonly isActive: boolean;
  readonly tags: string[];
  readonly chapters: Array<{
    readonly title: string;
    readonly description: string;
    readonly visibleAfterMinutes: number | null;
    readonly isFree: boolean;
    readonly sortOrder: number | null;
    readonly items: Array<{
      readonly title: string;
      readonly sortOrder: number | null;
      readonly fileAccessUrl: FileAccessUrl | null;
      readonly article: string;
      readonly type: CourseItemType;
    }>;
  }>;
};

export type CourseListFilters = {
  readonly query: string;
  readonly isActive: "ALL" | "ACTIVE" | "INACTIVE";
  readonly releaseType: "ALL" | CourseReleaseType;
  readonly itemType: "ALL" | CourseItemType;
  readonly hasPrice: "ALL" | "WITH_PRICE" | "FREE_OR_UNSET";
  readonly hasFreeChapter: "ALL" | "YES" | "NO";
  readonly isPurchased: "ALL" | "YES" | "NO";
  readonly minPriceIrt: string;
  readonly maxPriceIrt: string;
  readonly tagsAny: string;
};

export type CourseSortField = "sortOrder" | "createdAt" | "updatedAt" | "title" | "priceIrt" | "isActive";

export type CourseListSort = {
  readonly field: CourseSortField;
  readonly order: SortOrder;
};

export const DEFAULT_COURSE_LIST_FILTERS: CourseListFilters = {
  query: "",
  isActive: "ALL",
  releaseType: "ALL",
  itemType: "ALL",
  hasPrice: "ALL",
  hasFreeChapter: "ALL",
  isPurchased: "ALL",
  minPriceIrt: "",
  maxPriceIrt: "",
  tagsAny: "",
};

export const DEFAULT_COURSE_LIST_SORT: CourseListSort = {
  field: "sortOrder",
  order: "DESC",
};

export function isCourseFreeForList(item: Pick<CourseListRecord, "priceIrt" | "discount">): boolean {
  const price = item.priceIrt ?? 0;
  if (price <= 0) {
    return true;
  }

  const discount = item.discount;
  if (!discount || discount.value <= 0) {
    return false;
  }

  if (discount.type === "PERCENTAGE") {
    return discount.value >= 100;
  }

  return discount.value >= price;
}

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseTags(value: string): string[] | null {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? Array.from(new Set(parts)) : null;
}

export function mapCourseListRowToRecord(row: CourseListItemRow): CourseListRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description?.trim() || "",
    coverImageAccessUrl: row.coverImageAccessUrl ?? null,
    priceIrt: typeof row.priceIrt === "number" ? row.priceIrt : null,
    discount:
      row.discount && typeof row.discount.value === "number"
        ? {
            type: row.discount.type,
            value: row.discount.value,
          }
        : null,
    isActive: row.isActive ?? true,
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
    tags: row.tags || [],
    releaseType: row.releaseType,
    itemTypes: row.itemTypes || [],
    chapterCount: row.chapterCount,
    itemCount: row.itemCount,
    isPurchased: row.isPurchased === true,
  };
}

export function mapCourseDetailRowToRecord(row: CourseDetailItemRow): CourseEditRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description?.trim() || "",
    coverImageAccessUrl: row.coverImageAccessUrl ?? null,
    priceIrt: typeof row.priceIrt === "number" ? row.priceIrt : null,
    discount:
      row.discount && typeof row.discount.value === "number"
        ? {
            type: row.discount.type,
            value: row.discount.value,
          }
        : null,
    isActive: row.isActive ?? true,
    tags: row.tags || [],
    chapters: row.chapters.map((chapter) => ({
      title: chapter.title,
      description: chapter.description?.trim() || "",
      visibleAfterMinutes:
        typeof chapter.visibleAfterMinutes === "number" ? chapter.visibleAfterMinutes : null,
      isFree: chapter.isFree,
      sortOrder: typeof chapter.sortOrder === "number" ? chapter.sortOrder : null,
      items: chapter.items.map((item) => ({
        title: item.title,
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : null,
        fileAccessUrl: item.fileAccessUrl ?? null,
        article: item.article?.trim() || "",
        type: item.type,
      })),
    })),
  };
}

export function buildCourseListQueryVariables(
  filters: CourseListFilters,
  sort: CourseListSort,
  pageSize: number,
  startCursor?: string | null,
): CourseListQueryVariables {
  const query = trimToNull(filters.query);
  const tagsAny = parseTags(filters.tagsAny);
  const minPriceIrt = parseNumber(filters.minPriceIrt);
  const maxPriceIrt = parseNumber(filters.maxPriceIrt);

  return {
    input: {
      filters: {
        query,
        isActive:
          filters.isActive === "ALL"
            ? null
            : filters.isActive === "ACTIVE",
        releaseType: filters.releaseType === "ALL" ? null : filters.releaseType,
        itemType: filters.itemType === "ALL" ? null : filters.itemType,
        hasPrice:
          filters.hasPrice === "ALL"
            ? null
            : filters.hasPrice === "WITH_PRICE",
        hasFreeChapter:
          filters.hasFreeChapter === "ALL"
            ? null
            : filters.hasFreeChapter === "YES",
        isPurchased:
          filters.isPurchased === "ALL" ? null : filters.isPurchased === "YES",
        minPriceIrt,
        maxPriceIrt,
        tagsAny,
      },
      options: {
        limit: pageSize,
        startCursor: startCursor || null,
        sort: {
          [sort.field]: sort.order,
        },
      },
    },
  };
}
