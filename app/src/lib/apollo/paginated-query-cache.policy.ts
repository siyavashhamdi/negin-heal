import type { TypePolicies } from "@apollo/client";

/** Serialize list `input` args so each page/filter combination gets its own cache entry. */
function paginatedInputKey(args: { input?: Record<string, unknown> } | null): string {
  return JSON.stringify(args?.input ?? {});
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
};
