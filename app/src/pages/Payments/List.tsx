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
  CloseFullscreenRounded as CloseFullscreenRoundedIcon,
  FullscreenRounded as FullscreenRoundedIcon,
  ImageRounded as ImageRoundedIcon,
  InsertDriveFileRounded as InsertDriveFileRoundedIcon,
  PictureAsPdfRounded as PictureAsPdfRoundedIcon,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useQuery } from "@apollo/client/react";
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

import { COURSE_PAYMENT_MANUAL_CREATE_MUTATION } from "../../graphql/mutations/coursePaymentManualCreate.mutation";
import { COURSE_PAYMENT_STATUS_UPDATE_MUTATION } from "../../graphql/mutations/coursePaymentStatusUpdate.mutation";
import { COURSE_PAYMENT_LIST_QUERY } from "../../graphql/queries/coursePaymentList.query";
import { COURSE_LIST_QUERY } from "../../graphql/queries/courseList.query";
import { USER_LIST_QUERY } from "../../graphql/queries/userList.query";
import { useDebounce } from "../../hooks/useDebounce";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import {
  useServerPaginatedQuery,
  type ServerPageResult,
} from "../../hooks/useServerPaginatedQuery";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import EntityTableShell from "../../shared/crud/EntityTableShell";
import crudPrimitives from "../../shared/crud/styles/crudPrimitives.module.scss";
import EntityAutocompleteField from "../../shared/forms/EntityAutocompleteField";
import FileUploadField from "../../shared/forms/FileUploadField";
import { getFileIdFromAccessUrl } from "../../utils/fileAccessUrl.util";
import { uploadFile } from "../../utils/fileUpload.util";
import JalaliDateFilterField from "../../shared/table/JalaliDateFilterField";
import {
  type CourseListQuery,
  type CourseListQueryVariables,
  type CourseListItemRow,
} from "../Courses/courses-list.api";
import {
  type UserListQuery,
  type UserListQueryVariables,
  type UserListRow,
} from "../UsersManagement/users-management-list.api";
import {
  EMPTY_COURSE_PAYMENT_LIST_FILTERS,
  buildCoursePaymentListQueryVariables,
  hasCoursePaymentFiltersApplied,
  mapCoursePaymentListRowToRecord,
  type CoursePaymentListFilters,
  type CoursePaymentListQuery,
  type CoursePaymentListQueryVariables,
  type CoursePaymentListRow,
  type CoursePaymentRecord,
  type CouponDiscountType,
  type UserCoursePaymentMethod,
  type UserCoursePurchaseCurrency,
  type UserCoursePurchaseStatus,
} from "./payments-list.api";
import {
  ManualPaymentDialogActions,
  PaymentRowActions,
  ReviewPaymentDialogActions,
} from "./PaymentActions";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";

type CoursePaymentStatusUpdateMutation = {
  readonly coursePaymentStatusUpdate: CoursePaymentListRow;
};

type CoursePaymentStatusUpdateMutationVariables = {
  readonly input: {
    readonly id: string;
    readonly status: UserCoursePurchaseStatus;
    readonly manualStatusChangedDescription?: string | null;
  };
};

type CoursePaymentManualCreateMutation = {
  readonly coursePaymentManualCreate: CoursePaymentListRow;
};

type CoursePaymentManualCreateMutationVariables = {
  readonly input: {
    readonly userId: string;
    readonly courseId: string;
    readonly paymentMethod: UserCoursePaymentMethod;
    readonly status: UserCoursePurchaseStatus;
    readonly couponCode?: string | null;
    readonly uploadedReceiptFileId?: string | null;
    readonly manualStatusChangedDescription?: string | null;
  };
};

type ManualPaymentUserOption = {
  readonly id: string;
  readonly label: string;
  readonly subtitle: string;
  readonly row: UserListRow;
};

type ManualPaymentCourseOption = {
  readonly id: string;
  readonly label: string;
  readonly subtitle: string;
  readonly row: CourseListItemRow;
};

const COLUMN_WIDTH_BY_ID: Record<string, string> = {
  id: "14rem",
  userId: "14rem",
  courseId: "14rem",
  userFullName: "13rem",
  username: "11rem",
  userEmail: "14rem",
  userPhone: "10rem",
  courseTitle: "16rem",
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
  couponId: "14rem",
  couponCode: "9rem",
  couponDiscountType: "10rem",
  couponDiscountValue: "10rem",
  uploadedReceiptFileId: "14rem",
  receiptUploadedBy: "14rem",
  isManualStatusChange: "9rem",
  manualStatusChangedBy: "14rem",
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
const MANUAL_PAYMENT_DEFAULT_USER_LIMIT = 10;
const MANUAL_PAYMENT_SEARCH_USER_LIMIT = 200;
const MANUAL_PAYMENT_COURSE_OPTIONS_LIMIT = 200;

const STATUS_COLOR: Record<
  UserCoursePurchaseStatus,
  "default" | "primary" | "success" | "warning" | "error" | "info"
> = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "error",
  REFUNDED: "info",
  CANCELLED: "default",
};

const STATUS_LABEL: Record<UserCoursePurchaseStatus, string> = {
  PENDING: "در انتظار",
  PAID: "پرداخت‌شده",
  FAILED: "ناموفق",
  REFUNDED: "مرجوع‌شده",
  CANCELLED: "لغوشده",
};

const REVIEW_STATUS_OPTIONS: readonly UserCoursePurchaseStatus[] = [
  "PAID",
  "PENDING",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
];

const PAYMENT_METHOD_LABEL: Record<UserCoursePaymentMethod, string> = {
  GATEWAY: "درگاه",
  CARD_TO_CARD: "کارت به کارت",
  CRYPTOCURRENCY: "رمزارز",
  FREE: "رایگان",
};

const MANUAL_PAYMENT_METHOD_OPTIONS: readonly UserCoursePaymentMethod[] = [
  "CARD_TO_CARD",
  "GATEWAY",
  "CRYPTOCURRENCY",
  "FREE",
];

const CURRENCY_LABEL: Record<UserCoursePurchaseCurrency, string> = {
  IRT: "تومان",
  USDT: "تتر",
};

const COUPON_DISCOUNT_TYPE_LABEL: Record<CouponDiscountType, string> = {
  PERCENTAGE: "درصدی",
  FIXED_AMOUNT: "مبلغ ثابت",
};

function formatDate(value: string): string {
  if (!value.trim()) {
    return EMPTY_DISPLAY;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_DISPLAY;
  }
  return date.toLocaleDateString("fa-IR");
}

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

function getUserFullName(row: UserListRow): string {
  const parts = [row.profile?.firstName?.trim(), row.profile?.lastName?.trim()].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(" ") : row.username;
}

function userToManualPaymentOption(row: UserListRow): ManualPaymentUserOption {
  const fullName = getUserFullName(row);
  const phone = row.profile?.phoneNumber?.trim();
  const email = row.profile?.email?.trim();
  return {
    id: row.id,
    label: fullName,
    subtitle: [row.username, phone || email].filter(Boolean).join(" · "),
    row,
  };
}

function calculateDiscountedCoursePrice(course: CourseListItemRow): number {
  const price = Math.max(0, course.priceIrt ?? 0);
  const discount = course.discount;
  if (!discount || discount.value <= 0 || price <= 0) {
    return price;
  }

  if (discount.type === "PERCENTAGE") {
    return Math.max(0, price - Math.round(price * (Math.min(discount.value, 100) / 100)));
  }

  return Math.max(0, price - Math.min(price, discount.value));
}

function courseToManualPaymentOption(row: CourseListItemRow): ManualPaymentCourseOption {
  const finalPrice = calculateDiscountedCoursePrice(row);
  return {
    id: row.id,
    label: row.title,
    subtitle: `${formatAmount(finalPrice)} · ${row.isActive ? "فعال" : "غیرفعال"}`,
    row,
  };
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

function isUploadedReceiptPresent(record: CoursePaymentRecord): boolean {
  return record.uploadedReceiptFileId !== "-" || record.uploadedReceiptFileTitle !== "-";
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

function renderReceiptFileCard(
  record: CoursePaymentRecord,
  isExpanded: boolean,
  onToggleExpanded: () => void,
): ReactElement | null {
  if (!isUploadedReceiptPresent(record)) {
    return null;
  }

  const title =
    record.uploadedReceiptFileTitle !== "-" ? record.uploadedReceiptFileTitle : "رسید پرداخت";
  const mimeType =
    record.uploadedReceiptFileMimeType !== "-" ? record.uploadedReceiptFileMimeType : "";
  const accessUrl = record.uploadedReceiptFileAccessUrl;
  const canPreviewImage = accessUrl !== "" && isImageMimeType(mimeType);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "background.paper",
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
        <Stack
          direction={{ xs: "column", sm: isExpanded ? "column" : "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: isExpanded ? "stretch" : "center" }}
        >
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              position: "relative",
              flexShrink: 0,
              inlineSize: "100%",
              maxInlineSize: { xs: "100%", sm: isExpanded ? "100%" : "9rem" },
              blockSize: {
                xs: isExpanded ? "min(68vh, 32rem)" : "12rem",
                sm: isExpanded ? "min(70vh, 36rem)" : "9rem",
              },
              overflow: "hidden",
              borderRadius: 2,
              bgcolor: "action.hover",
              color: "text.secondary",
            }}
          >
            {canPreviewImage ? (
              <>
                <Box
                  component="img"
                  src={accessUrl}
                  alt={title}
                  sx={{
                    display: "block",
                    inlineSize: "100%",
                    blockSize: "100%",
                    objectFit: "contain",
                  }}
                />
                <IconButton
                  size="small"
                  aria-label={isExpanded ? "کوچک کردن تصویر رسید" : "بزرگ کردن تصویر رسید"}
                  onClick={onToggleExpanded}
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                    boxShadow: 2,
                    "&:hover": {
                      bgcolor: "background.paper",
                    },
                  }}
                >
                  {isExpanded ? (
                    <CloseFullscreenRoundedIcon fontSize="small" />
                  ) : (
                    <FullscreenRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </>
            ) : (
              getReceiptFileIcon(mimeType)
            )}
          </Box>
          <Stack spacing={0.75} minWidth={0} flex={1}>
            <Typography variant="body1" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mimeType || "نوع فایل نامشخص"} ·{" "}
              {formatFileSize(record.uploadedReceiptFileSizeBytes)}
            </Typography>
            {record.receiptUploaderName !== "-" ? (
              <Typography variant="body2" color="text.secondary">
                آپلودکننده: {record.receiptUploaderName}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

function selectCoursePaymentListPage(
  data: CoursePaymentListQuery | undefined,
): ServerPageResult<CoursePaymentListRow> | null {
  const page = data?.coursePaymentList;
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

type DetailItem = {
  readonly label: string;
  readonly value: string | ReactElement;
};

function PaymentDetailSection({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly DetailItem[];
}): ReactElement {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "background.default",
      }}
    >
      <Typography variant="subtitle1" fontWeight={800} gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {items.map((item) => (
          <Box key={item.label}>
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
            <Box sx={{ mt: 0.25, overflowWrap: "anywhere" }}>
              {typeof item.value === "string" ? (
                <Typography variant="body2" fontWeight={600}>
                  {item.value || EMPTY_DISPLAY}
                </Typography>
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
  const { dialogProps, getPaperProps, getContentProps } = useMobileDialogProps({
    breakpoint: "md",
  });
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const hasShownLoadErrorRef = useRef(false);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    userId: false,
    courseId: false,
    userFullName: true,
    username: true,
    userPhone: true,
    userEmail: false,
    courseTitle: true,
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
    couponId: false,
    couponCode: true,
    couponDiscountType: false,
    couponDiscountValue: false,
    uploadedReceiptFileId: false,
    receiptUploadedBy: false,
    isManualStatusChange: false,
    manualStatusChangedBy: false,
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
  const [filters, setFilters] = useState<CoursePaymentListFilters>(
    EMPTY_COURSE_PAYMENT_LIST_FILTERS,
  );
  const [reviewTarget, setReviewTarget] = useState<CoursePaymentRecord | null>(null);
  const [reviewStatus, setReviewStatus] = useState<UserCoursePurchaseStatus>("PENDING");
  const [reviewDescription, setReviewDescription] = useState("");
  const [isReceiptPreviewExpanded, setIsReceiptPreviewExpanded] = useState(false);
  const manualPaymentRouteOpen = location.pathname === `${APP_SHELL_ROUTES.payments}/new`;
  const [manualPaymentUser, setManualPaymentUser] = useState<ManualPaymentUserOption | null>(null);
  const [manualPaymentUserSearch, setManualPaymentUserSearch] = useState("");
  const [manualPaymentCourse, setManualPaymentCourse] = useState<ManualPaymentCourseOption | null>(
    null,
  );
  const [manualPaymentMethod, setManualPaymentMethod] =
    useState<UserCoursePaymentMethod>("CARD_TO_CARD");
  const [manualPaymentStatus, setManualPaymentStatus] = useState<UserCoursePurchaseStatus>("PAID");
  const [manualCouponCode, setManualCouponCode] = useState("");
  const [manualPaymentDescription, setManualPaymentDescription] = useState("");
  const [manualPaymentEvidenceFile, setManualPaymentEvidenceFile] = useState<File | null>(null);
  const debouncedManualPaymentUserSearch = useDebounce(manualPaymentUserSearch, 400);
  const debouncedFilters = useDebounce(filters, 500);
  const hasAppliedFilters =
    debouncedSearchQuery.trim() !== "" || hasCoursePaymentFiltersApplied(debouncedFilters);

  const manualPaymentUsersVariables = useMemo<UserListQueryVariables>(() => {
    const query = debouncedManualPaymentUserSearch.trim();
    return {
      input: {
        filters: {
          query: query || null,
          role: "END_USER",
          status: "ACTIVE",
        },
        options: {
          limit: query ? MANUAL_PAYMENT_SEARCH_USER_LIMIT : MANUAL_PAYMENT_DEFAULT_USER_LIMIT,
          skip: 0,
          sort: { createdAt: "DESC" },
        },
      },
    };
  }, [debouncedManualPaymentUserSearch]);

  const manualPaymentCoursesVariables = useMemo<CourseListQueryVariables>(
    () => ({
      input: {
        filters: {
          isActive: true,
          hasPrice: true,
        },
        options: {
          limit: MANUAL_PAYMENT_COURSE_OPTIONS_LIMIT,
          sort: { title: "ASC" },
        },
      },
    }),
    [],
  );

  const setFilterValue = <K extends keyof CoursePaymentListFilters>(
    key: K,
    value: CoursePaymentListFilters[K],
  ): void => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const buildVariables = useCallback(
    ({ page, pageSize }: { page: number; pageSize: number }) =>
      buildCoursePaymentListQueryVariables(debouncedSearchQuery, debouncedFilters, page, pageSize),
    [debouncedFilters, debouncedSearchQuery],
  );

  const {
    items: rows,
    loading,
    error,
    onRefresh,
    pagination,
  } = useServerPaginatedQuery<
    CoursePaymentListQuery,
    CoursePaymentListQueryVariables,
    CoursePaymentListRow,
    CoursePaymentRecord
  >({
    query: COURSE_PAYMENT_LIST_QUERY,
    variables: buildVariables,
    selectPage: selectCoursePaymentListPage,
    mapItem: mapCoursePaymentListRowToRecord,
    resetPageDeps: [debouncedSearchQuery, debouncedFilters],
  });

  const { data: manualPaymentUsersData, loading: manualPaymentUsersLoading } = useQuery<
    UserListQuery,
    UserListQueryVariables
  >(USER_LIST_QUERY, {
    variables: manualPaymentUsersVariables,
    fetchPolicy: "cache-first",
    skip: !manualPaymentRouteOpen,
  });

  const { data: manualPaymentCoursesData, loading: manualPaymentCoursesLoading } = useQuery<
    CourseListQuery,
    CourseListQueryVariables
  >(COURSE_LIST_QUERY, {
    variables: manualPaymentCoursesVariables,
    fetchPolicy: "cache-first",
    skip: !manualPaymentRouteOpen,
  });

  const [updatePaymentStatus, updatePaymentStatusResult] = useMutationWithSnackbar<
    CoursePaymentStatusUpdateMutation,
    CoursePaymentStatusUpdateMutationVariables
  >(COURSE_PAYMENT_STATUS_UPDATE_MUTATION, {
    successMessage: "وضعیت پرداخت با موفقیت ثبت شد.",
    errorMessage: "ثبت وضعیت پرداخت انجام نشد.",
    onSuccess: (data) => {
      setReviewTarget(mapCoursePaymentListRowToRecord(data.coursePaymentStatusUpdate));
      onRefresh();
    },
  });

  const [createManualPayment, createManualPaymentResult] = useMutationWithSnackbar<
    CoursePaymentManualCreateMutation,
    CoursePaymentManualCreateMutationVariables
  >(COURSE_PAYMENT_MANUAL_CREATE_MUTATION, {
    successMessage: "پرداخت دستی با موفقیت ثبت شد.",
    errorMessage: "ثبت پرداخت دستی انجام نشد.",
    onSuccess: () => {
      setIsManualPaymentDialogOpen(false);
      setManualPaymentUser(null);
      setManualPaymentUserSearch("");
      setManualPaymentCourse(null);
      setManualPaymentMethod("CARD_TO_CARD");
      setManualPaymentStatus("PAID");
      setManualCouponCode("");
      setManualPaymentDescription("");
      setManualPaymentEvidenceFile(null);
      onRefresh();
    },
  });

  const [isManualPaymentFileUploading, setIsManualPaymentFileUploading] = useState(false);

  const manualPaymentUserOptions = useMemo(
    () => (manualPaymentUsersData?.userList.items ?? []).map(userToManualPaymentOption),
    [manualPaymentUsersData],
  );

  const manualPaymentCourseOptions = useMemo(
    () =>
      (manualPaymentCoursesData?.courseList.items ?? [])
        .filter((course) => course.isActive !== false)
        .filter((course) => calculateDiscountedCoursePrice(course) > 0)
        .map(courseToManualPaymentOption),
    [manualPaymentCoursesData],
  );

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
    if (!manualPaymentCourse) {
      return;
    }
    const isStillAvailable = manualPaymentCourseOptions.some(
      (course) => course.id === manualPaymentCourse.id,
    );
    if (!isStillAvailable) {
      setManualPaymentCourse(null);
    }
  }, [manualPaymentCourse, manualPaymentCourseOptions]);

  useEffect(() => {
    if (!reviewTarget) {
      return;
    }

    setReviewStatus(reviewTarget.status);
    setReviewDescription(
      reviewTarget.manualStatusChangedDescription === "-"
        ? ""
        : reviewTarget.manualStatusChangedDescription,
    );
    setIsReceiptPreviewExpanded(false);
  }, [reviewTarget]);

  useEffect(() => {
    const paymentRoutePrefix = `${APP_SHELL_ROUTES.payments}/`;
    if (!location.pathname.startsWith(paymentRoutePrefix)) {
      if (reviewTarget) {
        setReviewTarget(null);
      }
      return;
    }

    const routeId = location.pathname.slice(paymentRoutePrefix.length);
    if (!routeId || routeId === "new") {
      if (routeId !== "new" && reviewTarget) {
        setReviewTarget(null);
      }
      return;
    }

    const record = rows.find((item) => item.id === routeId) ?? null;
    setReviewTarget(record);
  }, [location.pathname, reviewTarget, rows]);

  const textCell = (value: unknown, tabular = false): ReactElement => (
    <Typography variant="body2" className={tabular ? crudPrimitives.tabularNums : undefined}>
      {String(value || EMPTY_DISPLAY)}
    </Typography>
  );

  const dateCell = (value: unknown): ReactElement => (
    <Typography variant="body2" className={crudPrimitives.tabularNums}>
      {formatDate(String(value || ""))}
    </Typography>
  );

  const columns = useMemo<ColumnDef<CoursePaymentRecord>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("table.pages.payments.columns.id"),
        cell: (info) => textCell(info.getValue(), true),
      },
      {
        accessorKey: "userId",
        header: t("table.pages.payments.columns.userId"),
        cell: (info) => textCell(info.getValue(), true),
      },
      {
        accessorKey: "courseId",
        header: t("table.pages.payments.columns.courseId"),
        cell: (info) => textCell(info.getValue(), true),
      },
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
        cell: (info) => textCell(info.getValue()),
      },
      {
        accessorKey: "userPhone",
        header: t("table.pages.payments.columns.userPhone"),
        cell: (info) => textCell(info.getValue(), true),
      },
      {
        accessorKey: "userEmail",
        header: t("table.pages.payments.columns.userEmail"),
        cell: (info) => textCell(info.getValue(), true),
      },
      {
        accessorKey: "courseTitle",
        header: t("table.pages.payments.columns.courseTitle"),
        cell: (info) => textCell(info.getValue()),
      },
      {
        accessorKey: "status",
        header: t("table.pages.payments.columns.status"),
        cell: (info) => {
          const status = info.getValue() as UserCoursePurchaseStatus;
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
          const method = info.getValue() as UserCoursePaymentMethod;
          return <Chip size="small" label={PAYMENT_METHOD_LABEL[method]} />;
        },
      },
      {
        accessorKey: "currency",
        header: t("table.pages.payments.columns.currency"),
        cell: (info) => {
          const currency = info.getValue() as UserCoursePurchaseCurrency;
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
        cell: (info) => textCell(info.getValue(), true),
      },
      {
        accessorKey: "transactionId",
        header: t("table.pages.payments.columns.transactionId"),
        cell: (info) => textCell(info.getValue(), true),
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
        accessorKey: "couponId",
        header: t("table.pages.payments.columns.couponId"),
        cell: (info) => textCell(info.getValue(), true),
      },
      {
        accessorKey: "couponCode",
        header: t("table.pages.payments.columns.couponCode"),
        cell: (info) => textCell(info.getValue()),
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
        accessorKey: "uploadedReceiptFileId",
        header: t("table.pages.payments.columns.uploadedReceiptFileId"),
        cell: (info) => textCell(info.getValue(), true),
      },
      {
        accessorKey: "receiptUploadedBy",
        header: t("table.pages.payments.columns.receiptUploadedBy"),
        cell: (info) => textCell(info.getValue(), true),
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
        accessorKey: "manualStatusChangedBy",
        header: t("table.pages.payments.columns.manualStatusChangedBy"),
        cell: (info) => textCell(info.getValue(), true),
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
          <PaymentRowActions onReview={() => navigate(`${APP_SHELL_ROUTES.payments}/${row.original.id}`)} />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t],
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
    setFilters(EMPTY_COURSE_PAYMENT_LIST_FILTERS);
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
    setManualPaymentUserSearch("");
    setManualPaymentCourse(null);
    setManualPaymentMethod("CARD_TO_CARD");
    setManualPaymentStatus("PAID");
    setManualCouponCode("");
    setManualPaymentDescription("");
    setManualPaymentEvidenceFile(null);
  };

  const closeReviewDialog = (): void => {
    setReviewTarget(null);
    setIsReceiptPreviewExpanded(false);
    navigate(APP_SHELL_ROUTES.payments);
  };

  const handleSubmitReview = (): void => {
    if (!reviewTarget) {
      return;
    }

    void updatePaymentStatus({
      variables: {
        input: {
          id: reviewTarget.id,
          status: reviewStatus,
          manualStatusChangedDescription: reviewDescription.trim() || null,
        },
      },
    });
  };

  const uploadManualPaymentEvidence = async (file: File): Promise<string | null> => {
    setIsManualPaymentFileUploading(true);
    try {
      const uploadedFile = await uploadFile(file);
      return getFileIdFromAccessUrl(uploadedFile.accessUrl);
    } catch {
      showError("آپلود فایل پرداخت انجام نشد.");
      return null;
    } finally {
      setIsManualPaymentFileUploading(false);
    }
  };

  const handleSubmitManualPayment = async (): Promise<void> => {
    if (!manualPaymentUser || !manualPaymentCourse) {
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
          courseId: manualPaymentCourse.id,
          paymentMethod: manualPaymentMethod,
          status: manualPaymentStatus,
          couponCode: manualCouponCode.trim() || null,
          uploadedReceiptFileId,
          manualStatusChangedDescription: manualPaymentDescription.trim() || null,
        },
      },
    });
  };

  const renderTextFilter = (key: keyof CoursePaymentListFilters, label: string): ReactElement => (
    <TextField
      size="small"
      fullWidth
      aria-label={label}
      value={filters[key]}
      onChange={(event) =>
        setFilterValue(key, event.target.value as CoursePaymentListFilters[typeof key])
      }
    />
  );

  const renderSelectFilter = <TValue extends string>(
    key: keyof CoursePaymentListFilters,
    label: string,
    options: ReadonlyArray<{ value: TValue; label: string }>,
  ): ReactElement => (
      <TextField
        select
        size="small"
        fullWidth
        aria-label={label}
        value={filters[key]}
        onChange={(event) =>
          setFilterValue(key, event.target.value as CoursePaymentListFilters[typeof key])
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
    minKey: keyof CoursePaymentListFilters,
    maxKey: keyof CoursePaymentListFilters,
    minLabel: string,
    maxLabel: string,
    type: "text" | "number" | "date" = "number",
  ): ReactElement => {
    if (type === "date") {
      return (
        <Stack spacing={0.5}>
          <JalaliDateFilterField
            label={minLabel}
            ariaLabel={minLabel}
            value={String(filters[minKey] || "")}
            onChange={(value) =>
              setFilterValue(minKey, value as CoursePaymentListFilters[typeof minKey])
            }
          />
          <JalaliDateFilterField
            label={maxLabel}
            ariaLabel={maxLabel}
            value={String(filters[maxKey] || "")}
            onChange={(value) =>
              setFilterValue(maxKey, value as CoursePaymentListFilters[typeof maxKey])
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
            setFilterValue(minKey, event.target.value as CoursePaymentListFilters[typeof minKey])
          }
        />
        <TextField
          size="small"
          type={type}
          placeholder={maxLabel}
          aria-label={maxLabel}
          value={filters[maxKey]}
          onChange={(event) =>
            setFilterValue(maxKey, event.target.value as CoursePaymentListFilters[typeof maxKey])
          }
        />
      </Stack>
    );
  };

  const renderFilterCell = (column: Column<CoursePaymentRecord, unknown>): ReactElement | null => {
    const label = String(column.columnDef.header ?? column.id);

    switch (column.id) {
      case "id":
      case "userId":
      case "courseId":
      case "userFullName":
      case "username":
      case "userEmail":
      case "userPhone":
      case "courseTitle":
      case "paymentProvider":
      case "paymentReference":
      case "transactionId":
      case "manualStatusChangedBy":
      case "manualStatusChangedDescription":
      case "uploadedReceiptFileId":
      case "receiptUploadedBy":
      case "couponId":
      case "couponCode":
        return renderTextFilter(column.id as keyof CoursePaymentListFilters, label);
      case "status":
        return renderSelectFilter<UserCoursePurchaseStatus>(
          "status",
          label,
          Object.entries(STATUS_LABEL).map(([value, optionLabel]) => ({
            value: value as UserCoursePurchaseStatus,
            label: optionLabel,
          })),
        );
      case "paymentMethod":
        return renderSelectFilter<UserCoursePaymentMethod>(
          "paymentMethod",
          label,
          Object.entries(PAYMENT_METHOD_LABEL).map(([value, optionLabel]) => ({
            value: value as UserCoursePaymentMethod,
            label: optionLabel,
          })),
        );
      case "currency":
        return renderSelectFilter<UserCoursePurchaseCurrency>(
          "currency",
          label,
          Object.entries(CURRENCY_LABEL).map(([value, optionLabel]) => ({
            value: value as UserCoursePurchaseCurrency,
            label: optionLabel,
          })),
        );
      case "couponDiscountType":
        return renderSelectFilter<CouponDiscountType>(
          "couponDiscountType",
          label,
          Object.entries(COUPON_DISCOUNT_TYPE_LABEL).map(([value, optionLabel]) => ({
            value: value as CouponDiscountType,
            label: optionLabel,
          })),
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
          "تا درصد",
        );
      case "discountAmountIrt":
        return renderRangeFilter(
          "discountAmountIrtMin",
          "discountAmountIrtMax",
          "از تخفیف",
          "تا تخفیف",
        );
      case "finalAmountIrt":
        return renderRangeFilter("finalAmountIrtMin", "finalAmountIrtMax", "از مبلغ", "تا مبلغ");
      case "couponDiscountValue":
        return renderRangeFilter(
          "couponDiscountValueMin",
          "couponDiscountValueMax",
          "از مقدار",
          "تا مقدار",
        );
      case "createdAt":
      case "updatedAt":
      case "pendingAt":
      case "paidAt":
      case "failedAt":
      case "refundedAt":
      case "cancelledAt":
        return renderRangeFilter(
          `${column.id}From` as keyof CoursePaymentListFilters,
          `${column.id}To` as keyof CoursePaymentListFilters,
          `از ${label}`,
          `تا ${label}`,
          "date",
        );
      default:
        return null;
    }
  };

  const reviewStatusChip = reviewTarget ? (
    <Chip
      size="small"
      color={STATUS_COLOR[reviewTarget.status]}
      variant="outlined"
      label={STATUS_LABEL[reviewTarget.status]}
    />
  ) : null;
  const isManualPaymentOptionsLoading = manualPaymentUsersLoading || manualPaymentCoursesLoading;
  const canSubmitManualPayment =
    manualPaymentUser != null &&
    manualPaymentCourse != null &&
    !createManualPaymentResult.loading &&
    !isManualPaymentFileUploading;

  return (
    <>
      <EntityTableShell<CoursePaymentRecord>
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
        tableMinWidth="220rem"
        noDataLabel={error ? t("errors.general.loadData") : undefined}
        hasActiveFilters={hasAppliedFilters}
        pagination={pagination}
      />

      <Dialog
        open={manualPaymentRouteOpen}
        onClose={closeManualPaymentDialog}
        maxWidth="md"
        {...dialogProps}
        PaperProps={getPaperProps()}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={900}>
              ثبت دستی پرداخت
            </Typography>
            <Typography variant="body2" color="text.secondary">
              این فرم فقط برای ثبت پرداخت توسط پشتیبانی استفاده می‌شود
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent
          dividers
          {...getContentProps({ sx: { bgcolor: "background.default" } })}
        >
          <Stack spacing={2}>
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 3, bgcolor: "background.paper", borderColor: "divider" }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={900}>
                    اطلاعات پرداخت
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    کاربر نهایی و دوره فعال پولی را انتخاب کنید.
                  </Typography>
                </Box>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <EntityAutocompleteField
                    options={manualPaymentUserOptions}
                    value={manualPaymentUser}
                    inputValue={manualPaymentUserSearch}
                    loading={manualPaymentUsersLoading}
                    onInputChange={setManualPaymentUserSearch}
                    onChange={setManualPaymentUser}
                    noOptionsText="کاربر فعال با نقش کاربر نهایی پیدا نشد."
                    label="کاربر"
                    placeholder="جستجو براساس نام، نام کاربری یا موبایل"
                    required
                  />

                  <EntityAutocompleteField
                    options={manualPaymentCourseOptions}
                    value={manualPaymentCourse}
                    loading={manualPaymentCoursesLoading}
                    onChange={setManualPaymentCourse}
                    noOptionsText="دوره فعال پولی پیدا نشد."
                    label="دوره"
                    placeholder="انتخاب دوره فعال پولی"
                    helperText="همه دوره‌های فعال پولی قابل انتخاب هستند."
                    required
                  />
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="روش پرداخت"
                    value={manualPaymentMethod}
                    onChange={(event) =>
                      setManualPaymentMethod(event.target.value as UserCoursePaymentMethod)
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
                    label="وضعیت پرداخت"
                    value={manualPaymentStatus}
                    onChange={(event) =>
                      setManualPaymentStatus(event.target.value as UserCoursePurchaseStatus)
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
                  label="کد تخفیف"
                  value={manualCouponCode}
                  onChange={(event) => setManualCouponCode(event.target.value)}
                  placeholder="اختیاری"
                />

                <Box>
                  <FileUploadField
                    label="فایل پرداخت"
                    file={manualPaymentEvidenceFile}
                    onChange={setManualPaymentEvidenceFile}
                    accept="image/*,application/pdf"
                    allowedFormatsLabel="تصویر یا PDF"
                    maxSizeLabel="برای رسید یا مستند پرداخت"
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
                  minRows={3}
                  label="توضیح بررسی دستی"
                  value={manualPaymentDescription}
                  onChange={(event) => setManualPaymentDescription(event.target.value)}
                  placeholder="مثلاً پرداخت توسط پشتیبانی تایید و ثبت شد."
                />
              </Stack>
            </Paper>

            {isManualPaymentOptionsLoading ? (
              <Typography variant="body2" color="text.secondary">
                در حال آماده‌سازی گزینه‌های قابل انتخاب...
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <ManualPaymentDialogActions
          onCancel={closeManualPaymentDialog}
          onSubmit={handleSubmitManualPayment}
          cancelDisabled={
            createManualPaymentResult.loading || isManualPaymentFileUploading
          }
          submitDisabled={!canSubmitManualPayment}
          isUploadingFile={isManualPaymentFileUploading}
          isSubmitting={createManualPaymentResult.loading}
        />
      </Dialog>

      <Dialog
        open={reviewTarget != null}
        onClose={closeReviewDialog}
        maxWidth="lg"
        {...dialogProps}
        PaperProps={getPaperProps()}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack spacing={1}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  بررسی پرداخت
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {reviewTarget?.courseTitle ?? EMPTY_DISPLAY}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent
          dividers
          {...getContentProps({ sx: { bgcolor: "background.default" } })}
        >
          {reviewTarget ? (
            <Stack spacing={2}>
              <PaymentDetailSection
                title="خلاصه پرداخت"
                items={[
                  { label: "وضعیت", value: reviewStatusChip ?? EMPTY_DISPLAY },
                  {
                    label: "روش پرداخت",
                    value: PAYMENT_METHOD_LABEL[reviewTarget.paymentMethod],
                  },
                  { label: "واحد", value: CURRENCY_LABEL[reviewTarget.currency] },
                  { label: "مبلغ اولیه", value: formatAmount(reviewTarget.amountIrt) },
                  {
                    label: "درصد تخفیف",
                    value: formatNumber(reviewTarget.discountPercentage),
                  },
                  {
                    label: "مبلغ تخفیف",
                    value: formatAmount(reviewTarget.discountAmountIrt),
                  },
                  {
                    label: "مبلغ نهایی",
                    value: formatAmount(reviewTarget.finalAmountIrt),
                  },
                ]}
              />

              <PaymentDetailSection
                title="پرداخت‌کننده و دوره"
                items={[
                  { label: "نام پرداخت‌کننده", value: reviewTarget.userFullName },
                  { label: "نام کاربری", value: reviewTarget.username },
                  { label: "ایمیل", value: reviewTarget.userEmail },
                  { label: "شماره تماس", value: reviewTarget.userPhone },
                  { label: "دوره", value: reviewTarget.courseTitle },
                ]}
              />

              <PaymentDetailSection
                title="اطلاعات تراکنش"
                items={[
                  { label: "درگاه/ارائه‌دهنده", value: reviewTarget.paymentProvider },
                  { label: "کد/مرجع پرداخت", value: reviewTarget.paymentReference },
                  { label: "شناسه تراکنش", value: reviewTarget.transactionId },
                ]}
              />

              <PaymentDetailSection
                title="کد تخفیف"
                items={[
                  { label: "کد تخفیف", value: reviewTarget.couponCode },
                  {
                    label: "نوع تخفیف",
                    value: reviewTarget.couponDiscountType
                      ? COUPON_DISCOUNT_TYPE_LABEL[reviewTarget.couponDiscountType]
                      : EMPTY_DISPLAY,
                  },
                  {
                    label: "مقدار تخفیف",
                    value: formatNumber(reviewTarget.couponDiscountValue),
                  },
                ]}
              />

              <PaymentDetailSection
                title="زمان‌بندی وضعیت‌ها"
                items={[
                  { label: "تاریخ ثبت", value: formatDate(reviewTarget.createdAt) },
                  { label: "آخرین بروزرسانی", value: formatDate(reviewTarget.updatedAt) },
                  { label: "تاریخ انتظار", value: formatDate(reviewTarget.pendingAt) },
                  { label: "تاریخ پرداخت", value: formatDate(reviewTarget.paidAt) },
                  { label: "تاریخ خطا", value: formatDate(reviewTarget.failedAt) },
                  { label: "تاریخ مرجوعی", value: formatDate(reviewTarget.refundedAt) },
                  { label: "تاریخ لغو", value: formatDate(reviewTarget.cancelledAt) },
                ]}
              />

              <PaymentDetailSection
                title="بررسی دستی"
                items={[
                  {
                    label: "تغییر دستی",
                    value: reviewTarget.isManualStatusChange ? "بله" : "خیر",
                  },
                  {
                    label: "تغییردهنده دستی",
                    value: reviewTarget.manualStatusChangerName,
                  },
                ]}
              />

              {renderReceiptFileCard(reviewTarget, isReceiptPreviewExpanded, () =>
                setIsReceiptPreviewExpanded((previous) => !previous),
              )}

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "background.paper",
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
                        setReviewStatus(event.target.value as UserCoursePurchaseStatus)
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
                      minRows={3}
                      label="توضیح بررسی دستی"
                      value={reviewDescription}
                      onChange={(event) => setReviewDescription(event.target.value)}
                      placeholder="مثلاً رسید بررسی شد و پرداخت تایید گردید."
                    />
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          ) : null}
        </DialogContent>
        <ReviewPaymentDialogActions
          onCancel={closeReviewDialog}
          onSubmit={handleSubmitReview}
          cancelDisabled={updatePaymentStatusResult.loading}
          submitDisabled={!reviewTarget || updatePaymentStatusResult.loading}
          cancelLabel="بستن"
        />
      </Dialog>
    </>
  );
};

export default PaymentsList;
