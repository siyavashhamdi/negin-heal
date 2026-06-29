import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";
import {
  ArticleRounded as ArticleRoundedIcon,
  ClearRounded as ClearRoundedIcon,
  ImageRounded as ImageRoundedIcon,
  InsertDriveFileRounded as InsertDriveFileRoundedIcon,
  PictureAsPdfRounded as PictureAsPdfRoundedIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  DialogContentText,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import type { Theme } from "@mui/material/styles";

import { PRODUCT_PAYMENT_MANUAL_CREATE_MUTATION } from "../../graphql/mutations/productPaymentManualCreate.mutation";
import { PRODUCT_PAYMENT_STATUS_UPDATE_MUTATION } from "../../graphql/mutations/productPaymentStatusUpdate.mutation";
import { PRODUCT_PAYMENT_LIST_QUERY } from "../../graphql/queries/productPaymentList.query";
import { useDebounce } from "../../hooks/useDebounce";
import { useBadgeCountFirstPageReload } from "../../hooks/useBadgeCountFirstPageReload";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import {
  useServerPaginatedQuery,
  type ServerPageResult,
} from "../../hooks/useServerPaginatedQuery";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import { sanitizeMobilePhoneInput } from "../../utilities/mobile-phone.util";
import EntityConfirmDialogShell from "../../shared/crud/EntityConfirmDialogShell";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import EntityTableShell from "../../shared/crud/EntityTableShell";
import ModalFooterActions from "../../shared/crud/ModalFooterActions";
import { APP_SURFACE_BG } from "../../shared/crud/modalThemeSx";
import DateTimeValue from "../../shared/display/DateTimeValue";
import crudPrimitives from "../../shared/crud/styles/crudPrimitives.module.scss";
import ActiveEndUserPickerField, {
  type ActiveEndUserOption,
} from "../../shared/forms/ActiveEndUserPickerField";
import ProductPickerField from "../../shared/forms/ProductPickerField";
import type { ProductPickerOption } from "../../shared/forms/product-picker.util";
import FileUploadField from "../../shared/forms/FileUploadField";
import AppTooltip from "../../shared/AppTooltip";
import { getFileIdFromAccessUrl } from "../../utils/fileAccessUrl.util";
import { hasFormChanges } from "../../utils/formChange.util";
import {
  MULTILINE_TEXTAREA_MIN_ROWS,
  MULTILINE_TEXTAREA_MAX_ROWS,
} from "../../constants/multilineTextarea.constants";
import { uploadFile } from "../../utils/fileUpload.util";
import {
  FILE_UPLOAD_POLICY,
  FILE_UPLOAD_POLICY_MAX_SIZE_BYTES,
} from "../../constants/fileUploadPolicies";
import JalaliDateFilterField from "../../shared/table/JalaliDateFilterField";
import {
  EMPTY_PRODUCT_PAYMENT_LIST_FILTERS,
  buildProductPaymentListQueryVariables,
  buildPaymentReceiptExistingFile,
  hasProductPaymentFiltersApplied,
  formatPurchaseStatusChangedBy,
  isPaymentReceiptFilePresent,
  mapProductPaymentListRowToRecord,
  type ProductPaymentListFilters,
  type ProductPaymentListItemRow,
  type ProductPaymentListQuery,
  type ProductPaymentListQueryVariables,
  type ProductPaymentRecord,
  type CouponDiscountType,
  type UserProductPaymentMethod,
  type UserProductPurchaseCurrency,
  type UserProductPurchaseStatus,
} from "./payments-list.api";
import {
  ManualPaymentDialogActions,
  PaymentRowActions,
  ReviewPaymentDialogActions,
} from "./PaymentActions";
import { useProductPaymentReviewRecord } from "./useProductPaymentReviewRecord";
import styles from "./styles/payments-list.module.scss";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";

type ProductPaymentStatusUpdateMutation = {
  readonly productPaymentStatusUpdate: {
    readonly id: string;
    readonly status: UserProductPurchaseStatus;
  };
};

type ProductPaymentStatusUpdateMutationVariables = {
  readonly input: {
    readonly id: string;
    readonly status: UserProductPurchaseStatus;
    readonly manualStatusChangedDescription?: string | null;
  };
};

type ProductPaymentManualCreateMutation = {
  readonly productPaymentManualCreate: {
    readonly id: string;
  };
};

type ProductPaymentManualCreateMutationVariables = {
  readonly input: {
    readonly userId: string;
    readonly productId: string;
    readonly paymentMethod: UserProductPaymentMethod;
    readonly status: UserProductPurchaseStatus;
    readonly couponCode?: string | null;
    readonly uploadedReceiptFileId?: string | null;
    readonly manualStatusChangedDescription?: string | null;
  };
};

const LATIN_TEXT_FILTER_KEYS = new Set<keyof ProductPaymentListFilters>([
  "username",
  "userEmail",
  "userPhone",
  "paymentReference",
  "transactionId",
  "couponCode",
]);

const MOBILE_PHONE_FILTER_KEYS = new Set<keyof ProductPaymentListFilters>(["userPhone"]);

const COLUMN_WIDTH_BY_ID: Record<string, string> = {
  userFullName: "13rem",
  username: "11rem",
  userEmail: "14rem",
  userPhone: "10rem",
  productTitle: "16rem",
  status: "8rem",
  paymentMethod: "10rem",
  currency: "8rem",
  paymentProvider: "10rem",
  paymentReference: "13rem",
  transactionId: "13rem",
  amountIrt: "10rem",
  discountPercentage: "10rem",
  discountAmountIrt: "10rem",
  finalAmountIrt: "10rem",
  couponCode: "9rem",
  couponDiscountType: "10rem",
  couponDiscountValue: "10rem",
  isManualStatusChange: "9rem",
  manualStatusChangedDescription: "16rem",
  createdAt: "10rem",
  updatedAt: "10rem",
  pendingAt: "10rem",
  paidAt: "10rem",
  failedAt: "10rem",
  refundedAt: "10rem",
  cancelledAt: "10rem",
  actions: "6rem",
};

const TABLE_TOOLBAR_OPTIONS = {
  showSearch: true,
  showColumnVisibility: true,
  showRefresh: true,
  showFilterButton: true,
} as const;

const EMPTY_DISPLAY = "—";

const STATUS_COLOR: Record<
  UserProductPurchaseStatus,
  "default" | "primary" | "success" | "warning" | "error" | "info"
> = {
  PENDING: "warning",
  PENDING_GATEWAY: "info",
  PAID: "success",
  FAILED: "error",
  REFUNDED: "info",
  CANCELLED: "default",
};

const STATUS_LABEL: Record<UserProductPurchaseStatus, string> = {
  PENDING: "در انتظار",
  PENDING_GATEWAY: "در انتظار درگاه",
  PAID: "پرداخت‌شده",
  FAILED: "ناموفق",
  REFUNDED: "مرجوع‌شده",
  CANCELLED: "لغوشده",
};

const REVIEW_STATUS_OPTIONS: readonly UserProductPurchaseStatus[] = [
  "PAID",
  "PENDING",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
];

const PAYMENT_METHOD_LABEL: Record<UserProductPaymentMethod, string> = {
  GATEWAY: "درگاه",
  CARD_TO_CARD: "کارت به کارت",
  CRYPTOCURRENCY: "رمزارز",
  FREE: "رایگان",
};

const MANUAL_PAYMENT_METHOD_OPTIONS: readonly UserProductPaymentMethod[] = [
  "CARD_TO_CARD",
  "GATEWAY",
  "CRYPTOCURRENCY",
  "FREE",
];

const CURRENCY_LABEL: Record<UserProductPurchaseCurrency, string> = {
  IRT: "تومان",
  USDT: "تتر",
};

const COUPON_DISCOUNT_TYPE_LABEL: Record<CouponDiscountType, string> = {
  PERCENTAGE: "درصدی",
  FIXED_AMOUNT: "مبلغ ثابت",
};

function formatAmount(value: number | null | undefined): string {
  if (value == null) {
    return EMPTY_DISPLAY;
  }
  return `${value.toLocaleString("fa-IR").replace(/\u066c/g, ",")} تومان`;
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) {
    return EMPTY_DISPLAY;
  }
  return value.toLocaleString("fa-IR").replace(/\u066c/g, ",");
}

function formatFileSize(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return EMPTY_DISPLAY;
  }
  if (value < 1024) {
    return `${value.toLocaleString("fa-IR")} بایت`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toLocaleString("fa-IR", {
      maximumFractionDigits: 1,
    })} کیلوبایت`;
  }
  return `${(value / (1024 * 1024)).toLocaleString("fa-IR", {
    maximumFractionDigits: 1,
  })} مگابایت`;
}

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function getReceiptFileIcon(mimeType: string): ReactElement {
  if (isImageMimeType(mimeType)) {
    return <ImageRoundedIcon fontSize="large" />;
  }
  if (mimeType === "application/pdf") {
    return <PictureAsPdfRoundedIcon fontSize="large" />;
  }
  if (mimeType.startsWith("text/")) {
    return <ArticleRoundedIcon fontSize="large" />;
  }
  return <InsertDriveFileRoundedIcon fontSize="large" />;
}

function renderReceiptFileSection(record: ProductPaymentRecord): ReactElement | null {
  if (!isPaymentReceiptFilePresent(record)) {
    return null;
  }

  const existingFile = buildPaymentReceiptExistingFile(record);
  const canUseReadOnlyUploader = existingFile != null && isImageMimeType(existingFile.mimeType);
  const title =
    record.uploadedReceiptFileTitle !== "-" ? record.uploadedReceiptFileTitle : "رسید پرداخت";
  const mimeType =
    record.uploadedReceiptFileMimeType !== "-" ? record.uploadedReceiptFileMimeType : "";

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: APP_SURFACE_BG,
        borderColor: "divider",
      }}
    >
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={900}>
            رسید پرداخت
          </Typography>
          <Typography variant="body2" color="text.secondary">
            فایل بارگذاری‌شده توسط پرداخت‌کننده
          </Typography>
        </Box>

        {canUseReadOnlyUploader ? (
          <Stack spacing={1}>
            <FileUploadField
              previewId={`payment-receipt-${record.id}`}
              readOnly
              fullWidth
              label="رسید پرداخت"
              file={null}
              onChange={() => undefined}
              existingFile={existingFile}
              accept="image/*,.pdf"
              allowedFormatsLabel=""
              maxSizeLabel=""
              dropTitle=""
              dropHint=""
              removeLabel=""
              invalidLabel=""
            />
            <Stack spacing={0.75}>
              <Typography
                variant="body1"
                fontWeight={800}
                className={styles.latinText}
                sx={{ overflowWrap: "anywhere" }}
              >
                {existingFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFileSize(existingFile.sizeBytes)}
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                inlineSize: "100%",
                maxInlineSize: { xs: "100%", sm: "9rem" },
                blockSize: { xs: "12rem", sm: "9rem" },
                overflow: "hidden",
                borderRadius: 2,
                bgcolor: "action.hover",
                color: "text.secondary",
              }}
            >
              {getReceiptFileIcon(mimeType)}
            </Box>
            <Stack spacing={0.75} minWidth={0} flex={1}>
              <Typography
                variant="body1"
                fontWeight={800}
                className={styles.latinText}
                sx={{ overflowWrap: "anywhere" }}
              >
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <span className={styles.latinText}>{mimeType || "نوع فایل نامشخص"}</span>
                {" | "}
                {formatFileSize(record.uploadedReceiptFileSizeBytes)}
              </Typography>
            </Stack>
          </Stack>
        )}

        {record.receiptUploaderName !== "-" ? (
          <Typography variant="body2" color="text.secondary">
            آپلودکننده: {record.receiptUploaderName}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

function selectProductPaymentListPage(
  data: ProductPaymentListQuery | undefined
): ServerPageResult<ProductPaymentListItemRow> | null {
  const page = data?.productPaymentList;
  if (!page) {
    return null;
  }

  const limit = Math.max(1, page.pagination.limit || 10);
  const skip = Math.max(0, page.pagination.skip || 0);
  const total = Math.max(0, page.pagination.total || 0);

  return {
    items: page.items,
    total,
    page: Math.floor(skip / limit) + 1,
    pageSize: limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

type TextCellOptions = {
  readonly tabular?: boolean;
  readonly latin?: boolean;
};

function normalizeTextCellOptions(options: boolean | TextCellOptions = false): TextCellOptions {
  return typeof options === "boolean" ? { tabular: options } : options;
}

type DetailItem = {
  readonly label: string;
  readonly value: string | ReactElement;
  readonly latin?: boolean;
};

function LatinDetailValue({
  value,
  fontWeight = 600,
}: {
  readonly value: string;
  readonly fontWeight?: number;
}): ReactElement {
  return (
    <Typography variant="body2" fontWeight={fontWeight} className={styles.latinText}>
      {value || EMPTY_DISPLAY}
    </Typography>
  );
}

function PaymentDetailSection({
  title,
  items,
  twoColumnsOnMobile = false,
}: {
  readonly title: string;
  readonly items: readonly DetailItem[];
  readonly twoColumnsOnMobile?: boolean;
}): ReactElement {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: APP_SURFACE_BG,
        borderColor: "divider",
      }}
    >
      <Typography variant="subtitle1" fontWeight={800} gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: twoColumnsOnMobile
            ? "repeat(2, minmax(0, 1fr))"
            : { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {items.map((item) => (
          <Box key={item.label}>
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
            <Box sx={{ mt: 0.25, overflowWrap: "anywhere" }}>
              {typeof item.value === "string" ? (
                item.latin ? (
                  <LatinDetailValue value={item.value} />
                ) : (
                  <Typography variant="body2" fontWeight={600}>
                    {item.value || EMPTY_DISPLAY}
                  </Typography>
                )
              ) : (
                item.value
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

const PaymentsList = (): ReactElement => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery((muiTheme: Theme) => muiTheme.breakpoints.down("md"));
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const hasShownLoadErrorRef = useRef(false);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    userFullName: true,
    username: true,
    userPhone: true,
    userEmail: false,
    productTitle: true,
    status: true,
    paymentMethod: true,
    currency: false,
    paymentProvider: false,
    paymentReference: false,
    transactionId: false,
    amountIrt: false,
    discountPercentage: false,
    discountAmountIrt: false,
    finalAmountIrt: true,
    couponCode: true,
    couponDiscountType: false,
    couponDiscountValue: false,
    isManualStatusChange: false,
    manualStatusChangedDescription: false,
    createdAt: true,
    updatedAt: false,
    pendingAt: false,
    paidAt: true,
    failedAt: false,
    refundedAt: false,
    cancelledAt: false,
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [filters, setFilters] = useState<ProductPaymentListFilters>(
    EMPTY_PRODUCT_PAYMENT_LIST_FILTERS
  );
  const [reviewStatus, setReviewStatus] = useState<UserProductPurchaseStatus>("PENDING");
  const [reviewDescription, setReviewDescription] = useState("");
  const [initialReviewForm, setInitialReviewForm] = useState<{
    status: UserProductPurchaseStatus;
    description: string;
  } | null>(null);
  const [pendingPaidStatusChange, setPendingPaidStatusChange] =
    useState<UserProductPurchaseStatus | null>(null);
  const manualPaymentRouteOpen = location.pathname === `${APP_SHELL_ROUTES.payments}/new`;
  const reviewPaymentRoute = useMemo(() => {
    const paymentRoutePrefix = `${APP_SHELL_ROUTES.payments}/`;
    if (!location.pathname.startsWith(paymentRoutePrefix)) {
      return null;
    }

    const remainder = location.pathname.slice(paymentRoutePrefix.length);
    if (!remainder || remainder === "new") {
      return null;
    }

    const [paymentId, segment] = remainder.split("/");
    if (!paymentId) {
      return null;
    }

    return {
      paymentId,
      isConfirmRoute: segment === "confirm",
    };
  }, [location.pathname]);
  const reviewPaymentId = reviewPaymentRoute?.paymentId ?? null;
  const isPaidStatusChangeConfirmOpen = reviewPaymentRoute?.isConfirmRoute ?? false;
  const [manualPaymentUser, setManualPaymentUser] = useState<ActiveEndUserOption | null>(null);
  const [manualPaymentProduct, setManualPaymentProduct] = useState<ProductPickerOption | null>(null);
  const [manualPaymentMethod, setManualPaymentMethod] =
    useState<UserProductPaymentMethod>("CARD_TO_CARD");
  const [manualPaymentStatus, setManualPaymentStatus] = useState<UserProductPurchaseStatus>("PAID");
  const [manualCouponCode, setManualCouponCode] = useState("");
  const [manualPaymentDescription, setManualPaymentDescription] = useState("");
  const [manualPaymentEvidenceFile, setManualPaymentEvidenceFile] = useState<File | null>(null);
  const debouncedFilters = useDebounce(filters, 500);
  const hasAppliedFilters =
    debouncedSearchQuery.trim() !== "" || hasProductPaymentFiltersApplied(debouncedFilters);

  const manualPaymentProductFilters = useMemo(
    () => ({
      isActive: true,
      hasPrice: true,
      includeUserId: manualPaymentUser?.id ?? null,
    }),
    [manualPaymentUser?.id]
  );

  const setFilterValue = <K extends keyof ProductPaymentListFilters>(
    key: K,
    value: ProductPaymentListFilters[K]
  ): void => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const buildVariables = useCallback(
    ({ page, pageSize }: { page: number; pageSize: number }) =>
      buildProductPaymentListQueryVariables(debouncedSearchQuery, debouncedFilters, page, pageSize),
    [debouncedFilters, debouncedSearchQuery]
  );

  const {
    items: rows,
    loading,
    error,
    onRefresh,
    page,
    pagination,
  } = useServerPaginatedQuery<
    ProductPaymentListQuery,
    ProductPaymentListQueryVariables,
    ProductPaymentListItemRow,
    ProductPaymentRecord
  >({
    query: PRODUCT_PAYMENT_LIST_QUERY,
    variables: buildVariables,
    selectPage: selectProductPaymentListPage,
    mapItem: mapProductPaymentListRowToRecord,
    resetPageDeps: [debouncedSearchQuery, debouncedFilters],
  });

  useBadgeCountFirstPageReload({
    isOnFirstPage: page === 1,
    reload: onRefresh,
  });

  const { record: reviewPayment, isInitialLoading: paymentDetailLoading } =
    useProductPaymentReviewRecord(reviewPaymentId);

  const [updatePaymentStatus, updatePaymentStatusResult] = useMutationWithSnackbar<
    ProductPaymentStatusUpdateMutation,
    ProductPaymentStatusUpdateMutationVariables
  >(PRODUCT_PAYMENT_STATUS_UPDATE_MUTATION, {
    successMessage: "وضعیت پرداخت با موفقیت ثبت شد.",
    errorMessage: "ثبت وضعیت پرداخت انجام نشد.",
    onSuccess: () => {
      setPendingPaidStatusChange(null);
      navigate(APP_SHELL_ROUTES.payments);
      onRefresh();
    },
  });

  const [createManualPayment, createManualPaymentResult] = useMutationWithSnackbar<
    ProductPaymentManualCreateMutation,
    ProductPaymentManualCreateMutationVariables
  >(PRODUCT_PAYMENT_MANUAL_CREATE_MUTATION, {
    successMessage: "پرداخت دستی با موفقیت ثبت شد.",
    errorMessage: "ثبت پرداخت دستی انجام نشد.",
    onSuccess: () => {
      navigate(APP_SHELL_ROUTES.payments);
      setManualPaymentUser(null);
      setManualPaymentProduct(null);
      setManualPaymentMethod("CARD_TO_CARD");
      setManualPaymentStatus("PAID");
      setManualCouponCode("");
      setManualPaymentDescription("");
      setManualPaymentEvidenceFile(null);
      onRefresh();
    },
  });

  const [isManualPaymentFileUploading, setIsManualPaymentFileUploading] = useState(false);

  useEffect(() => {
    if (!error) {
      hasShownLoadErrorRef.current = false;
      return;
    }
    if (hasShownLoadErrorRef.current) {
      return;
    }
    showError(t("errors.general.loadData"));
    hasShownLoadErrorRef.current = true;
  }, [error, showError, t]);

  useEffect(() => {
    setManualPaymentProduct(null);
  }, [manualPaymentUser?.id]);

  useEffect(() => {
    if (!reviewPayment) {
      setInitialReviewForm(null);
      return;
    }

    const nextDescription =
      reviewPayment.manualStatusChangedDescription === "-"
        ? ""
        : reviewPayment.manualStatusChangedDescription;

    setReviewStatus(reviewPayment.status);
    setReviewDescription(nextDescription);
    setInitialReviewForm({
      status: reviewPayment.status,
      description: nextDescription,
    });
  }, [reviewPayment]);

  const textCell = (value: unknown, options: boolean | TextCellOptions = false): ReactElement => {
    const { tabular = false, latin = false } = normalizeTextCellOptions(options);
    const className = [
      tabular ? crudPrimitives.tabularNums : undefined,
      latin ? styles.latinText : undefined,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Typography variant="body2" className={className || undefined}>
        {String(value || EMPTY_DISPLAY)}
      </Typography>
    );
  };

  const dateCell = (value: unknown): ReactElement => <DateTimeValue value={String(value || "")} />;

  const columns = useMemo<ColumnDef<ProductPaymentRecord>[]>(
    () => [
      {
        accessorKey: "userFullName",
        header: t("table.pages.payments.columns.userFullName"),
        cell: (info) => (
          <Typography variant="body2" fontWeight={600}>
            {String(info.getValue() || EMPTY_DISPLAY)}
          </Typography>
        ),
      },
      {
        accessorKey: "username",
        header: t("table.pages.payments.columns.username"),
        cell: (info) => textCell(info.getValue(), { latin: true }),
      },
      {
        accessorKey: "userPhone",
        header: t("table.pages.payments.columns.userPhone"),
        cell: (info) => textCell(info.getValue(), { tabular: true, latin: true }),
      },
      {
        accessorKey: "userEmail",
        header: t("table.pages.payments.columns.userEmail"),
        cell: (info) => textCell(info.getValue(), { tabular: true, latin: true }),
      },
      {
        accessorKey: "productTitle",
        header: t("table.pages.payments.columns.productTitle"),
        cell: (info) => textCell(info.getValue()),
      },
      {
        accessorKey: "status",
        header: t("table.pages.payments.columns.status"),
        cell: (info) => {
          const status = info.getValue() as UserProductPurchaseStatus;
          return (
            <Chip
              size="small"
              color={STATUS_COLOR[status]}
              variant="outlined"
              label={STATUS_LABEL[status]}
            />
          );
        },
      },
      {
        accessorKey: "paymentMethod",
        header: t("table.pages.payments.columns.paymentMethod"),
        cell: (info) => {
          const method = info.getValue() as UserProductPaymentMethod;
          return <Chip size="small" label={PAYMENT_METHOD_LABEL[method]} />;
        },
      },
      {
        accessorKey: "currency",
        header: t("table.pages.payments.columns.currency"),
        cell: (info) => {
          const currency = info.getValue() as UserProductPurchaseCurrency;
          return <Chip size="small" variant="outlined" label={CURRENCY_LABEL[currency]} />;
        },
      },
      {
        accessorKey: "paymentProvider",
        header: t("table.pages.payments.columns.paymentProvider"),
        cell: (info) => textCell(info.getValue()),
      },
      {
        accessorKey: "paymentReference",
        header: t("table.pages.payments.columns.paymentReference"),
        cell: (info) => textCell(info.getValue(), { tabular: true, latin: true }),
      },
      {
        accessorKey: "transactionId",
        header: t("table.pages.payments.columns.transactionId"),
        cell: (info) => textCell(info.getValue(), { tabular: true, latin: true }),
      },
      {
        accessorKey: "amountIrt",
        header: t("table.pages.payments.columns.amountIrt"),
        cell: (info) => textCell(formatAmount(info.getValue() as number), true),
      },
      {
        accessorKey: "discountPercentage",
        header: t("table.pages.payments.columns.discountPercentage"),
        cell: (info) => textCell(formatNumber(info.getValue() as number | null), true),
      },
      {
        accessorKey: "discountAmountIrt",
        header: t("table.pages.payments.columns.discountAmountIrt"),
        cell: (info) => textCell(formatAmount(info.getValue() as number | null), true),
      },
      {
        accessorKey: "finalAmountIrt",
        header: t("table.pages.payments.columns.finalAmountIrt"),
        cell: (info) => textCell(formatAmount(info.getValue() as number), true),
      },
      {
        accessorKey: "couponCode",
        header: t("table.pages.payments.columns.couponCode"),
        cell: (info) => textCell(info.getValue(), { latin: true }),
      },
      {
        accessorKey: "couponDiscountType",
        header: t("table.pages.payments.columns.couponDiscountType"),
        cell: (info) => {
          const value = info.getValue() as CouponDiscountType | null;
          return textCell(value ? COUPON_DISCOUNT_TYPE_LABEL[value] : EMPTY_DISPLAY);
        },
      },
      {
        accessorKey: "couponDiscountValue",
        header: t("table.pages.payments.columns.couponDiscountValue"),
        cell: (info) => textCell(formatNumber(info.getValue() as number | null), true),
      },
      {
        accessorKey: "isManualStatusChange",
        header: t("table.pages.payments.columns.isManualStatusChange"),
        cell: (info) => (
          <Chip
            size="small"
            color={info.getValue() ? "warning" : "default"}
            variant="outlined"
            label={info.getValue() ? "بله" : "خیر"}
          />
        ),
      },
      {
        accessorKey: "manualStatusChangedDescription",
        header: t("table.pages.payments.columns.manualStatusChangedDescription"),
        cell: (info) => textCell(info.getValue()),
      },
      {
        accessorKey: "createdAt",
        header: t("table.pages.payments.columns.createdAt"),
        cell: (info) => dateCell(info.getValue()),
      },
      {
        accessorKey: "updatedAt",
        header: t("table.pages.payments.columns.updatedAt"),
        cell: (info) => dateCell(info.getValue()),
      },
      {
        accessorKey: "pendingAt",
        header: t("table.pages.payments.columns.pendingAt"),
        cell: (info) => dateCell(info.getValue()),
      },
      {
        accessorKey: "paidAt",
        header: t("table.pages.payments.columns.paidAt"),
        cell: (info) => dateCell(info.getValue()),
      },
      {
        accessorKey: "failedAt",
        header: t("table.pages.payments.columns.failedAt"),
        cell: (info) => dateCell(info.getValue()),
      },
      {
        accessorKey: "refundedAt",
        header: t("table.pages.payments.columns.refundedAt"),
        cell: (info) => dateCell(info.getValue()),
      },
      {
        accessorKey: "cancelledAt",
        header: t("table.pages.payments.columns.cancelledAt"),
        cell: (info) => dateCell(info.getValue()),
      },
      {
        id: "actions",
        header: t("table.columns.actions"),
        cell: ({ row }) => (
          <PaymentRowActions
            onReview={() => navigate(`${APP_SHELL_ROUTES.payments}/${row.original.id}`)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = (): void => {
    setSearchQuery("");
  };

  const handleClearFilters = (): void => {
    setSearchQuery("");
    setFilters(EMPTY_PRODUCT_PAYMENT_LIST_FILTERS);
  };

  const openManualPaymentDialog = (): void => {
    navigate(`${APP_SHELL_ROUTES.payments}/new`);
  };

  const closeManualPaymentDialog = (): void => {
    if (createManualPaymentResult.loading) {
      return;
    }
    navigate(APP_SHELL_ROUTES.payments);
    setManualPaymentUser(null);
    setManualPaymentProduct(null);
    setManualPaymentMethod("CARD_TO_CARD");
    setManualPaymentStatus("PAID");
    setManualCouponCode("");
    setManualPaymentDescription("");
    setManualPaymentEvidenceFile(null);
  };

  const closeReviewDialog = (): void => {
    setPendingPaidStatusChange(null);
    navigate(APP_SHELL_ROUTES.payments);
  };

  const closePaidStatusChangeConfirm = (): void => {
    setPendingPaidStatusChange(null);
    if (reviewPaymentId) {
      navigate(`${APP_SHELL_ROUTES.payments}/${reviewPaymentId}`);
    }
  };

  const confirmPaidStatusChange = (): void => {
    if (pendingPaidStatusChange) {
      setReviewStatus(pendingPaidStatusChange);
    }
    setPendingPaidStatusChange(null);
    if (reviewPaymentId) {
      navigate(`${APP_SHELL_ROUTES.payments}/${reviewPaymentId}`);
    }
  };

  const handleReviewStatusChange = (nextStatus: UserProductPurchaseStatus): void => {
    if (!reviewPaymentId) {
      return;
    }

    if (reviewStatus === "PAID" && nextStatus !== "PAID") {
      setPendingPaidStatusChange(nextStatus);
      navigate(`${APP_SHELL_ROUTES.payments}/${reviewPaymentId}/confirm`);
      return;
    }

    setReviewStatus(nextStatus);
  };

  useEffect(() => {
    if (isPaidStatusChangeConfirmOpen) {
      return;
    }

    setPendingPaidStatusChange(null);
  }, [isPaidStatusChangeConfirmOpen]);

  useEffect(() => {
    if (!isPaidStatusChangeConfirmOpen || pendingPaidStatusChange != null || !reviewPaymentId) {
      return;
    }

    navigate(`${APP_SHELL_ROUTES.payments}/${reviewPaymentId}`, { replace: true });
  }, [isPaidStatusChangeConfirmOpen, navigate, pendingPaidStatusChange, reviewPaymentId]);

  const handleSubmitReview = (): void => {
    if (!reviewPaymentId) {
      return;
    }

    void updatePaymentStatus({
      variables: {
        input: {
          id: reviewPaymentId,
          status: reviewStatus,
          manualStatusChangedDescription: reviewDescription.trim() || null,
        },
      },
    });
  };

  const uploadManualPaymentEvidence = async (file: File): Promise<string | null> => {
    setIsManualPaymentFileUploading(true);
    try {
      const uploadedFile = await uploadFile(file, {
        policy: FILE_UPLOAD_POLICY.PAYMENT_EVIDENCE,
        accept: "image/*,application/pdf",
        maxSizeBytes: FILE_UPLOAD_POLICY_MAX_SIZE_BYTES.PAYMENT_EVIDENCE,
      });
      return getFileIdFromAccessUrl(uploadedFile.accessUrl);
    } catch {
      showError("آپلود فایل پرداخت انجام نشد.");
      return null;
    } finally {
      setIsManualPaymentFileUploading(false);
    }
  };

  const handleSubmitManualPayment = async (): Promise<void> => {
    if (!manualPaymentUser || !manualPaymentProduct) {
      return;
    }

    let uploadedReceiptFileId: string | null = null;
    if (manualPaymentEvidenceFile) {
      uploadedReceiptFileId = await uploadManualPaymentEvidence(manualPaymentEvidenceFile);
      if (!uploadedReceiptFileId) {
        return;
      }
    }

    void createManualPayment({
      variables: {
        input: {
          userId: manualPaymentUser.id,
          productId: manualPaymentProduct.id,
          paymentMethod: manualPaymentMethod,
          status: manualPaymentStatus,
          couponCode: manualCouponCode.trim() || null,
          uploadedReceiptFileId,
          manualStatusChangedDescription: manualPaymentDescription.trim() || null,
        },
      },
    });
  };

  const renderTextFilter = (key: keyof ProductPaymentListFilters, label: string): ReactElement => {
    const latin = LATIN_TEXT_FILTER_KEYS.has(key);
    const numericPhone = MOBILE_PHONE_FILTER_KEYS.has(key);

    return (
      <TextField
        size="small"
        fullWidth
        aria-label={label}
        value={filters[key]}
        onChange={(event) => {
          const rawValue = event.target.value;
          const nextValue = numericPhone ? sanitizeMobilePhoneInput(rawValue) : rawValue;
          setFilterValue(key, nextValue as ProductPaymentListFilters[typeof key]);
        }}
        inputProps={
          latin
            ? {
                className: styles.latinInput,
                dir: "ltr",
                ...(numericPhone ? { inputMode: "numeric" as const } : {}),
              }
            : undefined
        }
      />
    );
  };

  const renderSelectFilter = <TValue extends string>(
    key: keyof ProductPaymentListFilters,
    label: string,
    options: ReadonlyArray<{ value: TValue; label: string }>
  ): ReactElement => (
    <TextField
      select
      size="small"
      fullWidth
      aria-label={label}
      value={filters[key]}
      onChange={(event) =>
        setFilterValue(key, event.target.value as ProductPaymentListFilters[typeof key])
      }
    >
      <MenuItem value="ALL">همه</MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );

  const renderRangeFilter = (
    minKey: keyof ProductPaymentListFilters,
    maxKey: keyof ProductPaymentListFilters,
    minLabel: string,
    maxLabel: string,
    type: "text" | "number" | "date" = "number"
  ): ReactElement => {
    if (type === "date") {
      return (
        <Stack spacing={0.5}>
          <JalaliDateFilterField
            label={minLabel}
            ariaLabel={minLabel}
            value={String(filters[minKey] || "")}
            onChange={(value) =>
              setFilterValue(minKey, value as ProductPaymentListFilters[typeof minKey])
            }
          />
          <JalaliDateFilterField
            label={maxLabel}
            ariaLabel={maxLabel}
            value={String(filters[maxKey] || "")}
            onChange={(value) =>
              setFilterValue(maxKey, value as ProductPaymentListFilters[typeof maxKey])
            }
          />
        </Stack>
      );
    }

    return (
      <Stack spacing={0.5}>
        <TextField
          size="small"
          type={type}
          placeholder={minLabel}
          aria-label={minLabel}
          value={filters[minKey]}
          onChange={(event) =>
            setFilterValue(minKey, event.target.value as ProductPaymentListFilters[typeof minKey])
          }
        />
        <TextField
          size="small"
          type={type}
          placeholder={maxLabel}
          aria-label={maxLabel}
          value={filters[maxKey]}
          onChange={(event) =>
            setFilterValue(maxKey, event.target.value as ProductPaymentListFilters[typeof maxKey])
          }
        />
      </Stack>
    );
  };

  const renderFilterCell = (column: Column<ProductPaymentRecord, unknown>): ReactElement | null => {
    const label = String(column.columnDef.header ?? column.id);

    switch (column.id) {
      case "userFullName":
      case "username":
      case "userEmail":
      case "userPhone":
      case "productTitle":
      case "paymentProvider":
      case "paymentReference":
      case "transactionId":
      case "manualStatusChangedDescription":
      case "couponCode":
        return renderTextFilter(column.id as keyof ProductPaymentListFilters, label);
      case "status":
        return renderSelectFilter<UserProductPurchaseStatus>(
          "status",
          label,
          Object.entries(STATUS_LABEL).map(([value, optionLabel]) => ({
            value: value as UserProductPurchaseStatus,
            label: optionLabel,
          }))
        );
      case "paymentMethod":
        return renderSelectFilter<UserProductPaymentMethod>(
          "paymentMethod",
          label,
          Object.entries(PAYMENT_METHOD_LABEL).map(([value, optionLabel]) => ({
            value: value as UserProductPaymentMethod,
            label: optionLabel,
          }))
        );
      case "currency":
        return renderSelectFilter<UserProductPurchaseCurrency>(
          "currency",
          label,
          Object.entries(CURRENCY_LABEL).map(([value, optionLabel]) => ({
            value: value as UserProductPurchaseCurrency,
            label: optionLabel,
          }))
        );
      case "couponDiscountType":
        return renderSelectFilter<CouponDiscountType>(
          "couponDiscountType",
          label,
          Object.entries(COUPON_DISCOUNT_TYPE_LABEL).map(([value, optionLabel]) => ({
            value: value as CouponDiscountType,
            label: optionLabel,
          }))
        );
      case "isManualStatusChange":
        return renderSelectFilter<"true" | "false">("isManualStatusChange", label, [
          { value: "true", label: "بله" },
          { value: "false", label: "خیر" },
        ]);
      case "amountIrt":
        return renderRangeFilter("amountIrtMin", "amountIrtMax", "از مبلغ", "تا مبلغ");
      case "discountPercentage":
        return renderRangeFilter(
          "discountPercentageMin",
          "discountPercentageMax",
          "از درصد",
          "تا درصد"
        );
      case "discountAmountIrt":
        return renderRangeFilter(
          "discountAmountIrtMin",
          "discountAmountIrtMax",
          "از تخفیف",
          "تا تخفیف"
        );
      case "finalAmountIrt":
        return renderRangeFilter("finalAmountIrtMin", "finalAmountIrtMax", "از مبلغ", "تا مبلغ");
      case "couponDiscountValue":
        return renderRangeFilter(
          "couponDiscountValueMin",
          "couponDiscountValueMax",
          "از مقدار",
          "تا مقدار"
        );
      case "createdAt":
      case "updatedAt":
      case "pendingAt":
      case "paidAt":
      case "failedAt":
      case "refundedAt":
      case "cancelledAt":
        return renderRangeFilter(
          `${column.id}From` as keyof ProductPaymentListFilters,
          `${column.id}To` as keyof ProductPaymentListFilters,
          `از ${label}`,
          `تا ${label}`,
          "date"
        );
      default:
        return null;
    }
  };

  const reviewStatusChip = reviewPayment ? (
    <Chip
      size="small"
      color={STATUS_COLOR[reviewPayment.status]}
      variant="outlined"
      label={STATUS_LABEL[reviewPayment.status]}
    />
  ) : null;
  const canSubmitManualPayment =
    manualPaymentUser != null &&
    manualPaymentProduct != null &&
    !createManualPaymentResult.loading &&
    !isManualPaymentFileUploading;

  const hasReviewFormChanges =
    initialReviewForm != null &&
    hasFormChanges(initialReviewForm, {
      status: reviewStatus,
      description: reviewDescription,
    });

  const canSubmitReview =
    reviewPayment != null &&
    !paymentDetailLoading &&
    !updatePaymentStatusResult.loading &&
    hasReviewFormChanges;

  return (
    <>
      <EntityTableShell<ProductPaymentRecord>
        table={table}
        pagedRows={table.getRowModel().rows}
        isMobile={isMobile}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        onRefresh={onRefresh}
        loading={loading}
        showNewButton
        newButtonText="ثبت دستی پرداخت"
        onNewClick={openManualPaymentDialog}
        toolbarOptions={TABLE_TOOLBAR_OPTIONS}
        showColumnFilters={showColumnFilters}
        onShowColumnFiltersChange={setShowColumnFilters}
        onClearFilters={handleClearFilters}
        renderFilterCell={renderFilterCell}
        columnWidthById={COLUMN_WIDTH_BY_ID}
        columnLayoutMode="fixed"
        noDataLabel={error ? t("errors.general.loadData") : undefined}
        hasActiveFilters={hasAppliedFilters}
        pagination={pagination}
        onRowClick={(row) => navigate(`${APP_SHELL_ROUTES.payments}/${row.id}`)}
      />

      <EntityModalShell
        open={manualPaymentRouteOpen}
        onClose={closeManualPaymentDialog}
        disableClose={createManualPaymentResult.loading || isManualPaymentFileUploading}
        hasUnsavedChanges={canSubmitManualPayment}
        maxWidth="md"
        title="ثبت دستی پرداخت"
        subtitle={t("pages.payments.manualCreate.subtitle")}
        relaxedHeaderSpacing
        footer={
          <ManualPaymentDialogActions
            onCancel={closeManualPaymentDialog}
            onSubmit={handleSubmitManualPayment}
            cancelDisabled={createManualPaymentResult.loading || isManualPaymentFileUploading}
            submitDisabled={!canSubmitManualPayment}
            isUploadingFile={isManualPaymentFileUploading}
            isSubmitting={createManualPaymentResult.loading}
          />
        }
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <ActiveEndUserPickerField
              value={manualPaymentUser}
              onChange={setManualPaymentUser}
              enabled={manualPaymentRouteOpen}
              required
            />

            <ProductPickerField
              enabled={manualPaymentRouteOpen && manualPaymentUser != null}
              filters={manualPaymentProductFilters}
              limit={200}
              sort={{ createdAt: "DESC" }}
              onlyPurchasable
              value={manualPaymentProduct}
              onChange={setManualPaymentProduct}
              disabled={!manualPaymentUser}
              noOptionsText={
                manualPaymentUser
                  ? "دوره فعال پولیِ پرداخت‌نشده برای این کاربر پیدا نشد."
                  : "دوره فعال پولی پیدا نشد."
              }
              label="دوره"
              placeholder="انتخاب دوره فعال پولی"
              helperText={
                manualPaymentUser
                  ? "فقط دوره‌های فعال پولی که این کاربر هنوز پرداخت نکرده نمایش داده می‌شوند."
                  : "ابتدا کاربر را انتخاب کنید تا دوره‌های قابل ثبت نمایش داده شوند."
              }
              required
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              fullWidth
              required
              size="small"
              label="روش پرداخت"
              value={manualPaymentMethod}
              onChange={(event) =>
                setManualPaymentMethod(event.target.value as UserProductPaymentMethod)
              }
            >
              {MANUAL_PAYMENT_METHOD_OPTIONS.map((method) => (
                <MenuItem key={method} value={method}>
                  {PAYMENT_METHOD_LABEL[method]}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              required
              fullWidth
              size="small"
              label="وضعیت پرداخت"
              value={manualPaymentStatus}
              onChange={(event) =>
                setManualPaymentStatus(event.target.value as UserProductPurchaseStatus)
              }
            >
              {REVIEW_STATUS_OPTIONS.map((value) => (
                <MenuItem key={value} value={value}>
                  {STATUS_LABEL[value]}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            fullWidth
            size="small"
            label="کد تخفیف"
            value={manualCouponCode}
            onChange={(event) => setManualCouponCode(event.target.value)}
            inputProps={{
              className: styles.latinInput,
              dir: "ltr",
            }}
            InputProps={{
              endAdornment: manualCouponCode ? (
                <InputAdornment position="end">
                  <AppTooltip title="پاک کردن کد تخفیف" arrow>
                    <IconButton
                      size="small"
                      edge="end"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setManualCouponCode("")}
                      aria-label="پاک کردن کد تخفیف"
                    >
                      <ClearRoundedIcon fontSize="small" />
                    </IconButton>
                  </AppTooltip>
                </InputAdornment>
              ) : null,
            }}
          />

          <Box>
            <FileUploadField
              label="فایل پرداخت"
              file={manualPaymentEvidenceFile}
              onChange={setManualPaymentEvidenceFile}
              accept="image/*,application/pdf"
              allowedFormatsLabel="تصویر یا PDF"
              maxSizeLabel="حداکثر ۱۰ مگابایت"
              maxSizeBytes={FILE_UPLOAD_POLICY_MAX_SIZE_BYTES.PAYMENT_EVIDENCE}
              dropTitle="فایل پرداخت را انتخاب کنید"
              mobileDropTitle="انتخاب فایل پرداخت"
              dropHint=""
              mobileDropHint=""
              removeLabel="حذف فایل"
              invalidLabel="فایل نامعتبر است"
            />
          </Box>

          <TextField
            fullWidth
            multiline
            minRows={MULTILINE_TEXTAREA_MIN_ROWS}
            maxRows={MULTILINE_TEXTAREA_MAX_ROWS}
            size="small"
            label="توضیح بررسی دستی"
            value={manualPaymentDescription}
            onChange={(event) => setManualPaymentDescription(event.target.value)}
            placeholder="مثلاً پرداخت توسط پشتیبانی تایید و ثبت شد."
          />
        </Stack>
      </EntityModalShell>

      <EntityModalShell
        open={reviewPaymentId != null}
        onClose={closeReviewDialog}
        disableClose={updatePaymentStatusResult.loading}
        hasUnsavedChanges={canSubmitReview}
        maxWidth="lg"
        resetKey={
          reviewPaymentId != null ? `${reviewPaymentId}-${Boolean(reviewPayment)}` : undefined
        }
        title="بررسی پرداخت"
        subtitle={reviewPayment?.productTitle?.trim() || t("pages.payments.review.subtitle")}
        footer={
          <ReviewPaymentDialogActions
            onCancel={closeReviewDialog}
            onSubmit={handleSubmitReview}
            cancelDisabled={updatePaymentStatusResult.loading}
            submitDisabled={!canSubmitReview}
          />
        }
      >
        {paymentDetailLoading || !reviewPayment ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 320 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              در حال دریافت اطلاعات پرداخت...
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <PaymentDetailSection
              title="پرداخت‌کننده و دوره"
              items={[
                { label: "نام پرداخت‌کننده", value: reviewPayment.userFullName },
                { label: "نام کاربری", value: reviewPayment.username, latin: true },
                { label: "ایمیل", value: reviewPayment.userEmail, latin: true },
                { label: "شماره تماس", value: reviewPayment.userPhone, latin: true },
                { label: "دوره", value: reviewPayment.productTitle },
              ]}
            />

            <PaymentDetailSection
              title="خلاصه پرداخت"
              twoColumnsOnMobile
              items={[
                { label: "وضعیت", value: reviewStatusChip ?? EMPTY_DISPLAY },
                {
                  label: "روش پرداخت",
                  value: PAYMENT_METHOD_LABEL[reviewPayment.paymentMethod],
                },
                { label: "واحد", value: CURRENCY_LABEL[reviewPayment.currency] },
                { label: "مبلغ اولیه", value: formatAmount(reviewPayment.amountIrt) },
                {
                  label: "درصد تخفیف",
                  value: formatNumber(reviewPayment.discountPercentage),
                },
                {
                  label: "مبلغ تخفیف",
                  value: formatAmount(reviewPayment.discountAmountIrt),
                },
                {
                  label: "مبلغ نهایی",
                  value: formatAmount(reviewPayment.finalAmountIrt),
                },
              ]}
            />

            <PaymentDetailSection
              title="اطلاعات تراکنش"
              items={[
                { label: "درگاه/ارائه‌دهنده", value: reviewPayment.paymentProvider, latin: true },
                {
                  label: "کد/مرجع پرداخت",
                  value: reviewPayment.paymentReference,
                  latin: true,
                },
                {
                  label: "شناسه تراکنش",
                  value: reviewPayment.transactionId,
                  latin: true,
                },
              ]}
            />

            <PaymentDetailSection
              title="کد تخفیف"
              twoColumnsOnMobile
              items={[
                { label: "کد تخفیف", value: reviewPayment.couponCode, latin: true },
                {
                  label: "نوع تخفیف",
                  value: reviewPayment.couponDiscountType
                    ? COUPON_DISCOUNT_TYPE_LABEL[reviewPayment.couponDiscountType]
                    : EMPTY_DISPLAY,
                },
                {
                  label: "مقدار تخفیف",
                  value: formatNumber(reviewPayment.couponDiscountValue),
                },
              ]}
            />

            <PaymentDetailSection
              title="زمان‌بندی وضعیت‌ها"
              twoColumnsOnMobile
              items={[
                {
                  label: "تاریخ ثبت",
                  value: <DateTimeValue value={reviewPayment.createdAt} emphasizeDate />,
                },
                {
                  label: "آخرین بروزرسانی",
                  value: <DateTimeValue value={reviewPayment.updatedAt} emphasizeDate />,
                },
                {
                  label: "تاریخ انتظار",
                  value: <DateTimeValue value={reviewPayment.pendingAt} emphasizeDate />,
                },
                {
                  label: "تاریخ پرداخت",
                  value: <DateTimeValue value={reviewPayment.paidAt} emphasizeDate />,
                },
                {
                  label: "تاریخ خطا",
                  value: <DateTimeValue value={reviewPayment.failedAt} emphasizeDate />,
                },
                {
                  label: "تاریخ مرجوعی",
                  value: <DateTimeValue value={reviewPayment.refundedAt} emphasizeDate />,
                },
                {
                  label: "تاریخ لغو",
                  value: <DateTimeValue value={reviewPayment.cancelledAt} emphasizeDate />,
                },
              ]}
            />

            <PaymentDetailSection
              title="ثبت اولیه و تغییر وضعیت"
              twoColumnsOnMobile
              items={[
                {
                  label: "ثبت اولیه توسط",
                  value: reviewPayment.submittedInitiallyByAdmin ? "پشتیبانی" : "کاربر",
                },
                {
                  label: "ثبت‌کننده",
                  value: reviewPayment.createdByUserName,
                },
                {
                  label: "تغییر دستی",
                  value: reviewPayment.isManualStatusChange ? "بله" : "خیر",
                },
                {
                  label: "تغییردهنده",
                  value: formatPurchaseStatusChangedBy(
                    reviewPayment.statusChangedBy === "SYSTEM" ||
                      reviewPayment.statusChangedBy === "ADMIN"
                      ? reviewPayment.statusChangedBy
                      : null,
                    reviewPayment.manualStatusChangerName
                  ),
                },
              ]}
            />

            {renderReceiptFileSection(reviewPayment)}

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: APP_SURFACE_BG,
                borderColor: "divider",
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={900}>
                    ثبت نتیجه بررسی
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    وضعیت پرداخت الزامی است. توضیح بررسی دستی اختیاری است.
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    select
                    required
                    fullWidth
                    label="وضعیت پرداخت"
                    value={reviewStatus}
                    onChange={(event) =>
                      handleReviewStatusChange(event.target.value as UserProductPurchaseStatus)
                    }
                  >
                    {REVIEW_STATUS_OPTIONS.map((value) => (
                      <MenuItem key={value} value={value}>
                        {STATUS_LABEL[value]}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    multiline
                    minRows={MULTILINE_TEXTAREA_MIN_ROWS}
                    maxRows={MULTILINE_TEXTAREA_MAX_ROWS}
                    label="توضیح بررسی دستی"
                    value={reviewDescription}
                    onChange={(event) => setReviewDescription(event.target.value)}
                    placeholder="مثلاً رسید بررسی شد و پرداخت تایید گردید."
                  />
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        )}
      </EntityModalShell>

      <EntityConfirmDialogShell
        open={isPaidStatusChangeConfirmOpen && pendingPaidStatusChange != null}
        onClose={closePaidStatusChangeConfirm}
        title="تغییر وضعیت پرداخت‌شده"
        resetKey={`${reviewPaymentId ?? ""}-${pendingPaidStatusChange ?? ""}`}
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: closePaidStatusChangeConfirm,
              },
              {
                key: "confirm",
                label: "تایید تغییر وضعیت",
                onClick: confirmPaidStatusChange,
                variant: "contained",
                color: "warning",
              },
            ]}
          />
        }
      >
        <Stack spacing={2}>
          <Alert severity="warning">
            این پرداخت در وضعیت «پرداخت‌شده» است. تغییر وضعیت ممکن است دسترسی کاربر به دوره را تحت
            تاثیر قرار دهد.
          </Alert>
          <DialogContentText>
            آیا از تغییر وضعیت از «{STATUS_LABEL.PAID}» به «
            {pendingPaidStatusChange ? STATUS_LABEL[pendingPaidStatusChange] : EMPTY_DISPLAY}» مطمئن
            هستید؟
          </DialogContentText>
        </Stack>
      </EntityConfirmDialogShell>
    </>
  );
};

export default PaymentsList;
