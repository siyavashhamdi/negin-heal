import { lazy, Suspense, type ReactElement } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RouteLoadingFallback } from "../components/RouteLoadingFallback";
import { PageSeoProvider } from "../contexts/PageSeoProvider";
import { useScrollToTop } from "../hooks/useScrollToTop";
import { APP_SHELL_ROUTES } from "./app-shell-routes";
import { PRODUCT_ROUTE_ID_PARAM } from "./product-route-path";
import { API_CONFIG } from "../config";
import {
  importAboutPage,
  importActivateAccount,
  importBackupPage,
  importCouponsIndex,
  importProductDetail,
  importProductsIndex,
  importGlobalAnouncementPage,
  importLanding,
  importLoginRoute,
  importMoreIndex,
  importNotificationsIndex,
  importPaymentsIndex,
  importPrivacyPolicyPage,
  importProfileIndex,
  importResetPassword,
  importSupportFaq,
  importSupportIndex,
  importSupportTicketsIndex,
  importSystemSettingsIndex,
  importTermsOfUsePage,
  importUnderConstruction,
  importUsersManagementIndex,
  importZarinPalCallback,
} from "./lazy-route-imports";

const ProductDetail = lazy(importProductDetail);
const ProductsIndex = lazy(importProductsIndex);
const LoginRoute = lazy(importLoginRoute);
const AboutPage = lazy(importAboutPage);
const GlobalAnouncementPage = lazy(importGlobalAnouncementPage);
const BackupPage = lazy(importBackupPage);
const More = lazy(importMoreIndex);
const CouponsIndex = lazy(importCouponsIndex);
const PrivacyPolicyPage = lazy(importPrivacyPolicyPage);
const TermsOfUsePage = lazy(importTermsOfUsePage);
const SystemSettingsIndex = lazy(importSystemSettingsIndex);
const Notifications = lazy(importNotificationsIndex);
const PaymentsIndex = lazy(importPaymentsIndex);
const ZarinPalCallback = lazy(importZarinPalCallback);
const Profile = lazy(importProfileIndex);
const ResetPassword = lazy(importResetPassword);
const ActivateAccount = lazy(importActivateAccount);
const SupportFaq = lazy(importSupportFaq);
const Support = lazy(importSupportIndex);
const SupportTicketsIndex = lazy(importSupportTicketsIndex);
const UsersManagementIndex = lazy(importUsersManagementIndex);
const UnderConstruction = lazy(importUnderConstruction);
const Landing = lazy(importLanding);

const wrapProtected = (element: ReactElement): ReactElement => (
  <ProtectedRoute>{element}</ProtectedRoute>
);

const DashboardAppRoutesContent = (): ReactElement => {
  useScrollToTop();

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path={APP_SHELL_ROUTES.login} element={<LoginRoute />} />
        <Route path={APP_SHELL_ROUTES.resetPassword} element={<ResetPassword />} />
        <Route path={APP_SHELL_ROUTES.activateAccount} element={<ActivateAccount />} />
        <Route path={`${APP_SHELL_ROUTES.products}/new`} element={<ProductsIndex />} />
        <Route path={`${APP_SHELL_ROUTES.products}/edit/:${PRODUCT_ROUTE_ID_PARAM}`} element={<ProductsIndex />} />
        <Route path={`${APP_SHELL_ROUTES.products}/delete/:${PRODUCT_ROUTE_ID_PARAM}`} element={<ProductsIndex />} />
        <Route path={APP_SHELL_ROUTES.products} element={<ProductsIndex />} />
        <Route path={APP_SHELL_ROUTES.productDetail} element={<ProductDetail />} />
        <Route path={APP_SHELL_ROUTES.more} element={wrapProtected(<More />)} />
        <Route path={APP_SHELL_ROUTES.moreAbout} element={wrapProtected(<AboutPage />)} />
        <Route
          path={APP_SHELL_ROUTES.morePrivacyPolicy}
          element={wrapProtected(<PrivacyPolicyPage />)}
        />
        <Route path={APP_SHELL_ROUTES.moreTermsOfUse} element={wrapProtected(<TermsOfUsePage />)} />
        <Route
          path={`${APP_SHELL_ROUTES.moreSystemSettings}/edit/:settingId`}
          element={wrapProtected(<SystemSettingsIndex />)}
        />
        <Route
          path={APP_SHELL_ROUTES.moreSystemSettings}
          element={wrapProtected(<SystemSettingsIndex />)}
        />
        <Route
          path={APP_SHELL_ROUTES.moreGlobalAnouncement}
          element={wrapProtected(<GlobalAnouncementPage />)}
        />
        <Route path={APP_SHELL_ROUTES.moreBackup} element={wrapProtected(<BackupPage />)} />
        <Route path={`${APP_SHELL_ROUTES.moreCoupons}/*`} element={wrapProtected(<CouponsIndex />)} />
        <Route path={APP_SHELL_ROUTES.notifications} element={wrapProtected(<Notifications />)} />
        <Route path={`${APP_SHELL_ROUTES.payments}/*`} element={wrapProtected(<PaymentsIndex />)} />
        <Route path={APP_SHELL_ROUTES.paymentZarinPalCallback} element={<ZarinPalCallback />} />
        <Route path={`${APP_SHELL_ROUTES.profile}/*`} element={wrapProtected(<Profile />)} />
        <Route path={APP_SHELL_ROUTES.support} element={wrapProtected(<Support />)} />
        <Route path={APP_SHELL_ROUTES.supportFaq} element={wrapProtected(<SupportFaq />)} />
        <Route
          path={`${APP_SHELL_ROUTES.supportTickets}/new`}
          element={wrapProtected(<SupportTicketsIndex />)}
        />
        <Route
          path={`${APP_SHELL_ROUTES.supportTickets}/:ticketId`}
          element={wrapProtected(<SupportTicketsIndex />)}
        />
        <Route
          path={APP_SHELL_ROUTES.supportTickets}
          element={wrapProtected(<SupportTicketsIndex />)}
        />
        <Route path={`${APP_SHELL_ROUTES.products}/:${PRODUCT_ROUTE_ID_PARAM}/purchase`} element={<ProductDetail />} />
        <Route path={`${APP_SHELL_ROUTES.products}/new/max`} element={<ProductsIndex />} />
        <Route path={`${APP_SHELL_ROUTES.products}/edit/:${PRODUCT_ROUTE_ID_PARAM}/max`} element={<ProductsIndex />} />
        <Route
          path={`${APP_SHELL_ROUTES.products}/new/compress-media`}
          element={<ProductsIndex />}
        />
        <Route
          path={`${APP_SHELL_ROUTES.products}/edit/:${PRODUCT_ROUTE_ID_PARAM}/compress-media`}
          element={<ProductsIndex />}
        />
        <Route path={`${APP_SHELL_ROUTES.products}/:${PRODUCT_ROUTE_ID_PARAM}/max`} element={<ProductDetail />} />
        <Route
          path={`${APP_SHELL_ROUTES.users}/*`}
          element={wrapProtected(<UsersManagementIndex />)}
        />
        <Route path={APP_SHELL_ROUTES.landing} element={<Landing />} />
        <Route
          path={APP_SHELL_ROUTES.home}
          element={
            API_CONFIG.UNDER_CONSTRUCTION ? (
              <UnderConstruction />
            ) : (
              <Navigate to={APP_SHELL_ROUTES.products} replace />
            )
          }
        />
        <Route path="*" element={<Navigate to={APP_SHELL_ROUTES.products} replace />} />
      </Routes>
    </Suspense>
  );
};

export const DashboardAppRoutes = (): ReactElement => (
  <PageSeoProvider>
    <DashboardAppRoutesContent />
  </PageSeoProvider>
);
