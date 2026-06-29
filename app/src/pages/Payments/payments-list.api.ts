import { parseJalaliParamDate } from "../../utilities/jalali-date-param.util";
import {
  getFileIdFromAccessUrl,
  isExecutableFileType,
  resolveFileAccessUrl,
  type ExistingFilePreview,
  type FileAccessUrl,
} from "../../utils/fileAccessUrl.util";

export type PurchaseStatusChangedBy = "ADMIN" | "SYSTEM";

export type UserProductPaymentMethod = "GATEWAY" | "CARD_TO_CARD" | "CRYPTOCURRENCY" | "FREE";

export type UserProductPurchaseStatus =
  | "PENDING"
  | "PENDING_GATEWAY"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type UserProductPurchaseCurrency = "IRT" | "USDT";

export type CouponDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type ProductPaymentRelatedUser = {
  readonly id: string;
  readonly fullName?: string | null;
  readonly username?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
};

export type ProductPaymentStoredFile = {
  readonly id: string;
  readonly name?: string | null;
  readonly title?: string | null;
  readonly mimeType?: string | null;
  readonly sizeBytes?: number | null;
  readonly path?: string | null;
  readonly accessUrl?: FileAccessUrl | null;
};

export type ProductPaymentListItemRow = {
  readonly id: string;
  readonly userId: string;
  readonly productId: string;
  readonly user: {
    readonly fullName: string;
    readonly username: string;
    readonly email: string;
    readonly phone?: string | null;
    readonly mobilePhone?: string | null;
  };
  readonly product: {
    readonly title: string;
  };
  readonly status: UserProductPurchaseStatus;
  readonly paymentMethod: UserProductPaymentMethod;
  readonly currency: UserProductPurchaseCurrency;
  readonly paymentProvider?: string | null;
  readonly paymentReference?: string | null;
  readonly transactionId?: string | null;
  readonly amountIrt: number;
  readonly discountPercentage?: number | null;
  readonly discountAmountIrt?: number | null;
  readonly finalAmountIrt: number;
  readonly coupon?: {
    readonly couponId: string;
    readonly code: string;
    readonly discountType: CouponDiscountType;
    readonly discountValue: number;
  } | null;
  readonly uploadedReceiptFile?: {
    readonly accessUrl?: Pick<FileAccessUrl, "fileId"> | null;
  } | null;
  readonly receiptUploadedBy?: string | null;
  readonly isManualStatusChange: boolean;
  readonly manualStatusChangedBy?: string | null;
  readonly manualStatusChangedDescription?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly pendingAt?: string | null;
  readonly gatewayPendingAt?: string | null;
  readonly paidAt?: string | null;
  readonly failedAt?: string | null;
  readonly refundedAt?: string | null;
  readonly cancelledAt?: string | null;
};

export type ProductPaymentDetailRow = {
  readonly id: string;
  readonly userId: string;
  readonly productId: string;
  readonly user: {
    readonly id: string;
    readonly fullName: string;
    readonly username: string;
    readonly email: string;
    readonly phone?: string | null;
    readonly mobilePhone?: string | null;
  };
  readonly product: {
    readonly id: string;
    readonly title: string;
    readonly priceIrt: number;
  };
  readonly status: UserProductPurchaseStatus;
  readonly paymentMethod: UserProductPaymentMethod;
  readonly currency: UserProductPurchaseCurrency;
  readonly paymentProvider?: string | null;
  readonly paymentReference?: string | null;
  readonly transactionId?: string | null;
  readonly amountIrt: number;
  readonly discountPercentage?: number | null;
  readonly discountAmountIrt?: number | null;
  readonly finalAmountIrt: number;
  readonly coupon?: {
    readonly id: string;
    readonly couponId: string;
    readonly code: string;
    readonly title: string;
    readonly discountType: CouponDiscountType;
    readonly discountValue: number;
  } | null;
  readonly uploadedReceiptFile?: ProductPaymentStoredFile | null;
  readonly receiptUploadedBy?: string | null;
  readonly receiptUploader?: ProductPaymentRelatedUser | null;
  readonly isManualStatusChange: boolean;
  readonly statusChangedBy?: PurchaseStatusChangedBy | null;
  readonly submittedInitiallyByAdmin: boolean;
  readonly createdBy?: string | null;
  readonly createdByUser?: ProductPaymentRelatedUser | null;
  readonly manualStatusChangedBy?: string | null;
  readonly manualStatusChanger?: ProductPaymentRelatedUser | null;
  readonly manualStatusChangedDescription?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly pendingAt?: string | null;
  readonly gatewayPendingAt?: string | null;
  readonly paidAt?: string | null;
  readonly failedAt?: string | null;
  readonly refundedAt?: string | null;
  readonly cancelledAt?: string | null;
};

export type ProductPaymentListQuery = {
  productPaymentList: {
    items: ProductPaymentListItemRow[];
    pagination: {
      limit: number;
      skip: number;
      total: number;
      count: number;
    };
  };
};

export type ProductPaymentDetailQuery = {
  productPaymentDetail: ProductPaymentDetailRow;
};

export type ProductPaymentDetailQueryVariables = {
  input: {
    id: string;
  };
};

export type ProductPaymentListFilters = {
  query: string;
  userFullName: string;
  username: string;
  userEmail: string;
  userPhone: string;
  productTitle: string;
  status: UserProductPurchaseStatus | "ALL";
  paymentMethod: UserProductPaymentMethod | "ALL";
  currency: UserProductPurchaseCurrency | "ALL";
  paymentProvider: string;
  paymentReference: string;
  transactionId: string;
  amountIrtMin: string;
  amountIrtMax: string;
  discountPercentageMin: string;
  discountPercentageMax: string;
  discountAmountIrtMin: string;
  discountAmountIrtMax: string;
  finalAmountIrtMin: string;
  finalAmountIrtMax: string;
  isManualStatusChange: "ALL" | "true" | "false";
  manualStatusChangedDescription: string;
  couponCode: string;
  couponDiscountType: CouponDiscountType | "ALL";
  couponDiscountValueMin: string;
  couponDiscountValueMax: string;
  createdAtFrom: string;
  createdAtTo: string;
  updatedAtFrom: string;
  updatedAtTo: string;
  pendingAtFrom: string;
  pendingAtTo: string;
  paidAtFrom: string;
  paidAtTo: string;
  failedAtFrom: string;
  failedAtTo: string;
  refundedAtFrom: string;
  refundedAtTo: string;
  cancelledAtFrom: string;
  cancelledAtTo: string;
};

export const EMPTY_PRODUCT_PAYMENT_LIST_FILTERS: ProductPaymentListFilters = {
  query: "",
  userFullName: "",
  username: "",
  userEmail: "",
  userPhone: "",
  productTitle: "",
  status: "ALL",
  paymentMethod: "ALL",
  currency: "ALL",
  paymentProvider: "",
  paymentReference: "",
  transactionId: "",
  amountIrtMin: "",
  amountIrtMax: "",
  discountPercentageMin: "",
  discountPercentageMax: "",
  discountAmountIrtMin: "",
  discountAmountIrtMax: "",
  finalAmountIrtMin: "",
  finalAmountIrtMax: "",
  isManualStatusChange: "ALL",
  manualStatusChangedDescription: "",
  couponCode: "",
  couponDiscountType: "ALL",
  couponDiscountValueMin: "",
  couponDiscountValueMax: "",
  createdAtFrom: "",
  createdAtTo: "",
  updatedAtFrom: "",
  updatedAtTo: "",
  pendingAtFrom: "",
  pendingAtTo: "",
  paidAtFrom: "",
  paidAtTo: "",
  failedAtFrom: "",
  failedAtTo: "",
  refundedAtFrom: "",
  refundedAtTo: "",
  cancelledAtFrom: "",
  cancelledAtTo: "",
};

export type ProductPaymentListQueryVariables = {
  input: {
    filters?: {
      query?: string | null;
      fullName?: string | null;
      email?: string | null;
      mobilePhone?: string | null;
      id?: string | null;
      userId?: string | null;
      productId?: string | null;
      userFullName?: string | null;
      username?: string | null;
      userEmail?: string | null;
      userPhone?: string | null;
      productTitle?: string | null;
      status?: UserProductPurchaseStatus | null;
      paymentMethod?: UserProductPaymentMethod | null;
      currency?: UserProductPurchaseCurrency | null;
      paymentProvider?: string | null;
      paymentReference?: string | null;
      transactionId?: string | null;
      amountIrtMin?: number | null;
      amountIrtMax?: number | null;
      discountPercentageMin?: number | null;
      discountPercentageMax?: number | null;
      discountAmountIrtMin?: number | null;
      discountAmountIrtMax?: number | null;
      finalAmountIrtMin?: number | null;
      finalAmountIrtMax?: number | null;
      isManualStatusChange?: boolean | null;
      manualStatusChangedBy?: string | null;
      manualStatusChangedDescription?: string | null;
      uploadedReceiptFileId?: string | null;
      receiptUploadedBy?: string | null;
      couponId?: string | null;
      couponCode?: string | null;
      couponDiscountType?: CouponDiscountType | null;
      couponDiscountValueMin?: number | null;
      couponDiscountValueMax?: number | null;
      createdAtFrom?: string | null;
      createdAtTo?: string | null;
      updatedAtFrom?: string | null;
      updatedAtTo?: string | null;
      pendingAtFrom?: string | null;
      pendingAtTo?: string | null;
      paidAtFrom?: string | null;
      paidAtTo?: string | null;
      failedAtFrom?: string | null;
      failedAtTo?: string | null;
      refundedAtFrom?: string | null;
      refundedAtTo?: string | null;
      cancelledAtFrom?: string | null;
      cancelledAtTo?: string | null;
    };
    options: {
      limit: number;
      skip: number;
    };
  };
};

export type ProductPaymentRecord = {
  readonly id: string;
  readonly userId: string;
  readonly productId: string;
  readonly userFullName: string;
  readonly username: string;
  readonly userEmail: string;
  readonly userPhone: string;
  readonly productTitle: string;
  readonly status: UserProductPurchaseStatus;
  readonly paymentMethod: UserProductPaymentMethod;
  readonly currency: UserProductPurchaseCurrency;
  readonly paymentProvider: string;
  readonly paymentReference: string;
  readonly transactionId: string;
  readonly amountIrt: number;
  readonly discountPercentage: number | null;
  readonly discountAmountIrt: number | null;
  readonly finalAmountIrt: number;
  readonly couponId: string;
  readonly couponCode: string;
  readonly couponTitle: string;
  readonly couponDiscountType: CouponDiscountType | null;
  readonly couponDiscountValue: number | null;
  readonly uploadedReceiptFileId: string;
  readonly uploadedReceiptFileTitle: string;
  readonly uploadedReceiptFileName: string;
  readonly uploadedReceiptFileMimeType: string;
  readonly uploadedReceiptFileSizeBytes: number | null;
  readonly uploadedReceiptFilePath: string;
  readonly uploadedReceiptFileAccessUrl: string;
  readonly receiptUploadedBy: string;
  readonly receiptUploaderName: string;
  readonly receiptUploaderUsername: string;
  readonly isManualStatusChange: boolean;
  readonly statusChangedBy: string;
  readonly submittedInitiallyByAdmin: boolean;
  readonly createdBy: string;
  readonly createdByUserName: string;
  readonly createdByUsername: string;
  readonly manualStatusChangedBy: string;
  readonly manualStatusChangerName: string;
  readonly manualStatusChangerUsername: string;
  readonly manualStatusChangedDescription: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly pendingAt: string;
  readonly gatewayPendingAt: string;
  readonly paidAt: string;
  readonly failedAt: string;
  readonly refundedAt: string;
  readonly cancelledAt: string;
};

const EMPTY_DISPLAY = "-";

export function formatPurchaseStatusChangedBy(
  statusChangedBy: PurchaseStatusChangedBy | null | undefined,
  manualStatusChangerName: string
): string {
  if (statusChangedBy === "SYSTEM") {
    return "سیستم";
  }

  if (statusChangedBy === "ADMIN") {
    return manualStatusChangerName !== EMPTY_DISPLAY ? manualStatusChangerName : "پشتیبانی";
  }

  return manualStatusChangerName;
}

export function isPaymentReceiptFilePresent(record: ProductPaymentRecord): boolean {
  return record.uploadedReceiptFileId !== "-" || record.uploadedReceiptFileTitle !== "-";
}

export function buildPaymentReceiptExistingFile(
  record: ProductPaymentRecord
): ExistingFilePreview | null {
  if (!isPaymentReceiptFilePresent(record)) {
    return null;
  }

  const accessUrl = record.uploadedReceiptFileAccessUrl.trim();
  if (!accessUrl) {
    return null;
  }

  const name =
    record.uploadedReceiptFileTitle !== "-"
      ? record.uploadedReceiptFileTitle
      : record.uploadedReceiptFileName !== "-"
        ? record.uploadedReceiptFileName
        : "رسید پرداخت";
  const mimeType =
    record.uploadedReceiptFileMimeType !== "-"
      ? record.uploadedReceiptFileMimeType
      : "application/octet-stream";

  if (isExecutableFileType(mimeType, name)) {
    return null;
  }

  return {
    accessUrl,
    fileId: record.uploadedReceiptFileId !== "-" ? record.uploadedReceiptFileId : undefined,
    name,
    mimeType,
    sizeBytes: record.uploadedReceiptFileSizeBytes ?? 0,
  };
}

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function display(value: string | null | undefined): string {
  return value?.trim() || EMPTY_DISPLAY;
}

function enumToNull<TValue extends string>(value: TValue | "ALL"): TValue | null {
  return value === "ALL" ? null : value;
}

function numberToNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateFilterToIsoDate(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const jalaliDate = parseJalaliParamDate(trimmed);
  if (!jalaliDate) {
    return trimmed;
  }

  const gregorianDate = jalaliDate.toDate();
  const year = String(gregorianDate.getFullYear()).padStart(4, "0");
  const month = String(gregorianDate.getMonth() + 1).padStart(2, "0");
  const day = String(gregorianDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function mapProductPaymentListRowToRecord(
  row: ProductPaymentListItemRow
): ProductPaymentRecord {
  const receiptAccessUrl = row.uploadedReceiptFile?.accessUrl;

  return {
    id: String(row.id),
    userId: String(row.userId),
    productId: String(row.productId),
    userFullName: display(row.user.fullName),
    username: display(row.user.username),
    userEmail: display(row.user.email),
    userPhone: display(row.user.mobilePhone ?? row.user.phone),
    productTitle: display(row.product.title),
    status: row.status,
    paymentMethod: row.paymentMethod,
    currency: row.currency,
    paymentProvider: display(row.paymentProvider),
    paymentReference: display(row.paymentReference),
    transactionId: display(row.transactionId),
    amountIrt: row.amountIrt,
    discountPercentage: row.discountPercentage ?? null,
    discountAmountIrt: row.discountAmountIrt ?? null,
    finalAmountIrt: row.finalAmountIrt,
    couponId: display(row.coupon?.couponId),
    couponCode: display(row.coupon?.code),
    couponTitle: display(row.coupon?.code),
    couponDiscountType: row.coupon?.discountType ?? null,
    couponDiscountValue: row.coupon?.discountValue ?? null,
    uploadedReceiptFileId: display(getFileIdFromAccessUrl(receiptAccessUrl)),
    uploadedReceiptFileTitle: EMPTY_DISPLAY,
    uploadedReceiptFileName: EMPTY_DISPLAY,
    uploadedReceiptFileMimeType: EMPTY_DISPLAY,
    uploadedReceiptFileSizeBytes: null,
    uploadedReceiptFilePath: EMPTY_DISPLAY,
    uploadedReceiptFileAccessUrl: "",
    receiptUploadedBy: display(row.receiptUploadedBy),
    receiptUploaderName: EMPTY_DISPLAY,
    receiptUploaderUsername: EMPTY_DISPLAY,
    isManualStatusChange: row.isManualStatusChange,
    statusChangedBy: EMPTY_DISPLAY,
    submittedInitiallyByAdmin: false,
    createdBy: EMPTY_DISPLAY,
    createdByUserName: EMPTY_DISPLAY,
    createdByUsername: EMPTY_DISPLAY,
    manualStatusChangedBy: display(row.manualStatusChangedBy),
    manualStatusChangerName: EMPTY_DISPLAY,
    manualStatusChangerUsername: EMPTY_DISPLAY,
    manualStatusChangedDescription: display(row.manualStatusChangedDescription),
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
    pendingAt: row.pendingAt ?? "",
    gatewayPendingAt: row.gatewayPendingAt ?? "",
    paidAt: row.paidAt ?? "",
    failedAt: row.failedAt ?? "",
    refundedAt: row.refundedAt ?? "",
    cancelledAt: row.cancelledAt ?? "",
  };
}

export function mapProductPaymentDetailRowToRecord(
  row: ProductPaymentDetailRow
): ProductPaymentRecord {
  const receiptFile = row.uploadedReceiptFile;
  const receiptAccessUrl = receiptFile?.accessUrl;

  return {
    id: String(row.id),
    userId: String(row.userId),
    productId: String(row.productId),
    userFullName: display(row.user.fullName),
    username: display(row.user.username),
    userEmail: display(row.user.email),
    userPhone: display(row.user.mobilePhone ?? row.user.phone),
    productTitle: display(row.product.title),
    status: row.status,
    paymentMethod: row.paymentMethod,
    currency: row.currency,
    paymentProvider: display(row.paymentProvider),
    paymentReference: display(row.paymentReference),
    transactionId: display(row.transactionId),
    amountIrt: row.amountIrt,
    discountPercentage: row.discountPercentage ?? null,
    discountAmountIrt: row.discountAmountIrt ?? null,
    finalAmountIrt: row.finalAmountIrt,
    couponId: display(row.coupon?.couponId),
    couponCode: display(row.coupon?.code),
    couponTitle: display(row.coupon?.title),
    couponDiscountType: row.coupon?.discountType ?? null,
    couponDiscountValue: row.coupon?.discountValue ?? null,
    uploadedReceiptFileId: display(getFileIdFromAccessUrl(receiptAccessUrl)),
    uploadedReceiptFileTitle: display(
      receiptFile?.title ?? receiptFile?.name ?? receiptAccessUrl?.name
    ),
    uploadedReceiptFileName: display(receiptFile?.name ?? receiptAccessUrl?.name),
    uploadedReceiptFileMimeType: display(receiptFile?.mimeType ?? receiptAccessUrl?.mimeType),
    uploadedReceiptFileSizeBytes: receiptFile?.sizeBytes ?? receiptAccessUrl?.sizeBytes ?? null,
    uploadedReceiptFilePath: display(receiptFile?.path),
    uploadedReceiptFileAccessUrl: resolveFileAccessUrl(receiptAccessUrl) ?? "",
    receiptUploadedBy: display(row.receiptUploadedBy),
    receiptUploaderName: display(row.receiptUploader?.fullName ?? row.receiptUploader?.username),
    receiptUploaderUsername: display(row.receiptUploader?.username),
    isManualStatusChange: row.isManualStatusChange,
    statusChangedBy: display(row.statusChangedBy),
    submittedInitiallyByAdmin: row.submittedInitiallyByAdmin === true,
    createdBy: display(row.createdBy),
    createdByUserName: display(row.createdByUser?.fullName ?? row.createdByUser?.username),
    createdByUsername: display(row.createdByUser?.username),
    manualStatusChangedBy: display(row.manualStatusChangedBy),
    manualStatusChangerName: display(
      row.manualStatusChanger?.fullName ?? row.manualStatusChanger?.username
    ),
    manualStatusChangerUsername: display(row.manualStatusChanger?.username),
    manualStatusChangedDescription: display(row.manualStatusChangedDescription),
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
    pendingAt: row.pendingAt ?? "",
    gatewayPendingAt: row.gatewayPendingAt ?? "",
    paidAt: row.paidAt ?? "",
    failedAt: row.failedAt ?? "",
    refundedAt: row.refundedAt ?? "",
    cancelledAt: row.cancelledAt ?? "",
  };
}

export function buildProductPaymentListQueryVariables(
  search: string,
  filters: ProductPaymentListFilters,
  page: number,
  pageSize: number
): ProductPaymentListQueryVariables {
  return {
    input: {
      filters: {
        query: trimToNull(search),
        fullName: trimToNull(filters.userFullName),
        email: trimToNull(filters.userEmail),
        mobilePhone: trimToNull(filters.userPhone),
        userFullName: trimToNull(filters.userFullName),
        username: trimToNull(filters.username),
        userEmail: trimToNull(filters.userEmail),
        userPhone: trimToNull(filters.userPhone),
        productTitle: trimToNull(filters.productTitle),
        status: enumToNull(filters.status),
        paymentMethod: enumToNull(filters.paymentMethod),
        currency: enumToNull(filters.currency),
        paymentProvider: trimToNull(filters.paymentProvider),
        paymentReference: trimToNull(filters.paymentReference),
        transactionId: trimToNull(filters.transactionId),
        amountIrtMin: numberToNull(filters.amountIrtMin),
        amountIrtMax: numberToNull(filters.amountIrtMax),
        discountPercentageMin: numberToNull(filters.discountPercentageMin),
        discountPercentageMax: numberToNull(filters.discountPercentageMax),
        discountAmountIrtMin: numberToNull(filters.discountAmountIrtMin),
        discountAmountIrtMax: numberToNull(filters.discountAmountIrtMax),
        finalAmountIrtMin: numberToNull(filters.finalAmountIrtMin),
        finalAmountIrtMax: numberToNull(filters.finalAmountIrtMax),
        isManualStatusChange:
          filters.isManualStatusChange === "ALL" ? null : filters.isManualStatusChange === "true",
        manualStatusChangedDescription: trimToNull(filters.manualStatusChangedDescription),
        couponCode: trimToNull(filters.couponCode),
        couponDiscountType: enumToNull(filters.couponDiscountType),
        couponDiscountValueMin: numberToNull(filters.couponDiscountValueMin),
        couponDiscountValueMax: numberToNull(filters.couponDiscountValueMax),
        createdAtFrom: dateFilterToIsoDate(filters.createdAtFrom),
        createdAtTo: dateFilterToIsoDate(filters.createdAtTo),
        updatedAtFrom: dateFilterToIsoDate(filters.updatedAtFrom),
        updatedAtTo: dateFilterToIsoDate(filters.updatedAtTo),
        pendingAtFrom: dateFilterToIsoDate(filters.pendingAtFrom),
        pendingAtTo: dateFilterToIsoDate(filters.pendingAtTo),
        paidAtFrom: dateFilterToIsoDate(filters.paidAtFrom),
        paidAtTo: dateFilterToIsoDate(filters.paidAtTo),
        failedAtFrom: dateFilterToIsoDate(filters.failedAtFrom),
        failedAtTo: dateFilterToIsoDate(filters.failedAtTo),
        refundedAtFrom: dateFilterToIsoDate(filters.refundedAtFrom),
        refundedAtTo: dateFilterToIsoDate(filters.refundedAtTo),
        cancelledAtFrom: dateFilterToIsoDate(filters.cancelledAtFrom),
        cancelledAtTo: dateFilterToIsoDate(filters.cancelledAtTo),
      },
      options: {
        limit: pageSize,
        skip: (page - 1) * pageSize,
      },
    },
  };
}

export function hasProductPaymentFiltersApplied(filters: ProductPaymentListFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "query") {
      return false;
    }
    return value !== "" && value !== "ALL";
  });
}
