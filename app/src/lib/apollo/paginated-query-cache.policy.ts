import type { TypePolicies } from "@apollo/client";

/** Strip nullish pagination cursors so first-page cache keys stay stable. */
function normalizePaginatedListInput(
  input: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!input) {
    return {};
  }

  const normalized: Record<string, unknown> = { ...input };

  if (normalized.filters && typeof normalized.filters === "object") {
    const filters = { ...(normalized.filters as Record<string, unknown>) };
    for (const [key, value] of Object.entries(filters)) {
      if (value == null) {
        delete filters[key];
      }
    }
    normalized.filters = filters;
  }

  if (normalized.options && typeof normalized.options === "object") {
    const options = { ...(normalized.options as Record<string, unknown>) };
    if (options.startCursor == null) {
      delete options.startCursor;
    }
    normalized.options = options;
  }

  return normalized;
}

/** Serialize list `input` args so each page/filter combination gets its own cache entry. */
function paginatedInputKey(args: { input?: Record<string, unknown> } | null): string {
  return JSON.stringify(normalizePaginatedListInput(args?.input));
}

/**
 * Apollo cache rules for GraphQL list queries backed by SQL *_Param + sp_* pagination.
 * Prevents merged/stale pages when variables change.
 */
export const paginatedQueryTypePolicies: TypePolicies = {
  Query: {
    fields: {
      isicGroups: {
        keyArgs: paginatedInputKey,
        merge(_existing, incoming) {
          return incoming;
        },
      },
      managedIsics: {
        keyArgs: paginatedInputKey,
        merge(_existing, incoming) {
          return incoming;
        },
      },
      supervisionCommissions: {
        keyArgs: paginatedInputKey,
        merge(_existing, incoming) {
          return incoming;
        },
      },
      rooms: {
        keyArgs: paginatedInputKey,
        merge(_existing, incoming) {
          return incoming;
        },
      },
      jobClasses: {
        keyArgs: paginatedInputKey,
        merge(_existing, incoming) {
          return incoming;
        },
      },
      userList: {
        keyArgs: paginatedInputKey,
        merge(_existing, incoming) {
          return incoming;
        },
      },
      managedUsers: {
        keyArgs: paginatedInputKey,
        merge(_existing, incoming) {
          return incoming;
        },
      },
      roleUsers: {
        keyArgs: ["roleId", "input"],
        merge(_existing, incoming) {
          return incoming;
        },
      },
      businessLicenses: {
        keyArgs: paginatedInputKey,
        merge(_existing, incoming) {
          return incoming;
        },
      },
      userProductReviewList: {
        keyArgs: paginatedInputKey,
        merge(_existing, incoming) {
          return incoming;
        },
      },
      productReviewList: {
        keyArgs: paginatedInputKey,
        merge(_existing, incoming) {
          return incoming;
        },
      },
      userProductDetail: {
        keyArgs: ["input"],
      },
      productList: {
        keyArgs: paginatedInputKey,
        merge(_existing, incoming) {
          return incoming;
        },
      },
      userProductList: {
        keyArgs: paginatedInputKey,
        merge(_existing, incoming) {
          return incoming;
        },
      },
    },
  },
  JobClassListPageGqlResponse: {
    fields: {
      items: {
        merge(_existing, incoming) {
          return incoming;
        },
      },
    },
  },
  IsicGroupsListPageGqlResponse: {
    fields: {
      items: {
        merge(_existing, incoming) {
          return incoming;
        },
      },
    },
  },
  IsicsManagementListPageGqlResponse: {
    fields: {
      items: {
        merge(_existing, incoming) {
          return incoming;
        },
      },
    },
  },
  SupervisionCommissionListPageGqlResponse: {
    fields: {
      items: {
        merge(_existing, incoming) {
          return incoming;
        },
      },
    },
  },
  RoomsListPageGqlResponse: {
    fields: {
      items: {
        merge(_existing, incoming) {
          return incoming;
        },
      },
    },
  },
  UserManagementListPageGqlResponse: {
    fields: {
      items: {
        merge(_existing, incoming) {
          return incoming;
        },
      },
    },
  },
  RoleUsersListPageGqlResponse: {
    fields: {
      items: {
        merge(_existing, incoming) {
          return incoming;
        },
      },
    },
  },
  BusinessLicenseListPageGqlResponse: {
    fields: {
      items: {
        merge(_existing, incoming) {
          return incoming;
        },
      },
    },
  },
  UserProductReviewListPaginatedCursorGqlResponse: {
    fields: {
      items: {
        merge(_existing, incoming) {
          return incoming;
        },
      },
    },
  },
  ProductReviewListPaginatedCursorGqlResponse: {
    fields: {
      items: {
        merge(_existing, incoming) {
          return incoming;
        },
      },
    },
  },
};
