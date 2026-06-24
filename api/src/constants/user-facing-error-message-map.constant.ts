import { EXCEPTION_CONSTANT } from "./exception.constant";

type ErrorCode = (typeof EXCEPTION_CONSTANT)[keyof typeof EXCEPTION_CONSTANT]["code"];

const EXACT_MESSAGE_TO_CODE = new Map<string, ErrorCode>([
  ["User not found", "USER_NOT_FOUND"],
  ["A valid email address is required", "EMAIL_REQUIRED"],
  [
    "Email is already set. Please contact support to change it.",
    "EMAIL_ALREADY_SET",
  ],
  [
    "Phone number is already set. Please contact support to change it.",
    "PHONE_ALREADY_SET",
  ],
  ["Avatar file not found", "AVATAR_FILE_NOT_FOUND"],
  ["Avatar file must be an image", "AVATAR_MUST_BE_IMAGE"],
  ["Unable to generate captcha image", "CAPTCHA_GENERATION_FAILED"],
  [
    "Invalid token, session expired, or user not found",
    "SESSION_EXPIRED",
  ],
  ["User not authenticated", "UNAUTHENTICATED"],
  ["Course not found", "COURSE_NOT_FOUND"],
  ["Course not found or inactive", "COURSE_NOT_FOUND_OR_INACTIVE"],
  ["Course is not available for review", "COURSE_NOT_AVAILABLE_FOR_REVIEW"],
  ["Staff user not found", "STAFF_USER_NOT_FOUND"],
  [
    "Course enrollment does not belong to this user",
    "COURSE_REVIEW_ENROLLMENT_USER_MISMATCH",
  ],
  [
    "Course enrollment does not match the submitted course",
    "COURSE_REVIEW_ENROLLMENT_MISMATCH",
  ],
  [
    "Either a star rating or a comment is required",
    "COURSE_REVIEW_INPUT_REQUIRED",
  ],
  [
    "You cannot update a review that has been hidden by moderation",
    "COURSE_REVIEW_HIDDEN",
  ],
  ["Course review not found", "COURSE_REVIEW_NOT_FOUND"],
  ["This review does not have a rating", "COURSE_REVIEW_NO_RATING"],
  [
    "Message key is required when updating message moderation",
    "COURSE_REVIEW_MESSAGE_KEY_REQUIRED",
  ],
  ["Review message not found", "COURSE_REVIEW_MESSAGE_NOT_FOUND"],
  ["Unsupported moderation target", "MODERATION_TARGET_UNSUPPORTED"],
  ["Course ID is required", "COURSE_ID_REQUIRED"],
  [
    "Support reply visibility must be PUBLIC or PRIVATE",
    "SUPPORT_REPLY_VISIBILITY_INVALID",
  ],
  [
    "Conflicting review records exist for this course enrollment",
    "COURSE_REVIEW_CONFLICT",
  ],
  [
    "This course enrollment is already linked to a different review",
    "COURSE_REVIEW_ENROLLMENT_LINKED",
  ],
  [
    "A review already exists for this course enrollment",
    "COURSE_REVIEW_ALREADY_EXISTS",
  ],
  [
    "Only staff accounts can submit reviews for another user",
    "STAFF_ONLY_CROSS_USER_REVIEW",
  ],
  ["You have already purchased this course", "COURSE_ALREADY_PURCHASED"],
  [
    "You already have a pending purchase for this course",
    "COURSE_PENDING_PURCHASE",
  ],
  [
    "You already have a purchase record for this course",
    "COURSE_PURCHASE_EXISTS",
  ],
  ["Payment record not found", "PAYMENT_NOT_FOUND"],
  [
    "Manual payment can only be created for active paid courses",
    "MANUAL_PAYMENT_PAID_COURSE_ONLY",
  ],
  [
    "Manual payment can only be created for active END_USER accounts",
    "MANUAL_PAYMENT_END_USER_ONLY",
  ],
  [
    "This user already has a purchase record for this course",
    "USER_COURSE_PURCHASE_EXISTS",
  ],
  [
    "Course enrollment was not found for this user",
    "COURSE_ENROLLMENT_NOT_FOUND",
  ],
  [
    "Chapter completion is only available after course purchase is confirmed",
    "CHAPTER_COMPLETION_REQUIRES_PURCHASE",
  ],
  ["Chapter was not found in this course", "CHAPTER_NOT_FOUND"],
  [
    "This chapter is locked and cannot be marked as completed yet",
    "CHAPTER_LOCKED",
  ],
  [
    "Chapter completion could not be recorded. Please try again",
    "CHAPTER_COMPLETION_FAILED",
  ],
  ["Course ID is invalid", "COURSE_ID_INVALID"],
  ["Payment method is not supported", "PAYMENT_METHOD_NOT_SUPPORTED"],
  [
    "Payment reference is required for card-to-card purchases",
    "PAYMENT_REFERENCE_REQUIRED",
  ],
  [
    "Uploaded receipt file ID is required for card-to-card purchases",
    "RECEIPT_FILE_REQUIRED",
  ],
  [
    "Payment reference or uploaded receipt file is required for card-to-card purchases",
    "CARD_TO_CARD_EVIDENCE_REQUIRED",
  ],
  [
    "Transaction ID is required for cryptocurrency purchases",
    "TRANSACTION_ID_REQUIRED",
  ],
  [
    "Free purchases cannot include manual payment evidence",
    "FREE_PURCHASE_NO_EVIDENCE",
  ],
  [
    "Gateway purchases cannot include manual payment evidence",
    "GATEWAY_PURCHASE_NO_EVIDENCE",
  ],
  ["User ID is invalid", "USER_ID_INVALID"],
  ["Purchase status is not supported", "PURCHASE_STATUS_NOT_SUPPORTED"],
  ["Unable to connect to ZarinPal", "ZARINPAL_CONNECTION_FAILED"],
  ["ZarinPal payment request failed", "ZARINPAL_PAYMENT_FAILED"],
  ["ZarinPal config is not configured", "ZARINPAL_CONFIG_ERROR"],
  ["ZarinPal config is invalid", "ZARINPAL_CONFIG_ERROR"],
  ["ZarinPal min amount is not configured", "ZARINPAL_CONFIG_ERROR"],
  ["ZarinPal merchant ID is not configured", "ZARINPAL_CONFIG_ERROR"],
  ["Coupon validation response is incomplete", "COUPON_VALIDATION_INCOMPLETE"],
  [
    "Free purchase is only available when the final amount is zero",
    "FREE_PURCHASE_AMOUNT_MISMATCH",
  ],
  [
    "Use FREE payment method when the final amount is zero",
    "FREE_PAYMENT_METHOD_REQUIRED",
  ],
  ["Uploaded receipt file not found", "RECEIPT_FILE_NOT_FOUND"],
  ["Uploaded payment evidence file not found", "PAYMENT_EVIDENCE_NOT_FOUND"],
  ["Ticket not found", "TICKET_NOT_FOUND"],
  ["You can only update your own support tickets", "TICKET_OWNERSHIP_REQUIRED"],
  ["You can only close your own support tickets", "TICKET_CLOSE_OWNERSHIP_REQUIRED"],
  ["Ticket category is required", "TICKET_CATEGORY_REQUIRED"],
  ["End-user ID is required", "END_USER_ID_REQUIRED"],
  ["End user not found", "END_USER_NOT_FOUND"],
  ["Assigned user must have END_USER role", "ASSIGNED_USER_MUST_BE_END_USER"],
  [
    "Ticket ID must be a valid MongoDB ObjectId",
    "TICKET_ID_INVALID",
  ],
  [
    "One or more notifications do not belong to the current user",
    "NOTIFICATION_OWNERSHIP_REQUIRED",
  ],
  ["File name is required", "FILE_NAME_REQUIRED"],
  ["File size must be zero or greater", "FILE_SIZE_INVALID"],
  ["Executable files are not allowed", "EXECUTABLE_FILE_NOT_ALLOWED"],
  ["File not found", "FILE_NOT_FOUND"],
  ["Stored file path is invalid", "FILE_PATH_INVALID"],
  ["Content-Length header is required", "CONTENT_LENGTH_REQUIRED"],
  ["X-File-Name header is required", "FILE_NAME_HEADER_REQUIRED"],
  ["X-File-Name header is invalid", "FILE_NAME_HEADER_INVALID"],
  ["Invalid or expired file access token", "FILE_ACCESS_TOKEN_INVALID"],
  ["Coupon not found", "COUPON_NOT_FOUND"],
  ["Coupon code already exists", "COUPON_CODE_EXISTS"],
  ["Coupon code is required", "COUPON_CODE_REQUIRED"],
  [
    "Coupon discount value must be greater than 0",
    "COUPON_DISCOUNT_INVALID",
  ],
  [
    "Percentage coupon discount value cannot be greater than 100",
    "COUPON_PERCENTAGE_INVALID",
  ],
  [
    "Coupon start date cannot be later than expiration date",
    "COUPON_DATE_RANGE_INVALID",
  ],
  ["One or more applicable course IDs do not exist", "COUPON_COURSE_IDS_INVALID"],
  ["Coupon code cannot be null", "COUPON_FIELD_NULL"],
  ["Coupon title cannot be null", "COUPON_FIELD_NULL"],
  ["Coupon discount type cannot be null", "COUPON_FIELD_NULL"],
  ["Coupon discount value cannot be null", "COUPON_FIELD_NULL"],
  ["First-purchase-only flag cannot be null", "COUPON_FIELD_NULL"],
  ["Active status cannot be null", "COUPON_FIELD_NULL"],
  ["App setting not found", "APP_SETTING_NOT_FOUND"],
  ["Unsupported app setting value type", "APP_SETTING_VALUE_TYPE_UNSUPPORTED"],
  [
    "Value is required when changing the app setting value type",
    "APP_SETTING_VALUE_INVALID",
  ],
  [
    "String app setting value must be provided as a string",
    "APP_SETTING_VALUE_INVALID",
  ],
  [
    "Number app setting value must be a finite number",
    "APP_SETTING_VALUE_INVALID",
  ],
  [
    "Boolean app setting value must be a boolean",
    "APP_SETTING_VALUE_INVALID",
  ],
  [
    "JSON app setting value must be a valid JSON value",
    "APP_SETTING_VALUE_INVALID",
  ],
  ["JSON app setting value must be valid JSON", "APP_SETTING_VALUE_INVALID"],
  [
    "Global anouncement description is required",
    "GLOBAL_ANNOUNCEMENT_DESCRIPTION_REQUIRED",
  ],
  [
    "Global anouncement title is required for popup messages",
    "GLOBAL_ANNOUNCEMENT_TITLE_REQUIRED",
  ],
  ["Not found", "NOT_FOUND"],
  ["An internal server error occurred", "INTERNAL_SERVER_ERROR"],
  ["Internal server error", "INTERNAL_SERVER_ERROR"],
  ["Validation failed", "VALIDATION_FAILED"],
  ["Coupon is not valid for this purchase", "COUPON_INVALID_FOR_PURCHASE"],
  [
    "Username must start with an English letter or number and may only contain letters, numbers, dots, underscores, and hyphens",
    "LATIN_USERNAME_INVALID",
  ],
  [
    "Email must start with an English letter or number and be a valid email address",
    "LATIN_EMAIL_INVALID",
  ],
  [
    "Mobile number must be 09xxxxxxxxx, 9xxxxxxxxx, 989xxxxxxxxx, exactly +989xxxxxxxxx, or + followed by at least 8 digits",
    "LATIN_MOBILE_INVALID",
  ],
  [
    "Identity must start with an English letter or number and be a valid username, email, or mobile number",
    "LATIN_IDENTITY_INVALID",
  ],
  [
    "Email must start with an English letter or number and may only contain valid email symbols",
    "LATIN_EMAIL_INVALID",
  ],
  [
    "Identity must start with an English letter or number and may only contain valid symbols",
    "LATIN_IDENTITY_INVALID",
  ],
  ["نام کاربری باید حداقل ۵ کاراکتر باشد.", "USERNAME_MIN_LENGTH"],
  ["شماره موبایل وارد شده معتبر نیست.", "INVALID_MOBILE"],
  ["ایمیل وارد شده معتبر نیست.", "INVALID_EMAIL"],
  ["حجم فایل بیش از حد مجاز است.", "FILE_SIZE_EXCEEDED"],
  ["بخش نظرات برای این دوره غیرفعال است.", "COURSE_REVIEWS_SECTION_DISABLED"],
  ["ثبت نظر برای این دوره غیرفعال است.", "COURSE_REVIEW_SUBMISSION_DISABLED"],
  [
    "برای ثبت نظر، ابتدا باید در این دورهٔ پولی ثبت‌نام کرده باشید.",
    "COURSE_REVIEW_PAID_ENROLLMENT_REQUIRED",
  ],
  ["این کاربر قبلاً این دوره را پرداخت کرده است", "USER_COURSE_ALREADY_PAID"],
  ["عنوان دوره الزامی است.", "COURSE_VALIDATION_TITLE_REQUIRED"],
  ["قیمت دوره نمی‌تواند منفی باشد.", "COURSE_VALIDATION_PRICE_NEGATIVE"],
  ["مقدار تخفیف باید عددی مثبت باشد.", "COURSE_VALIDATION_DISCOUNT_POSITIVE"],
  [
    "مقدار تخفیف درصدی باید بین ۰ تا ۱۰۰ باشد.",
    "COURSE_VALIDATION_DISCOUNT_PERCENTAGE_RANGE",
  ],
  [
    "مقدار تخفیف ثابت نمی‌تواند بیشتر از قیمت دوره باشد.",
    "COURSE_VALIDATION_DISCOUNT_FIXED_TOO_HIGH",
  ],
  ["حداقل یک فصل لازم است.", "COURSE_CHAPTER_REQUIRED"],
  ["کد تخفیف را وارد کنید.", "COUPON_CODE_EMPTY"],
  ["دوره موردنظر پیدا نشد یا فعال نیست.", "COURSE_NOT_FOUND_OR_INACTIVE"],
  ["شما قبلاً برای این دوره خرید فعال دارید.", "COURSE_ALREADY_PURCHASED"],
  [
    "این دوره رایگان است و نیازی به کد تخفیف ندارد.",
    "COUPON_NOT_NEEDED_FOR_FREE_COURSE",
  ],
  ["کد تخفیف معتبر نیست.", "COUPON_INVALID"],
  ["این کد تخفیف فعال نیست.", "COUPON_INACTIVE"],
  [
    "زمان استفاده از این کد تخفیف هنوز شروع نشده است.",
    "COUPON_NOT_STARTED",
  ],
  [
    "مهلت استفاده از این کد تخفیف به پایان رسیده است.",
    "COUPON_EXPIRED",
  ],
  [
    "این کد تخفیف برای این دوره قابل استفاده نیست.",
    "COUPON_NOT_APPLICABLE_TO_COURSE",
  ],
  [
    "ظرفیت استفاده از این کد تخفیف تکمیل شده است.",
    "COUPON_USAGE_LIMIT_REACHED",
  ],
  ["شما قبلاً از این کد تخفیف استفاده کرده‌اید.", "COUPON_USER_LIMIT_REACHED"],
  [
    "این کد تخفیف فقط برای اولین خرید قابل استفاده است.",
    "COUPON_FIRST_PURCHASE_ONLY",
  ],
  [
    "این کد تخفیف مبلغ قابل پرداخت را کاهش نمی‌دهد.",
    "COUPON_NO_DISCOUNT_APPLIED",
  ],
]);

const PREFIX_MESSAGE_TO_CODE: Array<{ prefix: string; code: ErrorCode }> = [
  { prefix: "Access denied. Required roles:", code: "FORBIDDEN" },
  { prefix: "ZarinPal ", code: "ZARINPAL_CONFIG_ERROR" },
  { prefix: "Unable to prepare MinIO bucket:", code: "FILE_UPLOAD_BUCKET_ERROR" },
  { prefix: "فرمت مجاز نیست.", code: "FILE_FORMAT_NOT_ALLOWED" },
  { prefix: "عنوان ", code: "COURSE_VALIDATION_CHAPTER_TITLE_REQUIRED" },
  { prefix: "مقدار «نمایش بعد از» در ", code: "COURSE_VALIDATION_VISIBLE_AFTER_NEGATIVE" },
];

const INCLUDES_MESSAGE_TO_CODE: Array<{ includes: string; code: ErrorCode }> = [
  { includes: "is only available to END_USER accounts", code: "END_USER_ONLY" },
  {
    includes: "is only available to anonymous users and END_USER accounts",
    code: "END_USER_OR_ANONYMOUS_ONLY",
  },
  { includes: "already exists", code: "DUPLICATE_KEY" },
  { includes: "is required", code: "VALIDATION_FAILED" },
  { includes: "must be", code: "VALIDATION_FAILED" },
  { includes: "cannot be", code: "VALIDATION_FAILED" },
  { includes: "باید حداقل یک آیتم داشته باشد", code: "COURSE_CHAPTER_ITEM_REQUIRED" },
  {
    includes: "نمی‌تواند هم‌زمان فایل و متن مقاله داشته باشد",
    code: "COURSE_ITEM_FILE_AND_ARTICLE_BOTH",
  },
  {
    includes: "الزامی است. فایل آپلود کنید یا متن مقاله وارد کنید",
    code: "COURSE_ITEM_CONTENT_REQUIRED",
  },
];

function normalizeMessage(message: string): string {
  return message.trim().replace(/\s+/g, " ");
}

export function resolveErrorCodeFromMessage(message: string): ErrorCode | undefined {
  const normalized = normalizeMessage(message);
  if (!normalized) {
    return undefined;
  }

  const exact = EXACT_MESSAGE_TO_CODE.get(normalized);
  if (exact) {
    return exact;
  }

  for (const entry of PREFIX_MESSAGE_TO_CODE) {
    if (normalized.startsWith(entry.prefix)) {
      return entry.code;
    }
  }

  for (const entry of INCLUDES_MESSAGE_TO_CODE) {
    if (normalized.includes(entry.includes)) {
      return entry.code;
    }
  }

  return undefined;
}
