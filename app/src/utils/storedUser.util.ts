import type { User } from "../contexts/AuthContext";
import type { UserMeGqlResponse } from "../hooks/useMe";

type ProfileNameLike = {
  readonly firstName?: string | null;
  readonly lastName?: string | null;
};

type MeDisplayNameLike = {
  readonly username?: string | null;
  readonly profile?: ProfileNameLike | null;
};

export function mapMeToUser(me: UserMeGqlResponse): User {
  return {
    id: String(me.id),
    username: me.username,
    roles: me.roles.map((role) => String(role)),
    firstName: me.profile?.firstName ?? null,
    lastName: me.profile?.lastName ?? null,
  };
}

export function joinProfileDisplayName(
  firstName?: string | null,
  lastName?: string | null
): string {
  const parts = [firstName?.trim(), lastName?.trim()].filter((part): part is string =>
    Boolean(part)
  );
  return parts.join(" ");
}

export function resolveStoredUserDisplayName(
  user: Pick<User, "username" | "firstName" | "lastName"> | null | undefined,
  fallback = ""
): string {
  if (!user) {
    return fallback;
  }

  const joined = joinProfileDisplayName(user.firstName, user.lastName);
  if (joined) {
    return joined;
  }

  return user.username || fallback;
}

export function resolveAvatarInitial(displayName: string, fallback = "?"): string {
  const initial = displayName.trim().slice(0, 1);
  return initial ? initial.toLocaleUpperCase() : fallback;
}

export function resolveMeUserDisplayName(
  meUser: MeDisplayNameLike | null | undefined,
  fallback = ""
): string {
  if (!meUser) {
    return fallback;
  }

  const joined = joinProfileDisplayName(meUser.profile?.firstName, meUser.profile?.lastName);
  if (joined) {
    return joined;
  }

  return meUser.username?.trim() || fallback;
}
