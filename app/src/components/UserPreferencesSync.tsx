import { useEffect, type ReactElement } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useMe } from "../hooks/useMe";
import { applyUserPreferences } from "../utils/userPreferences.util";

/**
 * Applies server-side user preferences to local storage and the running app
 * whenever authenticated `me` data is available (login and session restore).
 */
export function UserPreferencesSync(): ReactElement | null {
  const { isAuthenticated } = useAuth();
  const { user } = useMe();

  useEffect(() => {
    if (!isAuthenticated || !user?.preferences) {
      return;
    }

    applyUserPreferences(user.preferences);
  }, [isAuthenticated, user?.preferences]);

  return null;
}
