export const EXCEPTION_CONSTANT = {
  USER_NOT_FOUND: {
    code: "USER_NOT_FOUND",
    message: "User with username '%s' not found!",
  },

  INVALID_CREDENTIALS: {
    code: "INVALID_CREDENTIALS",
    message: "Invalid username or password!",
  },

  CAPTCHA_REQUIRED: {
    code: "CAPTCHA_REQUIRED",
    message: "Captcha is required after multiple failed login attempts!",
  },

  CAPTCHA_EXPIRED: {
    code: "CAPTCHA_EXPIRED",
    message: "Captcha has expired!",
  },

  CAPTCHA_INVALID: {
    code: "CAPTCHA_INVALID",
    message: "Captcha value is incorrect!",
  },

  IDENTITY_REQUIRED: {
    code: "IDENTITY_REQUIRED",
    message:
      "At least one identity is required (username, email, or mobile number)!",
  },

  IDENTITY_ALREADY_EXISTS: {
    code: "IDENTITY_ALREADY_EXISTS",
    message: "The provided identity is already used by another account!",
  },

  USERNAME_ALREADY_EXISTS: {
    code: "USERNAME_ALREADY_EXISTS",
    message: "This username is already used by another account!",
  },

  EMAIL_ALREADY_EXISTS: {
    code: "EMAIL_ALREADY_EXISTS",
    message: "This email is already used by another account!",
  },

  MOBILE_ALREADY_EXISTS: {
    code: "MOBILE_ALREADY_EXISTS",
    message: "This mobile number is already used by another account!",
  },

  SIGNUP_CREDENTIAL_REQUIRED: {
    code: "SIGNUP_CREDENTIAL_REQUIRED",
    message: "Password or signup verification code is required!",
  },

  INVALID_SIGNUP_VERIFICATION_CODE: {
    code: "INVALID_SIGNUP_VERIFICATION_CODE",
    message: "Invalid or expired signup verification code!",
  },

  INVALID_PASSWORD_RESET_TOKEN: {
    code: "INVALID_PASSWORD_RESET_TOKEN",
    message: "Password reset code is invalid or has already been used!",
  },

  INVALID_ACCOUNT_ACTIVATION_TOKEN: {
    code: "INVALID_ACCOUNT_ACTIVATION_TOKEN",
    message: "Account activation link is invalid or has expired!",
  },

  EXPIRED_PASSWORD_RESET_TOKEN: {
    code: "EXPIRED_PASSWORD_RESET_TOKEN",
    message: "Password reset code has expired!",
  },

  EMAIL_SEND_COOLDOWN: {
    code: "EMAIL_SEND_COOLDOWN",
    message:
      "A password reset or verification email was sent recently. Please try again in a few minutes.",
  },

  ACCOUNT_LOCKED: {
    code: "ACCOUNT_LOCKED",
    message: "Account is locked. Please try again later!",
  },

  COURSE_CHAPTER_REQUIRED: {
    code: "COURSE_CHAPTER_REQUIRED",
    message: "At least one course chapter is required!",
  },

  COURSE_CHAPTER_ITEM_REQUIRED: {
    code: "COURSE_CHAPTER_ITEM_REQUIRED",
    message: "Each course chapter must contain at least one item!",
  },

  COURSE_ITEM_CONTENT_REQUIRED: {
    code: "COURSE_ITEM_CONTENT_REQUIRED",
    message: "Each course item must include fileId, article, or both!",
  },

  COURSE_VALIDATION_FAILED: {
    code: "COURSE_VALIDATION_FAILED",
    message: "Course validation failed!",
  },

  COURSE_REFERENCED_FILE_NOT_FOUND: {
    code: "COURSE_REFERENCED_FILE_NOT_FOUND",
    message: "Referenced course file was not found!",
  },

  COURSE_NOT_FOUND: {
    code: "COURSE_NOT_FOUND",
    message: "Course not found!",
  },

  PASSWORD_VALIDATION_FAILED: {
    code: "PASSWORD_VALIDATION_FAILED",
    message: "Password validation failed!",
  },

  PASSWORD_POLICY_VIOLATION: {
    code: "PASSWORD_POLICY_VIOLATION",
    message: "Password does not meet the required policy!",
  },

  UNKNOWN_ERROR_OCCURRED: {
    code: "UNKNOWN_ERROR_OCCURRED",
    message: "An unknown error occurred!",
  },

  INTERNAL_SERVER_ERROR: {
    code: "INTERNAL_SERVER_ERROR",
    message: "An internal server error occurred!",
  },

  UNAUTHENTICATED: {
    code: "UNAUTHENTICATED",
    message: "Authentication required!",
  },

  VALIDATION_FAILED: {
    code: "VALIDATION_FAILED",
    message: "Validation failed!",
  },

  FORBIDDEN: {
    code: "FORBIDDEN",
    message: "Access denied!",
  },

  NOT_FOUND: {
    code: "NOT_FOUND",
    message: "Resource not found!",
  },

  DUPLICATE_KEY: {
    code: "DUPLICATE_KEY",
    message: "Duplicate value!",
  },

  SESSION_EXPIRED: {
    code: "SESSION_EXPIRED",
    message: "Session expired!",
  },

  EMAIL_REQUIRED: {
    code: "EMAIL_REQUIRED",
    message: "A valid email address is required!",
  },

  EMAIL_ALREADY_SET: {
    code: "EMAIL_ALREADY_SET",
    message: "Email is already set!",
  },

  PHONE_ALREADY_SET: {
    code: "PHONE_ALREADY_SET",
    message: "Phone number is already set!",
  },

  INVALID_EMAIL: {
    code: "INVALID_EMAIL",
    message: "Invalid email address!",
  },

  INVALID_MOBILE: {
    code: "INVALID_MOBILE",
    message: "Invalid mobile number!",
  },

  USERNAME_MIN_LENGTH: {
    code: "USERNAME_MIN_LENGTH",
    message: "Username is too short!",
  },

  AVATAR_FILE_NOT_FOUND: {
    code: "AVATAR_FILE_NOT_FOUND",
    message: "Avatar file not found!",
  },

  AVATAR_MUST_BE_IMAGE: {
    code: "AVATAR_MUST_BE_IMAGE",
    message: "Avatar file must be an image!",
  },

  CAPTCHA_GENERATION_FAILED: {
    code: "CAPTCHA_GENERATION_FAILED",
    message: "Captcha generation failed!",
  },

  LATIN_USERNAME_INVALID: {
    code: "LATIN_USERNAME_INVALID",
    message: "Invalid username format!",
  },

  LATIN_EMAIL_INVALID: {
    code: "LATIN_EMAIL_INVALID",
    message: "Invalid email format!",
  },

  LATIN_MOBILE_INVALID: {
    code: "LATIN_MOBILE_INVALID",
    message: "Invalid mobile number format!",
  },

  LATIN_IDENTITY_INVALID: {
    code: "LATIN_IDENTITY_INVALID",
    message: "Invalid identity format!",
  },

  COURSE_NOT_FOUND_OR_INACTIVE: {
    code: "COURSE_NOT_FOUND_OR_INACTIVE",
    message: "Course not found or inactive!",
  },

  COURSE_NOT_AVAILABLE_FOR_REVIEW: {
    code: "COURSE_NOT_AVAILABLE_FOR_REVIEW",
    message: "Course is not available for review!",
  },

  COURSE_REVIEWS_SECTION_DISABLED: {
    code: "COURSE_REVIEWS_SECTION_DISABLED",
    message: "Reviews section is disabled for this course!",
  },

  COURSE_REVIEW_SUBMISSION_DISABLED: {
    code: "COURSE_REVIEW_SUBMISSION_DISABLED",
    message: "Review submission is disabled for this course!",
  },

  COURSE_REVIEW_PAID_ENROLLMENT_REQUIRED: {
    code: "COURSE_REVIEW_PAID_ENROLLMENT_REQUIRED",
    message: "Paid course enrollment is required before submitting a review!",
  },

  STAFF_USER_NOT_FOUND: {
    code: "STAFF_USER_NOT_FOUND",
    message: "Staff user not found!",
  },

  COURSE_REVIEW_ENROLLMENT_USER_MISMATCH: {
    code: "COURSE_REVIEW_ENROLLMENT_USER_MISMATCH",
    message: "Course enrollment does not belong to this user!",
  },

  COURSE_REVIEW_ENROLLMENT_MISMATCH: {
    code: "COURSE_REVIEW_ENROLLMENT_MISMATCH",
    message: "Course enrollment does not match the submitted course!",
  },

  COURSE_REVIEW_INPUT_REQUIRED: {
    code: "COURSE_REVIEW_INPUT_REQUIRED",
    message: "Either a star rating or a comment is required!",
  },

  COURSE_REVIEW_HIDDEN: {
    code: "COURSE_REVIEW_HIDDEN",
    message: "This review has been hidden by moderation!",
  },

  COURSE_REVIEW_NOT_FOUND: {
    code: "COURSE_REVIEW_NOT_FOUND",
    message: "Course review not found!",
  },

  COURSE_REVIEW_NO_RATING: {
    code: "COURSE_REVIEW_NO_RATING",
    message: "This review does not have a rating!",
  },

  COURSE_REVIEW_MESSAGE_KEY_REQUIRED: {
    code: "COURSE_REVIEW_MESSAGE_KEY_REQUIRED",
    message: "Message key is required!",
  },

  COURSE_REVIEW_MESSAGE_NOT_FOUND: {
    code: "COURSE_REVIEW_MESSAGE_NOT_FOUND",
    message: "Review message not found!",
  },

  MODERATION_TARGET_UNSUPPORTED: {
    code: "MODERATION_TARGET_UNSUPPORTED",
    message: "Unsupported moderation target!",
  },

  COURSE_ID_REQUIRED: {
    code: "COURSE_ID_REQUIRED",
    message: "Course ID is required!",
  },

  SUPPORT_REPLY_VISIBILITY_INVALID: {
    code: "SUPPORT_REPLY_VISIBILITY_INVALID",
    message: "Support reply visibility is invalid!",
  },

  COURSE_REVIEW_CONFLICT: {
    code: "COURSE_REVIEW_CONFLICT",
    message: "Conflicting review records exist!",
  },

  COURSE_REVIEW_ENROLLMENT_LINKED: {
    code: "COURSE_REVIEW_ENROLLMENT_LINKED",
    message: "Course enrollment is already linked to a different review!",
  },

  COURSE_REVIEW_ALREADY_EXISTS: {
    code: "COURSE_REVIEW_ALREADY_EXISTS",
    message: "A review already exists for this course enrollment!",
  },

  STAFF_ONLY_CROSS_USER_REVIEW: {
    code: "STAFF_ONLY_CROSS_USER_REVIEW",
    message: "Only staff accounts can submit reviews for another user!",
  },

  COURSE_ALREADY_PURCHASED: {
    code: "COURSE_ALREADY_PURCHASED",
    message: "You have already purchased this course!",
  },

  COURSE_PENDING_PURCHASE: {
    code: "COURSE_PENDING_PURCHASE",
    message: "You already have a pending purchase for this course!",
  },

  COURSE_PURCHASE_EXISTS: {
    code: "COURSE_PURCHASE_EXISTS",
    message: "You already have a purchase record for this course!",
  },

  PAYMENT_NOT_FOUND: {
    code: "PAYMENT_NOT_FOUND",
    message: "Payment record not found!",
  },

  MANUAL_PAYMENT_PAID_COURSE_ONLY: {
    code: "MANUAL_PAYMENT_PAID_COURSE_ONLY",
    message: "Manual payment can only be created for active paid courses!",
  },

  MANUAL_PAYMENT_END_USER_ONLY: {
    code: "MANUAL_PAYMENT_END_USER_ONLY",
    message: "Manual payment can only be created for active end-user accounts!",
  },

  USER_COURSE_ALREADY_PAID: {
    code: "USER_COURSE_ALREADY_PAID",
    message: "This user has already paid for this course!",
  },

  USER_COURSE_PURCHASE_EXISTS: {
    code: "USER_COURSE_PURCHASE_EXISTS",
    message: "This user already has a purchase record for this course!",
  },

  COURSE_ENROLLMENT_NOT_FOUND: {
    code: "COURSE_ENROLLMENT_NOT_FOUND",
    message: "Course enrollment was not found!",
  },

  CHAPTER_COMPLETION_REQUIRES_PURCHASE: {
    code: "CHAPTER_COMPLETION_REQUIRES_PURCHASE",
    message: "Chapter completion requires a confirmed purchase!",
  },

  CHAPTER_NOT_FOUND: {
    code: "CHAPTER_NOT_FOUND",
    message: "Chapter was not found in this course!",
  },

  CHAPTER_LOCKED: {
    code: "CHAPTER_LOCKED",
    message: "This chapter is locked!",
  },

  CHAPTER_COMPLETION_FAILED: {
    code: "CHAPTER_COMPLETION_FAILED",
    message: "Chapter completion could not be recorded!",
  },

  COURSE_ID_INVALID: {
    code: "COURSE_ID_INVALID",
    message: "Course ID is invalid!",
  },

  PAYMENT_METHOD_NOT_SUPPORTED: {
    code: "PAYMENT_METHOD_NOT_SUPPORTED",
    message: "Payment method is not supported!",
  },

  PAYMENT_REFERENCE_REQUIRED: {
    code: "PAYMENT_REFERENCE_REQUIRED",
    message: "Payment reference is required!",
  },

  RECEIPT_FILE_REQUIRED: {
    code: "RECEIPT_FILE_REQUIRED",
    message: "Receipt file is required!",
  },

  CARD_TO_CARD_EVIDENCE_REQUIRED: {
    code: "CARD_TO_CARD_EVIDENCE_REQUIRED",
    message: "Payment reference or receipt file is required!",
  },

  TRANSACTION_ID_REQUIRED: {
    code: "TRANSACTION_ID_REQUIRED",
    message: "Transaction ID is required!",
  },

  FREE_PURCHASE_NO_EVIDENCE: {
    code: "FREE_PURCHASE_NO_EVIDENCE",
    message: "Free purchases cannot include manual payment evidence!",
  },

  GATEWAY_PURCHASE_NO_EVIDENCE: {
    code: "GATEWAY_PURCHASE_NO_EVIDENCE",
    message: "Gateway purchases cannot include manual payment evidence!",
  },

  USER_ID_INVALID: {
    code: "USER_ID_INVALID",
    message: "User ID is invalid!",
  },

  PURCHASE_STATUS_NOT_SUPPORTED: {
    code: "PURCHASE_STATUS_NOT_SUPPORTED",
    message: "Purchase status is not supported!",
  },

  ZARINPAL_CONNECTION_FAILED: {
    code: "ZARINPAL_CONNECTION_FAILED",
    message: "Unable to connect to payment gateway!",
  },

  ZARINPAL_PAYMENT_FAILED: {
    code: "ZARINPAL_PAYMENT_FAILED",
    message: "Payment gateway request failed!",
  },

  ZARINPAL_CONFIG_ERROR: {
    code: "ZARINPAL_CONFIG_ERROR",
    message: "Payment gateway configuration error!",
  },

  ZARINPAL_MISSING_AUTHORITY: {
    code: "ZARINPAL_MISSING_AUTHORITY",
    message: "Payment authority is missing!",
  },

  ZARINPAL_PURCHASE_NOT_FOUND: {
    code: "ZARINPAL_PURCHASE_NOT_FOUND",
    message: "Payment purchase record was not found!",
  },

  ZARINPAL_VERIFICATION_FAILED: {
    code: "ZARINPAL_VERIFICATION_FAILED",
    message: "Payment verification failed!",
  },

  ZARINPAL_VERIFICATION_ERROR: {
    code: "ZARINPAL_VERIFICATION_ERROR",
    message: "Payment verification error!",
  },

  COUPON_INVALID_FOR_PURCHASE: {
    code: "COUPON_INVALID_FOR_PURCHASE",
    message: "Coupon is not valid for this purchase!",
  },

  COUPON_VALIDATION_INCOMPLETE: {
    code: "COUPON_VALIDATION_INCOMPLETE",
    message: "Coupon validation response is incomplete!",
  },

  FREE_PURCHASE_AMOUNT_MISMATCH: {
    code: "FREE_PURCHASE_AMOUNT_MISMATCH",
    message: "Free purchase is only available when the final amount is zero!",
  },

  FREE_PAYMENT_METHOD_REQUIRED: {
    code: "FREE_PAYMENT_METHOD_REQUIRED",
    message: "Use the free payment method when the final amount is zero!",
  },

  RECEIPT_FILE_NOT_FOUND: {
    code: "RECEIPT_FILE_NOT_FOUND",
    message: "Uploaded receipt file not found!",
  },

  PAYMENT_EVIDENCE_NOT_FOUND: {
    code: "PAYMENT_EVIDENCE_NOT_FOUND",
    message: "Uploaded payment evidence file not found!",
  },

  COUPON_CODE_EMPTY: {
    code: "COUPON_CODE_EMPTY",
    message: "Coupon code is required!",
  },

  COUPON_NOT_NEEDED_FOR_FREE_COURSE: {
    code: "COUPON_NOT_NEEDED_FOR_FREE_COURSE",
    message: "This course is free and does not need a coupon!",
  },

  COUPON_INVALID: {
    code: "COUPON_INVALID",
    message: "Coupon is not valid!",
  },

  COUPON_INACTIVE: {
    code: "COUPON_INACTIVE",
    message: "Coupon is not active!",
  },

  COUPON_NOT_STARTED: {
    code: "COUPON_NOT_STARTED",
    message: "Coupon is not active yet!",
  },

  COUPON_EXPIRED: {
    code: "COUPON_EXPIRED",
    message: "Coupon has expired!",
  },

  COUPON_NOT_APPLICABLE_TO_COURSE: {
    code: "COUPON_NOT_APPLICABLE_TO_COURSE",
    message: "Coupon is not applicable to this course!",
  },

  COUPON_USAGE_LIMIT_REACHED: {
    code: "COUPON_USAGE_LIMIT_REACHED",
    message: "Coupon usage limit has been reached!",
  },

  COUPON_USER_LIMIT_REACHED: {
    code: "COUPON_USER_LIMIT_REACHED",
    message: "You have already used this coupon!",
  },

  COUPON_FIRST_PURCHASE_ONLY: {
    code: "COUPON_FIRST_PURCHASE_ONLY",
    message: "Coupon is only valid for the first purchase!",
  },

  COUPON_NO_DISCOUNT_APPLIED: {
    code: "COUPON_NO_DISCOUNT_APPLIED",
    message: "Coupon does not reduce the payable amount!",
  },

  COUPON_NOT_FOUND: {
    code: "COUPON_NOT_FOUND",
    message: "Coupon not found!",
  },

  COUPON_CODE_EXISTS: {
    code: "COUPON_CODE_EXISTS",
    message: "Coupon code already exists!",
  },

  COUPON_CODE_REQUIRED: {
    code: "COUPON_CODE_REQUIRED",
    message: "Coupon code is required!",
  },

  COUPON_DISCOUNT_INVALID: {
    code: "COUPON_DISCOUNT_INVALID",
    message: "Coupon discount value is invalid!",
  },

  COUPON_PERCENTAGE_INVALID: {
    code: "COUPON_PERCENTAGE_INVALID",
    message: "Coupon percentage value is invalid!",
  },

  COUPON_DATE_RANGE_INVALID: {
    code: "COUPON_DATE_RANGE_INVALID",
    message: "Coupon date range is invalid!",
  },

  COUPON_COURSE_IDS_INVALID: {
    code: "COUPON_COURSE_IDS_INVALID",
    message: "One or more applicable course IDs are invalid!",
  },

  COUPON_FIELD_NULL: {
    code: "COUPON_FIELD_NULL",
    message: "Coupon field cannot be null!",
  },

  TICKET_NOT_FOUND: {
    code: "TICKET_NOT_FOUND",
    message: "Ticket not found!",
  },

  TICKET_OWNERSHIP_REQUIRED: {
    code: "TICKET_OWNERSHIP_REQUIRED",
    message: "You can only update your own support tickets!",
  },

  TICKET_CLOSE_OWNERSHIP_REQUIRED: {
    code: "TICKET_CLOSE_OWNERSHIP_REQUIRED",
    message: "You can only close your own support tickets!",
  },

  TICKET_CATEGORY_REQUIRED: {
    code: "TICKET_CATEGORY_REQUIRED",
    message: "Ticket category is required!",
  },

  END_USER_ID_REQUIRED: {
    code: "END_USER_ID_REQUIRED",
    message: "End-user ID is required!",
  },

  END_USER_NOT_FOUND: {
    code: "END_USER_NOT_FOUND",
    message: "End user not found!",
  },

  ASSIGNED_USER_MUST_BE_END_USER: {
    code: "ASSIGNED_USER_MUST_BE_END_USER",
    message: "Assigned user must have end-user role!",
  },

  TICKET_ID_INVALID: {
    code: "TICKET_ID_INVALID",
    message: "Ticket ID is invalid!",
  },

  NOTIFICATION_OWNERSHIP_REQUIRED: {
    code: "NOTIFICATION_OWNERSHIP_REQUIRED",
    message: "One or more notifications do not belong to the current user!",
  },

  FILE_NAME_REQUIRED: {
    code: "FILE_NAME_REQUIRED",
    message: "File name is required!",
  },

  FILE_SIZE_INVALID: {
    code: "FILE_SIZE_INVALID",
    message: "File size is invalid!",
  },

  FILE_SIZE_EXCEEDED: {
    code: "FILE_SIZE_EXCEEDED",
    message: "File size exceeds the allowed limit!",
  },

  FILE_FORMAT_NOT_ALLOWED: {
    code: "FILE_FORMAT_NOT_ALLOWED",
    message: "File format is not allowed!",
  },

  EXECUTABLE_FILE_NOT_ALLOWED: {
    code: "EXECUTABLE_FILE_NOT_ALLOWED",
    message: "Executable files are not allowed!",
  },

  FILE_NOT_FOUND: {
    code: "FILE_NOT_FOUND",
    message: "File not found!",
  },

  FILE_PATH_INVALID: {
    code: "FILE_PATH_INVALID",
    message: "Stored file path is invalid!",
  },

  FILE_UPLOAD_BUCKET_ERROR: {
    code: "FILE_UPLOAD_BUCKET_ERROR",
    message: "File storage is unavailable!",
  },

  CONTENT_LENGTH_REQUIRED: {
    code: "CONTENT_LENGTH_REQUIRED",
    message: "Content-Length header is required!",
  },

  FILE_NAME_HEADER_REQUIRED: {
    code: "FILE_NAME_HEADER_REQUIRED",
    message: "X-File-Name header is required!",
  },

  FILE_NAME_HEADER_INVALID: {
    code: "FILE_NAME_HEADER_INVALID",
    message: "X-File-Name header is invalid!",
  },

  FILE_ACCESS_TOKEN_INVALID: {
    code: "FILE_ACCESS_TOKEN_INVALID",
    message: "File access token is invalid or expired!",
  },

  APP_SETTING_NOT_FOUND: {
    code: "APP_SETTING_NOT_FOUND",
    message: "App setting not found!",
  },

  APP_SETTING_VALUE_TYPE_UNSUPPORTED: {
    code: "APP_SETTING_VALUE_TYPE_UNSUPPORTED",
    message: "Unsupported app setting value type!",
  },

  APP_SETTING_VALUE_INVALID: {
    code: "APP_SETTING_VALUE_INVALID",
    message: "App setting value is invalid!",
  },

  GLOBAL_ANNOUNCEMENT_DESCRIPTION_REQUIRED: {
    code: "GLOBAL_ANNOUNCEMENT_DESCRIPTION_REQUIRED",
    message: "Global announcement description is required!",
  },

  GLOBAL_ANNOUNCEMENT_TITLE_REQUIRED: {
    code: "GLOBAL_ANNOUNCEMENT_TITLE_REQUIRED",
    message: "Global announcement title is required!",
  },

  END_USER_ONLY: {
    code: "END_USER_ONLY",
    message: "This action is only available to end-user accounts!",
  },

  END_USER_OR_ANONYMOUS_ONLY: {
    code: "END_USER_OR_ANONYMOUS_ONLY",
    message: "This action is only available to guests or end-user accounts!",
  },

  COURSE_VALIDATION_TITLE_REQUIRED: {
    code: "COURSE_VALIDATION_TITLE_REQUIRED",
    message: "Course title is required!",
  },

  COURSE_VALIDATION_PRICE_NEGATIVE: {
    code: "COURSE_VALIDATION_PRICE_NEGATIVE",
    message: "Course price cannot be negative!",
  },

  COURSE_VALIDATION_DISCOUNT_POSITIVE: {
    code: "COURSE_VALIDATION_DISCOUNT_POSITIVE",
    message: "Discount value must be positive!",
  },

  COURSE_VALIDATION_DISCOUNT_PERCENTAGE_RANGE: {
    code: "COURSE_VALIDATION_DISCOUNT_PERCENTAGE_RANGE",
    message: "Percentage discount must be between 0 and 100!",
  },

  COURSE_VALIDATION_DISCOUNT_FIXED_TOO_HIGH: {
    code: "COURSE_VALIDATION_DISCOUNT_FIXED_TOO_HIGH",
    message: "Fixed discount cannot exceed the course price!",
  },

  COURSE_VALIDATION_CHAPTER_TITLE_REQUIRED: {
    code: "COURSE_VALIDATION_CHAPTER_TITLE_REQUIRED",
    message: "Chapter title is required!",
  },

  COURSE_VALIDATION_VISIBLE_AFTER_NEGATIVE: {
    code: "COURSE_VALIDATION_VISIBLE_AFTER_NEGATIVE",
    message: "Visible-after value cannot be negative!",
  },

  COURSE_ITEM_FILE_AND_ARTICLE_BOTH: {
    code: "COURSE_ITEM_FILE_AND_ARTICLE_BOTH",
    message: "Course item cannot include both file and article!",
  },
} as const;
