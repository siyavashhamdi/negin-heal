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
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AddRounded as AddRoundedIcon,
  DeleteRounded as DeleteRoundedIcon,
} from "@mui/icons-material";
import {
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { type Theme } from "@mui/material/styles";
import {
  getCoreRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import { COUPON_CREATE_MUTATION } from "../../graphql/mutations/couponCreate.mutation";
import { COUPON_DELETE_MUTATION } from "../../graphql/mutations/couponDelete.mutation";
import { COUPON_UPDATE_MUTATION } from "../../graphql/mutations/couponUpdate.mutation";
import { COUPON_LIST_QUERY } from "../../graphql/queries/couponList.query";
import { COUPON_DETAIL_QUERY } from "../../graphql/queries/couponDetail.query";
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
import { hasFormChanges } from "../../utils/formChange.util";
import {
  MULTILINE_TEXTAREA_MIN_ROWS,
  MULTILINE_TEXTAREA_MAX_ROWS,
} from "../../constants/multilineTextarea.constants";
import CrudRowActions from "../../shared/crud/CrudRowActions";
import EntityDeleteDialog from "../../shared/crud/EntityDeleteDialog";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import ModalFooterActions from "../../shared/crud/ModalFooterActions";
import EntityTableShell from "../../shared/crud/EntityTableShell";
import crudPrimitives from "../../shared/crud/styles/crudPrimitives.module.scss";
import DateTimeValue from "../../shared/display/DateTimeValue";
import JalaliDateFilterField from "../../shared/table/JalaliDateFilterField";
import JalaliDateTimeField from "../../shared/table/JalaliDateTimeField";
import DashboardMenuHeader from "../../shared/DashboardMenuHeader";
import ProductPickerField from "../../shared/forms/ProductPickerField";
import {
  EMPTY_COUPON_LIST_FILTERS,
  buildInitialCouponForm,
  buildCouponCreateVariables,
  buildCouponListQueryVariables,
  buildCouponUpdateVariables,
  hasCouponFiltersApplied,
  mapCouponListRowToRecord,
  type CouponCreateMutation,
  type CouponCreateMutationVariables,
  type CouponDeleteMutation,
  type CouponDeleteMutationVariables,
  type CouponDiscountType,
  type CouponFormState,
  type CouponListFilters,
  type CouponListItemRow,
  type CouponListQuery,
  type CouponListQueryVariables,
  type CouponListRecord,
  type CouponListSortField,
  type CouponRecord,
  type CouponUpdateMutation,
  type CouponUpdateMutationVariables,
  type SortingOrder,
} from "./coupons-list.api";
import { useCouponEditRecord } from "./useCouponEditRecord";

const EMPTY_DISPLAY = "—";

const COUPON_CODE_INPUT_PROPS = {
  dir: "ltr",
  lang: "en",
  spellCheck: "false",
  autoCapitalize: "off",
  autoCorrect: "off",
} as const;

const COUPON_CODE_INPUT_SX = {
  "& .MuiInputBase-input": {
    direction: "ltr",
    textAlign: "left",
    fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
} as const;

const TABLE_TOOLBAR_OPTIONS = {
  showSearch: true,
  showColumnVisibility: true,
  showRefresh: true,
  showFilterButton: true,
} as const;

const COLUMN_WIDTH_BY_ID: Record<string, string> = {
  code: "11rem",
  title: "16rem",
  discountType: "10rem",
  discountValue: "9rem",
  startsAt: "11rem",
  expiresAt: "11rem",
  isFirstPurchaseOnly: "9rem",
  isActive: "8rem",
  totalUsageCount: "8rem",
  remainingTotalUsageCount: "8rem",
  createdAt: "10rem",
  updatedAt: "10rem",
  actions: "7rem",
};

const MOBILE_COLUMN_WIDTH_BY_ID: Record<string, string> = {
  ...COLUMN_WIDTH_BY_ID,
  code: "18rem",
  title: "24rem",
  actions: "12rem",
};

const DISCOUNT_TYPE_OPTIONS: readonly CouponDiscountType[] = ["PERCENTAGE", "FIXED_AMOUNT"];

const DISCOUNT_TYPE_LABEL: Record<CouponDiscountType, string> = {
  PERCENTAGE: "درصدی",
  FIXED_AMOUNT: "مبلغ ثابت",
};

const BOOLEAN_FILTER_OPTIONS = [
  { value: "ALL", label: "همه" },
  { value: "true", label: "بله" },
  { value: "false", label: "خیر" },
] as const;

const SORTABLE_FIELDS = new Set<CouponListSortField>([
  "createdAt",
  "updatedAt",
  "code",
  "title",
  "discountType",
  "discountValue",
  "startsAt",
  "expiresAt",
  "isFirstPurchaseOnly",
  "isActive",
]);

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

function selectCouponListPage(
  data: CouponListQuery | undefined
): ServerPageResult<CouponListItemRow> | null {
  const page = data?.couponList;
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
): Partial<Record<CouponListSortField, SortingOrder>> {
  const sort = sorting.find((item) => SORTABLE_FIELDS.has(item.id as CouponListSortField));

  if (!sort) {
    return { createdAt: "DESC" };
  }

  return {
    [sort.id as CouponListSortField]: sort.desc ? "DESC" : "ASC",
  };
}

const CouponsIndex = (): ReactElement => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery((muiTheme: Theme) => muiTheme.breakpoints.down("md"));
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN") === true;
  const hasShownLoadErrorRef = useRef(false);
  const isCreateRoute = location.pathname === `${APP_SHELL_ROUTES.moreCoupons}/new`;
  const editCouponId = useMemo(() => {
    const editRoutePrefix = `${APP_SHELL_ROUTES.moreCoupons}/edit/`;
    if (!location.pathname.startsWith(editRoutePrefix)) {
      return null;
    }

    const routeId = location.pathname.slice(editRoutePrefix.length);
    return routeId || null;
  }, [location.pathname]);
  const couponDialogOpen = isCreateRoute || editCouponId != null;

  const { record: editCouponRecord, isInitialLoading: couponDetailLoading } =
    useCouponEditRecord(editCouponId);

  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    code: true,
    title: true,
    discountType: false,
    discountValue: true,
    startsAt: false,
    expiresAt: false,
    isFirstPurchaseOnly: false,
    isActive: true,
    totalUsageCount: true,
    remainingTotalUsageCount: true,
    createdAt: true,
    updatedAt: false,
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [appliedFilters, setAppliedFilters] =
    useState<CouponListFilters>(EMPTY_COUPON_LIST_FILTERS);
  const [pendingFilters, setPendingFilters] =
    useState<CouponListFilters>(EMPTY_COUPON_LIST_FILTERS);
  const debouncedPendingFilters = useDebounce(pendingFilters, 500);
  const applyFiltersRef = useRef<(() => void) | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<CouponFormState | null>(null);
  const [initialForm, setInitialForm] = useState<CouponFormState | null>(null);
  const [editTarget, setEditTarget] = useState<CouponRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CouponListRecord | null>(null);
  const hydratedEditCouponIdRef = useRef<string | null>(null);
  const serverSort = useMemo(() => sortingToServerSort(sorting), [sorting]);

  const hasAppliedFilters = useMemo(
    () => debouncedSearchQuery.trim() !== "" || hasCouponFiltersApplied(appliedFilters),
    [appliedFilters, debouncedSearchQuery]
  );

  const buildVariables = useCallback(
    ({ page, pageSize }: { page: number; pageSize: number }) =>
      buildCouponListQueryVariables(
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
    CouponListQuery,
    CouponListQueryVariables,
    CouponListItemRow,
    CouponListRecord
  >({
    query: COUPON_LIST_QUERY,
    variables: buildVariables,
    selectPage: selectCouponListPage,
    mapItem: mapCouponListRowToRecord,
    resetPageDeps: [debouncedSearchQuery, appliedFilters, serverSort],
    skip: !isSuperAdmin,
  });
  const closeDialog = (): void => {
    hydratedEditCouponIdRef.current = null;
    setForm(null);
    setInitialForm(null);
    setEditTarget(null);
    setDialogMode("create");
    navigate(APP_SHELL_ROUTES.moreCoupons);
  };

  const [createCoupon, createCouponResult] = useMutationWithSnackbar<
    CouponCreateMutation,
    CouponCreateMutationVariables
  >(COUPON_CREATE_MUTATION, {
    successMessage: t("pages.coupons.create.success"),
    onSuccess: () => {
      closeDialog();
      onRefresh();
    },
  });

  const [updateCoupon, updateCouponResult] = useMutationWithSnackbar<
    CouponUpdateMutation,
    CouponUpdateMutationVariables
  >(COUPON_UPDATE_MUTATION, {
    successMessage: t("pages.coupons.edit.success"),
    refetchQueries: ({ data }) => {
      const couponId = data?.couponUpdate?.id;
      if (!couponId) {
        return [];
      }

      return [
        {
          query: COUPON_DETAIL_QUERY,
          variables: { input: { id: couponId } },
        },
      ];
    },
    onSuccess: () => {
      closeDialog();
      onRefresh();
    },
  });

  const [deleteCoupon, deleteCouponResult] = useMutationWithSnackbar<
    CouponDeleteMutation,
    CouponDeleteMutationVariables
  >(COUPON_DELETE_MUTATION, {
    successMessage: t("pages.coupons.delete.success"),
    errorMessage: t("pages.coupons.delete.error"),
    onSuccess: () => {
      setDeleteTarget(null);
      closeDialog();
      navigate(APP_SHELL_ROUTES.moreCoupons);
      onRefresh();
    },
  });

  const isSaving = createCouponResult.loading || updateCouponResult.loading;

  const isCreateFormReady =
    form != null &&
    form.code.trim().length > 0 &&
    form.title.trim().length > 0 &&
    form.discountValue.trim().length > 0;

  const hasEditFormChanges =
    initialForm != null && form != null && hasFormChanges(initialForm, form);

  const canSubmitCouponForm = dialogMode === "create" ? isCreateFormReady : hasEditFormChanges;

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
    const nextForm = buildInitialCouponForm();
    setDialogMode("create");
    setEditTarget(null);
    setInitialForm(nextForm);
    setForm(nextForm);
    navigate(`${APP_SHELL_ROUTES.moreCoupons}/new`);
  };

  const openEditDialog = (record: CouponListRecord): void => {
    navigate(`${APP_SHELL_ROUTES.moreCoupons}/edit/${record.id}`);
  };

  const openDeleteFromEditDialog = (): void => {
    if (editTarget) {
      setDeleteTarget(editTarget);
    }
  };

  const setFormField = <TKey extends keyof CouponFormState>(
    key: TKey,
    value: CouponFormState[TKey]
  ): void => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const setFilterValue = <TKey extends keyof CouponListFilters>(
    key: TKey,
    value: CouponListFilters[TKey]
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
    setPendingFilters(EMPTY_COUPON_LIST_FILTERS);
    setAppliedFilters(EMPTY_COUPON_LIST_FILTERS);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!form) {
      return;
    }

    if (!form.code.trim() || !form.title.trim() || !form.discountValue.trim()) {
      showError(t("pages.coupons.form.requiredError"));
      return;
    }

    if (dialogMode === "create") {
      void createCoupon({
        variables: buildCouponCreateVariables(form),
      });
      return;
    }

    if (!editTarget) {
      return;
    }

    void updateCoupon({
      variables: buildCouponUpdateVariables(editTarget, form),
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

  useEffect(() => {
    if (!editCouponId) {
      hydratedEditCouponIdRef.current = null;
    }
  }, [editCouponId]);

  useEffect(() => {
    if (isCreateRoute) {
      hydratedEditCouponIdRef.current = null;
      const nextForm = buildInitialCouponForm();
      setDialogMode("create");
      setEditTarget(null);
      setInitialForm(nextForm);
      setForm(nextForm);
      return;
    }

    if (!editCouponId || !editCouponRecord) {
      return;
    }

    if (hydratedEditCouponIdRef.current === editCouponId) {
      return;
    }

    hydratedEditCouponIdRef.current = editCouponId;
    const nextForm = buildInitialCouponForm(editCouponRecord);
    setDialogMode("edit");
    setEditTarget(editCouponRecord);
    setInitialForm(nextForm);
    setForm(nextForm);
  }, [editCouponId, editCouponRecord, isCreateRoute]);

  const renderTextFilter = (
    key: keyof Pick<
      CouponListFilters,
      "code" | "title" | "applicableProductId" | "createdBy" | "updatedBy"
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
      CouponListFilters,
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
    fromKey: keyof CouponListFilters,
    toKey: keyof CouponListFilters,
    fromLabel: string,
    toLabel: string
  ): ReactElement => (
    <Stack spacing={0.5}>
      <JalaliDateFilterField
        label={fromLabel}
        ariaLabel={fromLabel}
        value={String(pendingFilters[fromKey] || "")}
        onChange={(value) => setFilterValue(fromKey, value as CouponListFilters[typeof fromKey])}
      />
      <JalaliDateFilterField
        label={toLabel}
        ariaLabel={toLabel}
        value={String(pendingFilters[toKey] || "")}
        onChange={(value) => setFilterValue(toKey, value as CouponListFilters[typeof toKey])}
      />
    </Stack>
  );

  const renderBooleanFilter = (
    key: keyof Pick<CouponListFilters, "isFirstPurchaseOnly" | "isActive">,
    label: string
  ): ReactElement => (
    <TextField
      select
      size="small"
      fullWidth
      aria-label={label}
      value={pendingFilters[key]}
      onChange={(event) => setFilterValue(key, event.target.value as CouponListFilters[typeof key])}
    >
      {BOOLEAN_FILTER_OPTIONS.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );

  const renderFilterCell = (column: Column<CouponListRecord, unknown>): ReactElement | null => {
    const label = String(column.columnDef.header ?? column.id);

    switch (column.id) {
      case "code":
      case "title":
        return renderTextFilter(column.id, label);
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
                event.target.value as CouponListFilters["discountType"]
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
            {renderNumberFilter("discountValueMin", t("pages.coupons.filters.min"))}
            {renderNumberFilter("discountValueMax", t("pages.coupons.filters.max"))}
          </Stack>
        );
      case "startsAt":
        return renderDateFilter(
          "startsAtFrom",
          "startsAtTo",
          t("table.pages.coupons.filters.startsAtFrom"),
          t("table.pages.coupons.filters.startsAtTo")
        );
      case "expiresAt":
        return renderDateFilter(
          "expiresAtFrom",
          "expiresAtTo",
          t("table.pages.coupons.filters.expiresAtFrom"),
          t("table.pages.coupons.filters.expiresAtTo")
        );
      case "isFirstPurchaseOnly":
      case "isActive":
        return renderBooleanFilter(column.id, label);
      case "createdAt":
        return renderDateFilter(
          "createdAtFrom",
          "createdAtTo",
          t("table.pages.coupons.filters.createdAtFrom"),
          t("table.pages.coupons.filters.createdAtTo")
        );
      case "updatedAt":
        return renderDateFilter(
          "updatedAtFrom",
          "updatedAtTo",
          t("table.pages.coupons.filters.updatedAtFrom"),
          t("table.pages.coupons.filters.updatedAtTo")
        );
      default:
        return null;
    }
  };

  const columns = useMemo<ColumnDef<CouponListRecord>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("table.pages.coupons.columns.title"),
        cell: (info) => textCell(info.getValue()),
      },
      {
        accessorKey: "code",
        header: t("table.pages.coupons.columns.code"),
        cell: (info) => (
          <Typography variant="body2" fontWeight={800} className={crudPrimitives.latinText}>
            {String(info.getValue() || EMPTY_DISPLAY)}
          </Typography>
        ),
      },
      {
        accessorKey: "discountType",
        header: t("table.pages.coupons.columns.discountType"),
        cell: (info) => {
          const discountType = info.getValue() as CouponDiscountType;
          return (
            <Chip
              size="small"
              variant="outlined"
              color={discountType === "PERCENTAGE" ? "success" : "secondary"}
              label={DISCOUNT_TYPE_LABEL[discountType] ?? discountType}
            />
          );
        },
      },
      {
        accessorKey: "discountValue",
        header: t("table.pages.coupons.columns.discountValue"),
        cell: ({ row }) => {
          const suffix = row.original.discountType === "PERCENTAGE" ? "٪" : " تومان";
          return textCell(`${formatNumber(row.original.discountValue)}${suffix}`, true);
        },
      },
      {
        accessorKey: "startsAt",
        header: t("table.pages.coupons.columns.startsAt"),
        cell: (info) => <DateTimeValue value={info.getValue() as string} />,
      },
      {
        accessorKey: "expiresAt",
        header: t("table.pages.coupons.columns.expiresAt"),
        cell: (info) => <DateTimeValue value={info.getValue() as string} />,
      },
      {
        accessorKey: "isFirstPurchaseOnly",
        header: t("table.pages.coupons.columns.isFirstPurchaseOnly"),
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
        header: t("table.pages.coupons.columns.isActive"),
        cell: (info) => (
          <Chip
            size="small"
            variant="outlined"
            color={Boolean(info.getValue()) ? "success" : "default"}
            label={
              Boolean(info.getValue())
                ? t("pages.coupons.status.active")
                : t("pages.coupons.status.inactive")
            }
          />
        ),
      },
      {
        accessorKey: "totalUsageCount",
        header: t("table.pages.coupons.columns.totalUsageCount"),
        cell: (info) => textCell(formatNumber(info.getValue() as number), true),
      },
      {
        accessorKey: "remainingTotalUsageCount",
        header: t("table.pages.coupons.columns.remainingTotalUsageCount"),
        cell: (info) => textCell(formatNumber(info.getValue() as number | null), true),
        enableSorting: false,
      },
      {
        accessorKey: "createdAt",
        header: t("table.pages.coupons.columns.createdAt"),
        cell: (info) => <DateTimeValue value={info.getValue() as string} />,
      },
      {
        accessorKey: "updatedAt",
        header: t("table.pages.coupons.columns.updatedAt"),
        cell: (info) => <DateTimeValue value={info.getValue() as string} />,
      },
      {
        id: "actions",
        header: t("table.columns.actions"),
        cell: ({ row }) => <CrudRowActions onEdit={() => openEditDialog(row.original)} />,
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
        title={t("pages.coupons.title")}
        description={t("pages.coupons.subtitle")}
      />
      <EntityTableShell<CouponListRecord>
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
          title: t("pages.coupons.createEntityTitle"),
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
        onRowClick={openEditDialog}
      />

      <EntityModalShell
        open={couponDialogOpen}
        onClose={closeDialog}
        disableClose={isSaving}
        hasUnsavedChanges={Boolean(form && canSubmitCouponForm)}
        maxWidth="lg"
        relaxedHeaderSpacing
        resetKey={editCouponId != null ? `${editCouponId}-${Boolean(editCouponRecord)}` : undefined}
        title={
          dialogMode === "create" ? t("pages.coupons.create.title") : t("pages.coupons.edit.title")
        }
        subtitle={
          dialogMode === "create"
            ? t("pages.coupons.create.subtitle")
            : editCouponRecord?.code?.trim() ||
              form?.code?.trim() ||
              t("pages.coupons.edit.subtitle")
        }
        useFormWrapper
        onSubmit={handleSubmit}
        closeOnSave
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: closeDialog,
                disabled: isSaving,
              },
              ...(dialogMode === "edit"
                ? [
                    {
                      key: "delete",
                      label: t("table.dataGrid.rowActions.delete"),
                      onClick: openDeleteFromEditDialog,
                      isDestructive: true,
                      disabled: isSaving || deleteCouponResult.loading,
                      icon: <DeleteRoundedIcon />,
                    },
                  ]
                : []),
              {
                key: "submit",
                label: isSaving
                  ? t("pages.coupons.edit.saving")
                  : dialogMode === "create"
                    ? t("pages.coupons.create.save")
                    : t("pages.coupons.edit.save"),
                type: "submit",
                icon: dialogMode === "create" ? <AddRoundedIcon /> : undefined,
                disabled: isSaving || !form || !canSubmitCouponForm,
              },
            ]}
          />
        }
      >
        {editCouponId != null && couponDetailLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 320 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              در حال دریافت اطلاعات کوپن...
            </Typography>
          </Stack>
        ) : form ? (
          <Stack spacing={2.5}>
            <TextField
              label={t("table.pages.coupons.columns.title")}
              value={form.title}
              onChange={(event) => setFormField("title", event.target.value)}
              required
              fullWidth
              size="small"
            />
            <TextField
              label={t("table.pages.coupons.columns.code")}
              value={form.code}
              onChange={(event) => setFormField("code", event.target.value)}
              required
              fullWidth
              size="small"
              sx={COUPON_CODE_INPUT_SX}
              inputProps={COUPON_CODE_INPUT_PROPS}
            />

            <TextField
              label={t("table.pages.coupons.columns.description")}
              value={form.description}
              onChange={(event) => setFormField("description", event.target.value)}
              fullWidth
              size="small"
              multiline
              minRows={MULTILINE_TEXTAREA_MIN_ROWS}
              maxRows={MULTILINE_TEXTAREA_MAX_ROWS}
            />

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                select
                label={t("table.pages.coupons.columns.discountType")}
                value={form.discountType}
                onChange={(event) =>
                  setFormField("discountType", event.target.value as CouponDiscountType)
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
                label={t("table.pages.coupons.columns.discountValue")}
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
                label={t("table.pages.coupons.columns.startsAt")}
                value={form.startsAt}
                onChange={(value) => setFormField("startsAt", value)}
                ariaLabel={t("table.pages.coupons.columns.startsAt")}
                size="small"
              />
              <JalaliDateTimeField
                label={t("table.pages.coupons.columns.expiresAt")}
                value={form.expiresAt}
                onChange={(value) => setFormField("expiresAt", value)}
                ariaLabel={t("table.pages.coupons.columns.expiresAt")}
                size="small"
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label={t("table.pages.coupons.columns.totalUsageLimit")}
                value={form.totalUsageLimit}
                onChange={(event) => setFormField("totalUsageLimit", event.target.value)}
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 1, step: 1 }}
              />
              <TextField
                label={t("table.pages.coupons.columns.perUserUsageLimit")}
                value={form.perUserUsageLimit}
                onChange={(event) => setFormField("perUserUsageLimit", event.target.value)}
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 1, step: 1 }}
              />
            </Stack>

            <ProductPickerField
              multiple
              enabled={couponDialogOpen}
              limit={500}
              label={t("table.pages.coupons.columns.applicableProductIds")}
              placeholder={t("pages.coupons.form.applicableProductIdsPlaceholder")}
              helperText={t("pages.coupons.form.applicableProductIdsHelp")}
              noOptionsText={t("table.filters.noOptions")}
              loadErrorText={t("pages.coupons.form.applicableProductIdsLoadError")}
              value={form.applicableProductIds}
              onChange={(nextProductIds) =>
                setFormField("applicableProductIds", [...nextProductIds])
              }
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.isFirstPurchaseOnly}
                    onChange={(event) => setFormField("isFirstPurchaseOnly", event.target.checked)}
                  />
                }
                label={t("table.pages.coupons.columns.isFirstPurchaseOnly")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.isActive}
                    onChange={(event) => setFormField("isActive", event.target.checked)}
                  />
                }
                label={t("table.pages.coupons.columns.isActive")}
              />
            </Stack>
          </Stack>
        ) : null}
      </EntityModalShell>

      <EntityDeleteDialog
        open={deleteTarget != null}
        entityTitle={deleteTarget?.title ?? t("pages.coupons.createEntityTitle")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteCouponResult.loading}
      />
    </>
  );
};

export default CouponsIndex;
