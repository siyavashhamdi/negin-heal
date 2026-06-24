import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "../../contexts/AuthContext";
import { COURSE_LIST_QUERY } from "../../graphql/queries/courseList.query";
import { USER_COURSE_LIST_QUERY } from "../../graphql/queries/userCourseList.query";
import {
  buildCourseListQueryVariables,
  DEFAULT_COURSE_LIST_FILTERS,
  DEFAULT_COURSE_LIST_SORT,
  mapCourseListRowToRecord,
  type CourseListQuery,
  type CourseListQueryVariables,
  type CourseListRecord,
} from "../Courses/courses-list.api";

const FEATURED_COURSE_COUNT = 3;

type UseLandingFeaturedCoursesResult = {
  readonly courses: CourseListRecord[];
  readonly loading: boolean;
};

/**
 * Picks the course list query that matches the viewer role so the landing page
 * never triggers forbidden errors for logged-in admins.
 */
export function useLandingFeaturedCourses(): UseLandingFeaturedCoursesResult {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();

  const isEndUser = user?.roles?.includes("END_USER") === true;
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN") === true;
  const usePublicList = !isAuthenticated || isEndUser;
  const canFetchCourses = !isAuthLoading && (usePublicList || (isAuthenticated && isSuperAdmin));

  const variables = useMemo(
    () =>
      buildCourseListQueryVariables(
        { ...DEFAULT_COURSE_LIST_FILTERS, isActive: "ACTIVE" },
        DEFAULT_COURSE_LIST_SORT,
        FEATURED_COURSE_COUNT
      ),
    []
  );

  const { data, loading } = useQuery<CourseListQuery, CourseListQueryVariables>(
    usePublicList ? USER_COURSE_LIST_QUERY : COURSE_LIST_QUERY,
    {
      variables,
      fetchPolicy: "cache-first",
      skip: !canFetchCourses,
      errorPolicy: "ignore",
    }
  );

  return {
    courses: data?.courseList.items.map(mapCourseListRowToRecord) ?? [],
    loading: isAuthLoading || (canFetchCourses && loading),
  };
}
