/**
 * GraphQL Enum Registrations
 * Registers TypeScript enums as GraphQL enum types
 */

import { registerEnumType } from "@nestjs/graphql";

import { GeneralAnouncementMode } from "./general-anouncement-mode.enum";
import { AppSettingValueType } from "./app-setting-value-type.enum";
import { CourseDiscountType } from "./course-discount-type.enum";
import { CourseItemType } from "./course-item-type.enum";
import { CourseReleaseType } from "./course-release-type.enum";
import { PaymentCouponDiscountType } from "./payment-coupon-discount-type.enum";
import { TicketCategory } from "./ticket-category.enum";
import { TicketClosedBy } from "./ticket-closed-by.enum";
import { TicketPriority } from "./ticket-priority.enum";
import { TicketStatus } from "./ticket-status.enum";
import { GeneralSubscriptionUpdateType } from "./general-subscription-update-type.enum";
import { UserRole } from "./user-role.enum";
import { UserStatus } from "./user-status.enum";
import { UserCoursePaymentMethod } from "./user-course-payment-method.enum";
import { UserCoursePurchaseCurrency } from "./user-course-purchase-currency.enum";
import { UserCoursePurchaseStatus } from "./user-course-purchase-status.enum";
import { SortingOrder } from "../common/pagination/input/sorting-order.enum";

// Register SortingOrder as GraphQL enum
registerEnumType(SortingOrder, {
  name: "SortingOrder",
  description: "Sorting order",
});

registerEnumType(GeneralAnouncementMode, {
  name: "GeneralAnouncementMode",
  description: "Visual mode for general anouncements",
});

registerEnumType(AppSettingValueType, {
  name: "AppSettingValueType",
  description: "Stored app setting value type",
});

registerEnumType(CourseItemType, {
  name: "CourseItemType",
  description: "Calculated course item content type",
});

registerEnumType(CourseReleaseType, {
  name: "CourseReleaseType",
  description: "Calculated course release strategy",
});

registerEnumType(CourseDiscountType, {
  name: "CourseDiscountType",
  description: "Course discount calculation type",
});

registerEnumType(PaymentCouponDiscountType, {
  name: "PaymentCouponDiscountType",
  description: "Payment coupon discount calculation kind",
});

registerEnumType(TicketCategory, {
  name: "TicketCategory",
  description: "Support ticket category",
});

registerEnumType(TicketPriority, {
  name: "TicketPriority",
  description: "Support ticket priority",
});

registerEnumType(TicketStatus, {
  name: "TicketStatus",
  description: "Support ticket lifecycle status",
});

registerEnumType(TicketClosedBy, {
  name: "TicketClosedBy",
  description: "Actor type that closed a support ticket",
});

registerEnumType(GeneralSubscriptionUpdateType, {
  name: "GeneralSubscriptionUpdateType",
  description: "Type of real-time update in general subscription channel",
});

// Register UserRole as GraphQL enum
registerEnumType(UserRole, {
  name: "UserRole",
  description: "Role of the user in the system",
});

// Register UserStatus as GraphQL enum
registerEnumType(UserStatus, {
  name: "UserStatus",
  description: "Status of the user account",
});

registerEnumType(UserCoursePaymentMethod, {
  name: "UserCoursePaymentMethod",
  description: "Supported course payment methods",
});

registerEnumType(UserCoursePurchaseCurrency, {
  name: "UserCoursePurchaseCurrency",
  description: "Currency used for course purchases",
});

registerEnumType(UserCoursePurchaseStatus, {
  name: "UserCoursePurchaseStatus",
  description: "Course purchase lifecycle status",
});
