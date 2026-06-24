import type { UserRole, UserStatus } from "./users-management-list.api";

export type UserEditFormSnapshot = {
  readonly username: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly password: string;
  readonly roles: readonly UserRole[];
  readonly status: UserStatus;
};

export type UserEditSensitiveChangeKind =
  | "username"
  | "email"
  | "mobile"
  | "password"
  | "status"
  | "role";

function hasStoredValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed !== "" && trimmed !== "—" && trimmed !== "-";
}

function rolesSignature(roles: readonly UserRole[]): string {
  return [...roles].sort().join(",");
}

function includesNonEndUserRole(roles: readonly UserRole[]): boolean {
  return roles.some((role) => role !== "END_USER");
}

export function collectUserEditSensitiveChanges(
  initial: UserEditFormSnapshot,
  current: UserEditFormSnapshot
): readonly UserEditSensitiveChangeKind[] {
  const changes: UserEditSensitiveChangeKind[] = [];

  if (hasStoredValue(initial.username) && initial.username.trim() !== current.username.trim()) {
    changes.push("username");
  }

  if (hasStoredValue(initial.email) && initial.email.trim() !== current.email.trim()) {
    changes.push("email");
  }

  if (
    hasStoredValue(initial.phoneNumber) &&
    initial.phoneNumber.trim() !== current.phoneNumber.trim()
  ) {
    changes.push("mobile");
  }

  if (current.password.trim() !== "") {
    changes.push("password");
  }

  if (hasStoredValue(initial.status) && initial.status !== current.status) {
    changes.push("status");
  }

  if (
    rolesSignature(initial.roles) !== rolesSignature(current.roles) &&
    includesNonEndUserRole(current.roles)
  ) {
    changes.push("role");
  }

  return changes;
}

export function buildUserEditConfirmPath(userId: string): string {
  return `/users/edit/${userId}/confirm`;
}
