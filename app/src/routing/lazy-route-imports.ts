/** Shared dynamic imports so route chunks are deduplicated between React.lazy and prefetch. */

export const importProductDetail = () => import("../pages/Products/ProductDetail");
export const importProductsIndex = () => import("../pages/Products/Index");
export const importLoginRoute = () => import("../pages/Login/LoginRoute");
export const importAboutPage = () => import("../pages/More/About");
export const importGlobalAnouncementPage = () => import("../pages/More/GlobalAnouncement");
export const importBackupPage = () => import("../pages/More/Backup");
export const importMoreIndex = () => import("../pages/More/Index");
export const importCouponsIndex = () => import("../pages/Coupons/Index");
export const importPrivacyPolicyPage = () => import("../pages/More/PrivacyPolicy");
export const importTermsOfUsePage = () => import("../pages/More/TermsOfUse");
export const importSystemSettingsIndex = () => import("../pages/SystemSettings/Index");
export const importNotificationsIndex = () => import("../pages/Notifications/Index");
export const importPaymentsIndex = () => import("../pages/Payments/Index");
export const importZarinPalCallback = () => import("../pages/Payments/ZarinPalCallback");
export const importProfileIndex = () => import("../pages/Profile/Index");
export const importResetPassword = () => import("../pages/Login/ResetPassword");
export const importActivateAccount = () => import("../pages/Login/ActivateAccount");
export const importSupportFaq = () => import("../pages/Support/Faq");
export const importSupportIndex = () => import("../pages/Support/Index");
export const importSupportTicketsIndex = () => import("../pages/Support/TicketsIndex");
export const importUsersManagementIndex = () => import("../pages/UsersManagement/Index");
export const importUnderConstruction = () => import("../pages/UnderConstruction/UnderConstruction");
export const importLanding = () => import("../pages/Landing/Landing");
