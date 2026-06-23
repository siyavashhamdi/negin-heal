import { type ReactElement } from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter, useLocation } from "react-router-dom";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { ApolloProvider } from "@apollo/client/react";
import { createAppTheme } from "./theme";
import { ThemeProvider, useThemeMode } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SnackbarProvider } from "./contexts/SnackbarContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { ApolloErrorHandler } from "./components/ApolloErrorHandler";
import { AppUpdatePrompt } from "./components/AppUpdatePrompt";
import { LoadingBar } from "./components/LoadingBar";
import { UserPreferencesSync } from "./components/UserPreferencesSync";
import { apolloClient } from "./lib/apollo-client";
import { MainLayout } from "./layouts/MainLayout";
import { LOCAL_STORAGE_KEYS } from "./constants";
import { DashboardAppRoutes } from "./routing/DashboardAppRoutes";
import { APP_SHELL_ROUTES } from "./routing/app-shell-routes";
import { API_CONFIG } from "./config";

const emotionRtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [rtlPlugin],
});

const AppShell = (): ReactElement => {
  const location = useLocation();
  const isLoginPage = location.pathname === APP_SHELL_ROUTES.login;
  const isResetPasswordPage = location.pathname === APP_SHELL_ROUTES.resetPassword;
  const isActivateAccountPage = location.pathname === APP_SHELL_ROUTES.activateAccount;
  const isLandingPage = location.pathname === APP_SHELL_ROUTES.landing;
  const isUnderConstructionHome =
    API_CONFIG.UNDER_CONSTRUCTION && location.pathname === APP_SHELL_ROUTES.home;
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

  if (isLoginPage || isResetPasswordPage || isActivateAccountPage || isLandingPage || isUnderConstructionHome) {
    return <DashboardAppRoutes />;
  }

  return (
    <MainLayout showSessionTools={Boolean(token)}>
      <DashboardAppRoutes />
    </MainLayout>
  );
};

const ThemedAppTree = (): ReactElement => {
  const { mode } = useThemeMode();
  const theme = createAppTheme(mode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <ApolloErrorHandler />
        <AppUpdatePrompt />
        <LoadingBar />
        <AppShell />
      </SnackbarProvider>
    </MuiThemeProvider>
  );
};

const App = (): ReactElement => (
  <CacheProvider value={emotionRtlCache}>
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <LoadingProvider>
              <UserPreferencesSync />
              <ThemedAppTree />
            </LoadingProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ApolloProvider>
  </CacheProvider>
);

export default App;
