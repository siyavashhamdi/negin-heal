import { NetworkStatus } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

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
  type EndUserCourseReviewRecord,
  type UserCourseReviewListQuery,
  type UserCourseReviewListQueryVariables,
} from "./course-reviews.api";

type CourseReviewListScrollRoot = "list" | "parent";

type UseCourseReviewListOptions = {
  readonly courseId: string;
  readonly mode: CourseReviewListMode;
  readonly enabled: boolean;
  readonly starsFilter: number | null;
  readonly scrollRoot?: CourseReviewListScrollRoot;
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

type UseCourseReviewListResult<TItem> = {
  readonly items: TItem[];
  readonly totalCount: number;
  readonly loading: boolean;
  readonly isFetchingMore: boolean;
  readonly error: unknown;
  readonly refetch: () => void;
  readonly hasNextPage: boolean;
  readonly loadMoreRef: RefObject<HTMLDivElement>;
  readonly scrollContainerRef: RefObject<HTMLDivElement>;
};

export function useCourseReviewList(
  options: UseCourseReviewListOptions & { readonly mode: "endUser" },
): UseCourseReviewListResult<EndUserCourseReviewRecord>;

export function useCourseReviewList(
  options: UseCourseReviewListOptions & { readonly mode: "admin" },
): UseCourseReviewListResult<AdminCourseReviewRecord>;

export function useCourseReviewList({
  courseId,
  mode,
  enabled,
  starsFilter,
  scrollRoot = "list",
}: UseCourseReviewListOptions):
  | UseCourseReviewListResult<EndUserCourseReviewRecord>
  | UseCourseReviewListResult<AdminCourseReviewRecord> {
  const isAdminMode = mode === "admin";

  const [items, setItems] = useState<
    EndUserCourseReviewRecord[] | AdminCourseReviewRecord[]
  >([]);
  const [pagination, setPagination] = useState({
    total: 0,
    hasNextPage: false,
    endCursor: null as string | null,
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fetchingMoreRef = useRef(false);

  const listVariables = useMemo(
    () =>
      isAdminMode
        ? buildAdminCourseReviewListVariables(
            courseId,
            starsFilter,
            null,
            COURSE_REVIEW_LIST_PAGE_SIZE,
          )
        : buildEndUserCourseReviewListVariables(
            courseId,
            starsFilter,
            null,
            COURSE_REVIEW_LIST_PAGE_SIZE,
          ),
    [courseId, isAdminMode, starsFilter],
  );

  useEffect(() => {
    setItems([]);
    setPagination({
      total: 0,
      hasNextPage: false,
      endCursor: null,
    });
  }, [courseId, mode, starsFilter]);

  const { data, loading, error, fetchMore, refetch, networkStatus } = useQuery<
    CourseReviewListQuery | UserCourseReviewListQuery,
    CourseReviewListQueryVariables | UserCourseReviewListQueryVariables
  >(isAdminMode ? COURSE_REVIEW_LIST_QUERY : USER_COURSE_REVIEW_LIST_QUERY, {
    variables: listVariables,
    skip: !enabled || !courseId,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  const isFetchingMore = networkStatus === NetworkStatus.fetchMore;
  const isInitialLoading =
    (loading || networkStatus === NetworkStatus.loading) && items.length === 0;

  useEffect(() => {
    const page = isAdminMode
      ? (data as CourseReviewListQuery | undefined)?.courseReviewList
      : (data as UserCourseReviewListQuery | undefined)?.userCourseReviewList;

    if (!page) {
      return;
    }

    if (
      networkStatus === NetworkStatus.loading ||
      networkStatus === NetworkStatus.setVariables
    ) {
      return;
    }

    setItems(page.items);
    setPagination({
      total: page.pagination.total,
      hasNextPage: page.pagination.hasNextPage,
      endCursor: page.pagination.endCursor ?? null,
    });
  }, [data, isAdminMode, networkStatus]);

  const queryField = isAdminMode ? "courseReviewList" : "userCourseReviewList";

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
            ...listVariables.input,
            options: {
              ...listVariables.input.options,
              startCursor: nextCursor,
            },
          },
        },
        updateQuery: (previous, { fetchMoreResult }) => {
          const previousPage = previous[queryField as keyof typeof previous] as
            | UserCourseReviewListQuery["userCourseReviewList"]
            | CourseReviewListQuery["courseReviewList"]
            | undefined;
          const nextPage = fetchMoreResult?.[queryField as keyof typeof fetchMoreResult] as
            | UserCourseReviewListQuery["userCourseReviewList"]
            | CourseReviewListQuery["courseReviewList"]
            | undefined;

          if (!previousPage || !nextPage) {
            return previous;
          }

          const existingIds = new Set(previousPage.items.map((item) => item.id));
          const newItems = nextPage.items.filter((item) => !existingIds.has(item.id));

          return {
            [queryField]: {
              items: [...previousPage.items, ...newItems],
              pagination: nextPage.pagination,
            },
          };
        },
      });
    } finally {
      fetchingMoreRef.current = false;
    }
  }, [
    fetchMore,
    isFetchingMore,
    items,
    listVariables,
    loading,
    pagination.endCursor,
    pagination.hasNextPage,
    queryField,
  ]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !pagination.hasNextPage) {
      return undefined;
    }

    const observerRoot =
      scrollRoot === "parent"
        ? findScrollableAncestor(sentinel)
        : scrollContainerRef.current;

    if (!observerRoot && scrollRoot === "list") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void loadNextPage();
        }
      },
      {
        root: observerRoot,
        rootMargin: "120px 0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [items.length, loadNextPage, pagination.hasNextPage, scrollRoot]);

  const refetchList = useCallback((): void => {
    void refetch({ fetchPolicy: "network-only" });
  }, [refetch]);

  return {
    items,
    totalCount: pagination.total,
    loading: isInitialLoading,
    isFetchingMore,
    error,
    refetch: refetchList,
    hasNextPage: pagination.hasNextPage,
    loadMoreRef,
    scrollContainerRef,
  };
}
