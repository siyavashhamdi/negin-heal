/**
 * GraphQL Enum Registrations
 * Registers TypeScript enums as GraphQL enum types
 */

import { registerEnumType } from "@nestjs/graphql";

import { BackupTarget } from "./backup-target.enum";
import { GlobalAnouncementMessageType } from "./global-anouncement-message-type.enum";
import { AppSettingValueType } from "./app-setting-value-type.enum";
import { ProductDiscountType } from "./product-discount-type.enum";
import { ProductReviewVisibility } from "./product-review-visibility.enum";
import { ProductReviewModerationTarget } from "./product-review-moderation-target.enum";
import { ProductItemType } from "./product-item-type.enum";
import { ProductReleaseType } from "./product-release-type.enum";
import { NotificationMode } from "./notification-mode.enum";
import { NotificationSource } from "./notification-source.enum";
import { NotificationUpdateAction } from "./notification-update-action.enum";
import { CouponDiscountType } from "./coupon-discount-type.enum";
import { TicketCategory } from "./ticket-category.enum";
import { TicketClosedBy } from "./ticket-closed-by.enum";
import { TicketPriority } from "./ticket-priority.enum";
import { TicketStatus } from "./ticket-status.enum";
import { GeneralSubscriptionUpdateType } from "./general-subscription-update-type.enum";
import { UserRole } from "./user-role.enum";
import { UserStatus } from "./user-status.enum";
import { UserProductPaymentMethod } from "./user-product-payment-method.enum";
import { UserProductPurchaseCurrency } from "./user-product-purchase-currency.enum";
import { UserProductPurchaseStatus } from "./user-product-purchase-status.enum";
import { PurchaseStatusChangedBy } from "./purchase-status-changed-by.enum";
import { SortingOrder } from "../common/pagination/input/sorting-order.enum";
import { MediaCompressionQuality } from "./media-compression-quality.enum";
import { VideoOutputExtension } from "./video-output-extension.enum";
import { AudioOutputExtension } from "./audio-output-extension.enum";
import { MediaType } from "./media-type.enum";
import { MediaCompressionSkipReason } from "./media-compression-skip-reason.enum";
import { MediaCodecFamily } from "./media-codec-family.enum";

// Register SortingOrder as GraphQL enum
registerEnumType(BackupTarget, {
  name: "BackupTarget",
  description: "Backup source to archive and deliver",
});

registerEnumType(SortingOrder, {
  name: "SortingOrder",
  description: "Sorting order",
});

registerEnumType(NotificationMode, {
  name: "NotificationMode",
  description: "Visual mode for notifications",
});

registerEnumType(GlobalAnouncementMessageType, {
  name: "GlobalAnouncementMessageType",
  description: "Display type used for global anouncements",
});

registerEnumType(NotificationSource, {
  name: "NotificationSource",
  description: "Domain source that produced a notification",
});

registerEnumType(NotificationUpdateAction, {
  name: "NotificationUpdateAction",
  description: "Bulk update action for user notifications",
});

registerEnumType(AppSettingValueType, {
  name: "AppSettingValueType",
  description: "Stored app setting value type",
});

registerEnumType(ProductItemType, {
  name: "ProductItemType",
  description: "Calculated product item content type",
});

registerEnumType(ProductReleaseType, {
  name: "ProductReleaseType",
  description: "Calculated product release strategy",
});

registerEnumType(ProductDiscountType, {
  name: "ProductDiscountType",
  description: "Product discount calculation type",
});

registerEnumType(ProductReviewVisibility, {
  name: "ProductReviewVisibility",
  description: "Visibility state for product review content",
});

registerEnumType(ProductReviewModerationTarget, {
  name: "ProductReviewModerationTarget",
  description: "Moderation scope for a product review update",
});

registerEnumType(CouponDiscountType, {
  name: "CouponDiscountType",
  description: "Coupon discount calculation kind",
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

registerEnumType(UserProductPaymentMethod, {
  name: "UserProductPaymentMethod",
  description: "Supported product payment methods",
});

registerEnumType(UserProductPurchaseCurrency, {
  name: "UserProductPurchaseCurrency",
  description: "Currency used for product purchases",
});

registerEnumType(UserProductPurchaseStatus, {
  name: "UserProductPurchaseStatus",
  description: "Product purchase lifecycle status",
});

registerEnumType(PurchaseStatusChangedBy, {
  name: "PurchaseStatusChangedBy",
  description: "Actor that changed a product purchase status",
});

registerEnumType(MediaCompressionQuality, {
  name: "MediaCompressionQuality",
  description: "Detected or requested media compression quality tier",
});

registerEnumType(VideoOutputExtension, {
  name: "VideoOutputExtension",
  description: "Supported video output container formats",
});

registerEnumType(AudioOutputExtension, {
  name: "AudioOutputExtension",
  description: "Supported audio output container formats",
});

registerEnumType(MediaType, {
  name: "MediaType",
  description: "Stored media type",
});

registerEnumType(MediaCompressionSkipReason, {
  name: "MediaCompressionSkipReason",
  description: "Reason media compression was skipped",
});

registerEnumType(MediaCodecFamily, {
  name: "MediaCodecFamily",
  description: "Normalized codec family detected from media probes",
});
