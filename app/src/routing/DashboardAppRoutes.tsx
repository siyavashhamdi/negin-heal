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
import SupportFaq from "../pages/Support/Faq";
import Support from "../pages/Support/Index";
import SupportTicketsIndex from "../pages/Support/TicketsIndex";
import UsersManagementIndex from "../pages/UsersManagement/Index";

const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  courses: "/courses",
  courseDetail: "/courses/:courseId",
  more: "/more",
  moreAbout: "/more/about",
  morePrivacyPolicy: "/more/privacy-policy",
  moreTermsOfUse: "/more/terms-of-use",
  notifications: "/notifications",
  payments: "/payments",
  paymentZarinPalCallback: "/payment/zarinpal/callback",
  profile: "/profile",
  support: "/support",
  supportFaq: "/support/faq",
  supportTickets: "/support/tickets",
  users: "/users",
  usersManagement: "/users-management",
  home: "/",
} as const;

const wrapProtected = (element: ReactElement): ReactElement => (
  <ProtectedRoute>{element}</ProtectedRoute>
);

export const DashboardAppRoutes = (): ReactElement => {
  usePageTitle();

  return (
    <Routes>
      <Route path={ROUTES.login} element={<Login />} />
      <Route path={ROUTES.dashboard} element={wrapProtected(<Dashboard />)} />
      <Route path={ROUTES.courseDetail} element={<CourseDetail />} />
      <Route path={ROUTES.courses} element={<CoursesIndex />} />
      <Route path={ROUTES.more} element={wrapProtected(<More />)} />
      <Route path={ROUTES.moreAbout} element={wrapProtected(<AboutPage />)} />
      <Route path={ROUTES.morePrivacyPolicy} element={wrapProtected(<PrivacyPolicyPage />)} />
      <Route path={ROUTES.moreTermsOfUse} element={wrapProtected(<TermsOfUsePage />)} />
      <Route path={ROUTES.notifications} element={wrapProtected(<Notifications />)} />
      <Route path={ROUTES.payments} element={wrapProtected(<PaymentsIndex />)} />
      <Route path={ROUTES.paymentZarinPalCallback} element={<ZarinPalCallback />} />
      <Route path={ROUTES.profile} element={wrapProtected(<Profile />)} />
      <Route path={ROUTES.support} element={wrapProtected(<Support />)} />
      <Route path={ROUTES.supportFaq} element={wrapProtected(<SupportFaq />)} />
      <Route path={ROUTES.supportTickets} element={wrapProtected(<SupportTicketsIndex />)} />
      <Route path={ROUTES.users} element={wrapProtected(<UsersManagementIndex />)} />
      <Route path={ROUTES.usersManagement} element={wrapProtected(<UsersManagementIndex />)} />
      <Route path={ROUTES.home} element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
};

export { ROUTES as APP_SHELL_ROUTES };
