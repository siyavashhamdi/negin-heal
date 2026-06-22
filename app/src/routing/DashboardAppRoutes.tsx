import { type ReactElement } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { usePageTitle } from "../hooks/usePageTitle";
import { useScrollToTop } from "../hooks/useScrollToTop";
import Dashboard from "../pages/Dashoard/Dashboard";
import CourseDetail from "../pages/Courses/CourseDetail";
import CoursesIndex from "../pages/Courses/Index";
import LoginRoute from "../pages/Login/LoginRoute";
import AboutPage from "../pages/More/About";
import GlobalAnouncementPage from "../pages/More/GlobalAnouncement";
import More from "../pages/More/Index";
import CouponsIndex from "../pages/Coupons/Index";
import PrivacyPolicyPage from "../pages/More/PrivacyPolicy";
import TermsOfUsePage from "../pages/More/TermsOfUse";
import SystemSettingsIndex from "../pages/SystemSettings/Index";
import Notifications from "../pages/Notifications/Index";
import PaymentsIndex from "../pages/Payments/Index";
import ZarinPalCallback from "../pages/Payments/ZarinPalCallback";
import Profile from "../pages/Profile/Index";
import ResetPassword from "../pages/Login/ResetPassword";
import ActivateAccount from "../pages/Login/ActivateAccount";
import SupportFaq from "../pages/Support/Faq";
import Support from "../pages/Support/Index";
import SupportTicketsIndex from "../pages/Support/TicketsIndex";
import UsersManagementIndex from "../pages/UsersManagement/Index";
import UnderConstruction from "../pages/UnderConstruction/UnderConstruction";
import { APP_SHELL_ROUTES } from "./app-shell-routes";
import { API_CONFIG } from "../config";

const wrapProtected = (element: ReactElement): ReactElement => (
  <ProtectedRoute>{element}</ProtectedRoute>
);

export const DashboardAppRoutes = (): ReactElement => {
  usePageTitle();
  useScrollToTop();

  return (
    <Routes>
      <Route path={APP_SHELL_ROUTES.login} element={<LoginRoute />} />
      <Route path={APP_SHELL_ROUTES.resetPassword} element={<ResetPassword />} />
      <Route path={APP_SHELL_ROUTES.activateAccount} element={<ActivateAccount />} />
      <Route path={APP_SHELL_ROUTES.dashboard} element={wrapProtected(<Dashboard />)} />
      <Route path={`${APP_SHELL_ROUTES.courses}/new`} element={<CoursesIndex />} />
      <Route path={`${APP_SHELL_ROUTES.courses}/edit/:courseId`} element={<CoursesIndex />} />
      <Route path={`${APP_SHELL_ROUTES.courses}/delete/:courseId`} element={<CoursesIndex />} />
      <Route path={`${APP_SHELL_ROUTES.courses}/flip/:courseId`} element={<CoursesIndex />} />
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
      <Route path={`${APP_SHELL_ROUTES.moreCoupons}/*`} element={wrapProtected(<CouponsIndex />)} />
      <Route path={APP_SHELL_ROUTES.notifications} element={wrapProtected(<Notifications />)} />
      <Route path={`${APP_SHELL_ROUTES.payments}/*`} element={wrapProtected(<PaymentsIndex />)} />
      <Route path={APP_SHELL_ROUTES.paymentZarinPalCallback} element={<ZarinPalCallback />} />
      <Route path={`${APP_SHELL_ROUTES.profile}/*`} element={wrapProtected(<Profile />)} />
      <Route path={APP_SHELL_ROUTES.support} element={wrapProtected(<Support />)} />
      <Route path={APP_SHELL_ROUTES.supportFaq} element={wrapProtected(<SupportFaq />)} />
      <Route path={`${APP_SHELL_ROUTES.supportTickets}/new`} element={wrapProtected(<SupportTicketsIndex />)} />
      <Route path={`${APP_SHELL_ROUTES.supportTickets}/:ticketId`} element={wrapProtected(<SupportTicketsIndex />)} />
      <Route
        path={APP_SHELL_ROUTES.supportTickets}
        element={wrapProtected(<SupportTicketsIndex />)}
      />
      <Route path={`${APP_SHELL_ROUTES.courses}/:courseId/purchase`} element={<CourseDetail />} />
      <Route path={`${APP_SHELL_ROUTES.courses}/new/max`} element={<CoursesIndex />} />
      <Route path={`${APP_SHELL_ROUTES.courses}/edit/:courseId/max`} element={<CoursesIndex />} />
      <Route path={`${APP_SHELL_ROUTES.courses}/flip/:courseId/max`} element={<CoursesIndex />} />
      <Route path={`${APP_SHELL_ROUTES.courses}/:courseId/max`} element={<CourseDetail />} />
      <Route path={`${APP_SHELL_ROUTES.users}/*`} element={wrapProtected(<UsersManagementIndex />)} />
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
  );
};
