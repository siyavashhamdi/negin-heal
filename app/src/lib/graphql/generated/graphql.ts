/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any };
};

export type CourseChapterGqlInput = {
  /** Chapter description */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Stored file ID used as the chapter icon */
  iconFileId?: InputMaybe<Scalars["ID"]["input"]>;
  /** Whether the chapter is free to access */
  isFree: Scalars["Boolean"]["input"];
  /** Chapter items */
  items: Array<CourseItemGqlInput>;
  /** Optional chapter sort order */
  sortOrder?: InputMaybe<Scalars["Int"]["input"]>;
  /** Chapter title */
  title: Scalars["String"]["input"];
  /** Number of minutes after purchase/enrollment when visible */
  visibleAfterMinutes?: InputMaybe<Scalars["Int"]["input"]>;
};

export type CourseCreateGqlInput = {
  /** Course chapters */
  chapters: Array<CourseChapterGqlInput>;
  /** Stored file ID used as the course cover image */
  coverImageFileId?: InputMaybe<Scalars["ID"]["input"]>;
  /** Course description */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Optional course discount */
  discount?: InputMaybe<CourseDiscountGqlInput>;
  /** Whether the course is active */
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Course price in IRT */
  priceIrt?: InputMaybe<Scalars["Float"]["input"]>;
  /** Course display rank used for manual ordering */
  sortOrder?: InputMaybe<Scalars["Float"]["input"]>;
  /** Course tags */
  tags?: InputMaybe<Array<Scalars["String"]["input"]>>;
  /** Course title */
  title: Scalars["String"]["input"];
};

export type CourseDeleteGqlInput = {
  /** Course ID */
  id: Scalars["ID"]["input"];
};

export type CourseDiscountGqlInput = {
  /** Discount calculation type */
  type: CourseDiscountType;
  /** Discount value. Percentage for PERCENTAGE, IRT amount for FIXED_AMOUNT_IRT */
  value: Scalars["Float"]["input"];
};

/** Course discount calculation type */
export const CourseDiscountType = {
  FIXED_AMOUNT_IRT: "FIXED_AMOUNT_IRT",
  PERCENTAGE: "PERCENTAGE",
} as const;

export type CourseDiscountType = (typeof CourseDiscountType)[keyof typeof CourseDiscountType];
export type CourseItemGqlInput = {
  /** Article body when this item is text-based */
  article?: InputMaybe<Scalars["String"]["input"]>;
  /** Stored file ID attached to this item */
  fileId?: InputMaybe<Scalars["ID"]["input"]>;
  /** Optional item sort order inside its chapter */
  sortOrder?: InputMaybe<Scalars["Int"]["input"]>;
  /** Course item title */
  title: Scalars["String"]["input"];
};

/** Calculated course item content type */
export const CourseItemType = {
  ARTICLE: "ARTICLE",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  VOICE: "VOICE",
} as const;

export type CourseItemType = (typeof CourseItemType)[keyof typeof CourseItemType];
export type CourseListChapterGqlResponse = {
  __typename?: "CourseListChapterGqlResponse";
  /** Chapter description */
  description?: Maybe<Scalars["String"]["output"]>;
  /** Stored file ID used as the chapter icon */
  iconFileId?: Maybe<Scalars["ID"]["output"]>;
  /** Whether the chapter is free to access */
  isFree: Scalars["Boolean"]["output"];
  /** Chapter items */
  items: Array<CourseListItemGqlResponse>;
  /** Optional chapter sort order */
  sortOrder?: Maybe<Scalars["Int"]["output"]>;
  /** Chapter title */
  title: Scalars["String"]["output"];
  /** Number of minutes after purchase/enrollment when visible */
  visibleAfterMinutes?: Maybe<Scalars["Int"]["output"]>;
};

export type CourseListCursorPageOptionsParamsInput = {
  /** Maximum number of records to return */
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  /** Sort options as a map of field names to sort order */
  sort?: InputMaybe<CourseListSortOptionInput>;
  /** Cursor to start after. Uses the beginning if omitted */
  startCursor?: InputMaybe<Scalars["ID"]["input"]>;
};

export type CourseListDiscountGqlResponse = {
  __typename?: "CourseListDiscountGqlResponse";
  /** Discount calculation type */
  type: CourseDiscountType;
  /** Discount value. Percentage for PERCENTAGE, IRT amount for FIXED_AMOUNT_IRT */
  value: Scalars["Float"]["output"];
};

export type CourseListFilterInput = {
  /** Filter courses by description */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter courses that contain at least one free chapter */
  hasFreeChapter?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Filter courses by whether a price is set */
  hasPrice?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Filter by active state */
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Filter courses containing at least one calculated item type. ARTICLE means an item without fileId. */
  itemType?: InputMaybe<CourseItemType>;
  /** Maximum price in IRT */
  maxPriceIrt?: InputMaybe<Scalars["Float"]["input"]>;
  /** Minimum price in IRT */
  minPriceIrt?: InputMaybe<Scalars["Float"]["input"]>;
  /** Search query that matches title, description, tags, chapter titles, item titles, and article text */
  query?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter by calculated release type. GRADUAL means at least one chapter has visibleAfterMinutes. */
  releaseType?: InputMaybe<CourseReleaseType>;
  /** Return courses that contain every tag in this list */
  tagsAll?: InputMaybe<Array<Scalars["String"]["input"]>>;
  /** Return courses that contain at least one of these tags */
  tagsAny?: InputMaybe<Array<Scalars["String"]["input"]>>;
  /** Filter courses by title */
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type CourseListGqlInput = {
  /** Filter options for narrowing down the course list */
  filters?: InputMaybe<CourseListFilterInput>;
  /** Pagination and sorting options */
  options?: InputMaybe<CourseListCursorPageOptionsParamsInput>;
};

export type CourseListGqlResponse = {
  __typename?: "CourseListGqlResponse";
  /** Course chapters */
  chapters: Array<CourseListChapterGqlResponse>;
  /** Stored file ID used as the course cover image */
  coverImageFileId?: Maybe<Scalars["ID"]["output"]>;
  /** Date when the course was created */
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Course description */
  description?: Maybe<Scalars["String"]["output"]>;
  /** Optional course discount */
  discount?: Maybe<CourseListDiscountGqlResponse>;
  /** Course ID */
  id: Scalars["ID"]["output"];
  /** Whether the course is active */
  isActive: Scalars["Boolean"]["output"];
  /** Course price in IRT */
  priceIrt?: Maybe<Scalars["Float"]["output"]>;
  /** Calculated release strategy. GRADUAL means at least one chapter has visibleAfterMinutes. */
  releaseType: CourseReleaseType;
  /** Course display rank used for manual ordering */
  sortOrder?: Maybe<Scalars["Float"]["output"]>;
  /** Course tags */
  tags: Array<Scalars["String"]["output"]>;
  /** Course title */
  title: Scalars["String"]["output"];
  /** Date when the course was last updated */
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export type CourseListItemGqlResponse = {
  __typename?: "CourseListItemGqlResponse";
  /** Article body when this item is text-based */
  article?: Maybe<Scalars["String"]["output"]>;
  /** Stored file ID attached to this item */
  fileId?: Maybe<Scalars["ID"]["output"]>;
  /** Optional item sort order inside its chapter */
  sortOrder?: Maybe<Scalars["Int"]["output"]>;
  /** Course item title */
  title: Scalars["String"]["output"];
  /** Calculated item type. File-backed items are resolved from stored file MIME type; items without fileId are ARTICLE. */
  type: CourseItemType;
};

export type CourseListPaginatedCursorGqlResponse = {
  __typename?: "CourseListPaginatedCursorGqlResponse";
  /** List of courses */
  items: Array<CourseListGqlResponse>;
  /** Pagination metadata */
  pagination: PaginationCursorResponse;
};

export type CourseListSortOptionInput = {
  /** Sort by creation date */
  createdAt?: InputMaybe<SortingOrder>;
  /** Sort by active state */
  isActive?: InputMaybe<SortingOrder>;
  /** Sort by price in IRT */
  priceIrt?: InputMaybe<SortingOrder>;
  /** Sort by manual display rank */
  sortOrder?: InputMaybe<SortingOrder>;
  /** Sort by course title */
  title?: InputMaybe<SortingOrder>;
  /** Sort by last update date */
  updatedAt?: InputMaybe<SortingOrder>;
};

export type CoursePaymentCouponSnapshotGqlResponse = {
  __typename?: "CoursePaymentCouponSnapshotGqlResponse";
  /** Coupon code */
  code: Scalars["String"]["output"];
  /** Coupon ID */
  couponId: Scalars["ID"]["output"];
  /** Coupon discount type */
  discountType: PaymentCouponDiscountType;
  /** Coupon discount value. Percentage or fixed amount based on discountType */
  discountValue: Scalars["Float"]["output"];
  /** Coupon ID */
  id: Scalars["ID"]["output"];
  /** Coupon display title */
  title: Scalars["String"]["output"];
};

export type CoursePaymentCourseSnapshotGqlResponse = {
  __typename?: "CoursePaymentCourseSnapshotGqlResponse";
  /** Course description snapshot */
  description?: Maybe<Scalars["String"]["output"]>;
  /** Course ID */
  id: Scalars["ID"]["output"];
  /** Original course price in IRT */
  priceIrt: Scalars["Float"]["output"];
  /** Course title snapshot */
  title: Scalars["String"]["output"];
};

export type CoursePaymentListFilterInput = {
  /** Maximum original amount in IRT */
  amountIrtMax?: InputMaybe<Scalars["Float"]["input"]>;
  /** Minimum original amount in IRT */
  amountIrtMin?: InputMaybe<Scalars["Float"]["input"]>;
  /** Filter cancelled payments from this ISO date */
  cancelledAtFrom?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter cancelled payments until this ISO date */
  cancelledAtTo?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter by coupon code */
  couponCode?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter by coupon discount type */
  couponDiscountType?: InputMaybe<PaymentCouponDiscountType>;
  /** Maximum coupon discount value */
  couponDiscountValueMax?: InputMaybe<Scalars["Float"]["input"]>;
  /** Minimum coupon discount value */
  couponDiscountValueMin?: InputMaybe<Scalars["Float"]["input"]>;
  /** Filter by coupon ID */
  couponId?: InputMaybe<Scalars["ID"]["input"]>;
  /** Filter payments by course ID */
  courseId?: InputMaybe<Scalars["ID"]["input"]>;
  /** Filter by course title snapshot */
  courseTitle?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter records created from this ISO date */
  createdAtFrom?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter records created until this ISO date */
  createdAtTo?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter payments by currency */
  currency?: InputMaybe<UserCoursePurchaseCurrency>;
  /** Maximum discount amount in IRT */
  discountAmountIrtMax?: InputMaybe<Scalars["Float"]["input"]>;
  /** Minimum discount amount in IRT */
  discountAmountIrtMin?: InputMaybe<Scalars["Float"]["input"]>;
  /** Maximum discount percentage */
  discountPercentageMax?: InputMaybe<Scalars["Float"]["input"]>;
  /** Minimum discount percentage */
  discountPercentageMin?: InputMaybe<Scalars["Float"]["input"]>;
  /** Filter by buyer email snapshot */
  email?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter failed payments from this ISO date */
  failedAtFrom?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter failed payments until this ISO date */
  failedAtTo?: InputMaybe<Scalars["String"]["input"]>;
  /** Maximum final amount in IRT */
  finalAmountIrtMax?: InputMaybe<Scalars["Float"]["input"]>;
  /** Minimum final amount in IRT */
  finalAmountIrtMin?: InputMaybe<Scalars["Float"]["input"]>;
  /** Filter by buyer full name snapshot */
  fullName?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter by user-course purchase record ID */
  id?: InputMaybe<Scalars["ID"]["input"]>;
  /** Filter by manual status-change flag */
  isManualStatusChange?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Filter by manual status changer user ID */
  manualStatusChangedBy?: InputMaybe<Scalars["ID"]["input"]>;
  /** Filter by manual status-change description */
  manualStatusChangedDescription?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter by buyer mobile phone snapshot */
  mobilePhone?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter paid payments from this ISO date */
  paidAtFrom?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter paid payments until this ISO date */
  paidAtTo?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter payments by method */
  paymentMethod?: InputMaybe<UserCoursePaymentMethod>;
  /** Filter by payment provider */
  paymentProvider?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter by payment reference */
  paymentReference?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter pending payments from this ISO date */
  pendingAtFrom?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter pending payments until this ISO date */
  pendingAtTo?: InputMaybe<Scalars["String"]["input"]>;
  /** Search query that matches buyer, course, payment reference, or transaction ID */
  query?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter by receipt uploader user ID */
  receiptUploadedBy?: InputMaybe<Scalars["ID"]["input"]>;
  /** Filter refunded payments from this ISO date */
  refundedAtFrom?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter refunded payments until this ISO date */
  refundedAtTo?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter payments by purchase status */
  status?: InputMaybe<UserCoursePurchaseStatus>;
  /** Filter by transaction ID */
  transactionId?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter records updated from this ISO date */
  updatedAtFrom?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter records updated until this ISO date */
  updatedAtTo?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter by uploaded receipt file ID */
  uploadedReceiptFileId?: InputMaybe<Scalars["ID"]["input"]>;
  /** Filter by buyer email snapshot */
  userEmail?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter by buyer full name snapshot */
  userFullName?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter payments by buyer ID */
  userId?: InputMaybe<Scalars["ID"]["input"]>;
  /** Filter by buyer phone snapshot */
  userPhone?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter by buyer username snapshot */
  username?: InputMaybe<Scalars["String"]["input"]>;
};

export type CoursePaymentListGqlInput = {
  /** Filter options for narrowing down the course payment list */
  filters?: InputMaybe<CoursePaymentListFilterInput>;
  /** Pagination options */
  options?: InputMaybe<OffsetPageOptionsParamsInput>;
};

export type CoursePaymentListGqlResponse = {
  __typename?: "CoursePaymentListGqlResponse";
  /** Original amount in IRT */
  amountIrt: Scalars["Float"]["output"];
  /** Cancelled status date */
  cancelledAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Applied coupon snapshot, if any */
  coupon?: Maybe<CoursePaymentCouponSnapshotGqlResponse>;
  /** Course snapshot captured when the purchase was submitted */
  course: CoursePaymentCourseSnapshotGqlResponse;
  /** Course ID */
  courseId: Scalars["ID"]["output"];
  /** Payment submitted date */
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Payment currency */
  currency: UserCoursePurchaseCurrency;
  /** Discount amount in IRT */
  discountAmountIrt?: Maybe<Scalars["Float"]["output"]>;
  /** Discount percentage applied by course discount */
  discountPercentage?: Maybe<Scalars["Float"]["output"]>;
  /** Failed status date */
  failedAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Final payable amount in IRT */
  finalAmountIrt: Scalars["Float"]["output"];
  /** User-course purchase record ID */
  id: Scalars["ID"]["output"];
  /** Whether the payment status was changed manually */
  isManualStatusChange: Scalars["Boolean"]["output"];
  /** User ID that manually changed the status */
  manualStatusChangedBy?: Maybe<Scalars["ID"]["output"]>;
  /** Manual status-change description */
  manualStatusChangedDescription?: Maybe<Scalars["String"]["output"]>;
  /** User that manually changed the status */
  manualStatusChanger?: Maybe<CoursePaymentRelatedUserGqlResponse>;
  /** Paid status date */
  paidAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Payment method */
  paymentMethod: UserCoursePaymentMethod;
  /** Payment provider, if any */
  paymentProvider?: Maybe<Scalars["String"]["output"]>;
  /** Gateway authority or manual reference */
  paymentReference?: Maybe<Scalars["String"]["output"]>;
  /** Pending status date */
  pendingAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** User ID that uploaded the receipt */
  receiptUploadedBy?: Maybe<Scalars["ID"]["output"]>;
  /** User that uploaded the receipt */
  receiptUploader?: Maybe<CoursePaymentRelatedUserGqlResponse>;
  /** Refunded status date */
  refundedAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Payment status */
  status: UserCoursePurchaseStatus;
  /** Whether this payment record was initially submitted by an admin */
  submittedInitiallyByAdmin: Scalars["Boolean"]["output"];
  /** Gateway ref ID or crypto transaction ID */
  transactionId?: Maybe<Scalars["String"]["output"]>;
  /** Last payment update date */
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Uploaded receipt file metadata */
  uploadedReceiptFile?: Maybe<CoursePaymentStoredFileGqlResponse>;
  /** Receipt stored file ID */
  uploadedReceiptFileId?: Maybe<Scalars["ID"]["output"]>;
  /** Buyer snapshot captured when the purchase was submitted */
  user: CoursePaymentUserSnapshotGqlResponse;
  /** Buyer user ID */
  userId: Scalars["ID"]["output"];
};

export type CoursePaymentListPaginatedOffsetGqlResponse = {
  __typename?: "CoursePaymentListPaginatedOffsetGqlResponse";
  /** List of course payments */
  items: Array<CoursePaymentListGqlResponse>;
  /** Pagination metadata */
  pagination: PaginationOffsetResponse;
};

export type CoursePaymentManualCreateGqlInput = {
  /** Optional coupon code to apply to this manual payment */
  couponCode?: InputMaybe<Scalars["String"]["input"]>;
  /** Active paid course ID to register payment for */
  courseId: Scalars["ID"]["input"];
  /** Optional manual review description */
  manualStatusChangedDescription?: InputMaybe<Scalars["String"]["input"]>;
  /** Payment method selected by support for this manual record */
  paymentMethod: UserCoursePaymentMethod;
  /** Initial manual purchase status */
  status: UserCoursePurchaseStatus;
  /** Optional uploaded payment evidence file ID */
  uploadedReceiptFileId?: InputMaybe<Scalars["ID"]["input"]>;
  /** User ID that will receive the payment record */
  userId: Scalars["ID"]["input"];
};

export type CoursePaymentRelatedUserGqlResponse = {
  __typename?: "CoursePaymentRelatedUserGqlResponse";
  /** Related user email */
  email?: Maybe<Scalars["String"]["output"]>;
  /** Related user display name */
  fullName?: Maybe<Scalars["String"]["output"]>;
  /** Related user ID */
  id: Scalars["ID"]["output"];
  /** Related user phone */
  phone?: Maybe<Scalars["String"]["output"]>;
  /** Related username */
  username?: Maybe<Scalars["String"]["output"]>;
};

export type CoursePaymentStatusUpdateGqlInput = {
  /** User-course purchase record ID */
  id: Scalars["ID"]["input"];
  /** Optional manual status-change description */
  manualStatusChangedDescription?: InputMaybe<Scalars["String"]["input"]>;
  /** New purchase status */
  status: UserCoursePurchaseStatus;
};

export type CoursePaymentStoredFileGqlResponse = {
  __typename?: "CoursePaymentStoredFileGqlResponse";
  /** Temporary URL for reading the stored file */
  accessUrl?: Maybe<Scalars["String"]["output"]>;
  /** Stored file ID */
  id: Scalars["ID"]["output"];
  /** Stored file MIME type */
  mimeType?: Maybe<Scalars["String"]["output"]>;
  /** Stored file name */
  name?: Maybe<Scalars["String"]["output"]>;
  /** Stored file path */
  path?: Maybe<Scalars["String"]["output"]>;
  /** Stored file size in bytes */
  sizeBytes?: Maybe<Scalars["Float"]["output"]>;
  /** Stored file display title */
  title?: Maybe<Scalars["String"]["output"]>;
};

export type CoursePaymentUserSnapshotGqlResponse = {
  __typename?: "CoursePaymentUserSnapshotGqlResponse";
  /** Buyer email snapshot */
  email: Scalars["String"]["output"];
  /** Buyer full name snapshot */
  fullName: Scalars["String"]["output"];
  /** Buyer user ID */
  id: Scalars["ID"]["output"];
  /** Buyer mobile phone snapshot */
  mobilePhone?: Maybe<Scalars["String"]["output"]>;
  /** Buyer phone snapshot */
  phone?: Maybe<Scalars["String"]["output"]>;
  /** Buyer username snapshot */
  username: Scalars["String"]["output"];
};

export type CoursePurchaseSubmitGqlInput = {
  /** Optional coupon code to apply to this purchase */
  couponCode?: InputMaybe<Scalars["String"]["input"]>;
  /** Course ID to purchase */
  courseId: Scalars["ID"]["input"];
  /** Payment method. Supports GATEWAY, CARD_TO_CARD, CRYPTOCURRENCY, and FREE. */
  paymentMethod: UserCoursePaymentMethod;
  /** Receipt number or last card digits. Required for CARD_TO_CARD. */
  paymentReference?: InputMaybe<Scalars["String"]["input"]>;
  /** Blockchain transaction ID. Required for CRYPTOCURRENCY. */
  transactionId?: InputMaybe<Scalars["String"]["input"]>;
  /** Uploaded receipt file ID. Required for CARD_TO_CARD. */
  uploadedReceiptFileId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type CoursePurchaseSubmitGqlResponse = {
  __typename?: "CoursePurchaseSubmitGqlResponse";
  /** Original course price in IRT */
  amountIrt: Scalars["Float"]["output"];
  /** Applied coupon code, if the purchase used a coupon */
  couponCode?: Maybe<Scalars["String"]["output"]>;
  /** Purchased course ID */
  courseId: Scalars["ID"]["output"];
  /** Currency expected for the payment method */
  currency: UserCoursePurchaseCurrency;
  /** Applied discount amount in IRT */
  discountAmountIrt?: Maybe<Scalars["Float"]["output"]>;
  /** Final payable amount in IRT */
  finalAmountIrt: Scalars["Float"]["output"];
  /** User course purchase record ID */
  id: Scalars["ID"]["output"];
  /** Whether this purchase grants course access now */
  isPurchased: Scalars["Boolean"]["output"];
  /** Gateway authority/reference for online payments */
  paymentAuthority?: Maybe<Scalars["String"]["output"]>;
  /** Payment method used for this purchase */
  paymentMethod: UserCoursePaymentMethod;
  /** Receipt number or last source-card digits */
  paymentReference?: Maybe<Scalars["String"]["output"]>;
  /** Gateway redirect URL for online payments */
  paymentUrl?: Maybe<Scalars["String"]["output"]>;
  /** Purchase status after submission */
  status: UserCoursePurchaseStatus;
  /** Blockchain transaction ID for crypto purchases */
  transactionId?: Maybe<Scalars["String"]["output"]>;
  /** Uploaded receipt file ID for card-to-card purchases */
  uploadedReceiptFileId?: Maybe<Scalars["ID"]["output"]>;
};

/** Calculated course release strategy */
export const CourseReleaseType = {
  GRADUAL: "GRADUAL",
  IMMEDIATE: "IMMEDIATE",
} as const;

export type CourseReleaseType = (typeof CourseReleaseType)[keyof typeof CourseReleaseType];
export type CourseUpdateGqlInput = {
  /** Course chapters */
  chapters: Array<CourseChapterGqlInput>;
  /** Stored file ID used as the course cover image */
  coverImageFileId?: InputMaybe<Scalars["ID"]["input"]>;
  /** Course description */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Optional course discount */
  discount?: InputMaybe<CourseDiscountGqlInput>;
  /** Course ID */
  id: Scalars["ID"]["input"];
  /** Whether the course is active */
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Course price in IRT */
  priceIrt?: InputMaybe<Scalars["Float"]["input"]>;
  /** Course display rank used for manual ordering */
  sortOrder?: InputMaybe<Scalars["Float"]["input"]>;
  /** Course tags */
  tags?: InputMaybe<Array<Scalars["String"]["input"]>>;
  /** Course title */
  title: Scalars["String"]["input"];
};

export type FileDetailGqlInput = {
  /** Stored file ID */
  id: Scalars["ID"]["input"];
};

export type FileUploadGqlInput = {
  /** Base64 encoded file content without data URL prefix */
  contentBase64: Scalars["String"]["input"];
  /** File MIME type */
  mimeType: Scalars["String"]["input"];
  /** Original file name including extension */
  name: Scalars["String"]["input"];
  /** File size in bytes */
  sizeBytes: Scalars["Float"]["input"];
};

export type FileUploadGqlResponse = {
  __typename?: "FileUploadGqlResponse";
  /** Temporary URL for reading the stored file */
  accessUrl?: Maybe<Scalars["String"]["output"]>;
  /** Stored file ID */
  id: Scalars["ID"]["output"];
  /** File MIME type */
  mimeType: Scalars["String"]["output"];
  /** Original file name */
  name: Scalars["String"]["output"];
  /** MinIO object path stored for this file */
  path: Scalars["String"]["output"];
  /** File size in bytes */
  sizeBytes: Scalars["Float"]["output"];
  /** Upload completion date */
  uploadedAt: Scalars["DateTime"]["output"];
};

export type Mutation = {
  __typename?: "Mutation";
  /** Create a course with chapters and items, returning calculated release and item types */
  courseCreate: CourseListGqlResponse;
  /** Delete a course and remove its detached file attachments */
  courseDelete: Scalars["Boolean"]["output"];
  /** Create a manual course payment record for an active paid course as a super admin */
  coursePaymentManualCreate: CoursePaymentListGqlResponse;
  /** Manually update a course payment status and optional review description */
  coursePaymentStatusUpdate: CoursePaymentListGqlResponse;
  /** Submit a course purchase using gateway, card-to-card, cryptocurrency, or a free coupon */
  coursePurchaseSubmit: CoursePurchaseSubmitGqlResponse;
  /** Update a course and clean up replaced or removed file attachments */
  courseUpdate: CourseListGqlResponse;
  /** Upload a file to MinIO and store its metadata */
  fileUpload: FileUploadGqlResponse;
  /** Request login code using username, email, or phone identity */
  requestLoginCode: UserRequestLoginCodeGqlResponse;
  /** Request SMS verification code for mobile signup */
  requestSignupCode: UserRequestLoginCodeGqlResponse;
  /** Resolve whether an identity belongs to an existing user account */
  resolveAuthIdentity: UserResolveAuthIdentityGqlResponse;
  /** Create a user account with profile, avatar file, roles, status, and initial password */
  userCreate: UserMutationGqlResponse;
  /** Login and get JWT access token */
  userLogin: UserLoginGqlResponse;
  /** Logout and revoke the current session token */
  userLogout: Scalars["Boolean"]["output"];
  /** Create an END_USER account using username/email/mobile and start a session */
  userSignup: UserLoginGqlResponse;
  /** Update a user account, profile, preferences, avatar file, roles, status, or password */
  userUpdate: UserMutationGqlResponse;
  /** Verify SMS login code and create an authenticated session */
  verifyLoginCode: UserVerifyLoginCodeGqlResponse;
};

export type MutationCourseCreateArgs = {
  input: CourseCreateGqlInput;
};

export type MutationCourseDeleteArgs = {
  input: CourseDeleteGqlInput;
};

export type MutationCoursePaymentManualCreateArgs = {
  input: CoursePaymentManualCreateGqlInput;
};

export type MutationCoursePaymentStatusUpdateArgs = {
  input: CoursePaymentStatusUpdateGqlInput;
};

export type MutationCoursePurchaseSubmitArgs = {
  input: CoursePurchaseSubmitGqlInput;
};

export type MutationCourseUpdateArgs = {
  input: CourseUpdateGqlInput;
};

export type MutationFileUploadArgs = {
  input: FileUploadGqlInput;
};

export type MutationRequestLoginCodeArgs = {
  input: UserRequestLoginCodeGqlInput;
};

export type MutationRequestSignupCodeArgs = {
  input: UserRequestSignupCodeGqlInput;
};

export type MutationResolveAuthIdentityArgs = {
  input: UserRequestLoginCodeGqlInput;
};

export type MutationUserCreateArgs = {
  input: UserCreateGqlInput;
};

export type MutationUserLoginArgs = {
  input: UserLoginGqlInput;
};

export type MutationUserSignupArgs = {
  input: UserSignupGqlInput;
};

export type MutationUserUpdateArgs = {
  input: UserUpdateGqlInput;
};

export type MutationVerifyLoginCodeArgs = {
  input: UserVerifyLoginCodeGqlInput;
};

export type OffsetPageOptionsParamsInput = {
  /** Maximum number of records to return */
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  /** Number of records to skip (offset) */
  skip?: InputMaybe<Scalars["Int"]["input"]>;
};

export type PaginationCursorResponse = {
  __typename?: "PaginationCursorResponse";
  /** Number of items returned in this page */
  count: Scalars["Int"]["output"];
  /** Cursor for the last item in this page. Use this as startCursor for the next page */
  endCursor?: Maybe<Scalars["ID"]["output"]>;
  /** Whether there are more items available after this page */
  hasNextPage: Scalars["Boolean"]["output"];
  /** Whether there are items before this page */
  hasPreviousPage: Scalars["Boolean"]["output"];
  /** Number of items requested */
  limit: Scalars["Int"]["output"];
  /** Cursor for the first item in this page. Use this as endCursor for the previous page */
  startCursor?: Maybe<Scalars["ID"]["output"]>;
  /** Total number of items */
  total: Scalars["Int"]["output"];
};

export type PaginationOffsetResponse = {
  __typename?: "PaginationOffsetResponse";
  /** Number of items returned in this page */
  count: Scalars["Int"]["output"];
  /** Number of items requested */
  limit: Scalars["Int"]["output"];
  /** Number of items skipped (offset) */
  skip: Scalars["Int"]["output"];
  /** Total number of items */
  total: Scalars["Int"]["output"];
};

export type PaymentCheckoutCardGqlResponse = {
  __typename?: "PaymentCheckoutCardGqlResponse";
  /** Payment card bank name */
  bankName: Scalars["String"]["output"];
  /** Payment card number */
  cardNumber: Scalars["String"]["output"];
  /** Payment card holder name */
  holderName: Scalars["String"]["output"];
};

export type PaymentCheckoutConfigGqlResponse = {
  __typename?: "PaymentCheckoutConfigGqlResponse";
  /** Available cryptocurrency wallets */
  cryptoWallets: Array<PaymentCheckoutCryptoWalletGqlResponse>;
  /** Available payment cards */
  paymentCards: Array<PaymentCheckoutCardGqlResponse>;
  /** Payment method visibility and availability configuration */
  paymentMethods: Array<PaymentCheckoutMethodGqlResponse>;
  /** USDT to IRT conversion settings */
  usdtIrtRate: PaymentCheckoutUsdtIrtRateGqlResponse;
};

export type PaymentCheckoutCryptoWalletGqlResponse = {
  __typename?: "PaymentCheckoutCryptoWalletGqlResponse";
  /** Crypto wallet address */
  address: Scalars["String"]["output"];
  /** Crypto wallet network */
  network: Scalars["String"]["output"];
};

export type PaymentCheckoutMethodGqlResponse = {
  __typename?: "PaymentCheckoutMethodGqlResponse";
  /** Whether the method can currently be selected */
  isActive: Scalars["Boolean"]["output"];
  /** Whether the method should be marked as recommended */
  isRecommended: Scalars["Boolean"]["output"];
  /** Whether the method should be shown in checkout */
  isVisible: Scalars["Boolean"]["output"];
  /** Payment method identifier */
  method: UserCoursePaymentMethod;
};

export type PaymentCheckoutUsdtIrtRateGqlResponse = {
  __typename?: "PaymentCheckoutUsdtIrtRateGqlResponse";
  /** Multiplier applied to converted USDT amount */
  coefficient: Scalars["Float"]["output"];
  /** Fixed USDT fee added after conversion */
  feeUsdt: Scalars["Float"]["output"];
  /** IRT value equivalent to one USDT before fee/coefficient */
  valueIrt: Scalars["Float"]["output"];
};

/** Payment coupon discount calculation kind */
export const PaymentCouponDiscountType = {
  FIXED_AMOUNT: "FIXED_AMOUNT",
  PERCENTAGE: "PERCENTAGE",
} as const;

export type PaymentCouponDiscountType =
  (typeof PaymentCouponDiscountType)[keyof typeof PaymentCouponDiscountType];
export type PaymentCouponValidateGqlInput = {
  /** Coupon code */
  code: Scalars["String"]["input"];
  /** Course ID */
  courseId: Scalars["ID"]["input"];
};

export type PaymentCouponValidateGqlResponse = {
  __typename?: "PaymentCouponValidateGqlResponse";
  /** Course amount before any discount */
  amountIrt?: Maybe<Scalars["Float"]["output"]>;
  /** Normalized coupon code */
  code?: Maybe<Scalars["String"]["output"]>;
  /** Coupon discount amount */
  couponDiscountAmountIrt?: Maybe<Scalars["Float"]["output"]>;
  /** Coupon ID when validation succeeds */
  couponId?: Maybe<Scalars["ID"]["output"]>;
  /** Built-in course discount amount */
  courseDiscountAmountIrt?: Maybe<Scalars["Float"]["output"]>;
  /** Coupon discount type */
  discountType?: Maybe<PaymentCouponDiscountType>;
  /** Coupon discount value */
  discountValue?: Maybe<Scalars["Float"]["output"]>;
  /** Final payable amount after coupon */
  finalAmountIrt?: Maybe<Scalars["Float"]["output"]>;
  /** Whether the coupon can be used for this purchase */
  isValid: Scalars["Boolean"]["output"];
  /** Human-readable reason when the coupon is invalid */
  message?: Maybe<Scalars["String"]["output"]>;
  /** Amount after built-in course discount and before coupon */
  payableAmountBeforeCouponIrt?: Maybe<Scalars["Float"]["output"]>;
  /** Coupon title */
  title?: Maybe<Scalars["String"]["output"]>;
};

export type Query = {
  __typename?: "Query";
  /** Get a paginated, filterable, sortable admin list of courses with calculated release and item types */
  courseList: CourseListPaginatedCursorGqlResponse;
  /** Get paginated list of all course payments from user-course purchase records */
  coursePaymentList: CoursePaymentListPaginatedOffsetGqlResponse;
  /** Get stored file metadata and preview path by ID */
  fileDetail: FileUploadGqlResponse;
  /** Get the currently authenticated user's information */
  me: UserMeGqlResponse;
  /** Get payment checkout settings for course purchases */
  paymentCheckoutConfig: PaymentCheckoutConfigGqlResponse;
  /** Validate a payment coupon for the current user's course purchase */
  paymentCouponValidate: PaymentCouponValidateGqlResponse;
  /** Get active course details for anonymous users and END_USER accounts with locked content redacted */
  userCourseDetail: UserCourseDetailGqlResponse;
  /** Get active courses for anonymous users and END_USER views with purchase state */
  userCourseList: UserCourseListPaginatedCursorGqlResponse;
  /** Get a paginated, filterable, sortable super-admin list of users using offset-based pagination */
  userList: UserListPaginatedOffsetGqlResponse;
  /** Generate a captcha challenge for password login */
  userLoginCaptcha: UserLoginCaptchaGqlResponse;
};

export type QueryCourseListArgs = {
  input: CourseListGqlInput;
};

export type QueryCoursePaymentListArgs = {
  input: CoursePaymentListGqlInput;
};

export type QueryFileDetailArgs = {
  input: FileDetailGqlInput;
};

export type QueryPaymentCouponValidateArgs = {
  input: PaymentCouponValidateGqlInput;
};

export type QueryUserCourseDetailArgs = {
  input: UserCourseDetailGqlInput;
};

export type QueryUserCourseListArgs = {
  input: CourseListGqlInput;
};

export type QueryUserListArgs = {
  input: UserListGqlInput;
};

/** Sorting order */
export const SortingOrder = {
  ASC: "ASC",
  DESC: "DESC",
} as const;

export type SortingOrder = (typeof SortingOrder)[keyof typeof SortingOrder];
export type UserCourseDetailChapterGqlResponse = {
  __typename?: "UserCourseDetailChapterGqlResponse";
  /** Chapter description */
  description?: Maybe<Scalars["String"]["output"]>;
  /** Stored file ID used as the chapter icon */
  iconFileId?: Maybe<Scalars["ID"]["output"]>;
  /** Whether this chapter is free to access */
  isFree: Scalars["Boolean"]["output"];
  /** Whether this chapter content is hidden from the current viewer */
  isLocked: Scalars["Boolean"]["output"];
  /** Chapter items. Locked chapters return item metadata with protected content redacted. */
  items: Array<UserCourseDetailItemGqlResponse>;
  /** Stable chapter key */
  key: Scalars["String"]["output"];
  /** Chapter title */
  title: Scalars["String"]["output"];
  /** Number of minutes after purchase/enrollment when visible */
  visibleAfterMinutes?: Maybe<Scalars["Int"]["output"]>;
};

export type UserCourseDetailGqlInput = {
  /** Course ID */
  id: Scalars["ID"]["input"];
};

export type UserCourseDetailGqlResponse = {
  __typename?: "UserCourseDetailGqlResponse";
  /** Course chapters with locked content redacted */
  chapters: Array<UserCourseDetailChapterGqlResponse>;
  /** Stored file ID used as the course cover image */
  coverImageFileId?: Maybe<Scalars["ID"]["output"]>;
  /** Course description */
  description?: Maybe<Scalars["String"]["output"]>;
  /** Optional public course discount */
  discount?: Maybe<UserCourseListDiscountGqlResponse>;
  /** Course ID */
  id: Scalars["ID"]["output"];
  /** Whether this course is free to access */
  isFree: Scalars["Boolean"]["output"];
  /** Whether the current END_USER has a paid purchase for this course */
  isPurchased: Scalars["Boolean"]["output"];
  /** Course price in IRT */
  priceIrt?: Maybe<Scalars["Float"]["output"]>;
  /** Current END_USER purchase status for this course, if any */
  purchaseStatus?: Maybe<UserCoursePurchaseStatus>;
  /** Calculated release strategy. GRADUAL means at least one chapter has visibleAfterMinutes. */
  releaseType: CourseReleaseType;
  /** Course tags */
  tags: Array<Scalars["String"]["output"]>;
  /** Course title */
  title: Scalars["String"]["output"];
};

export type UserCourseDetailItemGqlResponse = {
  __typename?: "UserCourseDetailItemGqlResponse";
  /** Article body for unlocked text-based items */
  article?: Maybe<Scalars["String"]["output"]>;
  /** Stored file ID for unlocked file-backed items */
  fileId?: Maybe<Scalars["ID"]["output"]>;
  /** Whether this item content is hidden from the current viewer */
  isLocked: Scalars["Boolean"]["output"];
  /** Course item title */
  title: Scalars["String"]["output"];
  /** Calculated item content type */
  type: CourseItemType;
};

export type UserCourseListDiscountGqlResponse = {
  __typename?: "UserCourseListDiscountGqlResponse";
  /** Discount calculation type */
  type: CourseDiscountType;
  /** Discount value. Percentage for PERCENTAGE, IRT amount for FIXED_AMOUNT_IRT */
  value: Scalars["Float"]["output"];
};

export type UserCourseListGqlResponse = {
  __typename?: "UserCourseListGqlResponse";
  /** Number of chapters in the course */
  chapterCount: Scalars["Int"]["output"];
  /** Stored file ID used as the course cover image */
  coverImageFileId?: Maybe<Scalars["ID"]["output"]>;
  /** Course description */
  description?: Maybe<Scalars["String"]["output"]>;
  /** Optional public course discount */
  discount?: Maybe<UserCourseListDiscountGqlResponse>;
  /** Course ID */
  id: Scalars["ID"]["output"];
  /** Whether the current END_USER has a paid purchase for this course */
  isPurchased: Scalars["Boolean"]["output"];
  /** Number of items in the course */
  itemCount: Scalars["Int"]["output"];
  /** Calculated content types available in this course */
  itemTypes: Array<CourseItemType>;
  /** Course price in IRT */
  priceIrt?: Maybe<Scalars["Float"]["output"]>;
  /** Calculated release strategy. GRADUAL means at least one chapter has visibleAfterMinutes. */
  releaseType: CourseReleaseType;
  /** Course tags */
  tags: Array<Scalars["String"]["output"]>;
  /** Course title */
  title: Scalars["String"]["output"];
};

export type UserCourseListPaginatedCursorGqlResponse = {
  __typename?: "UserCourseListPaginatedCursorGqlResponse";
  /** List of courses for anonymous and end-user views */
  items: Array<UserCourseListGqlResponse>;
  /** Pagination metadata */
  pagination: PaginationCursorResponse;
};

/** Supported course payment methods */
export const UserCoursePaymentMethod = {
  CARD_TO_CARD: "CARD_TO_CARD",
  CRYPTOCURRENCY: "CRYPTOCURRENCY",
  FREE: "FREE",
  GATEWAY: "GATEWAY",
} as const;

export type UserCoursePaymentMethod =
  (typeof UserCoursePaymentMethod)[keyof typeof UserCoursePaymentMethod];
/** Currency used for course purchases */
export const UserCoursePurchaseCurrency = {
  IRT: "IRT",
  USDT: "USDT",
} as const;

export type UserCoursePurchaseCurrency =
  (typeof UserCoursePurchaseCurrency)[keyof typeof UserCoursePurchaseCurrency];
/** Course purchase lifecycle status */
export const UserCoursePurchaseStatus = {
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
  PAID: "PAID",
  PENDING: "PENDING",
  REFUNDED: "REFUNDED",
} as const;

export type UserCoursePurchaseStatus =
  (typeof UserCoursePurchaseStatus)[keyof typeof UserCoursePurchaseStatus];
export type UserCreateGqlInput = {
  /** Initial account password */
  password: Scalars["String"]["input"];
  /** Optional profile fields for the new user */
  profile?: InputMaybe<UserUpdateProfileGqlInput>;
  /** Roles assigned to the user */
  roles: Array<UserRole>;
  /** Initial user account status */
  status?: InputMaybe<UserStatus>;
  /** Unique username */
  username: Scalars["String"]["input"];
};

export type UserListFilterInput = {
  /** Filter users created from this ISO date */
  createdAtFrom?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter users created until this ISO date */
  createdAtTo?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter users by email */
  email?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter users by first name */
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter users by first name or last name */
  fullName?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter users by ID */
  id?: InputMaybe<Scalars["ID"]["input"]>;
  /** Filter users by last name */
  lastName?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter users by mobile phone number */
  mobilePhone?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter users by phone number */
  phoneNumber?: InputMaybe<Scalars["String"]["input"]>;
  /** Search query that matches username, first name, last name, email, or phone number */
  query?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter users by role */
  role?: InputMaybe<UserRole>;
  /** Filter users by account status */
  status?: InputMaybe<UserStatus>;
  /** Filter users updated from this ISO date */
  updatedAtFrom?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter users updated until this ISO date */
  updatedAtTo?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter users by username */
  username?: InputMaybe<Scalars["String"]["input"]>;
};

export type UserListGqlInput = {
  /** Filter options for narrowing down the user list */
  filters?: InputMaybe<UserListFilterInput>;
  /** Pagination and sorting options */
  options?: InputMaybe<UserListOffsetPageOptionsParamsInput>;
};

export type UserListGqlResponse = {
  __typename?: "UserListGqlResponse";
  /** Date when the user was created */
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** User ID */
  id: Scalars["ID"]["output"];
  /** User profile details */
  profile?: Maybe<UserListProfileGqlResponse>;
  /** User roles */
  roles: Array<UserRole>;
  /** User account status */
  status: UserStatus;
  /** Date when the user was last updated */
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Username */
  username: Scalars["String"]["output"];
};

export type UserListOffsetPageOptionsParamsInput = {
  /** Maximum number of records to return */
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  /** Number of records to skip (offset) */
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  /** Sort options as a map of field names to sort order */
  sort?: InputMaybe<UserListSortOptionInput>;
};

export type UserListPaginatedOffsetGqlResponse = {
  __typename?: "UserListPaginatedOffsetGqlResponse";
  /** List of users */
  items: Array<UserListGqlResponse>;
  /** Pagination metadata */
  pagination: PaginationOffsetResponse;
};

export type UserListProfileGqlResponse = {
  __typename?: "UserListProfileGqlResponse";
  /** Stored file ID used as the user's avatar */
  avatarFileId?: Maybe<Scalars["ID"]["output"]>;
  /** User biography */
  bio?: Maybe<Scalars["String"]["output"]>;
  /** User's email address */
  email?: Maybe<Scalars["String"]["output"]>;
  /** User's first name */
  firstName?: Maybe<Scalars["String"]["output"]>;
  /** User's last name */
  lastName?: Maybe<Scalars["String"]["output"]>;
  /** User's phone number */
  phoneNumber?: Maybe<Scalars["String"]["output"]>;
};

export type UserListSortOptionInput = {
  /** Sort by creation date */
  createdAt?: InputMaybe<SortingOrder>;
  /** Sort by email address */
  email?: InputMaybe<SortingOrder>;
  /** Sort by first name */
  firstName?: InputMaybe<SortingOrder>;
  /** Sort by last name */
  lastName?: InputMaybe<SortingOrder>;
  /** Sort by phone number */
  phoneNumber?: InputMaybe<SortingOrder>;
  /** Sort by account status */
  status?: InputMaybe<SortingOrder>;
  /** Sort by last update date */
  updatedAt?: InputMaybe<SortingOrder>;
  /** Sort by username */
  username?: InputMaybe<SortingOrder>;
};

export type UserLoginGqlInput = {
  /** Captcha challenge identifier issued by the backend */
  captchaId?: InputMaybe<Scalars["String"]["input"]>;
  /** Captcha answer entered by the user */
  captchaValue?: InputMaybe<Scalars["String"]["input"]>;
  /** User identity: registered username, email, or phone number */
  identity: Scalars["String"]["input"];
  /** User password */
  password: Scalars["String"]["input"];
  /** If true, the session will be remembered for a longer period (e.g., 30 days instead of 24 hours) */
  rememberMe?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type UserLoginGqlResponse = {
  __typename?: "UserLoginGqlResponse";
  /** JWT access token */
  accessToken: Scalars["String"]["output"];
  /** User information */
  user: UserLoginUserGqlResponse;
};

export type UserLoginCaptchaGqlResponse = {
  __typename?: "UserLoginCaptchaGqlResponse";
  /** Unique captcha identifier used for verification */
  captchaId: Scalars["String"]["output"];
  /** Captcha expiration time as ISO timestamp */
  expiresAtIso: Scalars["String"]["output"];
  /** Captcha image bytes encoded as Base64 string */
  imageBase64: Scalars["String"]["output"];
  /** Captcha image MIME type */
  imageMimeType: Scalars["String"]["output"];
};

export type UserLoginUserGqlResponse = {
  __typename?: "UserLoginUserGqlResponse";
  /** User ID */
  id: Scalars["ID"]["output"];
  /** User roles */
  roles: Array<UserRole>;
  /** User username */
  username: Scalars["String"]["output"];
};

export type UserMeGqlResponse = {
  __typename?: "UserMeGqlResponse";
  /** User ID */
  id: Scalars["ID"]["output"];
  /** User preferences */
  preferences?: Maybe<UserPreferencesGqlResponse>;
  /** User profile information */
  profile?: Maybe<UserProfileMinimalGqlResponse>;
  /** User roles */
  roles: Array<UserRole>;
  /** User status */
  status: UserStatus;
  /** User username */
  username: Scalars["String"]["output"];
};

export type UserMutationGqlResponse = {
  __typename?: "UserMutationGqlResponse";
  /** User ID */
  id: Scalars["ID"]["output"];
  /** User profile details */
  profile?: Maybe<UserListProfileGqlResponse>;
  /** User roles */
  roles: Array<UserRole>;
  /** User account status */
  status: UserStatus;
  /** Username */
  username: Scalars["String"]["output"];
};

export type UserPreferencesGqlResponse = {
  __typename?: "UserPreferencesGqlResponse";
  /** User's preferred language */
  language?: Maybe<Scalars["String"]["output"]>;
  /** Whether notifications are enabled */
  notificationsEnabled: Scalars["Boolean"]["output"];
  /** User's theme preference */
  theme?: Maybe<Scalars["String"]["output"]>;
  /** User's timezone */
  timezone?: Maybe<Scalars["String"]["output"]>;
};

export type UserProfileMinimalGqlResponse = {
  __typename?: "UserProfileMinimalGqlResponse";
  /** Stored file ID used as the user's avatar */
  avatarFileId?: Maybe<Scalars["ID"]["output"]>;
  /** User's first name */
  firstName?: Maybe<Scalars["String"]["output"]>;
  /** User's last name */
  lastName?: Maybe<Scalars["String"]["output"]>;
};

export type UserRequestLoginCodeGqlInput = {
  /** User identity: registered username, email, or phone number */
  identity: Scalars["String"]["input"];
};

export type UserRequestLoginCodeGqlResponse = {
  __typename?: "UserRequestLoginCodeGqlResponse";
  /** Operation message */
  message: Scalars["String"]["output"];
  /** Whether a login code was created and queued */
  success: Scalars["Boolean"]["output"];
};

export type UserRequestSignupCodeGqlInput = {
  /** Mobile phone number for signup verification code */
  mobile: Scalars["String"]["input"];
};

export type UserResolveAuthIdentityGqlResponse = {
  __typename?: "UserResolveAuthIdentityGqlResponse";
  /** Whether the identity already belongs to an account */
  exists: Scalars["Boolean"]["output"];
};

/** Role of the user in the system */
export const UserRole = {
  ADMIN: "ADMIN",
  END_USER: "END_USER",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export type UserSignupGqlInput = {
  /** Captcha challenge identifier issued by the backend */
  captchaId?: InputMaybe<Scalars["String"]["input"]>;
  /** Captcha answer entered by the user */
  captchaValue?: InputMaybe<Scalars["String"]["input"]>;
  /** Email address */
  email?: InputMaybe<Scalars["String"]["input"]>;
  /** Mobile phone number */
  mobile?: InputMaybe<Scalars["String"]["input"]>;
  /** Account password for signup */
  password?: InputMaybe<Scalars["String"]["input"]>;
  /** Mandatory profile data for signup */
  profile: UserSignupProfileGqlInput;
  /** If true, the newly-created session will be remembered longer (e.g. 30 days) */
  rememberMe?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** SMS verification code for mobile signup without password */
  signupCode?: InputMaybe<Scalars["String"]["input"]>;
  /** Preferred unique username */
  username?: InputMaybe<Scalars["String"]["input"]>;
};

export type UserSignupProfileGqlInput = {
  /** User first name */
  firstName: Scalars["String"]["input"];
  /** User last name */
  lastName: Scalars["String"]["input"];
};

/** Status of the user account */
export const UserStatus = {
  ACTIVE: "ACTIVE",
  BANNED: "BANNED",
  DEACTIVE: "DEACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export type UserUpdateGqlInput = {
  /** User ID */
  id: Scalars["ID"]["input"];
  /** New password. When provided, active sessions are revoked. */
  password?: InputMaybe<Scalars["String"]["input"]>;
  /** Preference fields to update */
  preferences?: InputMaybe<UserUpdatePreferencesGqlInput>;
  /** Profile fields to update */
  profile?: InputMaybe<UserUpdateProfileGqlInput>;
  /** Roles assigned to the user */
  roles?: InputMaybe<Array<UserRole>>;
  /** User account status */
  status?: InputMaybe<UserStatus>;
  /** Unique username */
  username?: InputMaybe<Scalars["String"]["input"]>;
};

export type UserUpdatePreferencesGqlInput = {
  /** User's preferred language */
  language?: InputMaybe<Scalars["String"]["input"]>;
  /** Whether notifications are enabled */
  notificationsEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** User's theme preference */
  theme?: InputMaybe<Scalars["String"]["input"]>;
  /** User's timezone */
  timezone?: InputMaybe<Scalars["String"]["input"]>;
};

export type UserUpdateProfileGqlInput = {
  /** Stored file ID used as the user's avatar */
  avatarFileId?: InputMaybe<Scalars["ID"]["input"]>;
  /** User biography */
  bio?: InputMaybe<Scalars["String"]["input"]>;
  /** User email address */
  email?: InputMaybe<Scalars["String"]["input"]>;
  /** User first name */
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  /** User last name */
  lastName?: InputMaybe<Scalars["String"]["input"]>;
  /** User mobile phone number */
  phoneNumber?: InputMaybe<Scalars["String"]["input"]>;
};

export type UserVerifyLoginCodeGqlInput = {
  /** SMS one-time password */
  code: Scalars["String"]["input"];
  /** User identity used when requesting the login code */
  identity: Scalars["String"]["input"];
  /** If true, the session will be remembered for a longer period (e.g., 30 days instead of 24 hours) */
  rememberMe?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type UserVerifyLoginCodeGqlResponse = {
  __typename?: "UserVerifyLoginCodeGqlResponse";
  /** JWT access token when verification succeeded */
  accessToken?: Maybe<Scalars["String"]["output"]>;
  /** Operation message */
  message: Scalars["String"]["output"];
  /** Whether the login code was accepted */
  success: Scalars["Boolean"]["output"];
  /** User ID when verification succeeded */
  userId?: Maybe<Scalars["ID"]["output"]>;
};

export type CourseCreateMutationVariables = Exact<{
  input: CourseCreateGqlInput;
}>;

export type CourseCreateMutation = {
  __typename?: "Mutation";
  courseCreate: {
    __typename?: "CourseListGqlResponse";
    id: string;
    title: string;
    description?: string | null;
    coverImageFileId?: string | null;
    priceIrt?: number | null;
    isActive: boolean;
    sortOrder?: number | null;
    tags: Array<string>;
    releaseType: CourseReleaseType;
    createdAt?: any | null;
    updatedAt?: any | null;
    discount?: {
      __typename?: "CourseListDiscountGqlResponse";
      type: CourseDiscountType;
      value: number;
    } | null;
    chapters: Array<{
      __typename?: "CourseListChapterGqlResponse";
      title: string;
      description?: string | null;
      iconFileId?: string | null;
      visibleAfterMinutes?: number | null;
      isFree: boolean;
      sortOrder?: number | null;
      items: Array<{
        __typename?: "CourseListItemGqlResponse";
        title: string;
        sortOrder?: number | null;
        fileId?: string | null;
        article?: string | null;
        type: CourseItemType;
      }>;
    }>;
  };
};

export type CourseDeleteMutationVariables = Exact<{
  input: CourseDeleteGqlInput;
}>;

export type CourseDeleteMutation = { __typename?: "Mutation"; courseDelete: boolean };

export type CoursePaymentManualCreateMutationVariables = Exact<{
  input: CoursePaymentManualCreateGqlInput;
}>;

export type CoursePaymentManualCreateMutation = {
  __typename?: "Mutation";
  coursePaymentManualCreate: {
    __typename?: "CoursePaymentListGqlResponse";
    id: string;
    userId: string;
    courseId: string;
    status: UserCoursePurchaseStatus;
    paymentMethod: UserCoursePaymentMethod;
    currency: UserCoursePurchaseCurrency;
    paymentProvider?: string | null;
    paymentReference?: string | null;
    transactionId?: string | null;
    amountIrt: number;
    discountPercentage?: number | null;
    discountAmountIrt?: number | null;
    finalAmountIrt: number;
    uploadedReceiptFileId?: string | null;
    receiptUploadedBy?: string | null;
    isManualStatusChange: boolean;
    submittedInitiallyByAdmin: boolean;
    manualStatusChangedBy?: string | null;
    manualStatusChangedDescription?: string | null;
    createdAt?: any | null;
    updatedAt?: any | null;
    pendingAt?: any | null;
    paidAt?: any | null;
    failedAt?: any | null;
    refundedAt?: any | null;
    cancelledAt?: any | null;
    user: {
      __typename?: "CoursePaymentUserSnapshotGqlResponse";
      id: string;
      fullName: string;
      username: string;
      email: string;
      phone?: string | null;
    };
    course: {
      __typename?: "CoursePaymentCourseSnapshotGqlResponse";
      id: string;
      title: string;
      priceIrt: number;
    };
    coupon?: {
      __typename?: "CoursePaymentCouponSnapshotGqlResponse";
      id: string;
      couponId: string;
      code: string;
      title: string;
      discountType: PaymentCouponDiscountType;
      discountValue: number;
    } | null;
    uploadedReceiptFile?: {
      __typename?: "CoursePaymentStoredFileGqlResponse";
      id: string;
      name?: string | null;
      title?: string | null;
      mimeType?: string | null;
      sizeBytes?: number | null;
      path?: string | null;
      accessUrl?: string | null;
    } | null;
    receiptUploader?: {
      __typename?: "CoursePaymentRelatedUserGqlResponse";
      id: string;
      fullName?: string | null;
      username?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
    manualStatusChanger?: {
      __typename?: "CoursePaymentRelatedUserGqlResponse";
      id: string;
      fullName?: string | null;
      username?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  };
};

export type CoursePaymentStatusUpdateMutationVariables = Exact<{
  input: CoursePaymentStatusUpdateGqlInput;
}>;

export type CoursePaymentStatusUpdateMutation = {
  __typename?: "Mutation";
  coursePaymentStatusUpdate: {
    __typename?: "CoursePaymentListGqlResponse";
    id: string;
    userId: string;
    courseId: string;
    status: UserCoursePurchaseStatus;
    paymentMethod: UserCoursePaymentMethod;
    currency: UserCoursePurchaseCurrency;
    paymentProvider?: string | null;
    paymentReference?: string | null;
    transactionId?: string | null;
    amountIrt: number;
    discountPercentage?: number | null;
    discountAmountIrt?: number | null;
    finalAmountIrt: number;
    uploadedReceiptFileId?: string | null;
    receiptUploadedBy?: string | null;
    isManualStatusChange: boolean;
    submittedInitiallyByAdmin: boolean;
    manualStatusChangedBy?: string | null;
    manualStatusChangedDescription?: string | null;
    createdAt?: any | null;
    updatedAt?: any | null;
    pendingAt?: any | null;
    paidAt?: any | null;
    failedAt?: any | null;
    refundedAt?: any | null;
    cancelledAt?: any | null;
    user: {
      __typename?: "CoursePaymentUserSnapshotGqlResponse";
      id: string;
      fullName: string;
      username: string;
      email: string;
      phone?: string | null;
    };
    course: {
      __typename?: "CoursePaymentCourseSnapshotGqlResponse";
      id: string;
      title: string;
      priceIrt: number;
    };
    coupon?: {
      __typename?: "CoursePaymentCouponSnapshotGqlResponse";
      id: string;
      couponId: string;
      code: string;
      title: string;
      discountType: PaymentCouponDiscountType;
      discountValue: number;
    } | null;
    uploadedReceiptFile?: {
      __typename?: "CoursePaymentStoredFileGqlResponse";
      id: string;
      name?: string | null;
      title?: string | null;
      mimeType?: string | null;
      sizeBytes?: number | null;
      path?: string | null;
      accessUrl?: string | null;
    } | null;
    receiptUploader?: {
      __typename?: "CoursePaymentRelatedUserGqlResponse";
      id: string;
      fullName?: string | null;
      username?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
    manualStatusChanger?: {
      __typename?: "CoursePaymentRelatedUserGqlResponse";
      id: string;
      fullName?: string | null;
      username?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  };
};

export type CoursePurchaseSubmitMutationVariables = Exact<{
  input: CoursePurchaseSubmitGqlInput;
}>;

export type CoursePurchaseSubmitMutation = {
  __typename?: "Mutation";
  coursePurchaseSubmit: {
    __typename?: "CoursePurchaseSubmitGqlResponse";
    id: string;
    courseId: string;
    status: UserCoursePurchaseStatus;
    paymentMethod: UserCoursePaymentMethod;
    currency: UserCoursePurchaseCurrency;
    amountIrt: number;
    discountAmountIrt?: number | null;
    finalAmountIrt: number;
    couponCode?: string | null;
    uploadedReceiptFileId?: string | null;
    paymentReference?: string | null;
    transactionId?: string | null;
    paymentUrl?: string | null;
    paymentAuthority?: string | null;
    isPurchased: boolean;
  };
};

export type CourseUpdateMutationVariables = Exact<{
  input: CourseUpdateGqlInput;
}>;

export type CourseUpdateMutation = {
  __typename?: "Mutation";
  courseUpdate: {
    __typename?: "CourseListGqlResponse";
    id: string;
    title: string;
    description?: string | null;
    coverImageFileId?: string | null;
    priceIrt?: number | null;
    isActive: boolean;
    sortOrder?: number | null;
    tags: Array<string>;
    releaseType: CourseReleaseType;
    createdAt?: any | null;
    updatedAt?: any | null;
    discount?: {
      __typename?: "CourseListDiscountGqlResponse";
      type: CourseDiscountType;
      value: number;
    } | null;
    chapters: Array<{
      __typename?: "CourseListChapterGqlResponse";
      title: string;
      description?: string | null;
      iconFileId?: string | null;
      visibleAfterMinutes?: number | null;
      isFree: boolean;
      sortOrder?: number | null;
      items: Array<{
        __typename?: "CourseListItemGqlResponse";
        title: string;
        sortOrder?: number | null;
        fileId?: string | null;
        article?: string | null;
        type: CourseItemType;
      }>;
    }>;
  };
};

export type FileUploadMutationVariables = Exact<{
  input: FileUploadGqlInput;
}>;

export type FileUploadMutation = {
  __typename?: "Mutation";
  fileUpload: {
    __typename?: "FileUploadGqlResponse";
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    path: string;
    uploadedAt: any;
  };
};

export type ResolveAuthIdentityMutationVariables = Exact<{
  input: UserRequestLoginCodeGqlInput;
}>;

export type ResolveAuthIdentityMutation = {
  __typename?: "Mutation";
  resolveAuthIdentity: { __typename?: "UserResolveAuthIdentityGqlResponse"; exists: boolean };
};

export type UserCreateMutationVariables = Exact<{
  input: UserCreateGqlInput;
}>;

export type UserCreateMutation = {
  __typename?: "Mutation";
  userCreate: {
    __typename?: "UserMutationGqlResponse";
    id: string;
    username: string;
    roles: Array<UserRole>;
    status: UserStatus;
    profile?: {
      __typename?: "UserListProfileGqlResponse";
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phoneNumber?: string | null;
      avatarFileId?: string | null;
      bio?: string | null;
    } | null;
  };
};

export type UserLoginMutationVariables = Exact<{
  input: UserLoginGqlInput;
}>;

export type UserLoginMutation = {
  __typename?: "Mutation";
  userLogin: {
    __typename?: "UserLoginGqlResponse";
    accessToken: string;
    user: {
      __typename?: "UserLoginUserGqlResponse";
      id: string;
      username: string;
      roles: Array<UserRole>;
    };
  };
};

export type UserRequestLoginCodeMutationVariables = Exact<{
  input: UserRequestLoginCodeGqlInput;
}>;

export type UserRequestLoginCodeMutation = {
  __typename?: "Mutation";
  requestLoginCode: {
    __typename?: "UserRequestLoginCodeGqlResponse";
    success: boolean;
    message: string;
  };
};

export type UserRequestSignupCodeMutationVariables = Exact<{
  input: UserRequestSignupCodeGqlInput;
}>;

export type UserRequestSignupCodeMutation = {
  __typename?: "Mutation";
  requestSignupCode: {
    __typename?: "UserRequestLoginCodeGqlResponse";
    success: boolean;
    message: string;
  };
};

export type UserSignupMutationVariables = Exact<{
  input: UserSignupGqlInput;
}>;

export type UserSignupMutation = {
  __typename?: "Mutation";
  userSignup: {
    __typename?: "UserLoginGqlResponse";
    accessToken: string;
    user: {
      __typename?: "UserLoginUserGqlResponse";
      id: string;
      username: string;
      roles: Array<UserRole>;
    };
  };
};

export type UserUpdateMutationVariables = Exact<{
  input: UserUpdateGqlInput;
}>;

export type UserUpdateMutation = {
  __typename?: "Mutation";
  userUpdate: {
    __typename?: "UserMutationGqlResponse";
    id: string;
    username: string;
    roles: Array<UserRole>;
    status: UserStatus;
    profile?: {
      __typename?: "UserListProfileGqlResponse";
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phoneNumber?: string | null;
      avatarFileId?: string | null;
      bio?: string | null;
    } | null;
  };
};

export type UserVerifyLoginCodeMutationVariables = Exact<{
  input: UserVerifyLoginCodeGqlInput;
}>;

export type UserVerifyLoginCodeMutation = {
  __typename?: "Mutation";
  verifyLoginCode: {
    __typename?: "UserVerifyLoginCodeGqlResponse";
    success: boolean;
    message: string;
    userId?: string | null;
    accessToken?: string | null;
  };
};

export type CourseListQueryVariables = Exact<{
  input: CourseListGqlInput;
}>;

export type CourseListQuery = {
  __typename?: "Query";
  courseList: {
    __typename?: "CourseListPaginatedCursorGqlResponse";
    items: Array<{
      __typename?: "CourseListGqlResponse";
      id: string;
      title: string;
      description?: string | null;
      coverImageFileId?: string | null;
      priceIrt?: number | null;
      isActive: boolean;
      sortOrder?: number | null;
      tags: Array<string>;
      releaseType: CourseReleaseType;
      createdAt?: any | null;
      updatedAt?: any | null;
      discount?: {
        __typename?: "CourseListDiscountGqlResponse";
        type: CourseDiscountType;
        value: number;
      } | null;
      chapters: Array<{
        __typename?: "CourseListChapterGqlResponse";
        title: string;
        description?: string | null;
        iconFileId?: string | null;
        visibleAfterMinutes?: number | null;
        isFree: boolean;
        sortOrder?: number | null;
        items: Array<{
          __typename?: "CourseListItemGqlResponse";
          title: string;
          sortOrder?: number | null;
          fileId?: string | null;
          article?: string | null;
          type: CourseItemType;
        }>;
      }>;
    }>;
    pagination: {
      __typename?: "PaginationCursorResponse";
      limit: number;
      total: number;
      count: number;
      startCursor?: string | null;
      endCursor?: string | null;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
};

export type CoursePaymentListQueryVariables = Exact<{
  input: CoursePaymentListGqlInput;
}>;

export type CoursePaymentListQuery = {
  __typename?: "Query";
  coursePaymentList: {
    __typename?: "CoursePaymentListPaginatedOffsetGqlResponse";
    items: Array<{
      __typename?: "CoursePaymentListGqlResponse";
      id: string;
      userId: string;
      courseId: string;
      status: UserCoursePurchaseStatus;
      paymentMethod: UserCoursePaymentMethod;
      currency: UserCoursePurchaseCurrency;
      paymentProvider?: string | null;
      paymentReference?: string | null;
      transactionId?: string | null;
      amountIrt: number;
      discountPercentage?: number | null;
      discountAmountIrt?: number | null;
      finalAmountIrt: number;
      uploadedReceiptFileId?: string | null;
      receiptUploadedBy?: string | null;
      isManualStatusChange: boolean;
      submittedInitiallyByAdmin: boolean;
      manualStatusChangedBy?: string | null;
      manualStatusChangedDescription?: string | null;
      createdAt?: any | null;
      updatedAt?: any | null;
      pendingAt?: any | null;
      paidAt?: any | null;
      failedAt?: any | null;
      refundedAt?: any | null;
      cancelledAt?: any | null;
      user: {
        __typename?: "CoursePaymentUserSnapshotGqlResponse";
        id: string;
        fullName: string;
        username: string;
        email: string;
        phone?: string | null;
        mobilePhone?: string | null;
      };
      course: {
        __typename?: "CoursePaymentCourseSnapshotGqlResponse";
        id: string;
        title: string;
        priceIrt: number;
      };
      coupon?: {
        __typename?: "CoursePaymentCouponSnapshotGqlResponse";
        id: string;
        couponId: string;
        code: string;
        title: string;
        discountType: PaymentCouponDiscountType;
        discountValue: number;
      } | null;
      uploadedReceiptFile?: {
        __typename?: "CoursePaymentStoredFileGqlResponse";
        id: string;
        name?: string | null;
        title?: string | null;
        mimeType?: string | null;
        sizeBytes?: number | null;
        path?: string | null;
        accessUrl?: string | null;
      } | null;
      receiptUploader?: {
        __typename?: "CoursePaymentRelatedUserGqlResponse";
        id: string;
        fullName?: string | null;
        username?: string | null;
        email?: string | null;
        phone?: string | null;
      } | null;
      manualStatusChanger?: {
        __typename?: "CoursePaymentRelatedUserGqlResponse";
        id: string;
        fullName?: string | null;
        username?: string | null;
        email?: string | null;
        phone?: string | null;
      } | null;
    }>;
    pagination: {
      __typename?: "PaginationOffsetResponse";
      limit: number;
      skip: number;
      total: number;
      count: number;
    };
  };
};

export type FileDetailQueryVariables = Exact<{
  input: FileDetailGqlInput;
}>;

export type FileDetailQuery = {
  __typename?: "Query";
  fileDetail: {
    __typename?: "FileUploadGqlResponse";
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    path: string;
    uploadedAt: any;
    accessUrl?: string | null;
  };
};

export type PaymentCheckoutConfigQueryVariables = Exact<{ [key: string]: never }>;

export type PaymentCheckoutConfigQuery = {
  __typename?: "Query";
  paymentCheckoutConfig: {
    __typename?: "PaymentCheckoutConfigGqlResponse";
    paymentCards: Array<{
      __typename?: "PaymentCheckoutCardGqlResponse";
      cardNumber: string;
      holderName: string;
      bankName: string;
    }>;
    cryptoWallets: Array<{
      __typename?: "PaymentCheckoutCryptoWalletGqlResponse";
      address: string;
      network: string;
    }>;
    paymentMethods: Array<{
      __typename?: "PaymentCheckoutMethodGqlResponse";
      method: UserCoursePaymentMethod;
      isVisible: boolean;
      isActive: boolean;
      isRecommended: boolean;
    }>;
    usdtIrtRate: {
      __typename?: "PaymentCheckoutUsdtIrtRateGqlResponse";
      valueIrt: number;
      feeUsdt: number;
      coefficient: number;
    };
  };
};

export type PaymentCouponValidateQueryVariables = Exact<{
  input: PaymentCouponValidateGqlInput;
}>;

export type PaymentCouponValidateQuery = {
  __typename?: "Query";
  paymentCouponValidate: {
    __typename?: "PaymentCouponValidateGqlResponse";
    isValid: boolean;
    message?: string | null;
    couponId?: string | null;
    code?: string | null;
    title?: string | null;
    discountType?: PaymentCouponDiscountType | null;
    discountValue?: number | null;
    amountIrt?: number | null;
    courseDiscountAmountIrt?: number | null;
    payableAmountBeforeCouponIrt?: number | null;
    couponDiscountAmountIrt?: number | null;
    finalAmountIrt?: number | null;
  };
};

export type UserCourseDetailQueryVariables = Exact<{
  input: UserCourseDetailGqlInput;
}>;

export type UserCourseDetailQuery = {
  __typename?: "Query";
  course: {
    __typename?: "UserCourseDetailGqlResponse";
    id: string;
    title: string;
    description?: string | null;
    coverImageFileId?: string | null;
    priceIrt?: number | null;
    tags: Array<string>;
    releaseType: CourseReleaseType;
    isFree: boolean;
    isPurchased: boolean;
    purchaseStatus?: UserCoursePurchaseStatus | null;
    discount?: {
      __typename?: "UserCourseListDiscountGqlResponse";
      type: CourseDiscountType;
      value: number;
    } | null;
    chapters: Array<{
      __typename?: "UserCourseDetailChapterGqlResponse";
      key: string;
      title: string;
      description?: string | null;
      iconFileId?: string | null;
      visibleAfterMinutes?: number | null;
      isFree: boolean;
      isLocked: boolean;
      items: Array<{
        __typename?: "UserCourseDetailItemGqlResponse";
        title: string;
        type: CourseItemType;
        isLocked: boolean;
        fileId?: string | null;
        article?: string | null;
      }>;
    }>;
  };
};

export type UserCourseListQueryVariables = Exact<{
  input: CourseListGqlInput;
}>;

export type UserCourseListQuery = {
  __typename?: "Query";
  courseList: {
    __typename?: "UserCourseListPaginatedCursorGqlResponse";
    items: Array<{
      __typename?: "UserCourseListGqlResponse";
      id: string;
      title: string;
      description?: string | null;
      coverImageFileId?: string | null;
      priceIrt?: number | null;
      tags: Array<string>;
      releaseType: CourseReleaseType;
      chapterCount: number;
      itemCount: number;
      itemTypes: Array<CourseItemType>;
      isPurchased: boolean;
      discount?: {
        __typename?: "UserCourseListDiscountGqlResponse";
        type: CourseDiscountType;
        value: number;
      } | null;
    }>;
    pagination: {
      __typename?: "PaginationCursorResponse";
      limit: number;
      total: number;
      count: number;
      startCursor?: string | null;
      endCursor?: string | null;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
};

export type UserListQueryVariables = Exact<{
  input: UserListGqlInput;
}>;

export type UserListQuery = {
  __typename?: "Query";
  userList: {
    __typename?: "UserListPaginatedOffsetGqlResponse";
    items: Array<{
      __typename?: "UserListGqlResponse";
      id: string;
      username: string;
      roles: Array<UserRole>;
      status: UserStatus;
      createdAt?: any | null;
      updatedAt?: any | null;
      profile?: {
        __typename?: "UserListProfileGqlResponse";
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
        phoneNumber?: string | null;
        avatarFileId?: string | null;
        bio?: string | null;
      } | null;
    }>;
    pagination: {
      __typename?: "PaginationOffsetResponse";
      limit: number;
      skip: number;
      total: number;
      count: number;
    };
  };
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  __typename?: "Query";
  me: {
    __typename?: "UserMeGqlResponse";
    id: string;
    username: string;
    roles: Array<UserRole>;
    status: UserStatus;
    profile?: {
      __typename?: "UserProfileMinimalGqlResponse";
      firstName?: string | null;
      lastName?: string | null;
      avatarFileId?: string | null;
    } | null;
    preferences?: {
      __typename?: "UserPreferencesGqlResponse";
      timezone?: string | null;
      notificationsEnabled: boolean;
      theme?: string | null;
    } | null;
  };
};

export const CourseCreateDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CourseCreate" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "CourseCreateGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "courseCreate" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "title" } },
                { kind: "Field", name: { kind: "Name", value: "description" } },
                { kind: "Field", name: { kind: "Name", value: "coverImageFileId" } },
                { kind: "Field", name: { kind: "Name", value: "priceIrt" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "discount" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "type" } },
                      { kind: "Field", name: { kind: "Name", value: "value" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "isActive" } },
                { kind: "Field", name: { kind: "Name", value: "sortOrder" } },
                { kind: "Field", name: { kind: "Name", value: "tags" } },
                { kind: "Field", name: { kind: "Name", value: "releaseType" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "chapters" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "description" } },
                      { kind: "Field", name: { kind: "Name", value: "iconFileId" } },
                      { kind: "Field", name: { kind: "Name", value: "visibleAfterMinutes" } },
                      { kind: "Field", name: { kind: "Name", value: "isFree" } },
                      { kind: "Field", name: { kind: "Name", value: "sortOrder" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "items" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "title" } },
                            { kind: "Field", name: { kind: "Name", value: "sortOrder" } },
                            { kind: "Field", name: { kind: "Name", value: "fileId" } },
                            { kind: "Field", name: { kind: "Name", value: "article" } },
                            { kind: "Field", name: { kind: "Name", value: "type" } },
                          ],
                        },
                      },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CourseCreateMutation, CourseCreateMutationVariables>;
export const CourseDeleteDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CourseDelete" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "CourseDeleteGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "courseDelete" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CourseDeleteMutation, CourseDeleteMutationVariables>;
export const CoursePaymentManualCreateDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CoursePaymentManualCreate" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "CoursePaymentManualCreateGqlInput" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "coursePaymentManualCreate" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "userId" } },
                { kind: "Field", name: { kind: "Name", value: "courseId" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "user" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "fullName" } },
                      { kind: "Field", name: { kind: "Name", value: "username" } },
                      { kind: "Field", name: { kind: "Name", value: "email" } },
                      { kind: "Field", name: { kind: "Name", value: "phone" } },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "course" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "priceIrt" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "status" } },
                { kind: "Field", name: { kind: "Name", value: "paymentMethod" } },
                { kind: "Field", name: { kind: "Name", value: "currency" } },
                { kind: "Field", name: { kind: "Name", value: "paymentProvider" } },
                { kind: "Field", name: { kind: "Name", value: "paymentReference" } },
                { kind: "Field", name: { kind: "Name", value: "transactionId" } },
                { kind: "Field", name: { kind: "Name", value: "amountIrt" } },
                { kind: "Field", name: { kind: "Name", value: "discountPercentage" } },
                { kind: "Field", name: { kind: "Name", value: "discountAmountIrt" } },
                { kind: "Field", name: { kind: "Name", value: "finalAmountIrt" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "coupon" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "couponId" } },
                      { kind: "Field", name: { kind: "Name", value: "code" } },
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "discountType" } },
                      { kind: "Field", name: { kind: "Name", value: "discountValue" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "uploadedReceiptFileId" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "uploadedReceiptFile" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "mimeType" } },
                      { kind: "Field", name: { kind: "Name", value: "sizeBytes" } },
                      { kind: "Field", name: { kind: "Name", value: "path" } },
                      { kind: "Field", name: { kind: "Name", value: "accessUrl" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "receiptUploadedBy" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "receiptUploader" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "fullName" } },
                      { kind: "Field", name: { kind: "Name", value: "username" } },
                      { kind: "Field", name: { kind: "Name", value: "email" } },
                      { kind: "Field", name: { kind: "Name", value: "phone" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "isManualStatusChange" } },
                { kind: "Field", name: { kind: "Name", value: "submittedInitiallyByAdmin" } },
                { kind: "Field", name: { kind: "Name", value: "manualStatusChangedBy" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "manualStatusChanger" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "fullName" } },
                      { kind: "Field", name: { kind: "Name", value: "username" } },
                      { kind: "Field", name: { kind: "Name", value: "email" } },
                      { kind: "Field", name: { kind: "Name", value: "phone" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "manualStatusChangedDescription" } },
                { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                { kind: "Field", name: { kind: "Name", value: "pendingAt" } },
                { kind: "Field", name: { kind: "Name", value: "paidAt" } },
                { kind: "Field", name: { kind: "Name", value: "failedAt" } },
                { kind: "Field", name: { kind: "Name", value: "refundedAt" } },
                { kind: "Field", name: { kind: "Name", value: "cancelledAt" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  CoursePaymentManualCreateMutation,
  CoursePaymentManualCreateMutationVariables
>;
export const CoursePaymentStatusUpdateDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CoursePaymentStatusUpdate" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "CoursePaymentStatusUpdateGqlInput" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "coursePaymentStatusUpdate" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "userId" } },
                { kind: "Field", name: { kind: "Name", value: "courseId" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "user" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "fullName" } },
                      { kind: "Field", name: { kind: "Name", value: "username" } },
                      { kind: "Field", name: { kind: "Name", value: "email" } },
                      { kind: "Field", name: { kind: "Name", value: "phone" } },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "course" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "priceIrt" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "status" } },
                { kind: "Field", name: { kind: "Name", value: "paymentMethod" } },
                { kind: "Field", name: { kind: "Name", value: "currency" } },
                { kind: "Field", name: { kind: "Name", value: "paymentProvider" } },
                { kind: "Field", name: { kind: "Name", value: "paymentReference" } },
                { kind: "Field", name: { kind: "Name", value: "transactionId" } },
                { kind: "Field", name: { kind: "Name", value: "amountIrt" } },
                { kind: "Field", name: { kind: "Name", value: "discountPercentage" } },
                { kind: "Field", name: { kind: "Name", value: "discountAmountIrt" } },
                { kind: "Field", name: { kind: "Name", value: "finalAmountIrt" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "coupon" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "couponId" } },
                      { kind: "Field", name: { kind: "Name", value: "code" } },
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "discountType" } },
                      { kind: "Field", name: { kind: "Name", value: "discountValue" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "uploadedReceiptFileId" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "uploadedReceiptFile" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "mimeType" } },
                      { kind: "Field", name: { kind: "Name", value: "sizeBytes" } },
                      { kind: "Field", name: { kind: "Name", value: "path" } },
                      { kind: "Field", name: { kind: "Name", value: "accessUrl" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "receiptUploadedBy" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "receiptUploader" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "fullName" } },
                      { kind: "Field", name: { kind: "Name", value: "username" } },
                      { kind: "Field", name: { kind: "Name", value: "email" } },
                      { kind: "Field", name: { kind: "Name", value: "phone" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "isManualStatusChange" } },
                { kind: "Field", name: { kind: "Name", value: "submittedInitiallyByAdmin" } },
                { kind: "Field", name: { kind: "Name", value: "manualStatusChangedBy" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "manualStatusChanger" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "fullName" } },
                      { kind: "Field", name: { kind: "Name", value: "username" } },
                      { kind: "Field", name: { kind: "Name", value: "email" } },
                      { kind: "Field", name: { kind: "Name", value: "phone" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "manualStatusChangedDescription" } },
                { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                { kind: "Field", name: { kind: "Name", value: "pendingAt" } },
                { kind: "Field", name: { kind: "Name", value: "paidAt" } },
                { kind: "Field", name: { kind: "Name", value: "failedAt" } },
                { kind: "Field", name: { kind: "Name", value: "refundedAt" } },
                { kind: "Field", name: { kind: "Name", value: "cancelledAt" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  CoursePaymentStatusUpdateMutation,
  CoursePaymentStatusUpdateMutationVariables
>;
export const CoursePurchaseSubmitDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CoursePurchaseSubmit" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "CoursePurchaseSubmitGqlInput" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "coursePurchaseSubmit" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "courseId" } },
                { kind: "Field", name: { kind: "Name", value: "status" } },
                { kind: "Field", name: { kind: "Name", value: "paymentMethod" } },
                { kind: "Field", name: { kind: "Name", value: "currency" } },
                { kind: "Field", name: { kind: "Name", value: "amountIrt" } },
                { kind: "Field", name: { kind: "Name", value: "discountAmountIrt" } },
                { kind: "Field", name: { kind: "Name", value: "finalAmountIrt" } },
                { kind: "Field", name: { kind: "Name", value: "couponCode" } },
                { kind: "Field", name: { kind: "Name", value: "uploadedReceiptFileId" } },
                { kind: "Field", name: { kind: "Name", value: "paymentReference" } },
                { kind: "Field", name: { kind: "Name", value: "transactionId" } },
                { kind: "Field", name: { kind: "Name", value: "paymentUrl" } },
                { kind: "Field", name: { kind: "Name", value: "paymentAuthority" } },
                { kind: "Field", name: { kind: "Name", value: "isPurchased" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CoursePurchaseSubmitMutation, CoursePurchaseSubmitMutationVariables>;
export const CourseUpdateDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CourseUpdate" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "CourseUpdateGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "courseUpdate" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "title" } },
                { kind: "Field", name: { kind: "Name", value: "description" } },
                { kind: "Field", name: { kind: "Name", value: "coverImageFileId" } },
                { kind: "Field", name: { kind: "Name", value: "priceIrt" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "discount" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "type" } },
                      { kind: "Field", name: { kind: "Name", value: "value" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "isActive" } },
                { kind: "Field", name: { kind: "Name", value: "sortOrder" } },
                { kind: "Field", name: { kind: "Name", value: "tags" } },
                { kind: "Field", name: { kind: "Name", value: "releaseType" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "chapters" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "description" } },
                      { kind: "Field", name: { kind: "Name", value: "iconFileId" } },
                      { kind: "Field", name: { kind: "Name", value: "visibleAfterMinutes" } },
                      { kind: "Field", name: { kind: "Name", value: "isFree" } },
                      { kind: "Field", name: { kind: "Name", value: "sortOrder" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "items" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "title" } },
                            { kind: "Field", name: { kind: "Name", value: "sortOrder" } },
                            { kind: "Field", name: { kind: "Name", value: "fileId" } },
                            { kind: "Field", name: { kind: "Name", value: "article" } },
                            { kind: "Field", name: { kind: "Name", value: "type" } },
                          ],
                        },
                      },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CourseUpdateMutation, CourseUpdateMutationVariables>;
export const FileUploadDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "FileUpload" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "FileUploadGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "fileUpload" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "mimeType" } },
                { kind: "Field", name: { kind: "Name", value: "sizeBytes" } },
                { kind: "Field", name: { kind: "Name", value: "path" } },
                { kind: "Field", name: { kind: "Name", value: "uploadedAt" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<FileUploadMutation, FileUploadMutationVariables>;
export const ResolveAuthIdentityDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "ResolveAuthIdentity" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "UserRequestLoginCodeGqlInput" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "resolveAuthIdentity" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [{ kind: "Field", name: { kind: "Name", value: "exists" } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ResolveAuthIdentityMutation, ResolveAuthIdentityMutationVariables>;
export const UserCreateDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UserCreate" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UserCreateGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "userCreate" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "username" } },
                { kind: "Field", name: { kind: "Name", value: "roles" } },
                { kind: "Field", name: { kind: "Name", value: "status" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "profile" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "firstName" } },
                      { kind: "Field", name: { kind: "Name", value: "lastName" } },
                      { kind: "Field", name: { kind: "Name", value: "email" } },
                      { kind: "Field", name: { kind: "Name", value: "phoneNumber" } },
                      { kind: "Field", name: { kind: "Name", value: "avatarFileId" } },
                      { kind: "Field", name: { kind: "Name", value: "bio" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserCreateMutation, UserCreateMutationVariables>;
export const UserLoginDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UserLogin" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UserLoginGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "userLogin" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "accessToken" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "user" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "username" } },
                      { kind: "Field", name: { kind: "Name", value: "roles" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserLoginMutation, UserLoginMutationVariables>;
export const UserRequestLoginCodeDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UserRequestLoginCode" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "UserRequestLoginCodeGqlInput" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "requestLoginCode" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "success" } },
                { kind: "Field", name: { kind: "Name", value: "message" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserRequestLoginCodeMutation, UserRequestLoginCodeMutationVariables>;
export const UserRequestSignupCodeDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UserRequestSignupCode" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "UserRequestSignupCodeGqlInput" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "requestSignupCode" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "success" } },
                { kind: "Field", name: { kind: "Name", value: "message" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserRequestSignupCodeMutation, UserRequestSignupCodeMutationVariables>;
export const UserSignupDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UserSignup" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UserSignupGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "userSignup" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "accessToken" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "user" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "username" } },
                      { kind: "Field", name: { kind: "Name", value: "roles" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserSignupMutation, UserSignupMutationVariables>;
export const UserUpdateDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UserUpdate" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UserUpdateGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "userUpdate" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "username" } },
                { kind: "Field", name: { kind: "Name", value: "roles" } },
                { kind: "Field", name: { kind: "Name", value: "status" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "profile" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "firstName" } },
                      { kind: "Field", name: { kind: "Name", value: "lastName" } },
                      { kind: "Field", name: { kind: "Name", value: "email" } },
                      { kind: "Field", name: { kind: "Name", value: "phoneNumber" } },
                      { kind: "Field", name: { kind: "Name", value: "avatarFileId" } },
                      { kind: "Field", name: { kind: "Name", value: "bio" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserUpdateMutation, UserUpdateMutationVariables>;
export const UserVerifyLoginCodeDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UserVerifyLoginCode" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "UserVerifyLoginCodeGqlInput" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "verifyLoginCode" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "success" } },
                { kind: "Field", name: { kind: "Name", value: "message" } },
                { kind: "Field", name: { kind: "Name", value: "userId" } },
                { kind: "Field", name: { kind: "Name", value: "accessToken" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserVerifyLoginCodeMutation, UserVerifyLoginCodeMutationVariables>;
export const CourseListDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "CourseList" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "CourseListGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "courseList" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "items" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "description" } },
                      { kind: "Field", name: { kind: "Name", value: "coverImageFileId" } },
                      { kind: "Field", name: { kind: "Name", value: "priceIrt" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "discount" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "type" } },
                            { kind: "Field", name: { kind: "Name", value: "value" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "isActive" } },
                      { kind: "Field", name: { kind: "Name", value: "sortOrder" } },
                      { kind: "Field", name: { kind: "Name", value: "tags" } },
                      { kind: "Field", name: { kind: "Name", value: "releaseType" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "chapters" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "title" } },
                            { kind: "Field", name: { kind: "Name", value: "description" } },
                            { kind: "Field", name: { kind: "Name", value: "iconFileId" } },
                            { kind: "Field", name: { kind: "Name", value: "visibleAfterMinutes" } },
                            { kind: "Field", name: { kind: "Name", value: "isFree" } },
                            { kind: "Field", name: { kind: "Name", value: "sortOrder" } },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "items" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  { kind: "Field", name: { kind: "Name", value: "title" } },
                                  { kind: "Field", name: { kind: "Name", value: "sortOrder" } },
                                  { kind: "Field", name: { kind: "Name", value: "fileId" } },
                                  { kind: "Field", name: { kind: "Name", value: "article" } },
                                  { kind: "Field", name: { kind: "Name", value: "type" } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "pagination" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "limit" } },
                      { kind: "Field", name: { kind: "Name", value: "total" } },
                      { kind: "Field", name: { kind: "Name", value: "count" } },
                      { kind: "Field", name: { kind: "Name", value: "startCursor" } },
                      { kind: "Field", name: { kind: "Name", value: "endCursor" } },
                      { kind: "Field", name: { kind: "Name", value: "hasNextPage" } },
                      { kind: "Field", name: { kind: "Name", value: "hasPreviousPage" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CourseListQuery, CourseListQueryVariables>;
export const CoursePaymentListDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "CoursePaymentList" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "CoursePaymentListGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "coursePaymentList" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "items" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "userId" } },
                      { kind: "Field", name: { kind: "Name", value: "courseId" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "user" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "id" } },
                            { kind: "Field", name: { kind: "Name", value: "fullName" } },
                            { kind: "Field", name: { kind: "Name", value: "username" } },
                            { kind: "Field", name: { kind: "Name", value: "email" } },
                            { kind: "Field", name: { kind: "Name", value: "phone" } },
                            { kind: "Field", name: { kind: "Name", value: "mobilePhone" } },
                          ],
                        },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "course" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "id" } },
                            { kind: "Field", name: { kind: "Name", value: "title" } },
                            { kind: "Field", name: { kind: "Name", value: "priceIrt" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "status" } },
                      { kind: "Field", name: { kind: "Name", value: "paymentMethod" } },
                      { kind: "Field", name: { kind: "Name", value: "currency" } },
                      { kind: "Field", name: { kind: "Name", value: "paymentProvider" } },
                      { kind: "Field", name: { kind: "Name", value: "paymentReference" } },
                      { kind: "Field", name: { kind: "Name", value: "transactionId" } },
                      { kind: "Field", name: { kind: "Name", value: "amountIrt" } },
                      { kind: "Field", name: { kind: "Name", value: "discountPercentage" } },
                      { kind: "Field", name: { kind: "Name", value: "discountAmountIrt" } },
                      { kind: "Field", name: { kind: "Name", value: "finalAmountIrt" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "coupon" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "id" } },
                            { kind: "Field", name: { kind: "Name", value: "couponId" } },
                            { kind: "Field", name: { kind: "Name", value: "code" } },
                            { kind: "Field", name: { kind: "Name", value: "title" } },
                            { kind: "Field", name: { kind: "Name", value: "discountType" } },
                            { kind: "Field", name: { kind: "Name", value: "discountValue" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "uploadedReceiptFileId" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "uploadedReceiptFile" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "id" } },
                            { kind: "Field", name: { kind: "Name", value: "name" } },
                            { kind: "Field", name: { kind: "Name", value: "title" } },
                            { kind: "Field", name: { kind: "Name", value: "mimeType" } },
                            { kind: "Field", name: { kind: "Name", value: "sizeBytes" } },
                            { kind: "Field", name: { kind: "Name", value: "path" } },
                            { kind: "Field", name: { kind: "Name", value: "accessUrl" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "receiptUploadedBy" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "receiptUploader" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "id" } },
                            { kind: "Field", name: { kind: "Name", value: "fullName" } },
                            { kind: "Field", name: { kind: "Name", value: "username" } },
                            { kind: "Field", name: { kind: "Name", value: "email" } },
                            { kind: "Field", name: { kind: "Name", value: "phone" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "isManualStatusChange" } },
                      { kind: "Field", name: { kind: "Name", value: "submittedInitiallyByAdmin" } },
                      { kind: "Field", name: { kind: "Name", value: "manualStatusChangedBy" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "manualStatusChanger" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "id" } },
                            { kind: "Field", name: { kind: "Name", value: "fullName" } },
                            { kind: "Field", name: { kind: "Name", value: "username" } },
                            { kind: "Field", name: { kind: "Name", value: "email" } },
                            { kind: "Field", name: { kind: "Name", value: "phone" } },
                          ],
                        },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "manualStatusChangedDescription" },
                      },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                      { kind: "Field", name: { kind: "Name", value: "pendingAt" } },
                      { kind: "Field", name: { kind: "Name", value: "paidAt" } },
                      { kind: "Field", name: { kind: "Name", value: "failedAt" } },
                      { kind: "Field", name: { kind: "Name", value: "refundedAt" } },
                      { kind: "Field", name: { kind: "Name", value: "cancelledAt" } },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "pagination" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "limit" } },
                      { kind: "Field", name: { kind: "Name", value: "skip" } },
                      { kind: "Field", name: { kind: "Name", value: "total" } },
                      { kind: "Field", name: { kind: "Name", value: "count" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CoursePaymentListQuery, CoursePaymentListQueryVariables>;
export const FileDetailDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "FileDetail" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "FileDetailGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "fileDetail" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "mimeType" } },
                { kind: "Field", name: { kind: "Name", value: "sizeBytes" } },
                { kind: "Field", name: { kind: "Name", value: "path" } },
                { kind: "Field", name: { kind: "Name", value: "uploadedAt" } },
                { kind: "Field", name: { kind: "Name", value: "accessUrl" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<FileDetailQuery, FileDetailQueryVariables>;
export const PaymentCheckoutConfigDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "PaymentCheckoutConfig" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "paymentCheckoutConfig" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "paymentCards" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "cardNumber" } },
                      { kind: "Field", name: { kind: "Name", value: "holderName" } },
                      { kind: "Field", name: { kind: "Name", value: "bankName" } },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "cryptoWallets" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "address" } },
                      { kind: "Field", name: { kind: "Name", value: "network" } },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "paymentMethods" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "method" } },
                      { kind: "Field", name: { kind: "Name", value: "isVisible" } },
                      { kind: "Field", name: { kind: "Name", value: "isActive" } },
                      { kind: "Field", name: { kind: "Name", value: "isRecommended" } },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "usdtIrtRate" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "valueIrt" } },
                      { kind: "Field", name: { kind: "Name", value: "feeUsdt" } },
                      { kind: "Field", name: { kind: "Name", value: "coefficient" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PaymentCheckoutConfigQuery, PaymentCheckoutConfigQueryVariables>;
export const PaymentCouponValidateDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "PaymentCouponValidate" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "PaymentCouponValidateGqlInput" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "paymentCouponValidate" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "isValid" } },
                { kind: "Field", name: { kind: "Name", value: "message" } },
                { kind: "Field", name: { kind: "Name", value: "couponId" } },
                { kind: "Field", name: { kind: "Name", value: "code" } },
                { kind: "Field", name: { kind: "Name", value: "title" } },
                { kind: "Field", name: { kind: "Name", value: "discountType" } },
                { kind: "Field", name: { kind: "Name", value: "discountValue" } },
                { kind: "Field", name: { kind: "Name", value: "amountIrt" } },
                { kind: "Field", name: { kind: "Name", value: "courseDiscountAmountIrt" } },
                { kind: "Field", name: { kind: "Name", value: "payableAmountBeforeCouponIrt" } },
                { kind: "Field", name: { kind: "Name", value: "couponDiscountAmountIrt" } },
                { kind: "Field", name: { kind: "Name", value: "finalAmountIrt" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PaymentCouponValidateQuery, PaymentCouponValidateQueryVariables>;
export const UserCourseDetailDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "UserCourseDetail" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UserCourseDetailGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            alias: { kind: "Name", value: "course" },
            name: { kind: "Name", value: "userCourseDetail" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "title" } },
                { kind: "Field", name: { kind: "Name", value: "description" } },
                { kind: "Field", name: { kind: "Name", value: "coverImageFileId" } },
                { kind: "Field", name: { kind: "Name", value: "priceIrt" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "discount" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "type" } },
                      { kind: "Field", name: { kind: "Name", value: "value" } },
                    ],
                  },
                },
                { kind: "Field", name: { kind: "Name", value: "tags" } },
                { kind: "Field", name: { kind: "Name", value: "releaseType" } },
                { kind: "Field", name: { kind: "Name", value: "isFree" } },
                { kind: "Field", name: { kind: "Name", value: "isPurchased" } },
                { kind: "Field", name: { kind: "Name", value: "purchaseStatus" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "chapters" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "key" } },
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "description" } },
                      { kind: "Field", name: { kind: "Name", value: "iconFileId" } },
                      { kind: "Field", name: { kind: "Name", value: "visibleAfterMinutes" } },
                      { kind: "Field", name: { kind: "Name", value: "isFree" } },
                      { kind: "Field", name: { kind: "Name", value: "isLocked" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "items" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "title" } },
                            { kind: "Field", name: { kind: "Name", value: "type" } },
                            { kind: "Field", name: { kind: "Name", value: "isLocked" } },
                            { kind: "Field", name: { kind: "Name", value: "fileId" } },
                            { kind: "Field", name: { kind: "Name", value: "article" } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserCourseDetailQuery, UserCourseDetailQueryVariables>;
export const UserCourseListDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "UserCourseList" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "CourseListGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            alias: { kind: "Name", value: "courseList" },
            name: { kind: "Name", value: "userCourseList" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "items" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "description" } },
                      { kind: "Field", name: { kind: "Name", value: "coverImageFileId" } },
                      { kind: "Field", name: { kind: "Name", value: "priceIrt" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "discount" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "type" } },
                            { kind: "Field", name: { kind: "Name", value: "value" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "tags" } },
                      { kind: "Field", name: { kind: "Name", value: "releaseType" } },
                      { kind: "Field", name: { kind: "Name", value: "chapterCount" } },
                      { kind: "Field", name: { kind: "Name", value: "itemCount" } },
                      { kind: "Field", name: { kind: "Name", value: "itemTypes" } },
                      { kind: "Field", name: { kind: "Name", value: "isPurchased" } },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "pagination" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "limit" } },
                      { kind: "Field", name: { kind: "Name", value: "total" } },
                      { kind: "Field", name: { kind: "Name", value: "count" } },
                      { kind: "Field", name: { kind: "Name", value: "startCursor" } },
                      { kind: "Field", name: { kind: "Name", value: "endCursor" } },
                      { kind: "Field", name: { kind: "Name", value: "hasNextPage" } },
                      { kind: "Field", name: { kind: "Name", value: "hasPreviousPage" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserCourseListQuery, UserCourseListQueryVariables>;
export const UserListDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "UserList" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UserListGqlInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "userList" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "items" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "username" } },
                      { kind: "Field", name: { kind: "Name", value: "roles" } },
                      { kind: "Field", name: { kind: "Name", value: "status" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "profile" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "firstName" } },
                            { kind: "Field", name: { kind: "Name", value: "lastName" } },
                            { kind: "Field", name: { kind: "Name", value: "email" } },
                            { kind: "Field", name: { kind: "Name", value: "phoneNumber" } },
                            { kind: "Field", name: { kind: "Name", value: "avatarFileId" } },
                            { kind: "Field", name: { kind: "Name", value: "bio" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "pagination" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "limit" } },
                      { kind: "Field", name: { kind: "Name", value: "skip" } },
                      { kind: "Field", name: { kind: "Name", value: "total" } },
                      { kind: "Field", name: { kind: "Name", value: "count" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserListQuery, UserListQueryVariables>;
export const MeDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "Me" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "me" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "username" } },
                { kind: "Field", name: { kind: "Name", value: "roles" } },
                { kind: "Field", name: { kind: "Name", value: "status" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "profile" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "firstName" } },
                      { kind: "Field", name: { kind: "Name", value: "lastName" } },
                      { kind: "Field", name: { kind: "Name", value: "avatarFileId" } },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "preferences" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "timezone" } },
                      { kind: "Field", name: { kind: "Name", value: "notificationsEnabled" } },
                      { kind: "Field", name: { kind: "Name", value: "theme" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
