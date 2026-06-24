import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Chip,
  Container,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  getCoreRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import { useAuth } from "../../contexts/AuthContext";
import { APP_SETTING_KEY_LIST_QUERY } from "../../graphql/queries/appSettingKeyList.query";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useServerPaginatedQuery,
  type ServerPageResult,
} from "../../hooks/useServerPaginatedQuery";
import { useSnackbar } from "../../hooks/useSnackbar";
import SystemSettingEditDialog from "./SystemSettingEditDialog";
import { useTranslation } from "../../hooks/useTranslation";
import CrudRowActions from "../../shared/crud/CrudRowActions";
import EntityTableShell from "../../shared/crud/EntityTableShell";
import systemSettingsStyles from "./styles/system-settings.module.scss";
import DateTimeValue from "../../shared/display/DateTimeValue";
import DashboardMenuHeader from "../../shared/DashboardMenuHeader";
import JalaliDateFilterField from "../../shared/table/JalaliDateFilterField";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import {
  EMPTY_APP_SETTING_LIST_FILTERS,
  buildAppSettingListQueryVariables,
  hasAppSettingFiltersApplied,
  mapAppSettingKeyListItemRowToRecord,
  type AppSettingKeyListItemRow,
  type AppSettingKeyListQuery,
  type AppSettingListFilters,
  type AppSettingListQueryVariables,
  type AppSettingListSortField,
  type AppSettingRecord,
  type AppSettingValueType,
  type SortingOrder,
} from "./system-settings-list.api";

const EMPTY_DISPLAY = "-";

const TABLE_TOOLBAR_OPTIONS = {
  showSearch: true,
  showColumnVisibility: true,
  showRefresh: true,
  showFilterButton: true,
} as const;

const COLUMN_WIDTH_BY_ID: Record<string, string> = {
  id: "14rem",
  key: "18rem",
  label: "16rem",
  valueType: "9rem",
  description: "24rem",
  isActive: "8rem",
  createdAt: "10rem",
  updatedAt: "10rem",
  actions: "6rem",
};

const VALUE_TYPE_LABEL: Record<AppSettingValueType, string> = {
  STRING: "متن",
  NUMBER: "عدد",
  BOOLEAN: "درست/نادرست",
  JSON: "JSON",
};

const VALUE_TYPE_OPTIONS: readonly AppSettingValueType[] = ["STRING", "NUMBER", "BOOLEAN", "JSON"];
const SORTABLE_FIELDS = new Set<AppSettingListSortField>([
  "createdAt",
  "updatedAt",
  "key",
  "label",
  "valueType",
  "isActive",
]);

function textCell(value: unknown, latin = false): ReactElement {
  return (
    <Typography
      variant="body2"
      className={latin ? systemSettingsStyles.latinText : undefined}
      sx={{ overflowWrap: "anywhere" }}
    >
      {String(value || EMPTY_DISPLAY)}
    </Typography>
  );
}

function selectAppSettingListPage(
  data: AppSettingKeyListQuery | undefined
): ServerPageResult<AppSettingKeyListItemRow> | null {
  const page = data?.appSettingKeyList;
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
): Partial<Record<AppSettingListSortField, SortingOrder>> {
  const sort = sorting.find((item) => SORTABLE_FIELDS.has(item.id as AppSettingListSortField));
  if (!sort) {
    return { createdAt: "DESC" };
  }

  return {
    [sort.id as AppSettingListSortField]: sort.desc ? "DESC" : "ASC",
  };
}

const SystemSettingsIndex = (): ReactElement => {
  const isMobile = useMediaQuery((muiTheme: Theme) => muiTheme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const hasShownLoadErrorRef = useRef(false);
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN") === true;

  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    key: false,
    label: true,
    valueType: true,
    description: false,
    isActive: true,
    createdAt: false,
    updatedAt: false,
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const editSettingId = useMemo(() => {
    const editRoutePrefix = `${APP_SHELL_ROUTES.moreSystemSettings}/edit/`;
    if (!location.pathname.startsWith(editRoutePrefix)) {
      return null;
    }

    const routeId = location.pathname.slice(editRoutePrefix.length);
    return routeId || null;
  }, [location.pathname]);
  const editDialogOpen = editSettingId != null;
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [appliedFilters, setAppliedFilters] = useState<AppSettingListFilters>(
    EMPTY_APP_SETTING_LIST_FILTERS
  );
  const [pendingFilters, setPendingFilters] = useState<AppSettingListFilters>(
    EMPTY_APP_SETTING_LIST_FILTERS
  );
  const debouncedPendingFilters = useDebounce(pendingFilters, 500);
  const applyFiltersRef = useRef<(() => void) | null>(null);
  const serverSort = useMemo(() => sortingToServerSort(sorting), [sorting]);

  const hasAppliedFilters = useMemo(
    () => debouncedSearchQuery.trim() !== "" || hasAppSettingFiltersApplied(appliedFilters),
    [appliedFilters, debouncedSearchQuery]
  );

  const buildVariables = useCallback(
    ({ page, pageSize }: { page: number; pageSize: number }) =>
      buildAppSettingListQueryVariables(
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
    AppSettingKeyListQuery,
    AppSettingListQueryVariables,
    AppSettingKeyListItemRow,
    AppSettingRecord
  >({
    query: APP_SETTING_KEY_LIST_QUERY,
    variables: buildVariables,
    selectPage: selectAppSettingListPage,
    mapItem: mapAppSettingKeyListItemRowToRecord,
    resetPageDeps: [debouncedSearchQuery, appliedFilters, serverSort],
    skip: !isSuperAdmin,
  });

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

  const columns = useMemo<ColumnDef<AppSettingRecord>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("table.pages.appSettings.columns.id"),
        cell: (info) => textCell(info.getValue(), true),
      },
      {
        accessorKey: "label",
        header: t("table.pages.appSettings.columns.label"),
        cell: (info) => (
          <Typography variant="body2" fontWeight={700}>
            {String(info.getValue() || EMPTY_DISPLAY)}
          </Typography>
        ),
      },
      {
        accessorKey: "key",
        header: t("table.pages.appSettings.columns.key"),
        cell: (info) => textCell(info.getValue(), true),
      },
      {
        accessorKey: "valueType",
        header: t("table.pages.appSettings.columns.valueType"),
        cell: (info) => {
          const valueType = info.getValue() as AppSettingValueType;
          return (
            <Chip
              size="small"
              variant="outlined"
              label={VALUE_TYPE_LABEL[valueType] ?? valueType}
            />
          );
        },
      },
      {
        accessorKey: "description",
        header: t("table.pages.appSettings.columns.description"),
        cell: (info) => textCell(info.getValue()),
      },
      {
        accessorKey: "isActive",
        header: t("table.pages.appSettings.columns.isActive"),
        cell: (info) => {
          const isActive = Boolean(info.getValue());
          return (
            <Chip
              size="small"
              color={isActive ? "success" : "default"}
              variant="outlined"
              label={
                isActive
                  ? t("pages.appSettings.status.active")
                  : t("pages.appSettings.status.inactive")
              }
            />
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("table.pages.appSettings.columns.createdAt"),
        cell: (info) => <DateTimeValue value={info.getValue() as string} />,
      },
      {
        accessorKey: "updatedAt",
        header: t("table.pages.appSettings.columns.updatedAt"),
        cell: (info) => <DateTimeValue value={info.getValue() as string} />,
      },
      {
        id: "actions",
        header: t("table.columns.actions"),
        cell: ({ row }) => (
          <CrudRowActions
            onEdit={() =>
              navigate(`${APP_SHELL_ROUTES.moreSystemSettings}/edit/${row.original.id}`)
            }
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate, t]
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
    setPendingFilters(EMPTY_APP_SETTING_LIST_FILTERS);
    setAppliedFilters(EMPTY_APP_SETTING_LIST_FILTERS);
  };

  const setFilterValue = <TKey extends keyof AppSettingListFilters>(
    key: TKey,
    value: AppSettingListFilters[TKey]
  ): void => {
    setPendingFilters((prev) => ({ ...prev, [key]: value }));
  };

  const renderTextFilter = (
    key: keyof Pick<AppSettingListFilters, "id" | "key" | "label">,
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

  const renderDateFilter = (
    fromKey: keyof AppSettingListFilters,
    toKey: keyof AppSettingListFilters,
    fromLabel: string,
    toLabel: string
  ): ReactElement => (
    <Stack spacing={0.5}>
      <JalaliDateFilterField
        label={fromLabel}
        ariaLabel={fromLabel}
        value={String(pendingFilters[fromKey] || "")}
        onChange={(value) =>
          setFilterValue(fromKey, value as AppSettingListFilters[typeof fromKey])
        }
      />
      <JalaliDateFilterField
        label={toLabel}
        ariaLabel={toLabel}
        value={String(pendingFilters[toKey] || "")}
        onChange={(value) => setFilterValue(toKey, value as AppSettingListFilters[typeof toKey])}
      />
    </Stack>
  );

  const renderFilterCell = (column: Column<AppSettingRecord, unknown>): ReactElement | null => {
    const label = String(column.columnDef.header ?? column.id);

    switch (column.id) {
      case "id":
      case "key":
      case "label":
        return renderTextFilter(column.id, label);
      case "valueType":
        return (
          <TextField
            select
            size="small"
            fullWidth
            aria-label={label}
            value={pendingFilters.valueType}
            onChange={(event) =>
              setFilterValue("valueType", event.target.value as AppSettingListFilters["valueType"])
            }
          >
            <MenuItem value="ALL">{t("table.filters.all")}</MenuItem>
            {VALUE_TYPE_OPTIONS.map((valueType) => (
              <MenuItem key={valueType} value={valueType}>
                {VALUE_TYPE_LABEL[valueType]}
              </MenuItem>
            ))}
          </TextField>
        );
      case "isActive":
        return (
          <TextField
            select
            size="small"
            fullWidth
            aria-label={label}
            value={pendingFilters.isActive}
            onChange={(event) =>
              setFilterValue("isActive", event.target.value as AppSettingListFilters["isActive"])
            }
          >
            <MenuItem value="ALL">{t("table.filters.all")}</MenuItem>
            <MenuItem value="true">{t("pages.appSettings.status.active")}</MenuItem>
            <MenuItem value="false">{t("pages.appSettings.status.inactive")}</MenuItem>
          </TextField>
        );
      case "createdAt":
        return renderDateFilter(
          "createdAtFrom",
          "createdAtTo",
          t("table.pages.appSettings.filters.createdAtFrom"),
          t("table.pages.appSettings.filters.createdAtTo")
        );
      case "updatedAt":
        return renderDateFilter(
          "updatedAtFrom",
          "updatedAtTo",
          t("table.pages.appSettings.filters.updatedAtFrom"),
          t("table.pages.appSettings.filters.updatedAtTo")
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" disableGutters className={systemSettingsStyles.latinValueForm}>
      <DashboardMenuHeader
        title={t("pages.appSettings.title")}
        description={t("pages.appSettings.subtitle")}
      />
      <EntityTableShell<AppSettingRecord>
        table={table}
        pagedRows={table.getRowModel().rows}
        isMobile={isMobile}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        onRefresh={onRefresh}
        loading={loading}
        toolbarOptions={TABLE_TOOLBAR_OPTIONS}
        showColumnFilters={showColumnFilters}
        onShowColumnFiltersChange={setShowColumnFilters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        renderFilterCell={renderFilterCell}
        columnWidthById={COLUMN_WIDTH_BY_ID}
        noDataLabel={error ? t("errors.general.loadData") : undefined}
        hasActiveFilters={hasAppliedFilters}
        pagination={pagination}
        onRowClick={(row) => navigate(`${APP_SHELL_ROUTES.moreSystemSettings}/edit/${row.id}`)}
      />
      <SystemSettingEditDialog
        open={editDialogOpen}
        settingId={editSettingId}
        onClose={() => navigate(APP_SHELL_ROUTES.moreSystemSettings)}
        onSaved={onRefresh}
      />
    </Container>
  );
};

export default SystemSettingsIndex;
