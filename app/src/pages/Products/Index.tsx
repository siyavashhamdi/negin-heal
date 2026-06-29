import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { NetworkStatus } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  InputAdornment,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
  Divider,
  useMediaQuery,
} from "@mui/material";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useDebounce } from "../../hooks/useDebounce";
import { usePageSeoOverride } from "../../hooks/usePageSeoOverride";
import { useBadgeCountFirstPageReload } from "../../hooks/useBadgeCountFirstPageReload";
import { useProductPaymentStatusNotificationRefetch } from "../../hooks/useProductPaymentStatusNotificationRefetch";
import { useCursorScrollLoadMore } from "../../hooks/useCursorScrollLoadMore";
import { useAuth } from "../../contexts/AuthContext";
import { API_CONFIG } from "../../config";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import { PRODUCT_LIST_QUERY } from "../../graphql/queries/productList.query";
import { USER_PRODUCT_LIST_QUERY } from "../../graphql/queries/userProductList.query";
import { PRODUCT_DELETE_MUTATION } from "../../graphql/mutations/productDelete.mutation";
import { PRODUCT_DELETE_DEPENDENCIES_QUERY } from "../../graphql/queries/productDeleteDependencies.query";
import ProductCard from "./ProductCard";
import ProductFormDialog from "./ProductFormDialog";
import EndUserProductFilterTabs, { type EndUserProductTab } from "./EndUserProductFilterTabs";
import {
  buildProductListQueryVariables,
  DEFAULT_PRODUCT_LIST_FILTERS,
  DEFAULT_PRODUCT_LIST_SORT,
  mapProductListRowToRecord,
  type ProductItemType,
  type ProductListFilters,
  type ProductListQuery,
  type ProductListQueryVariables,
  type ProductListRecord,
  type ProductListSort,
  type ProductSortField,
} from "./product-list.api";
import { resolveFileAccessUrl } from "../../utils/fileAccessUrl.util";
import EntityDeleteDialog from "../../shared/crud/EntityDeleteDialog";
import ProductDeleteDependenciesPanel from "./ProductDeleteDependenciesPanel";
import type {
  ProductDeleteDependenciesQuery,
  ProductDeleteDependenciesQueryVariables,
} from "./product-delete-dependencies.api";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import { PRODUCTS_EDIT_PATH_REGEX } from "../../routing/product-route-path";
import { resolveQueryFetchPolicy } from "../../lib/offline-fetch-policy.util";
import { isNativeAndroidShell } from "../../utils/nativePlatform.util";
import { useAfterLogoutCacheCleanup } from "../../hooks/useAfterLogoutCacheCleanup";
import { getIsBrowserOffline, getIsOfflineMode } from "../../lib/offline-state";
import { stripOverlayRoutePathname } from "../../routing/max-route.util";
import {
  buildProductListStructuredData,
  buildDefaultStructuredData,
  buildStructuredDataLogoUrl,
} from "../../seo/build-structured-data";
import { resolveAppBaseUrl } from "../../seo/build-page-seo";
import { buildSeoDescription, resolveAbsoluteUrl } from "../../seo/seo-text.util";
import styles from "./styles/products.module.scss";
import AppTooltip from "../../shared/AppTooltip";

const PRODUCT_LIST_PAGE_SIZE = 6;

function getEndUserTabFilters(
  tab: EndUserProductTab
): Pick<ProductListFilters, "hasPrice" | "isPurchased"> {
  switch (tab) {
    case "FREE":
      return { hasPrice: "FREE_OR_UNSET", isPurchased: "ALL" };
    case "PURCHASABLE":
      return { hasPrice: "WITH_PRICE", isPurchased: "NO" };
    case "PURCHASED":
      return { hasPrice: "ALL", isPurchased: "YES" };
    case "ALL":
    default:
      return { hasPrice: "ALL", isPurchased: "ALL" };
  }
}

type ProductDeleteMutationResult = {
  productDelete: boolean;
};

type ProductDeleteMutationVariables = {
  input: {
    id: string;
  };
};

type ProductFilterChip = {
  key: keyof ProductListFilters;
  label: string;
};

const SORT_FIELD_LABEL: Record<ProductSortField, string> = {
  sortOrder: "چینش",
  createdAt: "جدیدترین ایجاد",
  updatedAt: "آخرین بروزرسانی",
  title: "عنوان",
  priceIrt: "قیمت",
  isActive: "وضعیت",
};

const ITEM_TYPE_LABEL: Record<ProductItemType, string> = {
  ARTICLE: "مقاله",
  VIDEO: "ویدیو",
  VOICE: "صوت",
  IMAGE: "تصویر",
};

const SORT_ORDER_LABEL: Record<"ASC" | "DESC", string> = {
  ASC: "صعودی",
  DESC: "نزولی",
};

const ProductsIndex = (): ReactElement => {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isEndUser = authUser?.roles?.includes("END_USER") === true;
  const isPublicProductView = !authUser || isEndUser;

  const [filters, setFilters] = useState<ProductListFilters>(DEFAULT_PRODUCT_LIST_FILTERS);
  const [searchQuery, setSearchQuery] = useState(DEFAULT_PRODUCT_LIST_FILTERS.query);
  const [sort, setSort] = useState<ProductListSort>(DEFAULT_PRODUCT_LIST_SORT);
  const [deleteTarget, setDeleteTarget] = useState<ProductListRecord | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showFilterSections, setShowFilterSections] = useState(false);
  const [endUserTab, setEndUserTab] = useState<EndUserProductTab>(() =>
    isNativeAndroidShell() ? "FREE" : "ALL"
  );
  const [productFeedMinHeight, setProductFeedMinHeight] = useState<number | undefined>();
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const productFeedRef = useRef<HTMLDivElement | null>(null);
  const fetchingMoreRef = useRef(false);
  const lastMobileScrollYRef = useRef(0);
  const mobileFilterOpenGuardUntilRef = useRef(0);
  const [items, setItems] = useState<ProductListRecord[]>([]);
  const [isOnFirstPage, setIsOnFirstPage] = useState(true);
  const [pagination, setPagination] = useState({
    totalFiltered: 0,
    hasNextPage: false,
    endCursor: null as string | null,
  });
  const debouncedSearchQuery = useDebounce(searchQuery, 450);

  const productFormPath = stripOverlayRoutePathname(location.pathname);
  const isCreateDialogOpen = productFormPath === `${APP_SHELL_ROUTES.products}/new`;
  const editTargetId = PRODUCTS_EDIT_PATH_REGEX.exec(productFormPath)?.[1] ?? null;
  const isProductFormDialogOpen = isCreateDialogOpen || editTargetId != null;

  const pageSeoOverride = useMemo(() => {
    if (
      !isPublicProductView ||
      productFormPath !== APP_SHELL_ROUTES.products ||
      items.length === 0
    ) {
      return null;
    }

    const appUrl = resolveAppBaseUrl(API_CONFIG.APP_URL);
    const canonicalPath = APP_SHELL_ROUTES.products;
    const canonicalUrl = resolveAbsoluteUrl(appUrl, canonicalPath);
    const siteName = t("seo.brand.name");
    const description = buildSeoDescription(t("seo.pages.products.description"));
    const logoUrl = buildStructuredDataLogoUrl(appUrl, "/icons/icon-512.png");

    return {
      description,
      canonicalPath,
      jsonLd: [
        ...buildDefaultStructuredData({
          t,
          appUrl,
          canonicalUrl,
          siteName,
          description,
          logoUrl,
        }),
        ...buildProductListStructuredData({
          appUrl,
          canonicalUrl,
          siteName,
          description,
          products: items.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            url: resolveAbsoluteUrl(appUrl, `${APP_SHELL_ROUTES.products}/${item.id}`),
            imageUrl: resolveFileAccessUrl(item.coverImageAccessUrl) ?? undefined,
          })),
        }),
      ],
    };
  }, [productFormPath, isPublicProductView, items, t]);

  usePageSeoOverride(pageSeoOverride);

  const closeProductFormDialog = (): void => {
    navigate(APP_SHELL_ROUTES.products);
  };

  const openCreateProductDialog = (): void => {
    navigate(`${APP_SHELL_ROUTES.products}/new`);
  };

  const openEditProductDialog = (product: ProductListRecord): void => {
    navigate(`${APP_SHELL_ROUTES.products}/edit/${product.id}`);
  };

  const closeDeleteDialog = (): void => {
    navigate(APP_SHELL_ROUTES.products);
  };

  const openDeleteDialogForProductId = (productId: string): void => {
    navigate(`${APP_SHELL_ROUTES.products}/delete/${productId}`);
  };

  useEffect(() => {
    if (!location.pathname.startsWith(`${APP_SHELL_ROUTES.products}/delete/`)) {
      return;
    }

    const deleteId = location.pathname.slice(`${APP_SHELL_ROUTES.products}/delete/`.length);
    if (!deleteId) {
      return;
    }

    const target = items.find((item) => item.id === deleteId) ?? null;
    setDeleteTarget(target);
  }, [items, location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith(`${APP_SHELL_ROUTES.products}/delete/`)) {
      return;
    }

    setDeleteTarget(null);
  }, [location.pathname]);

  const setFilterValue = <K extends keyof ProductListFilters>(
    key: K,
    value: ProductListFilters[K]
  ): void => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearSearch = (): void => {
    setSearchQuery(DEFAULT_PRODUCT_LIST_FILTERS.query);
    setFilterValue("query", DEFAULT_PRODUCT_LIST_FILTERS.query);
  };

  const clearAllFilters = (): void => {
    setSearchQuery(DEFAULT_PRODUCT_LIST_FILTERS.query);
    setFilters(DEFAULT_PRODUCT_LIST_FILTERS);
  };

  useEffect(() => {
    setFilters((prev) =>
      prev.query === debouncedSearchQuery ? prev : { ...prev, query: debouncedSearchQuery }
    );
  }, [debouncedSearchQuery]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== "" ||
      filters.query.trim() !== "" ||
      filters.isActive !== DEFAULT_PRODUCT_LIST_FILTERS.isActive ||
      filters.releaseType !== DEFAULT_PRODUCT_LIST_FILTERS.releaseType ||
      filters.itemType !== DEFAULT_PRODUCT_LIST_FILTERS.itemType ||
      filters.hasPrice !== DEFAULT_PRODUCT_LIST_FILTERS.hasPrice ||
      filters.hasFreeChapter !== DEFAULT_PRODUCT_LIST_FILTERS.hasFreeChapter ||
      filters.minPriceIrt.trim() !== "" ||
      filters.maxPriceIrt.trim() !== "" ||
      filters.tagsAny.trim() !== ""
    );
  }, [filters, searchQuery]);

  useEffect(() => {
    if (!isEndUser) {
      return;
    }

    const tabFilters = getEndUserTabFilters(endUserTab);
    setItems([]);
    setSearchQuery("");
    setFilters({
      ...DEFAULT_PRODUCT_LIST_FILTERS,
      ...tabFilters,
    });
  }, [endUserTab, isEndUser]);

  const handleEndUserTabChange = useCallback((tab: EndUserProductTab): void => {
    if (productFeedRef.current) {
      setProductFeedMinHeight(productFeedRef.current.offsetHeight);
    }
    setEndUserTab(tab);
  }, []);

  useEffect(() => {
    if (!isMobile || isEndUser) {
      setIsMobileFilterOpen(false);
      return undefined;
    }

    lastMobileScrollYRef.current = window.scrollY;
    let animationFrameId = 0;

    const collapseMobileFilterOnScroll = (): void => {
      const isOpeningMobileFilter = performance.now() < mobileFilterOpenGuardUntilRef.current;
      const activeElement = document.activeElement;
      const hasOpenDialog =
        document.querySelector(".MuiModal-root:not([aria-hidden='true'])") !== null;
      const isDialogFocused =
        activeElement instanceof HTMLElement &&
        activeElement.closest(".MuiDialog-root, [role='dialog']") !== null;

      if (isOpeningMobileFilter || hasOpenDialog || isDialogFocused) {
        return;
      }

      setShowFilterSections((current) => (current ? false : current));
      setIsMobileFilterOpen((current) => {
        const next = hasActiveFilters;
        return current === next ? current : next;
      });
    };

    const handleScroll = (): void => {
      const scrollY = window.scrollY;
      const didScroll = Math.abs(scrollY - lastMobileScrollYRef.current) > 1;
      lastMobileScrollYRef.current = scrollY;

      if (!didScroll || animationFrameId) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = 0;
        collapseMobileFilterOnScroll();
      });
    };

    const handleScrollEnd = (): void => {
      const activeElement = document.activeElement;
      const searchInput = searchInputRef.current;
      if (searchInput && activeElement === searchInput) {
        searchInput.blur();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scrollend", handleScrollEnd, { passive: true });
    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scrollend", handleScrollEnd);
    };
  }, [hasActiveFilters, isEndUser, isMobile]);

  useEffect(() => {
    if (!isMobile || !isMobileFilterOpen) {
      return undefined;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [isMobile, isMobileFilterOpen]);

  useEffect(() => {
    setIsOnFirstPage(true);
  }, [filters, sort]);

  const productListVariables = useMemo(
    () =>
      buildProductListQueryVariables(filters, sort, PRODUCT_LIST_PAGE_SIZE, null, {
        restrictToFreeOnAndroidApk: isPublicProductView,
      }),
    [filters, sort, isPublicProductView]
  );

  const {
    data: productListData,
    loading,
    error,
    fetchMore,
    refetch: refetchProductList,
    networkStatus,
  } = useQuery<ProductListQuery, ProductListQueryVariables>(
    isPublicProductView ? USER_PRODUCT_LIST_QUERY : PRODUCT_LIST_QUERY,
    {
      variables: productListVariables,
      fetchPolicy: resolveQueryFetchPolicy("cache-and-network"),
      nextFetchPolicy: "cache-first",
      notifyOnNetworkStatusChange: true,
    }
  );

  const isFetchingMore = networkStatus === NetworkStatus.fetchMore;

  const queryPageItems = useMemo(() => {
    const page = productListData?.productList;
    if (!page) {
      return [];
    }

    return page.items.map(mapProductListRowToRecord);
  }, [productListData]);

  const displayItems = items.length > 0 ? items : queryPageItems;

  const isInitialLoading =
    (loading ||
      networkStatus === NetworkStatus.loading ||
      networkStatus === NetworkStatus.setVariables) &&
    displayItems.length === 0 &&
    !error &&
    !getIsBrowserOffline();

  useLayoutEffect(() => {
    const page = productListData?.productList;
    if (!page) {
      return;
    }

    if (networkStatus === NetworkStatus.loading || networkStatus === NetworkStatus.setVariables) {
      return;
    }

    setItems(page.items.map(mapProductListRowToRecord));
    setPagination({
      totalFiltered: page.pagination.total,
      hasNextPage: page.pagination.hasNextPage,
      endCursor: page.pagination.endCursor ?? null,
    });
  }, [productListData, networkStatus]);

  useEffect(() => {
    if (!isEndUser || !isInitialLoading) {
      setProductFeedMinHeight(undefined);
    }
  }, [isEndUser, isInitialLoading, endUserTab]);

  const onRefresh = useCallback((): void => {
    void refetchProductList();
  }, [refetchProductList]);

  useAfterLogoutCacheCleanup(onRefresh);

  useBadgeCountFirstPageReload({
    isOnFirstPage,
    reload: onRefresh,
  });

  useProductPaymentStatusNotificationRefetch({
    enabled: Boolean(authUser),
    refetch: onRefresh,
  });

  const loadNextPage = useCallback(async (): Promise<boolean> => {
    const nextCursor = pagination.endCursor ?? items[items.length - 1]?.id ?? null;
    if (
      fetchingMoreRef.current ||
      loading ||
      isFetchingMore ||
      !pagination.hasNextPage ||
      !nextCursor
    ) {
      return false;
    }

    fetchingMoreRef.current = true;
    try {
      const result = await fetchMore({
        variables: {
          input: {
            ...productListVariables.input,
            options: {
              ...productListVariables.input.options,
              startCursor: nextCursor,
            },
          },
        },
        updateQuery: (previous, { fetchMoreResult }) => {
          if (!fetchMoreResult?.productList) {
            return previous;
          }

          const existingIds = new Set(previous.productList.items.map((item) => item.id));
          const newItems = fetchMoreResult.productList.items.filter(
            (item) => !existingIds.has(item.id)
          );

          return {
            productList: {
              items: [...previous.productList.items, ...newItems],
              pagination: fetchMoreResult.productList.pagination,
            },
          };
        },
      });

      if (!result.data?.productList) {
        return false;
      }

      setIsOnFirstPage(false);
      return true;
    } catch {
      return false;
    } finally {
      fetchingMoreRef.current = false;
    }
  }, [
    productListVariables,
    fetchMore,
    isFetchingMore,
    items,
    loading,
    pagination.endCursor,
    pagination.hasNextPage,
  ]);

  useCursorScrollLoadMore({
    loadMoreRef,
    hasNextPage: pagination.hasNextPage,
    rootMargin: "480px 0px",
    observeDeps: [items.length],
    loadMore: loadNextPage,
  });

  const [deleteProduct, deleteProductResult] = useMutationWithSnackbar<
    ProductDeleteMutationResult,
    ProductDeleteMutationVariables
  >(PRODUCT_DELETE_MUTATION, {
    successMessage: "دوره و اعلان‌های مرتبط با موفقیت حذف شد.",
    errorMessage: "حذف دوره انجام نشد.",
    onSuccess: () => {
      closeDeleteDialog();
      onRefresh();
    },
  });

  const {
    data: deleteDependenciesData,
    loading: deleteDependenciesLoading,
    error: deleteDependenciesError,
  } = useQuery<ProductDeleteDependenciesQuery, ProductDeleteDependenciesQueryVariables>(
    PRODUCT_DELETE_DEPENDENCIES_QUERY,
    {
      variables: {
        input: { id: deleteTarget?.id ?? "" },
      },
      skip: !deleteTarget?.id,
      fetchPolicy: resolveQueryFetchPolicy("network-only"),
    }
  );

  const canReorderProducts =
    !isPublicProductView && sort.field === "sortOrder" && sort.order === "ASC";

  const calculateSortOrderBetween = (
    previousItem: ProductListRecord | undefined,
    nextItem: ProductListRecord | undefined
  ): number => {
    if (previousItem && nextItem) {
      return (previousItem.sortOrder + nextItem.sortOrder) / 2;
    }
    if (previousItem) {
      return previousItem.sortOrder + 1;
    }
    if (nextItem) {
      return nextItem.sortOrder - 1;
    }
    return 0;
  };

  const handleProductDragStart = (event: DragEvent<HTMLDivElement>, productId: string): void => {
    if (!canReorderProducts) {
      event.preventDefault();
      return;
    }
    setDraggedProductId(productId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", productId);
  };

  const handleProductDragOver = (
    event: DragEvent<HTMLDivElement>,
    targetProductId: string
  ): void => {
    if (!canReorderProducts || !draggedProductId) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (draggedProductId === targetProductId) {
      return;
    }

    const targetRect = event.currentTarget.getBoundingClientRect();
    const shouldInsertAfter = event.clientY > targetRect.top + targetRect.height / 2;

    setItems((currentItems) => {
      const draggedIndex = currentItems.findIndex((item) => item.id === draggedProductId);
      const targetIndex = currentItems.findIndex((item) => item.id === targetProductId);
      if (draggedIndex < 0 || targetIndex < 0) {
        return currentItems;
      }

      const draggedItem = currentItems[draggedIndex];
      if (!draggedItem) {
        return currentItems;
      }

      const withoutDragged = currentItems.filter((item) => item.id !== draggedProductId);
      const adjustedTargetIndex = withoutDragged.findIndex((item) => item.id === targetProductId);
      const insertionIndex = adjustedTargetIndex + (shouldInsertAfter ? 1 : 0);
      if (currentItems[insertionIndex]?.id === draggedProductId) {
        return currentItems;
      }

      const previousItem = withoutDragged[insertionIndex - 1];
      const nextItem = withoutDragged[insertionIndex];
      const nextSortOrder = calculateSortOrderBetween(previousItem, nextItem);

      return [
        ...withoutDragged.slice(0, insertionIndex),
        { ...draggedItem, sortOrder: nextSortOrder },
        ...withoutDragged.slice(insertionIndex),
      ];
    });
  };

  const handleProductDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDraggedProductId(null);
  };

  const handleProductKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    product: ProductListRecord
  ): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isPublicProductView) {
        navigate(`${APP_SHELL_ROUTES.products}/${product.id}`);
      } else {
        openEditProductDialog(product);
      }
    }
  };

  const appliedFilterChips = useMemo(() => {
    const chips: ProductFilterChip[] = [];

    if (filters.isActive !== "ALL") {
      chips.push({
        key: "isActive",
        label: filters.isActive === "ACTIVE" ? "فقط فعال" : "فقط غیرفعال",
      });
    }
    if (filters.releaseType !== "ALL") {
      chips.push({
        key: "releaseType",
        label: filters.releaseType === "IMMEDIATE" ? "انتشار فوری" : "انتشار تدریجی",
      });
    }
    if (filters.itemType !== "ALL") {
      chips.push({ key: "itemType", label: `نوع محتوا: ${ITEM_TYPE_LABEL[filters.itemType]}` });
    }
    if (filters.hasPrice !== "ALL") {
      chips.push({
        key: "hasPrice",
        label: filters.hasPrice === "WITH_PRICE" ? "دارای قیمت" : "رایگان/بدون قیمت",
      });
    }
    if (filters.hasFreeChapter !== "ALL") {
      chips.push({
        key: "hasFreeChapter",
        label: filters.hasFreeChapter === "YES" ? "دارای فصل رایگان" : "بدون فصل رایگان",
      });
    }
    if (filters.minPriceIrt.trim()) {
      chips.push({ key: "minPriceIrt", label: `حداقل قیمت: ${filters.minPriceIrt.trim()}` });
    }
    if (filters.maxPriceIrt.trim()) {
      chips.push({ key: "maxPriceIrt", label: `حداکثر قیمت: ${filters.maxPriceIrt.trim()}` });
    }
    if (filters.tagsAny.trim()) {
      chips.push({ key: "tagsAny", label: `برچسب: ${filters.tagsAny.trim()}` });
    }

    return chips;
  }, [filters]);

  const handleDeleteConfirm = (): void => {
    if (!deleteTarget) {
      return;
    }
    void deleteProduct({
      variables: {
        input: { id: deleteTarget.id },
      },
    });
  };

  const openMobileFilter = (): void => {
    mobileFilterOpenGuardUntilRef.current = performance.now() + 600;
    setIsMobileFilterOpen(true);
  };

  const toggleFilterSections = (): void => {
    setShowFilterSections((prev) => {
      const next = !prev;
      if (next) {
        mobileFilterOpenGuardUntilRef.current = performance.now() + 600;
      }
      return next;
    });
  };

  const shouldShowFilterPanelContent = !isMobile || isMobileFilterOpen || hasActiveFilters;

  return (
    <section className={styles.page}>
      {!isPublicProductView ? (
        <header className={styles.hero}>
          <div className={styles.heroHead}>
            <AppTooltip title="دوره جدید" arrow>
              <IconButton
                color="primary"
                onClick={openCreateProductDialog}
                className={styles.createProductIconButton}
                aria-label="دوره جدید"
              >
                <AddRoundedIcon />
              </IconButton>
            </AppTooltip>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={openCreateProductDialog}
              className={styles.createProductButton}
            >
              دوره جدید
            </Button>
          </div>
        </header>
      ) : null}

      {isEndUser ? (
        <EndUserProductFilterTabs
          activeTab={endUserTab}
          onChange={handleEndUserTabChange}
          hiddenTabs={isNativeAndroidShell() ? ["ALL", "PURCHASABLE"] : []}
        />
      ) : (
        <Paper
          className={`${styles.filterPanel}${
            isMobile && !shouldShowFilterPanelContent ? ` ${styles.filterPanelCollapsed}` : ""
          }`}
          {...(shouldShowFilterPanelContent ? { "data-opaque-shell": true } : {})}
          elevation={0}
        >
          {shouldShowFilterPanelContent ? (
            <div className={styles.searchSection}>
              <Box className={styles.searchRow}>
                <TextField
                  inputRef={searchInputRef}
                  className={`${styles.searchInput}${
                    searchQuery.trim() ? ` ${styles.searchInputHasValue}` : ""
                  }`}
                  size="small"
                  label="جستجو"
                  placeholder=""
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  InputProps={{
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <AppTooltip title="پاک کردن جستجو" arrow>
                          <IconButton
                            size="small"
                            edge="end"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={clearSearch}
                            aria-label="پاک کردن جستجو"
                          >
                            <ClearRoundedIcon fontSize="small" />
                          </IconButton>
                        </AppTooltip>
                      </InputAdornment>
                    ) : null,
                  }}
                />

                <div className={styles.searchActions}>
                  <AppTooltip title="پاک کردن فیلترها" arrow>
                    <span>
                      <IconButton
                        size="small"
                        color="default"
                        disabled={!hasActiveFilters}
                        onClick={clearAllFilters}
                        aria-label="پاک کردن فیلترها"
                      >
                        <FilterAltOffRoundedIcon />
                      </IconButton>
                    </span>
                  </AppTooltip>

                  <AppTooltip
                    title={
                      showFilterSections ? "بستن فیلترها و مرتب‌سازی" : "نمایش فیلترها و مرتب‌سازی"
                    }
                    arrow
                  >
                    <IconButton
                      size="small"
                      color={showFilterSections ? "primary" : "default"}
                      onClick={toggleFilterSections}
                      aria-label={
                        showFilterSections
                          ? "بستن فیلترها و مرتب‌سازی"
                          : "نمایش فیلترها و مرتب‌سازی"
                      }
                    >
                      <FilterListRoundedIcon />
                    </IconButton>
                  </AppTooltip>

                  <AppTooltip title="بروزرسانی" arrow>
                    <IconButton
                      size="small"
                      color="default"
                      onClick={onRefresh}
                      aria-label="بروزرسانی"
                    >
                      <RefreshRoundedIcon />
                    </IconButton>
                  </AppTooltip>
                </div>
              </Box>
            </div>
          ) : (
            <AppTooltip title="جستجو و فیلتر" arrow>
              <IconButton
                className={styles.mobileFilterTrigger}
                color="primary"
                onClick={openMobileFilter}
                aria-label="جستجو و فیلتر"
              >
                <SearchRoundedIcon />
              </IconButton>
            </AppTooltip>
          )}

          {!isEndUser && shouldShowFilterPanelContent && showFilterSections ? (
            <Divider className={styles.sectionDivider} />
          ) : null}

          {!isEndUser && shouldShowFilterPanelContent && showFilterSections ? (
            <div className={styles.filtersSection}>
              <Grid container spacing={1.25}>
                {!isPublicProductView ? (
                  <Grid item xs={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>وضعیت</InputLabel>
                      <Select
                        value={filters.isActive}
                        label="وضعیت"
                        onChange={(event) =>
                          setFilterValue(
                            "isActive",
                            event.target.value as ProductListFilters["isActive"]
                          )
                        }
                      >
                        <MenuItem value="ALL">همه</MenuItem>
                        <MenuItem value="ACTIVE">فعال</MenuItem>
                        <MenuItem value="INACTIVE">غیرفعال</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                ) : null}
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>انتشار</InputLabel>
                    <Select
                      value={filters.releaseType}
                      label="انتشار"
                      onChange={(event) =>
                        setFilterValue(
                          "releaseType",
                          event.target.value as ProductListFilters["releaseType"]
                        )
                      }
                    >
                      <MenuItem value="ALL">همه</MenuItem>
                      <MenuItem value="IMMEDIATE">فوری</MenuItem>
                      <MenuItem value="GRADUAL">تدریجی</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>نوع محتوا</InputLabel>
                    <Select
                      value={filters.itemType}
                      label="نوع محتوا"
                      onChange={(event) =>
                        setFilterValue(
                          "itemType",
                          event.target.value as ProductListFilters["itemType"]
                        )
                      }
                    >
                      <MenuItem value="ALL">همه</MenuItem>
                      <MenuItem value="ARTICLE">مقاله</MenuItem>
                      <MenuItem value="VIDEO">ویدیو</MenuItem>
                      <MenuItem value="VOICE">صوت</MenuItem>
                      <MenuItem value="IMAGE">تصویر</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>قیمت</InputLabel>
                    <Select
                      value={filters.hasPrice}
                      label="قیمت"
                      onChange={(event) =>
                        setFilterValue(
                          "hasPrice",
                          event.target.value as ProductListFilters["hasPrice"]
                        )
                      }
                    >
                      <MenuItem value="ALL">همه</MenuItem>
                      <MenuItem value="WITH_PRICE">دارای قیمت</MenuItem>
                      <MenuItem value="FREE_OR_UNSET">رایگان/بدون قیمت</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>فصل رایگان</InputLabel>
                    <Select
                      value={filters.hasFreeChapter}
                      label="فصل رایگان"
                      onChange={(event) =>
                        setFilterValue(
                          "hasFreeChapter",
                          event.target.value as ProductListFilters["hasFreeChapter"]
                        )
                      }
                    >
                      <MenuItem value="ALL">همه</MenuItem>
                      <MenuItem value="YES">دارد</MenuItem>
                      <MenuItem value="NO">ندارد</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="حداقل قیمت"
                    value={filters.minPriceIrt}
                    onChange={(event) => setFilterValue("minPriceIrt", event.target.value)}
                    inputProps={{ inputMode: "numeric" }}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="حداکثر قیمت"
                    value={filters.maxPriceIrt}
                    onChange={(event) => setFilterValue("maxPriceIrt", event.target.value)}
                    inputProps={{ inputMode: "numeric" }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="برچسب‌ها"
                    placeholder="مثال: react,typescript,ui"
                    value={filters.tagsAny}
                    onChange={(event) => setFilterValue("tagsAny", event.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <AppTooltip title="برای چند برچسب از , استفاده کنید." arrow>
                            <InfoOutlinedIcon className={styles.inputInfoIcon} fontSize="small" />
                          </AppTooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </div>
          ) : null}

          {!isEndUser && shouldShowFilterPanelContent && showFilterSections ? (
            <Divider className={styles.sectionDivider} />
          ) : null}

          {!isEndUser && shouldShowFilterPanelContent && showFilterSections ? (
            <div className={styles.sortSection}>
              <Grid container spacing={1.25}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>مرتب‌سازی</InputLabel>
                    <Select
                      value={sort.field}
                      label="مرتب‌سازی"
                      onChange={(event) =>
                        setSort((prev) => {
                          const nextField = event.target.value as ProductSortField;
                          return {
                            ...prev,
                            field: nextField,
                            order: nextField === "sortOrder" ? "DESC" : prev.order,
                          };
                        })
                      }
                    >
                      {(Object.keys(SORT_FIELD_LABEL) as ProductSortField[])
                        .filter((field) => !isPublicProductView || field !== "isActive")
                        .map((field) => (
                          <MenuItem key={field} value={field}>
                            {SORT_FIELD_LABEL[field]}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>ترتیب</InputLabel>
                    <Select
                      value={sort.order}
                      label="ترتیب"
                      onChange={(event) =>
                        setSort((prev) => ({
                          ...prev,
                          order: event.target.value as "ASC" | "DESC",
                        }))
                      }
                    >
                      <MenuItem value="ASC">{SORT_ORDER_LABEL.ASC}</MenuItem>
                      <MenuItem value="DESC">{SORT_ORDER_LABEL.DESC}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </div>
          ) : null}

          {!isEndUser && shouldShowFilterPanelContent && appliedFilterChips.length > 0 ? (
            <Stack direction="row" spacing={0.75} className={styles.appliedFilters} flexWrap="wrap">
              {appliedFilterChips.map((chip) => (
                <Chip
                  key={`product-filter-${chip.key}`}
                  label={chip.label}
                  onDelete={() => {
                    setFilters((prev) => ({
                      ...prev,
                      [chip.key]: DEFAULT_PRODUCT_LIST_FILTERS[chip.key],
                    }));
                  }}
                />
              ))}
            </Stack>
          ) : null}
        </Paper>
      )}

      {error && !getIsOfflineMode() && displayItems.length === 0 ? (
        <Alert severity="error" className={styles.errorAlert}>
          دریافت لیست دوره‌ها با خطا مواجه شد.
        </Alert>
      ) : null}

      <div
        ref={productFeedRef}
        className={styles.productFeed}
        style={isEndUser && productFeedMinHeight ? { minHeight: productFeedMinHeight } : undefined}
      >
        <div className={styles.productGrid}>
          {isInitialLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <Paper
                  key={`product-skeleton-${index}`}
                  className={styles.skeletonCard}
                  elevation={0}
                >
                  <Skeleton variant="rectangular" height={148} />
                  <div className={styles.skeletonBody}>
                    <Skeleton height={28} />
                    <Skeleton height={20} />
                    <Skeleton height={20} />
                    <Skeleton height={26} width="70%" />
                  </div>
                </Paper>
              ))
            : displayItems.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.productCardShell}${
                    canReorderProducts ? ` ${styles.productCardShellDraggable}` : ""
                  }${draggedProductId === item.id ? ` ${styles.productCardShellDragging}` : ""}`}
                  draggable={canReorderProducts}
                  onDragStart={(event) => handleProductDragStart(event, item.id)}
                  onDragOver={(event) => handleProductDragOver(event, item.id)}
                  onDrop={handleProductDrop}
                  onDragEnd={() => setDraggedProductId(null)}
                >
                  <ProductCard
                    item={item}
                    coverImageAccessUrl={item.coverImageAccessUrl}
                    variant={isPublicProductView ? "public" : "management"}
                    onOpen={() => navigate(`${APP_SHELL_ROUTES.products}/${item.id}`)}
                    onKeyDown={(event) => handleProductKeyDown(event, item)}
                    onEdit={openEditProductDialog}
                  />
                </div>
              ))}
        </div>

        {!isInitialLoading && displayItems.length === 0 ? (
          <div className={styles.emptyState}>
            <Typography variant="h6">دوره‌ای پیدا نشد.</Typography>
            <Typography variant="body2" color="text.secondary">
              {isEndUser
                ? "دوره‌ای در این دسته وجود ندارد. دسته دیگری را امتحان کنید."
                : "فیلترها را تغییر دهید یا پاک کنید تا نتایج بیشتری ببینید."}
            </Typography>
          </div>
        ) : null}

        {displayItems.length > 0 || (isEndUser && pagination.hasNextPage) ? (
          <div
            ref={loadMoreRef}
            className={styles.infiniteScrollSentinel}
            aria-hidden={!isFetchingMore}
          >
            {isFetchingMore && pagination.hasNextPage ? "در حال بارگذاری دوره‌های بیشتر..." : null}
          </div>
        ) : null}
      </div>

      <EntityDeleteDialog
        open={Boolean(deleteTarget)}
        entityTitle={deleteTarget?.title ?? "دوره"}
        onCancel={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        loading={deleteProductResult.loading}
        prominent
      >
        <ProductDeleteDependenciesPanel
          dependencies={deleteDependenciesData?.productDeleteDependencies ?? null}
          loading={deleteDependenciesLoading}
          error={Boolean(deleteDependenciesError)}
        />
      </EntityDeleteDialog>
      {!isPublicProductView ? (
        <ProductFormDialog
          open={isProductFormDialogOpen}
          productId={editTargetId}
          onClose={closeProductFormDialog}
          onSaved={onRefresh}
          onDelete={
            editTargetId != null ? () => openDeleteDialogForProductId(editTargetId) : undefined
          }
        />
      ) : null}
    </section>
  );
};

export default ProductsIndex;
