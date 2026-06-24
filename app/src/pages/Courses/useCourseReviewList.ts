import { NetworkStatus } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { COURSE_REVIEW_LIST_QUERY } from "../../graphql/queries/courseReviewList.query";
import { USER_COURSE_REVIEW_LIST_QUERY } from "../../graphql/queries/userCourseReviewList.query";
import {
  buildAdminCourseReviewListVariables,
  buildEndUserCourseReviewListVariables,
  COURSE_REVIEW_LIST_PAGE_SIZE,
  type AdminCourseReviewRecord,
  type CourseReviewListMode,
  type CourseReviewListQuery,
  type CourseReviewListQueryVariables,
  type CourseReviewSummaryStats,
  type EndUserCourseReviewRecord,
  mapCourseReviewRatingSummaryToStats,
  type UserCourseReviewListQuery,
  type UserCourseReviewListQueryVariables,
} from "./course-reviews.api";

type CourseReviewListScrollRoot = "list" | "parent";

type ReviewListItem = EndUserCourseReviewRecord | AdminCourseReviewRecord;

type ReviewListPage = {
  readonly items: ReviewListItem[];
  readonly pagination: {
    readonly total: number;
    readonly hasNextPage: boolean;
    readonly endCursor?: string | null;
  };
  readonly summary?: CourseReviewSummaryStats | null;
};

type UseCourseReviewListOptions = {
  readonly courseId: string;
  readonly mode: CourseReviewListMode;
  readonly enabled: boolean;
  readonly starsFilter: number | null;
  readonly scrollRoot?: CourseReviewListScrollRoot;
};

export type CourseReviewListController = {
  readonly items: ReadonlyArray<EndUserCourseReviewRecord | AdminCourseReviewRecord>;
  readonly totalCount: number;
  readonly ratingSummary: CourseReviewSummaryStats;
  readonly loading: boolean;
  readonly isFetchingMore: boolean;
  readonly error: unknown;
  readonly refetch: () => Promise<void>;
  readonly hasNextPage: boolean;
  readonly loadMoreRef: RefObject<HTMLDivElement>;
  readonly scrollContainerRef: RefObject<HTMLDivElement>;
};

function findScrollableAncestor(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null;

  while (node) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return node;
    }

    node = node.parentElement;
  }

  return null;
}

function appendUniqueReviewItems(
  previousItems: ReadonlyArray<ReviewListItem>,
  incomingItems: ReadonlyArray<ReviewListItem>
): ReviewListItem[] {
  const existingIds = new Set(previousItems.map((item) => item.id));
  const newItems = incomingItems.filter((item) => !existingIds.has(item.id));

  if (newItems.length === 0) {
    return [...previousItems];
  }

  return [...previousItems, ...newItems];
}

export function useCourseReviewList({
  courseId,
  mode,
  enabled,
  starsFilter,
  scrollRoot = "list",
}: UseCourseReviewListOptions): CourseReviewListController {
  const isAdminMode = mode === "admin";

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fetchingMoreRef = useRef(false);
  const hasPaginatedRef = useRef(false);

  const [items, setItems] = useState<ReviewListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [ratingSummary, setRatingSummary] = useState<CourseReviewSummaryStats>(() =>
    mapCourseReviewRatingSummaryToStats(null)
  );

  const listVariables = useMemo(
    () =>
      isAdminMode
        ? buildAdminCourseReviewListVariables(
            courseId,
            starsFilter,
            null,
            COURSE_REVIEW_LIST_PAGE_SIZE
          )
        : buildEndUserCourseReviewListVariables(
            courseId,
            starsFilter,
            null,
            COURSE_REVIEW_LIST_PAGE_SIZE
          ),
    [courseId, isAdminMode, starsFilter]
  );

  const queryDocument = isAdminMode ? COURSE_REVIEW_LIST_QUERY : USER_COURSE_REVIEW_LIST_QUERY;

  const { data, loading, error, fetchMore, refetch, networkStatus } = useQuery<
    CourseReviewListQuery | UserCourseReviewListQuery,
    CourseReviewListQueryVariables | UserCourseReviewListQueryVariables
  >(queryDocument, {
    variables: listVariables,
    skip: !enabled || !courseId,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const queryField = isAdminMode ? "courseReviewList" : "userCourseReviewList";

  const page = useMemo((): ReviewListPage | undefined => {
    if (isAdminMode) {
      return (data as CourseReviewListQuery | undefined)?.courseReviewList;
    }

    return (data as UserCourseReviewListQuery | undefined)?.userCourseReviewList;
  }, [data, isAdminMode]);

  useEffect(() => {
    hasPaginatedRef.current = false;
    setItems([]);
    setTotalCount(0);
    setHasNextPage(false);
    setEndCursor(null);
    setRatingSummary(mapCourseReviewRatingSummaryToStats(null));
  }, [courseId, listVariables]);

  useEffect(() => {
    if (!page) {
      return;
    }

    if (
      networkStatus === NetworkStatus.loading ||
      networkStatus === NetworkStatus.setVariables ||
      networkStatus === NetworkStatus.fetchMore
    ) {
      return;
    }

    if (!hasPaginatedRef.current) {
      setItems(page.items);
      setTotalCount(page.pagination.total);
      setHasNextPage(page.pagination.hasNextPage);
      setEndCursor(page.pagination.endCursor ?? null);
      setRatingSummary(mapCourseReviewRatingSummaryToStats(page.summary));
    }
  }, [networkStatus, page]);

  const isFetchingMore = networkStatus === NetworkStatus.fetchMore;
  const isInitialLoading =
    enabled &&
    items.length === 0 &&
    (loading ||
      networkStatus === NetworkStatus.loading ||
      networkStatus === NetworkStatus.setVariables);

  const loadNextPage = useCallback(async (): Promise<void> => {
    const nextCursor = endCursor ?? items[items.length - 1]?.id ?? null;
    if (fetchingMoreRef.current || loading || isFetchingMore || !hasNextPage || !nextCursor) {
      return;
    }

    fetchingMoreRef.current = true;
    try {
      const result = await fetchMore({
        variables: {
          input: {
            ...listVariables.input,
            options: {
              ...listVariables.input.options,
              startCursor: nextCursor,
            },
          },
        },
        updateQuery: (previous, { fetchMoreResult }) => {
          const previousPage = previous[queryField as keyof typeof previous] as
            | ReviewListPage
            | undefined;
          const nextPage = fetchMoreResult?.[queryField as keyof typeof fetchMoreResult] as
            | ReviewListPage
            | undefined;

          if (!previousPage || !nextPage) {
            return previous;
          }

          return {
            ...previous,
            [queryField]: {
              ...previousPage,
              items: appendUniqueReviewItems(previousPage.items, nextPage.items),
              pagination: nextPage.pagination,
            },
          };
        },
      });

      const nextPage = result.data?.[queryField as keyof typeof result.data] as
        | ReviewListPage
        | undefined;

      if (!nextPage) {
        return;
      }

      hasPaginatedRef.current = true;
      setItems((previousItems) => appendUniqueReviewItems(previousItems, nextPage.items));
      setTotalCount(nextPage.pagination.total);
      setHasNextPage(nextPage.pagination.hasNextPage);
      setEndCursor(nextPage.pagination.endCursor ?? null);
    } finally {
      fetchingMoreRef.current = false;
    }
  }, [
    endCursor,
    fetchMore,
    hasNextPage,
    isFetchingMore,
    items,
    listVariables,
    loading,
    queryField,
  ]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage || isInitialLoading) {
      return undefined;
    }

    const observerRoot =
      scrollRoot === "parent" ? findScrollableAncestor(sentinel) : scrollContainerRef.current;

    if (!observerRoot && scrollRoot === "list") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !fetchingMoreRef.current) {
          void loadNextPage();
        }
      },
      {
        root: observerRoot,
        rootMargin: "120px 0px",
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isInitialLoading, items.length, loadNextPage, scrollRoot]);

  const refetchList = useCallback(async (): Promise<void> => {
    hasPaginatedRef.current = false;
    await refetch();
  }, [refetch]);

  return {
    items,
    totalCount,
    ratingSummary,
    loading: isInitialLoading,
    isFetchingMore,
    error,
    refetch: refetchList,
    hasNextPage,
    loadMoreRef,
    scrollContainerRef,
  };
}
