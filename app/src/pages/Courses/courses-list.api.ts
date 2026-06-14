export type CourseItemType = "ARTICLE" | "VIDEO" | "VOICE" | "IMAGE";
export type CourseReleaseType = "IMMEDIATE" | "GRADUAL";
export type CourseDiscountType = "PERCENTAGE" | "FIXED_AMOUNT_IRT";
export type SortOrder = "ASC" | "DESC";

export type CourseListItemRow = {
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly coverImageFileId?: string | null;
  readonly priceIrt?: number | null;
  readonly discount?: {
    readonly type: CourseDiscountType;
    readonly value: number;
  } | null;
  readonly isActive?: boolean;
  readonly sortOrder?: number | null;
  readonly tags: string[];
  readonly releaseType: CourseReleaseType;
  readonly chapters?: Array<{
    readonly title: string;
    readonly description?: string | null;
    readonly iconFileId?: string | null;
    readonly visibleAfterMinutes?: number | null;
    readonly isFree: boolean;
    readonly sortOrder?: number | null;
    readonly items: Array<{
      readonly title: string;
      readonly sortOrder?: number | null;
      readonly fileId?: string | null;
      readonly article?: string | null;
      readonly type: CourseItemType;
    }>;
  }>;
  readonly chapterCount?: number | null;
  readonly itemCount?: number | null;
  readonly itemTypes?: CourseItemType[] | null;
  readonly isPurchased?: boolean | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
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
  readonly coverImageFileId: string | null;
  readonly priceIrt: number | null;
  readonly discount: {
    readonly type: CourseDiscountType;
    readonly value: number;
  } | null;
  readonly isActive: boolean;
  readonly sortOrder: number;
  readonly tags: string[];
  readonly releaseType: CourseReleaseType;
  readonly chapters: Array<{
    readonly title: string;
    readonly description: string;
    readonly iconFileId: string | null;
    readonly visibleAfterMinutes: number | null;
    readonly isFree: boolean;
    readonly sortOrder: number | null;
    readonly items: Array<{
      readonly title: string;
      readonly sortOrder: number | null;
      readonly fileId: string | null;
      readonly article: string;
      readonly type: CourseItemType;
    }>;
  }>;
  readonly itemTypes: CourseItemType[];
  readonly chapterCount: number;
  readonly itemCount: number;
  readonly isPurchased: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CourseListFilters = {
  readonly query: string;
  readonly isActive: "ALL" | "ACTIVE" | "INACTIVE";
  readonly releaseType: "ALL" | CourseReleaseType;
  readonly itemType: "ALL" | CourseItemType;
  readonly hasPrice: "ALL" | "WITH_PRICE" | "FREE_OR_UNSET";
  readonly hasFreeChapter: "ALL" | "YES" | "NO";
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
  minPriceIrt: "",
  maxPriceIrt: "",
  tagsAny: "",
};

export const DEFAULT_COURSE_LIST_SORT: CourseListSort = {
  field: "sortOrder",
  order: "ASC",
};

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

function toIsoOrEmpty(value?: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function mapCourseListRowToRecord(row: CourseListItemRow): CourseListRecord {
  const chapters = row.chapters ?? [];
  const itemTypes = Array.from(
    new Set(row.itemTypes?.length ? row.itemTypes : chapters.flatMap((chapter) => chapter.items.map((item) => item.type))),
  );

  return {
    id: row.id,
    title: row.title,
    description: row.description?.trim() || "",
    coverImageFileId: row.coverImageFileId || null,
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
    chapters: chapters.map((chapter) => ({
      title: chapter.title,
      description: chapter.description?.trim() || "",
      iconFileId: chapter.iconFileId || null,
      visibleAfterMinutes:
        typeof chapter.visibleAfterMinutes === "number" ? chapter.visibleAfterMinutes : null,
      isFree: chapter.isFree,
      sortOrder: typeof chapter.sortOrder === "number" ? chapter.sortOrder : null,
      items: chapter.items.map((item) => ({
        title: item.title,
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : null,
        fileId: item.fileId || null,
        article: item.article?.trim() || "",
        type: item.type,
      })),
    })),
    itemTypes,
    chapterCount: typeof row.chapterCount === "number" ? row.chapterCount : chapters.length,
    itemCount:
      typeof row.itemCount === "number"
        ? row.itemCount
        : chapters.reduce((sum, chapter) => sum + chapter.items.length, 0),
    isPurchased: row.isPurchased === true,
    createdAt: toIsoOrEmpty(row.createdAt),
    updatedAt: toIsoOrEmpty(row.updatedAt),
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
