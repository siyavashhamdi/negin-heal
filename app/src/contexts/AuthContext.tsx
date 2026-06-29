import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type ReactElement,
} from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LOCAL_STORAGE_KEYS } from "../constants";
import { shouldUseProfileAuthShell } from "../hooks/useMobileAppLayout";
import { apolloClient, resetApolloClientCache } from "../lib/apollo-client";
import {
  beginLogoutCacheCleanup,
  endLogoutCacheCleanup,
  LOGGED_OUT_NAV_PREFETCH_CONTEXT,
  runAppShellNavPrefetchNow,
} from "../lib/app-shell-nav-prefetch";
import {
  APP_SHELL_ROUTES,
  isProfileAuthRoute,
  isStandaloneShellRoute,
} from "../routing/app-shell-routes";
import {
  clearPostLoginRedirect,
  consumePostLoginRedirect,
  type PostLoginRedirect,
  resolvePendingPostLoginRedirect,
} from "../routing/post-login-redirect";
import { USER_LOGOUT_MUTATION } from "../graphql/mutations/userLogout.mutation";
import { subscribeAuthSessionExpired } from "../lib/auth-session-expired-listeners";
import { unregisterWebPushSubscriptionFromServer } from "../utils/pushSubscription.util";
import { isNativeCapacitorShell } from "../utils/apiBaseUrl.util";
import { unregisterNativePushFromServer } from "../native/nativePushRegistration";

/**
 * User data structure
 */
export interface User {
  id: string;
  username: string;
  roles: string[];
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Auth context value
 */
interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPostLoginRedirectPending: boolean;
  login: (token: string, user: User) => void;
  syncUser: (userData: User) => void;
  logout: () => void;
}

/**
 * Auth Context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  readonly children: ReactNode;
}

function isAuthEntryRoute(pathname: string): boolean {
  return pathname === APP_SHELL_ROUTES.login || isProfileAuthRoute(pathname);
}

function hasReachedPostLoginRedirectTarget(pathname: string, redirect: PostLoginRedirect): boolean {
  return pathname === redirect.pathname || pathname.startsWith(`${redirect.pathname}/`);
}

/**
 * Auth Provider Component
 * Manages authentication state and provides auth methods
 */
export const AuthProvider = ({ children }: AuthProviderProps): ReactElement => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [postLoginRedirectTarget, setPostLoginRedirectTarget] = useState<PostLoginRedirect | null>(
    null
  );
  const location = useLocation();
  const navigate = useNavigate();

  const beginPostLoginRedirect = useCallback((redirect: PostLoginRedirect): void => {
    consumePostLoginRedirect();
    setPostLoginRedirectTarget(redirect);
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const parsedUser = JSON.parse(userStr) as User;
        setAccessToken(token);
        setUser(parsedUser);
      } catch (error) {
        console.error("خواندن اطلاعات کاربر از حافظه محلی ناموفق بود.", error);
        // Clear invalid data
        localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!postLoginRedirectTarget) {
      return;
    }

    if (hasReachedPostLoginRedirectTarget(location.pathname, postLoginRedirectTarget)) {
      setPostLoginRedirectTarget(null);
    }
  }, [location.pathname, postLoginRedirectTarget]);

  useEffect(() => {
    if (isLoading || !accessToken || !user || postLoginRedirectTarget) {
      return;
    }

    if (!isAuthEntryRoute(location.pathname)) {
      return;
    }

    const redirect = resolvePendingPostLoginRedirect(location.state);
    if (!redirect) {
      return;
    }

    beginPostLoginRedirect(redirect);
  }, [
    accessToken,
    beginPostLoginRedirect,
    isLoading,
    location.pathname,
    location.state,
    postLoginRedirectTarget,
    user,
  ]);

  /**
   * Login function
   * Stores token and user data, then navigates based on viewport.
   */
  const login = useCallback(
    (token: string, userData: User): void => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, token);
      localStorage.setItem("user", JSON.stringify(userData));
      setAccessToken(token);
      setUser(userData);

      const redirect = resolvePendingPostLoginRedirect(location.state);
      if (redirect) {
        beginPostLoginRedirect(redirect);
        return;
      }

      if (shouldUseProfileAuthShell()) {
        if (window.location.pathname !== APP_SHELL_ROUTES.profile) {
          navigate(APP_SHELL_ROUTES.profile);
        }
        return;
      }

      navigate(APP_SHELL_ROUTES.products);
    },
    [beginPostLoginRedirect, location.state, navigate]
  );

  const syncUser = useCallback((userData: User): void => {
    setUser((currentUser) => {
      if (!currentUser || currentUser.id !== userData.id) {
        return currentUser;
      }

      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    });
  }, []);

  const clearLocalAuthSession = useCallback((): void => {
    setAccessToken(null);
    setUser(null);
    setPostLoginRedirectTarget(null);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem("user");
    clearPostLoginRedirect();
  }, []);

  const runBackgroundLogoutCleanup = useCallback(async (token: string | null): Promise<void> => {
    try {
      if (!isNativeCapacitorShell()) {
        await unregisterWebPushSubscriptionFromServer({
          clearStoredEndpoint: true,
          authToken: token,
        });
      }
    } catch (error: unknown) {
      console.warn("[Auth] Failed to unregister Web Push subscription during logout.", error);
    }

    try {
      await unregisterNativePushFromServer({ clearStoredToken: true });
    } catch (error: unknown) {
      console.warn("[Auth] Failed to unregister native push token during logout.", error);
    }

    if (token) {
      try {
        await apolloClient.mutate({
          mutation: USER_LOGOUT_MUTATION,
          context: {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        });
      } catch (error: unknown) {
        console.warn("[Auth] userLogout mutation failed.", error);
      }
    }
  }, []);

  const runServerLogout = useCallback(
    (afterLogout: () => void): void => {
      const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

      beginLogoutCacheCleanup();
      clearLocalAuthSession();
      afterLogout();

      void runBackgroundLogoutCleanup(token)
        .catch((error: unknown) => {
          console.warn("[Auth] Background logout cleanup failed.", error);
        })
        .finally(() => {
          void (async () => {
            try {
              await resetApolloClientCache();
            } catch (error: unknown) {
              console.warn("[Auth] Failed to reset client cache during logout.", error);
            } finally {
              endLogoutCacheCleanup();
              try {
                await runAppShellNavPrefetchNow(LOGGED_OUT_NAV_PREFETCH_CONTEXT);
              } catch (error: unknown) {
                console.warn("[Auth] Failed to prefetch logged-out nav data.", error);
              }
            }
          })();
        });
    },
    [clearLocalAuthSession, runBackgroundLogoutCleanup]
  );

  const redirectToLoginAfterLogout = useCallback((): void => {
    navigate(shouldUseProfileAuthShell() ? APP_SHELL_ROUTES.profileLogin : APP_SHELL_ROUTES.login);
  }, [navigate]);

  const forceLogoutToProfile = useCallback((): void => {
    const stayOnPage = isStandaloneShellRoute(window.location.pathname);

    runServerLogout(() => {
      if (!stayOnPage) {
        navigate(APP_SHELL_ROUTES.profile, { replace: true });
      }
    });
  }, [navigate, runServerLogout]);

  useEffect(() => {
    return subscribeAuthSessionExpired(forceLogoutToProfile);
  }, [forceLogoutToProfile]);

  /**
   * Logout function
   * Clears auth state and redirects to login
   */
  const logout = useCallback((): void => {
    runServerLogout(redirectToLoginAfterLogout);
  }, [redirectToLoginAfterLogout, runServerLogout]);

  const value: AuthContextValue = {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken) && Boolean(user),
    isLoading,
    isPostLoginRedirectPending: postLoginRedirectTarget !== null,
    login,
    syncUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {postLoginRedirectTarget ? (
        <Navigate
          to={postLoginRedirectTarget.pathname}
          replace
          state={
            postLoginRedirectTarget.openProductPurchase ? { openProductPurchase: true } : undefined
          }
        />
      ) : null}
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Provides access to auth context
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("The hook 'useAuth' should be used inside 'AuthProvider'.");
  }
  return context;
};
