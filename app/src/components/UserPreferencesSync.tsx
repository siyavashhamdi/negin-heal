import { useEffect, type ReactElement } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useMe } from "../hooks/useMe";
import { mapMeToUser } from "../utils/storedUser.util";
import { applyUserPreferences } from "../utils/userPreferences.util";

/**
 * Applies server-side user data to local storage and the running app
 * whenever authenticated `me` data is available (login and session restore).
 */
export function UserPreferencesSync(): ReactElement | null {
  const { isAuthenticated, syncUser } = useAuth();
  const { user } = useMe();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    syncUser(mapMeToUser(user));
  }, [
    isAuthenticated,
    syncUser,
    user?.id,
    user?.username,
    user?.roles?.join(","),
    user?.profile?.firstName,
    user?.profile?.lastName,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !user?.preferences) {
      return;
    }

    applyUserPreferences(user.preferences);
  }, [isAuthenticated, user?.preferences]);

  return null;
}
