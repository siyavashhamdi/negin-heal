import { type UserListItemRow } from "../../pages/UsersManagement/users-management-list.api";
import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";

export type ActiveEndUserOption = {
  readonly id: string;
  readonly label: string;
  readonly subtitle: string;
  readonly imageAccessUrl?: FileAccessUrl | null;
  readonly row: UserListItemRow;
};

export const ACTIVE_END_USER_COMBOBOX_LABEL = "کاربر";
export const ACTIVE_END_USER_COMBOBOX_PLACEHOLDER = "جستجو براساس نام، نام کاربری، ایمیل یا موبایل";
export const ACTIVE_END_USER_COMBOBOX_NO_OPTIONS_TEXT = "کاربر فعال با نقش کاربر نهایی پیدا نشد.";

export const ACTIVE_END_USER_DEFAULT_OPTIONS_LIMIT = 10;
export const ACTIVE_END_USER_SEARCH_OPTIONS_LIMIT = 200;

function getUserFullName(row: UserListItemRow): string {
  const parts = [row.profile?.firstName?.trim(), row.profile?.lastName?.trim()].filter(
    (part): part is string => Boolean(part)
  );
  return parts.length > 0 ? parts.join(" ") : row.username;
}

export function userToActiveEndUserOption(row: UserListItemRow): ActiveEndUserOption {
  const email = row.profile?.email?.trim();
  return {
    id: row.id,
    label: getUserFullName(row),
    subtitle: [row.username, email].filter(Boolean).join(" | "),
    imageAccessUrl: row.profile?.avatarAccessUrl as FileAccessUrl | null | undefined,
    row,
  };
}

export function mapActiveEndUserListItems(
  items: readonly UserListItemRow[]
): ActiveEndUserOption[] {
  return items
    .filter((user) => user.roles.length === 1 && user.roles[0] === "END_USER")
    .map(userToActiveEndUserOption);
}
