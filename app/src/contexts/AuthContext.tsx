import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type ReactElement,
} from "react";
import { useNavigate } from "react-router-dom";
import { LOCAL_STORAGE_KEYS } from "../constants";
import { isMobileAppLayoutViewport } from "../hooks/useMobileAppLayout";
import { apolloClient } from "../lib/apollo-client";
import { APP_SHELL_ROUTES } from "../routing/app-shell-routes";
import { consumePostLoginRedirect } from "../routing/post-login-redirect";
import { USER_LOGOUT_MUTATION } from "../graphql/mutations/userLogout.mutation";

/**
 * User data structure
 */
export interface User {
  id: string;
  username: string;
  roles: string[];
}

/**
 * Auth context value
 */
interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
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

/**
 * Auth Provider Component
 * Manages authentication state and provides auth methods
 */
export const AuthProvider = ({ children }: AuthProviderProps): ReactElement => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

  /**
   * Login function
   * Stores token and user data, then navigates based on viewport.
   */
  const login = (token: string, userData: User): void => {
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem("user", JSON.stringify(userData));

    const redirect = consumePostLoginRedirect();
    if (redirect) {
      navigate(redirect.pathname, {
        replace: true,
        state: redirect.openCoursePurchase ? { openCoursePurchase: true } : undefined,
      });
      return;
    }

    if (isMobileAppLayoutViewport()) {
      if (window.location.pathname !== APP_SHELL_ROUTES.profile) {
        navigate(APP_SHELL_ROUTES.profile);
      }
      return;
    }

    navigate(APP_SHELL_ROUTES.dashboard);
  };

  /**
   * Logout function
   * Clears auth state and redirects to login
   */
  const logout = (): void => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

    const finishLogout = (): void => {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem("user");
      navigate(
        isMobileAppLayoutViewport() ? APP_SHELL_ROUTES.profileLogin : APP_SHELL_ROUTES.login,
      );
    };

    if (!token) {
      finishLogout();
      return;
    }

    void apolloClient.mutate({ mutation: USER_LOGOUT_MUTATION }).finally(() => {
      finishLogout();
    });
  };

  const value: AuthContextValue = {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken) && Boolean(user),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
