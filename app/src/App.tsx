import { type ReactElement, useMemo } from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter, useLocation } from "react-router-dom";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { ApolloBootstrap } from "./components/ApolloBootstrap";
import { createAppTheme } from "./theme";
import { ThemeProvider, useThemeMode } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
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
import { NativeBackButtonBridge } from "./components/NativeBackButtonBridge";
import { PushNotificationOpenHost } from "./components/PushNotificationOpenHost";
import { NotificationLiveBanner } from "./components/NotificationLiveBanner";
import { MainLayout } from "./layouts/MainLayout";
import { DashboardAppRoutes } from "./routing/DashboardAppRoutes";
import { APP_SHELL_ROUTES, isStandaloneShellRoute } from "./routing/app-shell-routes";
import { API_CONFIG } from "./config";

const emotionRtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [rtlPlugin],
});

const AppShell = (): ReactElement => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isUnderConstructionHome =
    API_CONFIG.UNDER_CONSTRUCTION && location.pathname === APP_SHELL_ROUTES.home;

  if (isStandaloneShellRoute(location.pathname) || isUnderConstructionHome) {
    return <DashboardAppRoutes />;
  }

  return (
    <MainLayout showSessionTools={isAuthenticated}>
      <DashboardAppRoutes />
    </MainLayout>
  );
};

const ThemedAppTree = (): ReactElement => {
  const { mode } = useThemeMode();
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <ApolloErrorHandler />
        <AppUpdatePrompt />
        <OfflineModeBanner />
        <NotificationLiveBanner />
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
          <NativeBackButtonBridge />
          <AuthProvider>
            <LoadingProvider>
              <GeneralUpdatesSubscriptionHost />
              <UserPreferencesSync />
              <PushSubscriptionSync />
              <NativePushSubscriptionSync />
              <LauncherBadgeSync />
              <PushNotificationOpenHost />
              <ThemedAppTree />
            </LoadingProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ApolloBootstrap>
  </CacheProvider>
);

export default App;
