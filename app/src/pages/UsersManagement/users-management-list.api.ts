import type { ManagedUserRecord, ManagedUsersListFilters } from "./users-management.types";
import { parseJalaliParamDate } from "../../utilities/jalali-date-param.util";
import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";

export type UserRole = "SUPER_ADMIN" | "END_USER";
export type UserStatus = "ACTIVE" | "DEACTIVE" | "SUSPENDED" | "BANNED";

export type UserListProfileSummary = {
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly email?: string | null;
  readonly phoneNumber?: string | null;
  readonly avatarAccessUrl?: FileAccessUrl | null;
  readonly bio?: string | null;
};

export type UserListItemRow = {
  readonly id: string;
  readonly username: string;
  readonly roles: readonly string[];
  readonly status: string;
  readonly profile?: UserListProfileSummary | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type UserDetailRow = {
  readonly id: string;
  readonly username: string;
  readonly roles: readonly string[];
  readonly status: string;
  readonly profile?: UserListProfileSummary | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type UserListQuery = {
  userList: {
    items: UserListItemRow[];
    pagination: {
      limit: number;
      skip: number;
      total: number;
      count: number;
    };
  };
};

export type UserListQueryVariables = {
  input: {
    filters?: {
      query?: string | null;
      id?: string | null;
      username?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      fullName?: string | null;
      email?: string | null;
      phoneNumber?: string | null;
      mobilePhone?: string | null;
      role?: UserRole | null;
      status?: UserStatus | null;
      createdAtFrom?: string | null;
      createdAtTo?: string | null;
      updatedAtFrom?: string | null;
      updatedAtTo?: string | null;
    };
    options: {
      limit: number;
      skip: number;
      sort?: {
        createdAt?: "ASC" | "DESC";
        updatedAt?: "ASC" | "DESC";
        username?: "ASC" | "DESC";
        firstName?: "ASC" | "DESC";
        lastName?: "ASC" | "DESC";
        email?: "ASC" | "DESC";
        phoneNumber?: "ASC" | "DESC";
        status?: "ASC" | "DESC";
      };
    };
  };
};

export type UserDetailQuery = {
  userDetail: UserDetailRow;
};

export type UserDetailQueryVariables = {
  input: {
    id: string;
  };
};

const EMPTY_DISPLAY = "-";

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function display(value: string | null | undefined): string {
  return value?.trim() || EMPTY_DISPLAY;
}

function enumToNull<TValue extends string>(value: TValue | "ALL"): TValue | null {
  return value === "ALL" ? null : value;
}

function dateFilterToIsoDate(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const jalaliDate = parseJalaliParamDate(trimmed);
  if (!jalaliDate) {
    return trimmed;
  }

  const gregorianDate = jalaliDate.toDate();
  const year = String(gregorianDate.getFullYear()).padStart(4, "0");
  const month = String(gregorianDate.getMonth() + 1).padStart(2, "0");
  const day = String(gregorianDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function joinName(first?: string | null, last?: string | null): string {
  const parts = [first?.trim(), last?.trim()].filter((p): p is string => Boolean(p));
  return parts.length > 0 ? parts.join(" ") : EMPTY_DISPLAY;
}

function mapUserProfileRowToRecord(
  row: Pick<
    UserListItemRow,
    "id" | "username" | "roles" | "status" | "profile" | "createdAt" | "updatedAt"
  >
): ManagedUserRecord {
  const firstName = display(row.profile?.firstName);
  const lastName = display(row.profile?.lastName);
  const phoneNumber = display(row.profile?.phoneNumber);

  return {
    id: String(row.id),
    username: display(row.username),
    firstName,
    lastName,
    fullName: joinName(row.profile?.firstName, row.profile?.lastName),
    email: display(row.profile?.email),
    phoneNumber,
    avatarAccessUrl: row.profile?.avatarAccessUrl ?? null,
    bio: display(row.profile?.bio),
    roles: row.roles ?? [],
    roleDesc: (row.roles ?? []).join(", ") || EMPTY_DISPLAY,
    status: row.status,
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

export function mapUserListItemRowToRecord(row: UserListItemRow): ManagedUserRecord {
  return mapUserProfileRowToRecord(row);
}

export function mapUserDetailRowToRecord(row: UserDetailRow): ManagedUserRecord {
  return mapUserProfileRowToRecord(row);
}

export function buildUserListQueryVariables(
  search: string,
  appliedFilters: ManagedUsersListFilters,
  page: number,
  pageSize: number
): UserListQueryVariables {
  return {
    input: {
      filters: {
        query: trimToNull(search) ?? trimToNull(appliedFilters.query),
        id: trimToNull(appliedFilters.id),
        username: trimToNull(appliedFilters.username),
        firstName: trimToNull(appliedFilters.firstName),
        lastName: trimToNull(appliedFilters.lastName),
        fullName: trimToNull(appliedFilters.fullName),
        email: trimToNull(appliedFilters.email),
        phoneNumber: trimToNull(appliedFilters.phoneNumber),
        mobilePhone: trimToNull(appliedFilters.phoneNumber),
        role: enumToNull(appliedFilters.role as UserRole | "ALL"),
        status: enumToNull(appliedFilters.status as UserStatus | "ALL"),
        createdAtFrom: dateFilterToIsoDate(appliedFilters.createdAtFrom),
        createdAtTo: dateFilterToIsoDate(appliedFilters.createdAtTo),
        updatedAtFrom: dateFilterToIsoDate(appliedFilters.updatedAtFrom),
        updatedAtTo: dateFilterToIsoDate(appliedFilters.updatedAtTo),
      },
      options: {
        limit: pageSize,
        skip: (page - 1) * pageSize,
        sort: { createdAt: "DESC" },
      },
    },
  };
}

/** @deprecated Use UserListItemRow instead. */
export type UserListRow = UserListItemRow;

/** @deprecated Use mapUserListItemRowToRecord instead. */
export const mapUserListRowToRecord = mapUserListItemRowToRecord;
