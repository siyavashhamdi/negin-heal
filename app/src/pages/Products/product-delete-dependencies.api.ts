export type ProductDeleteDependencyImpact = "RETAINED" | "REMOVED";

export type ProductDeleteDependencyBreakdownRow = {
  readonly key: string;
  readonly count: number;
};

export type ProductDeleteDependencySampleRow = {
  readonly id?: string | null;
  readonly label: string;
  readonly meta?: string | null;
};

export type ProductDeleteDependencyGroupRow = {
  readonly key: string;
  readonly impact: ProductDeleteDependencyImpact;
  readonly totalCount: number;
  readonly hiddenSampleCount: number;
  readonly breakdown: ProductDeleteDependencyBreakdownRow[];
  readonly samples: ProductDeleteDependencySampleRow[];
};

export type ProductDeleteDependenciesRow = {
  readonly productId: string;
  readonly productTitle: string;
  readonly summary: {
    readonly retainedCount: number;
    readonly removedCount: number;
    readonly hasRetainedDependencies: boolean;
    readonly hasRemovedDependencies: boolean;
  };
  readonly groups: ProductDeleteDependencyGroupRow[];
};

export type ProductDeleteDependenciesQuery = {
  productDeleteDependencies: ProductDeleteDependenciesRow;
};

export type ProductDeleteDependenciesQueryVariables = {
  input: {
    id: string;
  };
};

export const groupProductDeleteDependenciesByImpact = (
  groups: ProductDeleteDependencyGroupRow[]
): {
  retained: ProductDeleteDependencyGroupRow[];
  removed: ProductDeleteDependencyGroupRow[];
} => ({
  retained: groups.filter((group) => group.impact === "RETAINED"),
  removed: groups.filter((group) => group.impact === "REMOVED"),
});
