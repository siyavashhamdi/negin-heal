import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";
import { isNativeAndroidShell } from "../../utils/nativePlatform.util";

export type ProductItemType = "ARTICLE" | "VIDEO" | "VOICE" | "IMAGE";
export type ProductReleaseType = "IMMEDIATE" | "GRADUAL";
export type ProductDiscountType = "PERCENTAGE" | "FIXED_AMOUNT_IRT";
export type SortOrder = "ASC" | "DESC";

export type ProductListItemRow = {
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly coverImageAccessUrl?: FileAccessUrl | null;
  readonly priceIrt?: number | null;
  readonly discount?: {
    readonly type: ProductDiscountType;
    readonly value: number;
  } | null;
  readonly isActive?: boolean;
  readonly sortOrder?: number | null;
  readonly tags: string[];
  readonly releaseType: ProductReleaseType;
  readonly chapterCount: number;
  readonly itemCount: number;
  readonly itemTypes: ProductItemType[];
  readonly isPurchased?: boolean | null;
};

export type ProductDetailChapterRow = {
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
    readonly type: ProductItemType;
  }>;
};

export type ProductDetailItemRow = {
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly coverImageAccessUrl?: FileAccessUrl | null;
  readonly priceIrt?: number | null;
  readonly discount?: {
    readonly type: ProductDiscountType;
    readonly value: number;
  } | null;
  readonly isActive?: boolean;
  readonly isReviewSubmissionEnabled?: boolean;
  readonly isReviewsSectionVisible?: boolean;
  readonly tags: string[];
  readonly chapters: ProductDetailChapterRow[];
};

export type ProductDetailQuery = {
  productDetail: ProductDetailItemRow;
};

export type ProductDetailQueryVariables = {
  input: {
    id: string;
  };
};

export type ProductListQuery = {
  productList: {
    items: ProductListItemRow[];
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

type ProductListFilterInput = {
  query?: string | null;
  isActive?: boolean | null;
  releaseType?: ProductReleaseType | null;
  itemType?: ProductItemType | null;
  hasPrice?: boolean | null;
  hasFreeChapter?: boolean | null;
  isPurchased?: boolean | null;
  includeUserId?: string | null;
  minPriceIrt?: number | null;
  maxPriceIrt?: number | null;
  tagsAny?: string[] | null;
};

type ProductListSortInput = {
  createdAt?: SortOrder;
  updatedAt?: SortOrder;
  title?: SortOrder;
  priceIrt?: SortOrder;
  isActive?: SortOrder;
  sortOrder?: SortOrder;
};

export type ProductListQueryVariables = {
  input: {
    filters?: ProductListFilterInput;
    options: {
      limit: number;
      startCursor?: string | null;
      sort?: ProductListSortInput;
    };
  };
};

export type ProductListRecord = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly coverImageAccessUrl: FileAccessUrl | null;
  readonly priceIrt: number | null;
  readonly discount: {
    readonly type: ProductDiscountType;
    readonly value: number;
  } | null;
  readonly isActive: boolean;
  readonly sortOrder: number;
  readonly tags: string[];
  readonly releaseType: ProductReleaseType;
  readonly itemTypes: ProductItemType[];
  readonly chapterCount: number;
  readonly itemCount: number;
  readonly isPurchased: boolean;
};

export type ProductEditRecord = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly coverImageAccessUrl: FileAccessUrl | null;
  readonly priceIrt: number | null;
  readonly discount: {
    readonly type: ProductDiscountType;
    readonly value: number;
  } | null;
  readonly isActive: boolean;
  readonly isReviewSubmissionEnabled: boolean;
  readonly isReviewsSectionVisible: boolean;
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
      readonly type: ProductItemType;
    }>;
  }>;
};

export type ProductListFilters = {
  readonly query: string;
  readonly isActive: "ALL" | "ACTIVE" | "INACTIVE";
  readonly releaseType: "ALL" | ProductReleaseType;
  readonly itemType: "ALL" | ProductItemType;
  readonly hasPrice: "ALL" | "WITH_PRICE" | "FREE_OR_UNSET";
  readonly hasFreeChapter: "ALL" | "YES" | "NO";
  readonly isPurchased: "ALL" | "YES" | "NO";
  readonly minPriceIrt: string;
  readonly maxPriceIrt: string;
  readonly tagsAny: string;
};

export type ProductSortField =
  | "sortOrder"
  | "createdAt"
  | "updatedAt"
  | "title"
  | "priceIrt"
  | "isActive";

export type ProductListSort = {
  readonly field: ProductSortField;
  readonly order: SortOrder;
};

export const DEFAULT_PRODUCT_LIST_FILTERS: ProductListFilters = {
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

export const DEFAULT_PRODUCT_LIST_SORT: ProductListSort = {
  field: "sortOrder",
  order: "DESC",
};

export function isProductFreeForList(
  item: Pick<ProductListRecord, "priceIrt" | "discount">
): boolean {
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

export function mapProductListRowToRecord(row: ProductListItemRow): ProductListRecord {
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

export function mapProductDetailRowToRecord(row: ProductDetailItemRow): ProductEditRecord {
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
    isReviewSubmissionEnabled: row.isReviewSubmissionEnabled !== false,
    isReviewsSectionVisible: row.isReviewsSectionVisible !== false,
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

export type BuildProductListQueryVariablesOptions = {
  /** Restrict public product lists to free items on the Android APK. */
  readonly restrictToFreeOnAndroidApk?: boolean;
};

/** On Android APK, hide paid catalog entries except on the purchased tab. */
export function applyAndroidApkFreeProductListFilters(
  filters: ProductListFilters,
  enabled = true,
): ProductListFilters {
  if (!enabled || !isNativeAndroidShell() || filters.isPurchased === "YES") {
    return filters;
  }

  return {
    ...filters,
    hasPrice: "FREE_OR_UNSET",
  };
}

export function buildProductListQueryVariables(
  filters: ProductListFilters,
  sort: ProductListSort,
  pageSize: number,
  startCursor?: string | null,
  options?: BuildProductListQueryVariablesOptions,
): ProductListQueryVariables {
  const resolvedFilters = applyAndroidApkFreeProductListFilters(
    filters,
    options?.restrictToFreeOnAndroidApk ?? false,
  );
  const query = trimToNull(resolvedFilters.query);
  const tagsAny = parseTags(resolvedFilters.tagsAny);
  const minPriceIrt = parseNumber(resolvedFilters.minPriceIrt);
  const maxPriceIrt = parseNumber(resolvedFilters.maxPriceIrt);

  return {
    input: {
      filters: {
        query,
        isActive:
          resolvedFilters.isActive === "ALL" ? null : resolvedFilters.isActive === "ACTIVE",
        releaseType:
          resolvedFilters.releaseType === "ALL" ? null : resolvedFilters.releaseType,
        itemType: resolvedFilters.itemType === "ALL" ? null : resolvedFilters.itemType,
        hasPrice:
          resolvedFilters.hasPrice === "ALL"
            ? null
            : resolvedFilters.hasPrice === "WITH_PRICE",
        hasFreeChapter:
          resolvedFilters.hasFreeChapter === "ALL"
            ? null
            : resolvedFilters.hasFreeChapter === "YES",
        isPurchased:
          resolvedFilters.isPurchased === "ALL" ? null : resolvedFilters.isPurchased === "YES",
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
