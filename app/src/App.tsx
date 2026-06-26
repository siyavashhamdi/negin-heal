import { type ReactElement } from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter, useLocation } from "react-router-dom";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { ApolloBootstrap } from "./components/ApolloBootstrap";
import { createAppTheme } from "./theme";
import { ThemeProvider, useThemeMode } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SnackbarProvider } from "./contexts/SnackbarContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { ApolloErrorHandler } from "./components/ApolloErrorHandler";
import { GeneralUpdatesSubscriptionHost } from "./components/GeneralUpdatesSubscriptionHost";
import { AppUpdatePrompt } from "./components/AppUpdatePrompt";
import { LoadingBar } from "./components/LoadingBar";
import { OfflineModeBanner } from "./components/OfflineModeBanner";
import { UserPreferencesSync } from "./components/UserPreferencesSync";
import { PushSubscriptionSync } from "./components/PushSubscriptionSync";
import { NativePushSubscriptionSync } from "./components/NativePushSubscriptionSync";
import { LauncherBadgeSync } from "./components/LauncherBadgeSync";
import { MainLayout } from "./layouts/MainLayout";
import { LOCAL_STORAGE_KEYS } from "./constants";
import { DashboardAppRoutes } from "./routing/DashboardAppRoutes";
import { APP_SHELL_ROUTES, isStandaloneShellRoute } from "./routing/app-shell-routes";
import { API_CONFIG } from "./config";

const emotionRtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [rtlPlugin],
});

const AppShell = (): ReactElement => {
  const location = useLocation();
  const isUnderConstructionHome =
    API_CONFIG.UNDER_CONSTRUCTION && location.pathname === APP_SHELL_ROUTES.home;

  if (isStandaloneShellRoute(location.pathname) || isUnderConstructionHome) {
    return <DashboardAppRoutes />;
  }

  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

  return (
    <>
      <GeneralUpdatesSubscriptionHost />
      <MainLayout showSessionTools={Boolean(token)}>
        <DashboardAppRoutes />
      </MainLayout>
    </>
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
        <OfflineModeBanner />
        <LoadingBar />
        <AppShell />
      </SnackbarProvider>
    </MuiThemeProvider>
  );
};

const App = (): ReactElement => (
  <CacheProvider value={emotionRtlCache}>
    <ApolloBootstrap>
      <ThemeProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <LoadingProvider>
              <UserPreferencesSync />
              <PushSubscriptionSync />
              <NativePushSubscriptionSync />
              <LauncherBadgeSync />
              <ThemedAppTree />
            </LoadingProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ApolloBootstrap>
  </CacheProvider>
);

export default App;
