/**
 * GraphQL Enum Registrations
 * Registers TypeScript enums as GraphQL enum types
 */

import { registerEnumType } from "@nestjs/graphql";

import { CourseDiscountType } from "./course-discount-type.enum";
import { CourseItemType } from "./course-item-type.enum";
import { CourseReleaseType } from "./course-release-type.enum";
import { PaymentCouponDiscountType } from "./payment-coupon-discount-type.enum";
import { TicketCategory } from "./ticket-category.enum";
import { TicketClosedBy } from "./ticket-closed-by.enum";
import { TicketPriority } from "./ticket-priority.enum";
import { TicketStatus } from "./ticket-status.enum";
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
