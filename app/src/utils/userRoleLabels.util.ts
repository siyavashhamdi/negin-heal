export type UserRoleKey = "SUPER_ADMIN" | "END_USER";

export const USER_ROLE_LABELS: Record<UserRoleKey, string> = {
  SUPER_ADMIN: "سوپر ادمین",
  END_USER: "کاربر",
};

export function getUserRoleLabel(role: string): string {
  return USER_ROLE_LABELS[role as UserRoleKey] ?? role;
}

/** Elevated roles are shown on profile; end-users see no role badge. */
export function getProfileDisplayRoles(
  roles: readonly string[] | undefined | null
): readonly string[] {
  if (!roles?.length) {
    return [];
  }

  const hasElevatedRole = roles.some((role) => role === "SUPER_ADMIN");
  if (hasElevatedRole) {
    return roles.filter((role) => role !== "END_USER");
  }

  return [];
}
