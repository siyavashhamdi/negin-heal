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
    message: "Captcha has expired. Please request a new captcha!",
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
    message: "Password reset link is invalid or has already been used!",
  },

  EXPIRED_PASSWORD_RESET_TOKEN: {
    code: "EXPIRED_PASSWORD_RESET_TOKEN",
    message: "Password reset link has expired!",
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
} as const;
