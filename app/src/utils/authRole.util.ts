export function isEndUserRole(roles: readonly string[]): boolean {
  return roles.includes("END_USER") && !roles.includes("SUPER_ADMIN");
}
