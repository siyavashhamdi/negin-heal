import { lazy, Suspense, type ReactElement } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RouteLoadingFallback } from "../components/RouteLoadingFallback";
import { PageSeoProvider } from "../contexts/PageSeoProvider";
import { useScrollToTop } from "../hooks/useScrollToTop";
import { APP_SHELL_ROUTES } from "./app-shell-routes";
import { API_CONFIG } from "../config";

const CourseDetail = lazy(() => import("../pages/Courses/CourseDetail"));
const CoursesIndex = lazy(() => import("../pages/Courses/Index"));
const LoginRoute = lazy(() => import("../pages/Login/LoginRoute"));
const AboutPage = lazy(() => import("../pages/More/About"));
const GlobalAnouncementPage = lazy(() => import("../pages/More/GlobalAnouncement"));
const BackupPage = lazy(() => import("../pages/More/Backup"));
const More = lazy(() => import("../pages/More/Index"));
const CouponsIndex = lazy(() => import("../pages/Coupons/Index"));
const PrivacyPolicyPage = lazy(() => import("../pages/More/PrivacyPolicy"));
const TermsOfUsePage = lazy(() => import("../pages/More/TermsOfUse"));
const SystemSettingsIndex = lazy(() => import("../pages/SystemSettings/Index"));
const Notifications = lazy(() => import("../pages/Notifications/Index"));
const PaymentsIndex = lazy(() => import("../pages/Payments/Index"));
const ZarinPalCallback = lazy(() => import("../pages/Payments/ZarinPalCallback"));
const Profile = lazy(() => import("../pages/Profile/Index"));
const ResetPassword = lazy(() => import("../pages/Login/ResetPassword"));
const ActivateAccount = lazy(() => import("../pages/Login/ActivateAccount"));
const SupportFaq = lazy(() => import("../pages/Support/Faq"));
const Support = lazy(() => import("../pages/Support/Index"));
const SupportTicketsIndex = lazy(() => import("../pages/Support/TicketsIndex"));
const UsersManagementIndex = lazy(() => import("../pages/UsersManagement/Index"));
const UnderConstruction = lazy(() => import("../pages/UnderConstruction/UnderConstruction"));
const Landing = lazy(() => import("../pages/Landing/Landing"));

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
        <Route path={`${APP_SHELL_ROUTES.courses}/new`} element={<CoursesIndex />} />
        <Route path={`${APP_SHELL_ROUTES.courses}/edit/:courseId`} element={<CoursesIndex />} />
        <Route path={`${APP_SHELL_ROUTES.courses}/delete/:courseId`} element={<CoursesIndex />} />
        <Route path={APP_SHELL_ROUTES.courses} element={<CoursesIndex />} />
        <Route path={APP_SHELL_ROUTES.courseDetail} element={<CourseDetail />} />
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
        <Route path={`${APP_SHELL_ROUTES.courses}/:courseId/purchase`} element={<CourseDetail />} />
        <Route path={`${APP_SHELL_ROUTES.courses}/new/max`} element={<CoursesIndex />} />
        <Route path={`${APP_SHELL_ROUTES.courses}/edit/:courseId/max`} element={<CoursesIndex />} />
        <Route
          path={`${APP_SHELL_ROUTES.courses}/new/compress-media`}
          element={<CoursesIndex />}
        />
        <Route
          path={`${APP_SHELL_ROUTES.courses}/edit/:courseId/compress-media`}
          element={<CoursesIndex />}
        />
        <Route path={`${APP_SHELL_ROUTES.courses}/:courseId/max`} element={<CourseDetail />} />
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
              <Navigate to={APP_SHELL_ROUTES.courses} replace />
            )
          }
        />
        <Route path="*" element={<Navigate to={APP_SHELL_ROUTES.courses} replace />} />
      </Routes>
    </Suspense>
  );
};

export const DashboardAppRoutes = (): ReactElement => (
  <PageSeoProvider>
    <DashboardAppRoutesContent />
  </PageSeoProvider>
);
