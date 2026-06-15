import { type ReactElement } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { usePageTitle } from "../hooks/usePageTitle";
import Dashboard from "../pages/Dashoard/Dashboard";
import CourseDetail from "../pages/Courses/CourseDetail";
import CoursesIndex from "../pages/Courses/Index";
import Login from "../pages/Login/Login";
import AboutPage from "../pages/More/About";
import More from "../pages/More/Index";
import PrivacyPolicyPage from "../pages/More/PrivacyPolicy";
import TermsOfUsePage from "../pages/More/TermsOfUse";
import Notifications from "../pages/Notifications/Index";
import PaymentsIndex from "../pages/Payments/Index";
import ZarinPalCallback from "../pages/Payments/ZarinPalCallback";
import Profile from "../pages/Profile/Index";
import ResetPassword from "../pages/Login/ResetPassword";
import SupportFaq from "../pages/Support/Faq";
import Support from "../pages/Support/Index";
import SupportTicketsIndex from "../pages/Support/TicketsIndex";
import UsersManagementIndex from "../pages/UsersManagement/Index";
import { APP_SHELL_ROUTES } from "./app-shell-routes";

const wrapProtected = (element: ReactElement): ReactElement => (
  <ProtectedRoute>{element}</ProtectedRoute>
);

export const DashboardAppRoutes = (): ReactElement => {
  usePageTitle();

  return (
    <Routes>
      <Route path={APP_SHELL_ROUTES.login} element={<Login />} />
      <Route
        path={APP_SHELL_ROUTES.resetPassword}
        element={<ResetPassword />}
      />
      <Route
        path={APP_SHELL_ROUTES.dashboard}
        element={wrapProtected(<Dashboard />)}
      />
      <Route path={APP_SHELL_ROUTES.courseDetail} element={<CourseDetail />} />
      <Route path={APP_SHELL_ROUTES.courses} element={<CoursesIndex />} />
      <Route path={APP_SHELL_ROUTES.more} element={wrapProtected(<More />)} />
      <Route
        path={APP_SHELL_ROUTES.moreAbout}
        element={wrapProtected(<AboutPage />)}
      />
      <Route
        path={APP_SHELL_ROUTES.morePrivacyPolicy}
        element={wrapProtected(<PrivacyPolicyPage />)}
      />
      <Route
        path={APP_SHELL_ROUTES.moreTermsOfUse}
        element={wrapProtected(<TermsOfUsePage />)}
      />
      <Route
        path={APP_SHELL_ROUTES.notifications}
        element={wrapProtected(<Notifications />)}
      />
      <Route
        path={APP_SHELL_ROUTES.payments}
        element={wrapProtected(<PaymentsIndex />)}
      />
      <Route
        path={APP_SHELL_ROUTES.paymentZarinPalCallback}
        element={<ZarinPalCallback />}
      />
      <Route path={APP_SHELL_ROUTES.profile} element={wrapProtected(<Profile />)} />
      <Route path={APP_SHELL_ROUTES.support} element={wrapProtected(<Support />)} />
      <Route path={APP_SHELL_ROUTES.supportFaq} element={wrapProtected(<SupportFaq />)} />
      <Route
        path={APP_SHELL_ROUTES.supportTickets}
        element={wrapProtected(<SupportTicketsIndex />)}
      />
      <Route
        path={APP_SHELL_ROUTES.users}
        element={wrapProtected(<UsersManagementIndex />)}
      />
      <Route
        path={APP_SHELL_ROUTES.usersManagement}
        element={wrapProtected(<UsersManagementIndex />)}
      />
      <Route
        path={APP_SHELL_ROUTES.home}
        element={<Navigate to={APP_SHELL_ROUTES.dashboard} replace />}
      />
    </Routes>
  );
};
