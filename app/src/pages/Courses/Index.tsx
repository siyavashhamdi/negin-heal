import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { NetworkStatus } from "@apollo/client";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useDebounce } from "../../hooks/useDebounce";
import { useBadgeCountFirstPageReload } from "../../hooks/useBadgeCountFirstPageReload";
import { useAuth } from "../../contexts/AuthContext";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import { COURSE_LIST_QUERY } from "../../graphql/queries/courseList.query";
import { USER_COURSE_LIST_QUERY } from "../../graphql/queries/userCourseList.query";
import { COURSE_DELETE_MUTATION } from "../../graphql/mutations/courseDelete.mutation";
import { FILE_DETAIL_QUERY } from "../../graphql/queries/fileDetail.query";
import CourseCard from "./CourseCard";
import CourseFormDialog from "./CourseFormDialog";
import {
  buildCourseListQueryVariables,
  DEFAULT_COURSE_LIST_FILTERS,
  DEFAULT_COURSE_LIST_SORT,
  mapCourseListRowToRecord,
  type CourseItemType,
  type CourseListFilters,
  type CourseListQuery,
  type CourseListQueryVariables,
  type CourseListRecord,
  type CourseListSort,
  type CourseSortField,
} from "./courses-list.api";
import styles from "./styles/courses.module.scss";

const COURSE_LIST_PAGE_SIZE = 6;

type CourseDeleteMutationResult = {
  courseDelete: boolean;
};

type CourseDeleteMutationVariables = {
  input: {
    id: string;
  };
};

type FileDetailQueryResult = {
  fileDetail?: {
    id: string;
    accessUrl?: string | null;
  } | null;
};

type FileDetailQueryVariables = {
  input: {
    id: string;
  };
};

type CourseFilterChip = {
  key: keyof CourseListFilters;
  label: string;
};

const SORT_FIELD_LABEL: Record<CourseSortField, string> = {
  sortOrder: "چینش",
  createdAt: "جدیدترین ایجاد",
  updatedAt: "آخرین بروزرسانی",
  title: "عنوان",
  priceIrt: "قیمت",
  isActive: "وضعیت",
};

const ITEM_TYPE_LABEL: Record<CourseItemType, string> = {
  ARTICLE: "مقاله",
  VIDEO: "ویدیو",
  VOICE: "صوت",
  IMAGE: "تصویر",
};

const SORT_ORDER_LABEL: Record<"ASC" | "DESC", string> = {
  ASC: "صعودی",
  DESC: "نزولی",
};

const CoursesIndex = (): ReactElement => {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const apolloClient = useApolloClient();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isEndUser = authUser?.roles?.includes("END_USER") === true;
  const isPublicCourseView = !authUser || isEndUser;

  const [flippedItemId, setFlippedItemId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CourseListFilters>(DEFAULT_COURSE_LIST_FILTERS);
  const [searchQuery, setSearchQuery] = useState(DEFAULT_COURSE_LIST_FILTERS.query);
  const [sort, setSort] = useState<CourseListSort>(DEFAULT_COURSE_LIST_SORT);
  const [coverImageByFileId, setCoverImageByFileId] = useState<Record<string, string>>({});
  const loadingCoverImageIdsRef = useRef<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<CourseListRecord | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CourseListRecord | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showFilterSections, setShowFilterSections] = useState(false);
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const fetchingMoreRef = useRef(false);
  const lastMobileScrollYRef = useRef(0);
  const mobileFilterOpenGuardUntilRef = useRef(0);
  const [items, setItems] = useState<CourseListRecord[]>([]);
  const [isOnFirstPage, setIsOnFirstPage] = useState(true);
  const [pagination, setPagination] = useState({
    totalFiltered: 0,
    hasNextPage: false,
    endCursor: null as string | null,
  });
  const debouncedSearchQuery = useDebounce(searchQuery, 450);

  const setFilterValue = <K extends keyof CourseListFilters>(
    key: K,
    value: CourseListFilters[K],
  ): void => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFlippedItem = (itemId: string): void => {
    setFlippedItemId((current) => (current === itemId ? null : itemId));
  };

  const clearSearch = (): void => {
    setSearchQuery(DEFAULT_COURSE_LIST_FILTERS.query);
    setFilterValue("query", DEFAULT_COURSE_LIST_FILTERS.query);
  };

  const clearAllFilters = (): void => {
    setSearchQuery(DEFAULT_COURSE_LIST_FILTERS.query);
    setFilters(DEFAULT_COURSE_LIST_FILTERS);
  };

  useEffect(() => {
    setFilters((prev) =>
      prev.query === debouncedSearchQuery ? prev : { ...prev, query: debouncedSearchQuery },
    );
  }, [debouncedSearchQuery]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== "" ||
      filters.query.trim() !== "" ||
      filters.isActive !== DEFAULT_COURSE_LIST_FILTERS.isActive ||
      filters.releaseType !== DEFAULT_COURSE_LIST_FILTERS.releaseType ||
      filters.itemType !== DEFAULT_COURSE_LIST_FILTERS.itemType ||
      filters.hasPrice !== DEFAULT_COURSE_LIST_FILTERS.hasPrice ||
      filters.hasFreeChapter !== DEFAULT_COURSE_LIST_FILTERS.hasFreeChapter ||
      filters.minPriceIrt.trim() !== "" ||
      filters.maxPriceIrt.trim() !== "" ||
      filters.tagsAny.trim() !== ""
    );
  }, [filters, searchQuery]);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileFilterOpen(false);
      return undefined;
    }

    lastMobileScrollYRef.current = window.scrollY;

    const handleScroll = (): void => {
      const scrollY = window.scrollY;
      const didScroll = Math.abs(scrollY - lastMobileScrollYRef.current) > 1;
      lastMobileScrollYRef.current = scrollY;
      const isOpeningMobileFilter = performance.now() < mobileFilterOpenGuardUntilRef.current;

      if (didScroll && !isOpeningMobileFilter) {
        setShowFilterSections(false);
        setIsMobileFilterOpen(hasActiveFilters);
      }
      if (didScroll && !isOpeningMobileFilter && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasActiveFilters, isMobile]);

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

  const courseListVariables = useMemo(
    () => buildCourseListQueryVariables(filters, sort, COURSE_LIST_PAGE_SIZE, null),
    [filters, sort],
  );

  const {
    data: courseListData,
    loading,
    error,
    fetchMore,
    refetch: refetchCourseList,
    networkStatus,
  } = useQuery<CourseListQuery, CourseListQueryVariables>(
    isPublicCourseView ? USER_COURSE_LIST_QUERY : COURSE_LIST_QUERY,
    {
      variables: courseListVariables,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    },
  );

  const isFetchingMore = networkStatus === NetworkStatus.fetchMore;
  const isInitialLoading =
    (loading || networkStatus === NetworkStatus.loading) && items.length === 0;

  useEffect(() => {
    const page = courseListData?.courseList;
    if (!page) {
      return;
    }

    if (networkStatus === NetworkStatus.loading || networkStatus === NetworkStatus.setVariables) {
      return;
    }

    setItems(page.items.map(mapCourseListRowToRecord));
    setPagination({
      totalFiltered: page.pagination.total,
      hasNextPage: page.pagination.hasNextPage,
      endCursor: page.pagination.endCursor ?? null,
    });
  }, [courseListData, networkStatus]);

  const onRefresh = useCallback((): void => {
    void refetchCourseList();
  }, [refetchCourseList]);

  useBadgeCountFirstPageReload({
    enabled: Boolean(authUser),
    isOnFirstPage,
    reload: onRefresh,
  });

  const loadNextPage = useCallback(async (): Promise<void> => {
    const nextCursor = pagination.endCursor ?? items[items.length - 1]?.id ?? null;
    if (
      fetchingMoreRef.current ||
      loading ||
      isFetchingMore ||
      !pagination.hasNextPage ||
      !nextCursor
    ) {
      return;
    }

    fetchingMoreRef.current = true;
    try {
      await fetchMore({
        variables: {
          input: {
            ...courseListVariables.input,
            options: {
              ...courseListVariables.input.options,
              startCursor: nextCursor,
            },
          },
        },
        updateQuery: (previous, { fetchMoreResult }) => {
          if (!fetchMoreResult?.courseList) {
            return previous;
          }

          const existingIds = new Set(previous.courseList.items.map((item) => item.id));
          const newItems = fetchMoreResult.courseList.items.filter(
            (item) => !existingIds.has(item.id),
          );

          return {
            courseList: {
              items: [...previous.courseList.items, ...newItems],
              pagination: fetchMoreResult.courseList.pagination,
            },
          };
        },
      });
      setIsOnFirstPage(false);
    } finally {
      fetchingMoreRef.current = false;
    }
  }, [
    courseListVariables,
    fetchMore,
    isFetchingMore,
    items,
    loading,
    pagination.endCursor,
    pagination.hasNextPage,
  ]);

  const [deleteCourse, deleteCourseResult] = useMutationWithSnackbar<
    CourseDeleteMutationResult,
    CourseDeleteMutationVariables
  >(COURSE_DELETE_MUTATION, {
    successMessage: "دوره با موفقیت حذف شد.",
    errorMessage: "حذف دوره انجام نشد.",
    onSuccess: () => {
      setDeleteTarget(null);
      onRefresh();
    },
  });

  const canReorderCourses =
    !isPublicCourseView && sort.field === "sortOrder" && sort.order === "ASC";

  const calculateSortOrderBetween = (
    previousItem: CourseListRecord | undefined,
    nextItem: CourseListRecord | undefined,
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

  const handleCourseDragStart = (event: DragEvent<HTMLDivElement>, courseId: string): void => {
    if (!canReorderCourses) {
      event.preventDefault();
      return;
    }
    setDraggedCourseId(courseId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", courseId);
  };

  const handleCourseDragOver = (
    event: DragEvent<HTMLDivElement>,
    targetCourseId: string,
  ): void => {
    if (!canReorderCourses || !draggedCourseId) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (draggedCourseId === targetCourseId) {
      return;
    }

    const targetRect = event.currentTarget.getBoundingClientRect();
    const shouldInsertAfter = event.clientY > targetRect.top + targetRect.height / 2;

    setItems((currentItems) => {
      const draggedIndex = currentItems.findIndex((item) => item.id === draggedCourseId);
      const targetIndex = currentItems.findIndex((item) => item.id === targetCourseId);
      if (draggedIndex < 0 || targetIndex < 0) {
        return currentItems;
      }

      const draggedItem = currentItems[draggedIndex];
      if (!draggedItem) {
        return currentItems;
      }

      const withoutDragged = currentItems.filter((item) => item.id !== draggedCourseId);
      const adjustedTargetIndex = withoutDragged.findIndex((item) => item.id === targetCourseId);
      const insertionIndex = adjustedTargetIndex + (shouldInsertAfter ? 1 : 0);
      if (currentItems[insertionIndex]?.id === draggedCourseId) {
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

  const handleCourseDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDraggedCourseId(null);
  };

  const handleCourseKeyDown = (event: KeyboardEvent<HTMLElement>, itemId: string): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isPublicCourseView) {
        navigate(`/courses/${itemId}`);
      } else {
        toggleFlippedItem(itemId);
      }
    }
  };

  const appliedFilterChips = useMemo(() => {
    const chips: CourseFilterChip[] = [];

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

  useEffect(() => {
    const coverIdsToLoad = Array.from(
      new Set(
        items
          .map((item) => item.coverImageFileId)
          .filter((id): id is string => Boolean(id))
          .filter((id) => !(id in coverImageByFileId))
          .filter((id) => !loadingCoverImageIdsRef.current.has(id)),
      ),
    );

    if (coverIdsToLoad.length === 0) {
      return;
    }

    coverIdsToLoad.forEach((id) => loadingCoverImageIdsRef.current.add(id));

    void Promise.all(
      coverIdsToLoad.map(async (fileId) => {
        try {
          const result = await apolloClient.query<FileDetailQueryResult, FileDetailQueryVariables>({
            query: FILE_DETAIL_QUERY,
            variables: { input: { id: fileId } },
            fetchPolicy: "network-only",
          });
          const accessUrl = result.data?.fileDetail?.accessUrl?.trim();
          if (accessUrl) {
            setCoverImageByFileId((prev) => ({ ...prev, [fileId]: accessUrl }));
          }
        } catch {
          // Silently keep fallback icon on cover load failures.
        } finally {
          loadingCoverImageIdsRef.current.delete(fileId);
        }
      }),
    );
  }, [apolloClient, coverImageByFileId, items]);

  useEffect(() => {
    if (!flippedItemId) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(`[data-card-id="${flippedItemId}"]`)) {
        setFlippedItemId(null);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        setFlippedItemId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [flippedItemId]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !pagination.hasNextPage) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void loadNextPage();
        }
      },
      { rootMargin: "480px 0px" },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [items.length, loadNextPage, pagination.hasNextPage]);

  const handleDeleteConfirm = (): void => {
    if (!deleteTarget) {
      return;
    }
    void deleteCourse({
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
      <header className={styles.hero}>
        <div className={styles.heroHead}>
          <h2>
            {t("pages.courses.heroTitle")}
          </h2>
          {!isPublicCourseView ? (
            <>
              <Tooltip title="دوره جدید" arrow>
                <IconButton
                  color="primary"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className={styles.createCourseIconButton}
                  aria-label="دوره جدید"
                >
                  <AddRoundedIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => setIsCreateDialogOpen(true)}
                className={styles.createCourseButton}
              >
                دوره جدید
              </Button>
            </>
          ) : null}
        </div>
        <p>{t("pages.courses.heroDescription")}</p>
      </header>

      <Paper
        className={`${styles.filterPanel}${
          shouldShowFilterPanelContent ? "" : ` ${styles.filterPanelCollapsed}`
        }`}
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
                      <Tooltip title="پاک کردن جستجو" arrow>
                        <IconButton
                          size="small"
                          edge="end"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={clearSearch}
                          aria-label="پاک کردن جستجو"
                        >
                          <ClearRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ) : null,
                }}
              />

              <div className={styles.searchActions}>
                <Tooltip title="پاک کردن فیلترها" arrow>
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
                </Tooltip>

                <Tooltip
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
                      showFilterSections ? "بستن فیلترها و مرتب‌سازی" : "نمایش فیلترها و مرتب‌سازی"
                    }
                  >
                    <FilterListRoundedIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="بروزرسانی" arrow>
                  <IconButton size="small" color="default" onClick={onRefresh} aria-label="بروزرسانی">
                    <RefreshRoundedIcon />
                  </IconButton>
                </Tooltip>
              </div>
            </Box>
          </div>
        ) : (
          <Tooltip title="جستجو و فیلتر" arrow>
            <IconButton
              className={styles.mobileFilterTrigger}
              color="primary"
              onClick={openMobileFilter}
              aria-label="جستجو و فیلتر"
            >
              <ManageSearchRoundedIcon />
            </IconButton>
          </Tooltip>
        )}

        {shouldShowFilterPanelContent && showFilterSections ? (
          <Divider className={styles.sectionDivider} />
        ) : null}

        {shouldShowFilterPanelContent && showFilterSections ? (
          <div className={styles.filtersSection}>
            <Grid container spacing={1.25}>
              {!isPublicCourseView ? (
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>وضعیت</InputLabel>
                    <Select
                      value={filters.isActive}
                      label="وضعیت"
                      onChange={(event) =>
                        setFilterValue("isActive", event.target.value as CourseListFilters["isActive"])
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
                        event.target.value as CourseListFilters["releaseType"],
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
                      setFilterValue("itemType", event.target.value as CourseListFilters["itemType"])
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
                      setFilterValue("hasPrice", event.target.value as CourseListFilters["hasPrice"])
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
                        event.target.value as CourseListFilters["hasFreeChapter"],
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
                        <Tooltip title="برای چند برچسب از , استفاده کنید." arrow>
                          <InfoOutlinedIcon className={styles.inputInfoIcon} fontSize="small" />
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </div>
        ) : null}

        {shouldShowFilterPanelContent && showFilterSections ? (
          <Divider className={styles.sectionDivider} />
        ) : null}

        {shouldShowFilterPanelContent && showFilterSections ? (
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
                        const nextField = event.target.value as CourseSortField;
                        return {
                          ...prev,
                          field: nextField,
                          order: nextField === "sortOrder" ? "DESC" : prev.order,
                        };
                      })
                    }
                  >
                    {(Object.keys(SORT_FIELD_LABEL) as CourseSortField[])
                      .filter((field) => !isPublicCourseView || field !== "isActive")
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

        {shouldShowFilterPanelContent && appliedFilterChips.length > 0 ? (
          <Stack direction="row" spacing={0.75} className={styles.appliedFilters} flexWrap="wrap">
            {appliedFilterChips.map((chip) => (
              <Chip
                key={`course-filter-${chip.key}`}
                label={chip.label}
                onDelete={() => {
                  setFilters((prev) => ({
                    ...prev,
                    [chip.key]: DEFAULT_COURSE_LIST_FILTERS[chip.key],
                  }));
                }}
              />
            ))}
          </Stack>
        ) : null}
      </Paper>

      {error ? (
        <Alert severity="error" className={styles.errorAlert}>
          دریافت لیست دوره‌ها با خطا مواجه شد.
        </Alert>
      ) : null}

      <div className={styles.courseGrid}>
        {isInitialLoading
          ? Array.from({ length: 8 }).map((_, index) => (
            <Paper key={`course-skeleton-${index}`} className={styles.skeletonCard} elevation={0}>
              <Skeleton variant="rectangular" height={148} />
              <div className={styles.skeletonBody}>
                <Skeleton height={28} />
                <Skeleton height={20} />
                <Skeleton height={20} />
                <Skeleton height={26} width="70%" />
              </div>
            </Paper>
          ))
          : items.map((item) => (
            <div
              key={item.id}
              className={`${styles.courseCardShell}${
                canReorderCourses ? ` ${styles.courseCardShellDraggable}` : ""
              }${draggedCourseId === item.id ? ` ${styles.courseCardShellDragging}` : ""}`}
              draggable={canReorderCourses}
              onDragStart={(event) => handleCourseDragStart(event, item.id)}
              onDragOver={(event) => handleCourseDragOver(event, item.id)}
              onDrop={handleCourseDrop}
              onDragEnd={() => setDraggedCourseId(null)}
            >
              <CourseCard
                item={item}
                coverImageUrl={
                  item.coverImageFileId ? coverImageByFileId[item.coverImageFileId] : undefined
                }
                variant={isPublicCourseView ? "public" : "management"}
                isFlipped={!isPublicCourseView && flippedItemId === item.id}
                onOpen={() => navigate(`/courses/${item.id}`)}
                onFlip={() => toggleFlippedItem(item.id)}
                onKeyDown={(event) => handleCourseKeyDown(event, item.id)}
                onEdit={(course) => setEditTarget(course)}
                onDelete={(course) => setDeleteTarget(course)}
              />
            </div>
          ))}
      </div>

      {!isInitialLoading && items.length === 0 ? (
        <div className={styles.emptyState}>
          <Typography variant="h6">دوره‌ای پیدا نشد.</Typography>
          <Typography variant="body2" color="text.secondary">
            فیلترها را تغییر دهید یا پاک کنید تا نتایج بیشتری ببینید.
          </Typography>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div
          ref={loadMoreRef}
          className={styles.infiniteScrollSentinel}
          aria-hidden={!isFetchingMore}
        >
          {isFetchingMore && pagination.hasNextPage ? "در حال بارگذاری دوره‌های بیشتر..." : null}
        </div>
      ) : null}

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => (deleteCourseResult.loading ? undefined : setDeleteTarget(null))}
        fullScreen={isMobile}
        fullWidth
        maxWidth="xs"
        PaperProps={{ className: styles.deleteDialogPaper }}
      >
        <DialogTitle className={styles.deleteDialogTitle}>
          <span className={styles.deleteDialogIcon}>
            <WarningAmberRoundedIcon />
          </span>
          حذف دوره
        </DialogTitle>
        <DialogContent className={styles.deleteDialogContent}>
          <Typography variant="body1" className={styles.deleteDialogMessage}>
            آیا از حذف این دوره مطمئن هستید؟
          </Typography>
          <Typography variant="subtitle1" className={styles.deleteDialogCourseTitle}>
            {deleteTarget?.title}
          </Typography>
          <Typography variant="body2" className={styles.deleteDialogHint}>
            فایل‌های جداشده این دوره نیز حذف می‌شوند و این عملیات قابل بازگشت نیست.
          </Typography>
        </DialogContent>
        <DialogActions className={styles.deleteDialogActions}>
          <Button
            className={styles.deleteDialogActionButton}
            variant="outlined"
            onClick={() => setDeleteTarget(null)}
            disabled={deleteCourseResult.loading}
          >
            انصراف
          </Button>
          <Button
            className={styles.deleteDialogActionButton}
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleteCourseResult.loading}
          >
            حذف دوره
          </Button>
        </DialogActions>
      </Dialog>
      {!isPublicCourseView ? (
        <CourseFormDialog
          open={isCreateDialogOpen || editTarget != null}
          course={editTarget}
          onClose={() => {
            setIsCreateDialogOpen(false);
            setEditTarget(null);
          }}
          onSaved={onRefresh}
        />
      ) : null}
    </section>
  );
};

export default CoursesIndex;
