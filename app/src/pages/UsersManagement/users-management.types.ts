import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";

export interface ManagedUserRecord {
  readonly id: string;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly avatarAccessUrl: FileAccessUrl | null;
  readonly bio: string;
  readonly roles: readonly string[];
  readonly roleDesc: string;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ManagedUsersListFilters {
  query: string;
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  createdAtFrom: string;
  createdAtTo: string;
  updatedAtFrom: string;
  updatedAtTo: string;
}

export const EMPTY_MANAGED_USERS_LIST_FILTERS: ManagedUsersListFilters = {
  query: "",
  id: "",
  username: "",
  firstName: "",
  lastName: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  role: "ALL",
  status: "ALL",
  createdAtFrom: "",
  createdAtTo: "",
  updatedAtFrom: "",
  updatedAtTo: "",
};

export function hasManagedUsersColumnFiltersApplied(filters: ManagedUsersListFilters): boolean {
  return (
    filters.id.trim() !== "" ||
    filters.username.trim() !== "" ||
    filters.firstName.trim() !== "" ||
    filters.lastName.trim() !== "" ||
    filters.fullName.trim() !== "" ||
    filters.email.trim() !== "" ||
    filters.phoneNumber.trim() !== "" ||
    filters.role !== "ALL" ||
    filters.status !== "ALL" ||
    filters.createdAtFrom.trim() !== "" ||
    filters.createdAtTo.trim() !== "" ||
    filters.updatedAtFrom.trim() !== "" ||
    filters.updatedAtTo.trim() !== ""
  );
}

export function hasManagedUsersSupplementaryFiltersApplied(
  _filters: ManagedUsersListFilters
): boolean {
  return false;
}
