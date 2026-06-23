export type CourseDeleteDependencyImpact = "RETAINED" | "REMOVED";

export type CourseDeleteDependencyBreakdownRow = {
  readonly key: string;
  readonly count: number;
};

export type CourseDeleteDependencySampleRow = {
  readonly id?: string | null;
  readonly label: string;
  readonly meta?: string | null;
};

export type CourseDeleteDependencyGroupRow = {
  readonly key: string;
  readonly impact: CourseDeleteDependencyImpact;
  readonly totalCount: number;
  readonly hiddenSampleCount: number;
  readonly breakdown: CourseDeleteDependencyBreakdownRow[];
  readonly samples: CourseDeleteDependencySampleRow[];
};

export type CourseDeleteDependenciesRow = {
  readonly courseId: string;
  readonly courseTitle: string;
  readonly summary: {
    readonly retainedCount: number;
    readonly removedCount: number;
    readonly hasRetainedDependencies: boolean;
    readonly hasRemovedDependencies: boolean;
  };
  readonly groups: CourseDeleteDependencyGroupRow[];
};

export type CourseDeleteDependenciesQuery = {
  courseDeleteDependencies: CourseDeleteDependenciesRow;
};

export type CourseDeleteDependenciesQueryVariables = {
  input: {
    id: string;
  };
};

export const groupCourseDeleteDependenciesByImpact = (
  groups: CourseDeleteDependencyGroupRow[],
): {
  retained: CourseDeleteDependencyGroupRow[];
  removed: CourseDeleteDependencyGroupRow[];
} => ({
  retained: groups.filter((group) => group.impact === "RETAINED"),
  removed: groups.filter((group) => group.impact === "REMOVED"),
});
