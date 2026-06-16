import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react";
import { Navigate } from "react-router-dom";
import { AddRounded as AddRoundedIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme, type Theme } from "@mui/material/styles";
import {
  getCoreRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import { PAYMENT_COUPON_CREATE_MUTATION } from "../../graphql/mutations/paymentCouponCreate.mutation";
import { PAYMENT_COUPON_DELETE_MUTATION } from "../../graphql/mutations/paymentCouponDelete.mutation";
import { PAYMENT_COUPON_UPDATE_MUTATION } from "../../graphql/mutations/paymentCouponUpdate.mutation";
import { PAYMENT_COUPON_LIST_QUERY } from "../../graphql/queries/paymentCouponList.query";
import { useAuth } from "../../contexts/AuthContext";
import { useDebounce } from "../../hooks/useDebounce";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import {
  useServerPaginatedQuery,
  type ServerPageResult,
} from "../../hooks/useServerPaginatedQuery";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import CrudRowActions from "../../shared/crud/CrudRowActions";
import EntityDeleteDialog from "../../shared/crud/EntityDeleteDialog";
import EntityTableShell from "../../shared/crud/EntityTableShell";
import { crudModalFooterSx } from "../../shared/crud/modalThemeSx";
import crudPrimitives from "../../shared/crud/styles/crudPrimitives.module.scss";
import JalaliDateFilterField from "../../shared/table/JalaliDateFilterField";
import JalaliDateTimeField from "../../shared/table/JalaliDateTimeField";
import DashboardMenuHeader from "../../shared/DashboardMenuHeader";
import {
  EMPTY_PAYMENT_COUPON_LIST_FILTERS,
  buildInitialPaymentCouponForm,
  buildPaymentCouponCreateVariables,
  buildPaymentCouponListQueryVariables,
  buildPaymentCouponUpdateVariables,
  hasPaymentCouponFiltersApplied,
  mapPaymentCouponListRowToRecord,
  type PaymentCouponCreateMutation,
  type PaymentCouponCreateMutationVariables,
  type PaymentCouponDeleteMutation,
  type PaymentCouponDeleteMutationVariables,
  type PaymentCouponDiscountType,
  type PaymentCouponFormState,
  type PaymentCouponListFilters,
  type PaymentCouponListQuery,
  type PaymentCouponListQueryVariables,
  type PaymentCouponListRow,
  type PaymentCouponListSortField,
  type PaymentCouponRecord,
  type PaymentCouponUpdateMutation,
  type PaymentCouponUpdateMutationVariables,
  type SortingOrder,
} from "./payment-coupons-list.api";

const EMPTY_DISPLAY = "—";

const TABLE_TOOLBAR_OPTIONS = {
  showSearch: true,
  showColumnVisibility: true,
  showRefresh: true,
  showFilterButton: true,
} as const;

const COLUMN_WIDTH_BY_ID: Record<string, string> = {
  id: "14rem",
  code: "11rem",
  title: "16rem",
  description: "22rem",
  discountType: "10rem",
  discountValue: "9rem",
  startsAt: "11rem",
  expiresAt: "11rem",
  totalUsageLimit: "9rem",
  perUserUsageLimit: "9rem",
  applicableCourseIdsText: "20rem",
  isFirstPurchaseOnly: "9rem",
  isActive: "8rem",
  totalUsageCount: "8rem",
  remainingTotalUsageCount: "8rem",
  createdBy: "14rem",
  updatedBy: "14rem",
  createdAt: "10rem",
  updatedAt: "10rem",
  actions: "7rem",
};

const MOBILE_COLUMN_WIDTH_BY_ID: Record<string, string> = {
  ...COLUMN_WIDTH_BY_ID,
  code: "18rem",
  title: "24rem",
  description: "30rem",
  applicableCourseIdsText: "34rem",
  actions: "12rem",
};

const DISCOUNT_TYPE_OPTIONS: readonly PaymentCouponDiscountType[] = ["PERCENTAGE", "FIXED_AMOUNT"];

const DISCOUNT_TYPE_LABEL: Record<PaymentCouponDiscountType, string> = {
  PERCENTAGE: "درصدی",
  FIXED_AMOUNT: "مبلغ ثابت",
};

const BOOLEAN_FILTER_OPTIONS = [
  { value: "ALL", label: "همه" },
  { value: "true", label: "بله" },
  { value: "false", label: "خیر" },
] as const;

const SORTABLE_FIELDS = new Set<PaymentCouponListSortField>([
  "createdAt",
  "updatedAt",
  "code",
  "title",
  "discountType",
  "discountValue",
  "startsAt",
  "expiresAt",
  "totalUsageLimit",
  "perUserUsageLimit",
  "isFirstPurchaseOnly",
  "isActive",
]);

function formatDate(value: string): string {
  if (!value.trim()) {
    return EMPTY_DISPLAY;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_DISPLAY;
  }
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return EMPTY_DISPLAY;
  }
  return new Intl.NumberFormat("fa-IR").format(value);
}

function textCell(value: unknown, monospace = false): ReactElement {
  return (
    <Typography
      variant="body2"
      className={monospace ? crudPrimitives.tabularNums : undefined}
      sx={{ overflowWrap: "anywhere" }}
    >
      {String(value || EMPTY_DISPLAY)}
    </Typography>
  );
}

function selectPaymentCouponListPage(
  data: PaymentCouponListQuery | undefined
): ServerPageResult<PaymentCouponListRow> | null {
  const page = data?.paymentCouponList;
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

function sortingToServerSort(
  sorting: SortingState
): Partial<Record<PaymentCouponListSortField, SortingOrder>> {
  const sort = sorting.find((item) => SORTABLE_FIELDS.has(item.id as PaymentCouponListSortField));

  if (!sort) {
    return { createdAt: "DESC" };
  }

  return {
    [sort.id as PaymentCouponListSortField]: sort.desc ? "DESC" : "ASC",
  };
}

const PaymentCouponsIndex = (): ReactElement => {
  const theme = useTheme();
  const isMobile = useMediaQuery((muiTheme: Theme) => muiTheme.breakpoints.down("md"));
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN") === true;
  const hasShownLoadErrorRef = useRef(false);

  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    code: true,
    title: true,
    description: false,
    discountType: true,
    discountValue: true,
    startsAt: true,
    expiresAt: true,
    totalUsageLimit: false,
    perUserUsageLimit: false,
    applicableCourseIdsText: false,
    isFirstPurchaseOnly: true,
    isActive: true,
    totalUsageCount: true,
    remainingTotalUsageCount: true,
    createdBy: false,
    updatedBy: false,
    createdAt: true,
    updatedAt: false,
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [appliedFilters, setAppliedFilters] = useState<PaymentCouponListFilters>(
    EMPTY_PAYMENT_COUPON_LIST_FILTERS
  );
  const [pendingFilters, setPendingFilters] = useState<PaymentCouponListFilters>(
    EMPTY_PAYMENT_COUPON_LIST_FILTERS
  );
  const debouncedPendingFilters = useDebounce(pendingFilters, 500);
  const applyFiltersRef = useRef<(() => void) | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<PaymentCouponFormState | null>(null);
  const [editTarget, setEditTarget] = useState<PaymentCouponRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentCouponRecord | null>(null);
  const serverSort = useMemo(() => sortingToServerSort(sorting), [sorting]);

  const hasAppliedFilters = useMemo(
    () => debouncedSearchQuery.trim() !== "" || hasPaymentCouponFiltersApplied(appliedFilters),
    [appliedFilters, debouncedSearchQuery]
  );

  const buildVariables = useCallback(
    ({ page, pageSize }: { page: number; pageSize: number }) =>
      buildPaymentCouponListQueryVariables(
        debouncedSearchQuery,
        appliedFilters,
        serverSort,
        page,
        pageSize
      ),
    [appliedFilters, debouncedSearchQuery, serverSort]
  );

  const {
    items: rows,
    loading,
    error,
    onRefresh,
    pagination,
  } = useServerPaginatedQuery<
    PaymentCouponListQuery,
    PaymentCouponListQueryVariables,
    PaymentCouponListRow,
    PaymentCouponRecord
  >({
    query: PAYMENT_COUPON_LIST_QUERY,
    variables: buildVariables,
    selectPage: selectPaymentCouponListPage,
    mapItem: mapPaymentCouponListRowToRecord,
    resetPageDeps: [debouncedSearchQuery, appliedFilters, serverSort],
    skip: !isSuperAdmin,
  });

  const closeDialog = (): void => {
    setForm(null);
    setEditTarget(null);
    setDialogMode("create");
  };

  const [createCoupon, createCouponResult] = useMutationWithSnackbar<
    PaymentCouponCreateMutation,
    PaymentCouponCreateMutationVariables
  >(PAYMENT_COUPON_CREATE_MUTATION, {
    successMessage: t("pages.paymentCoupons.create.success"),
    onSuccess: () => {
      closeDialog();
      onRefresh();
    },
  });

  const [updateCoupon, updateCouponResult] = useMutationWithSnackbar<
    PaymentCouponUpdateMutation,
    PaymentCouponUpdateMutationVariables
  >(PAYMENT_COUPON_UPDATE_MUTATION, {
    successMessage: t("pages.paymentCoupons.edit.success"),
    onSuccess: () => {
      closeDialog();
      onRefresh();
    },
  });

  const [deleteCoupon, deleteCouponResult] = useMutationWithSnackbar<
    PaymentCouponDeleteMutation,
    PaymentCouponDeleteMutationVariables
  >(PAYMENT_COUPON_DELETE_MUTATION, {
    successMessage: t("pages.paymentCoupons.delete.success"),
    errorMessage: t("pages.paymentCoupons.delete.error"),
    onSuccess: () => {
      setDeleteTarget(null);
      onRefresh();
    },
  });

  const isSaving = createCouponResult.loading || updateCouponResult.loading;

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
    applyFiltersRef.current = () => setAppliedFilters({ ...pendingFilters });
  });

  useEffect(() => {
    if (!showColumnFilters) {
      return;
    }
    applyFiltersRef.current?.();
  }, [debouncedPendingFilters, showColumnFilters]);

  const openCreateDialog = (): void => {
    setDialogMode("create");
    setEditTarget(null);
    setForm(buildInitialPaymentCouponForm());
  };

  const openEditDialog = (record: PaymentCouponRecord): void => {
    setDialogMode("edit");
    setEditTarget(record);
    setForm(buildInitialPaymentCouponForm(record));
  };

  const setFormField = <TKey extends keyof PaymentCouponFormState>(
    key: TKey,
    value: PaymentCouponFormState[TKey]
  ): void => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const setFilterValue = <TKey extends keyof PaymentCouponListFilters>(
    key: TKey,
    value: PaymentCouponListFilters[TKey]
  ): void => {
    setPendingFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = (): void => {
    setSearchQuery("");
  };

  const handleApplyFilters = (): void => {
    setAppliedFilters({ ...pendingFilters });
  };

  const handleClearFilters = (): void => {
    setSearchQuery("");
    setPendingFilters(EMPTY_PAYMENT_COUPON_LIST_FILTERS);
    setAppliedFilters(EMPTY_PAYMENT_COUPON_LIST_FILTERS);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!form) {
      return;
    }

    if (!form.code.trim() || !form.title.trim() || !form.discountValue.trim()) {
      showError(t("pages.paymentCoupons.form.requiredError"));
      return;
    }

    if (dialogMode === "create") {
      void createCoupon({
        variables: buildPaymentCouponCreateVariables(form),
      });
      return;
    }

    if (!editTarget) {
      return;
    }

    void updateCoupon({
      variables: buildPaymentCouponUpdateVariables(editTarget, form),
    });
  };

  const handleConfirmDelete = (): void => {
    if (!deleteTarget) {
      return;
    }

    void deleteCoupon({
      variables: {
        input: {
          id: deleteTarget.id,
        },
      },
    });
  };

  const renderTextFilter = (
    key: keyof Pick<
      PaymentCouponListFilters,
      "id" | "code" | "title" | "applicableCourseId" | "createdBy" | "updatedBy"
    >,
    label: string
  ): ReactElement => {
    const filterValue = pendingFilters[key];
    return (
      <TextField
        size="small"
        fullWidth
        aria-label={label}
        value={filterValue}
        onChange={(event) => setFilterValue(key, event.target.value)}
        InputProps={{
          endAdornment:
            filterValue.trim() !== "" ? (
              <InputAdornment position="end">
                <Typography variant="caption" color="text.secondary">
                  Enter
                </Typography>
              </InputAdornment>
            ) : undefined,
        }}
      />
    );
  };

  const renderNumberFilter = (
    key: keyof Pick<
      PaymentCouponListFilters,
      | "discountValueMin"
      | "discountValueMax"
      | "totalUsageLimitMin"
      | "totalUsageLimitMax"
      | "perUserUsageLimitMin"
      | "perUserUsageLimitMax"
    >,
    label: string
  ): ReactElement => (
    <TextField
      size="small"
      fullWidth
      type="number"
      aria-label={label}
      value={pendingFilters[key]}
      onChange={(event) => setFilterValue(key, event.target.value)}
    />
  );

  const renderDateFilter = (
    fromKey: keyof PaymentCouponListFilters,
    toKey: keyof PaymentCouponListFilters,
    fromLabel: string,
    toLabel: string
  ): ReactElement => (
    <Stack spacing={0.5}>
      <JalaliDateFilterField
        label={fromLabel}
        ariaLabel={fromLabel}
        value={String(pendingFilters[fromKey] || "")}
        onChange={(value) =>
          setFilterValue(fromKey, value as PaymentCouponListFilters[typeof fromKey])
        }
      />
      <JalaliDateFilterField
        label={toLabel}
        ariaLabel={toLabel}
        value={String(pendingFilters[toKey] || "")}
        onChange={(value) => setFilterValue(toKey, value as PaymentCouponListFilters[typeof toKey])}
      />
    </Stack>
  );

  const renderBooleanFilter = (
    key: keyof Pick<PaymentCouponListFilters, "isFirstPurchaseOnly" | "isActive">,
    label: string
  ): ReactElement => (
    <TextField
      select
      size="small"
      fullWidth
      aria-label={label}
      value={pendingFilters[key]}
      onChange={(event) =>
        setFilterValue(key, event.target.value as PaymentCouponListFilters[typeof key])
      }
    >
      {BOOLEAN_FILTER_OPTIONS.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );

  const renderFilterCell = (column: Column<PaymentCouponRecord, unknown>): ReactElement | null => {
    const label = String(column.columnDef.header ?? column.id);

    switch (column.id) {
      case "id":
      case "code":
      case "title":
      case "createdBy":
      case "updatedBy":
        return renderTextFilter(column.id, label);
      case "applicableCourseIdsText":
        return renderTextFilter("applicableCourseId", label);
      case "discountType":
        return (
          <TextField
            select
            size="small"
            fullWidth
            aria-label={label}
            value={pendingFilters.discountType}
            onChange={(event) =>
              setFilterValue(
                "discountType",
                event.target.value as PaymentCouponListFilters["discountType"]
              )
            }
          >
            <MenuItem value="ALL">{t("table.filters.all")}</MenuItem>
            {DISCOUNT_TYPE_OPTIONS.map((discountType) => (
              <MenuItem key={discountType} value={discountType}>
                {DISCOUNT_TYPE_LABEL[discountType]}
              </MenuItem>
            ))}
          </TextField>
        );
      case "discountValue":
        return (
          <Stack spacing={0.5}>
            {renderNumberFilter("discountValueMin", t("pages.paymentCoupons.filters.min"))}
            {renderNumberFilter("discountValueMax", t("pages.paymentCoupons.filters.max"))}
          </Stack>
        );
      case "startsAt":
        return renderDateFilter(
          "startsAtFrom",
          "startsAtTo",
          t("table.pages.paymentCoupons.filters.startsAtFrom"),
          t("table.pages.paymentCoupons.filters.startsAtTo")
        );
      case "expiresAt":
        return renderDateFilter(
          "expiresAtFrom",
          "expiresAtTo",
          t("table.pages.paymentCoupons.filters.expiresAtFrom"),
          t("table.pages.paymentCoupons.filters.expiresAtTo")
        );
      case "totalUsageLimit":
        return (
          <Stack spacing={0.5}>
            {renderNumberFilter("totalUsageLimitMin", t("pages.paymentCoupons.filters.min"))}
            {renderNumberFilter("totalUsageLimitMax", t("pages.paymentCoupons.filters.max"))}
          </Stack>
        );
      case "perUserUsageLimit":
        return (
          <Stack spacing={0.5}>
            {renderNumberFilter("perUserUsageLimitMin", t("pages.paymentCoupons.filters.min"))}
            {renderNumberFilter("perUserUsageLimitMax", t("pages.paymentCoupons.filters.max"))}
          </Stack>
        );
      case "isFirstPurchaseOnly":
      case "isActive":
        return renderBooleanFilter(column.id, label);
      case "createdAt":
        return renderDateFilter(
          "createdAtFrom",
          "createdAtTo",
          t("table.pages.paymentCoupons.filters.createdAtFrom"),
          t("table.pages.paymentCoupons.filters.createdAtTo")
        );
      case "updatedAt":
        return renderDateFilter(
          "updatedAtFrom",
          "updatedAtTo",
          t("table.pages.paymentCoupons.filters.updatedAtFrom"),
          t("table.pages.paymentCoupons.filters.updatedAtTo")
        );
      default:
        return null;
    }
  };

  const columns = useMemo<ColumnDef<PaymentCouponRecord>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("table.pages.paymentCoupons.columns.id"),
        cell: (info) => textCell(info.getValue(), true),
      },
      {
        accessorKey: "code",
        header: t("table.pages.paymentCoupons.columns.code"),
        cell: (info) => (
          <Typography variant="body2" fontWeight={800} className={crudPrimitives.tabularNums}>
            {String(info.getValue() || EMPTY_DISPLAY)}
          </Typography>
        ),
      },
      {
        accessorKey: "title",
        header: t("table.pages.paymentCoupons.columns.title"),
        cell: (info) => textCell(info.getValue()),
      },
      {
        accessorKey: "description",
        header: t("table.pages.paymentCoupons.columns.description"),
        cell: (info) => textCell(info.getValue()),
      },
      {
        accessorKey: "discountType",
        header: t("table.pages.paymentCoupons.columns.discountType"),
        cell: (info) => {
          const discountType = info.getValue() as PaymentCouponDiscountType;
          return (
            <Chip
              size="small"
              variant="outlined"
              color={discountType === "PERCENTAGE" ? "primary" : "info"}
              label={DISCOUNT_TYPE_LABEL[discountType] ?? discountType}
            />
          );
        },
      },
      {
        accessorKey: "discountValue",
        header: t("table.pages.paymentCoupons.columns.discountValue"),
        cell: ({ row }) => {
          const suffix = row.original.discountType === "PERCENTAGE" ? "٪" : " تومان";
          return textCell(`${formatNumber(row.original.discountValue)}${suffix}`, true);
        },
      },
      {
        accessorKey: "startsAt",
        header: t("table.pages.paymentCoupons.columns.startsAt"),
        cell: (info) => textCell(formatDate(info.getValue() as string), true),
      },
      {
        accessorKey: "expiresAt",
        header: t("table.pages.paymentCoupons.columns.expiresAt"),
        cell: (info) => textCell(formatDate(info.getValue() as string), true),
      },
      {
        accessorKey: "totalUsageLimit",
        header: t("table.pages.paymentCoupons.columns.totalUsageLimit"),
        cell: (info) => textCell(formatNumber(info.getValue() as number | null), true),
      },
      {
        accessorKey: "perUserUsageLimit",
        header: t("table.pages.paymentCoupons.columns.perUserUsageLimit"),
        cell: (info) => textCell(formatNumber(info.getValue() as number | null), true),
      },
      {
        accessorKey: "applicableCourseIdsText",
        header: t("table.pages.paymentCoupons.columns.applicableCourseIds"),
        cell: (info) => textCell(info.getValue(), true),
      },
      {
        accessorKey: "isFirstPurchaseOnly",
        header: t("table.pages.paymentCoupons.columns.isFirstPurchaseOnly"),
        cell: (info) => (
          <Chip
            size="small"
            variant="outlined"
            color={Boolean(info.getValue()) ? "warning" : "default"}
            label={Boolean(info.getValue()) ? "بله" : "خیر"}
          />
        ),
      },
      {
        accessorKey: "isActive",
        header: t("table.pages.paymentCoupons.columns.isActive"),
        cell: (info) => (
          <Chip
            size="small"
            variant="outlined"
            color={Boolean(info.getValue()) ? "success" : "default"}
            label={
              Boolean(info.getValue())
                ? t("pages.paymentCoupons.status.active")
                : t("pages.paymentCoupons.status.inactive")
            }
          />
        ),
      },
      {
        accessorKey: "totalUsageCount",
        header: t("table.pages.paymentCoupons.columns.totalUsageCount"),
        cell: (info) => textCell(formatNumber(info.getValue() as number), true),
      },
      {
        accessorKey: "remainingTotalUsageCount",
        header: t("table.pages.paymentCoupons.columns.remainingTotalUsageCount"),
        cell: (info) => textCell(formatNumber(info.getValue() as number | null), true),
        enableSorting: false,
      },
      {
        accessorKey: "createdBy",
        header: t("table.pages.paymentCoupons.columns.createdBy"),
        cell: (info) => textCell(info.getValue(), true),
        enableSorting: false,
      },
      {
        accessorKey: "updatedBy",
        header: t("table.pages.paymentCoupons.columns.updatedBy"),
        cell: (info) => textCell(info.getValue(), true),
        enableSorting: false,
      },
      {
        accessorKey: "createdAt",
        header: t("table.pages.paymentCoupons.columns.createdAt"),
        cell: (info) => textCell(formatDate(info.getValue() as string), true),
      },
      {
        accessorKey: "updatedAt",
        header: t("table.pages.paymentCoupons.columns.updatedAt"),
        cell: (info) => textCell(formatDate(info.getValue() as string), true),
      },
      {
        id: "actions",
        header: t("table.columns.actions"),
        cell: ({ row }) => (
          <CrudRowActions
            onEdit={() => openEditDialog(row.original)}
            onDelete={() => setDeleteTarget(row.original)}
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
    manualPagination: true,
    manualSorting: true,
    pageCount: pagination.totalPages,
  });

  if (!isSuperAdmin) {
    return <Navigate to={APP_SHELL_ROUTES.more} replace />;
  }

  return (
    <>
      <DashboardMenuHeader
        title={t("pages.paymentCoupons.title")}
        description={t("pages.paymentCoupons.subtitle")}
        backTo={APP_SHELL_ROUTES.more}
        backLabel={t("pages.paymentCoupons.backToMore")}
      />
      <EntityTableShell<PaymentCouponRecord>
        table={table}
        pagedRows={table.getRowModel().rows}
        isMobile={isMobile}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        onRefresh={onRefresh}
        loading={loading}
        showNewButton
        newButtonText={t("table.entity.createButton", {
          title: t("pages.paymentCoupons.createEntityTitle"),
        })}
        onNewClick={openCreateDialog}
        toolbarOptions={TABLE_TOOLBAR_OPTIONS}
        showColumnFilters={showColumnFilters}
        onShowColumnFiltersChange={setShowColumnFilters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        renderFilterCell={renderFilterCell}
        columnWidthById={isMobile ? MOBILE_COLUMN_WIDTH_BY_ID : COLUMN_WIDTH_BY_ID}
        noDataLabel={error ? t("errors.general.loadData") : undefined}
        hasActiveFilters={hasAppliedFilters}
        pagination={pagination}
      />

      <Dialog
        open={form != null}
        onClose={isSaving ? undefined : closeDialog}
        fullWidth
        maxWidth="lg"
        fullScreen={isMobile}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: isMobile ? "100%" : undefined,
          }}
        >
          <DialogTitle>
            {dialogMode === "create"
              ? t("pages.paymentCoupons.create.title")
              : t("pages.paymentCoupons.edit.title")}
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: "background.default" }}>
            {form ? (
              <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label={t("table.pages.paymentCoupons.columns.code")}
                    value={form.code}
                    onChange={(event) => setFormField("code", event.target.value)}
                    required
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t("table.pages.paymentCoupons.columns.title")}
                    value={form.title}
                    onChange={(event) => setFormField("title", event.target.value)}
                    required
                    fullWidth
                    size="small"
                  />
                </Stack>

                <TextField
                  label={t("table.pages.paymentCoupons.columns.description")}
                  value={form.description}
                  onChange={(event) => setFormField("description", event.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                />

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    select
                    label={t("table.pages.paymentCoupons.columns.discountType")}
                    value={form.discountType}
                    onChange={(event) =>
                      setFormField("discountType", event.target.value as PaymentCouponDiscountType)
                    }
                    fullWidth
                    size="small"
                    required
                  >
                    {DISCOUNT_TYPE_OPTIONS.map((discountType) => (
                      <MenuItem key={discountType} value={discountType}>
                        {DISCOUNT_TYPE_LABEL[discountType]}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label={t("table.pages.paymentCoupons.columns.discountValue")}
                    value={form.discountValue}
                    onChange={(event) => setFormField("discountValue", event.target.value)}
                    fullWidth
                    size="small"
                    type="number"
                    required
                    inputProps={{ min: 0, step: form.discountType === "PERCENTAGE" ? 1 : 1000 }}
                  />
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <JalaliDateTimeField
                    label={t("table.pages.paymentCoupons.columns.startsAt")}
                    value={form.startsAt}
                    onChange={(value) => setFormField("startsAt", value)}
                    ariaLabel={t("table.pages.paymentCoupons.columns.startsAt")}
                    size="small"
                  />
                  <JalaliDateTimeField
                    label={t("table.pages.paymentCoupons.columns.expiresAt")}
                    value={form.expiresAt}
                    onChange={(value) => setFormField("expiresAt", value)}
                    ariaLabel={t("table.pages.paymentCoupons.columns.expiresAt")}
                    size="small"
                  />
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label={t("table.pages.paymentCoupons.columns.totalUsageLimit")}
                    value={form.totalUsageLimit}
                    onChange={(event) => setFormField("totalUsageLimit", event.target.value)}
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                  />
                  <TextField
                    label={t("table.pages.paymentCoupons.columns.perUserUsageLimit")}
                    value={form.perUserUsageLimit}
                    onChange={(event) => setFormField("perUserUsageLimit", event.target.value)}
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                  />
                </Stack>

                <TextField
                  label={t("table.pages.paymentCoupons.columns.applicableCourseIds")}
                  value={form.applicableCourseIds}
                  onChange={(event) => setFormField("applicableCourseIds", event.target.value)}
                  helperText={t("pages.paymentCoupons.form.applicableCourseIdsHelp")}
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.isFirstPurchaseOnly}
                        onChange={(event) =>
                          setFormField("isFirstPurchaseOnly", event.target.checked)
                        }
                      />
                    }
                    label={t("table.pages.paymentCoupons.columns.isFirstPurchaseOnly")}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.isActive}
                        onChange={(event) => setFormField("isActive", event.target.checked)}
                      />
                    }
                    label={t("table.pages.paymentCoupons.columns.isActive")}
                  />
                </Stack>
              </Stack>
            ) : null}
          </DialogContent>
          <DialogActions
            sx={crudModalFooterSx(theme, {
              pinFooterToBottomOnMobile: true,
            })}
          >
            <Stack
              direction={isMobile ? "column-reverse" : "row"}
              spacing={1.5}
              sx={{
                width: "100%",
                justifyContent: isMobile ? "stretch" : "flex-end",
                "& .MuiButton-root": {
                  width: isMobile ? "100%" : "auto",
                  minWidth: isMobile ? undefined : "8rem",
                },
              }}
            >
              <Button variant="outlined" color="inherit" onClick={closeDialog} disabled={isSaving}>
                {t("pages.paymentCoupons.edit.cancel")}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSaving}
                startIcon={dialogMode === "create" ? <AddRoundedIcon /> : undefined}
              >
                {isSaving
                  ? t("pages.paymentCoupons.edit.saving")
                  : dialogMode === "create"
                    ? t("pages.paymentCoupons.create.save")
                    : t("pages.paymentCoupons.edit.save")}
              </Button>
            </Stack>
          </DialogActions>
        </Box>
      </Dialog>

      <EntityDeleteDialog
        open={deleteTarget != null}
        entityTitle={deleteTarget?.title ?? t("pages.paymentCoupons.createEntityTitle")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteCouponResult.loading}
        fullScreen={isMobile}
      />
    </>
  );
};

export default PaymentCouponsIndex;
