import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";
import { Clear as ClearIcon } from "@mui/icons-material";
import {
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
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

import { TICKET_LIST_QUERY } from "../../graphql/queries/ticketList.query";
import { USER_TICKET_LIST_QUERY } from "../../graphql/queries/userTicketList.query";
import { useAuth } from "../../contexts/AuthContext";
import { useBadgeCountFirstPageReload } from "../../hooks/useBadgeCountFirstPageReload";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useServerPaginatedQuery,
  type ServerPageResult,
  type ServerPaginatedPaginationProps,
} from "../../hooks/useServerPaginatedQuery";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import CrudRowActions from "../../shared/crud/CrudRowActions";
import EntityTableShell from "../../shared/crud/EntityTableShell";
import JalaliDateFilterField from "../../shared/table/JalaliDateFilterField";
import crudPrimitives from "../../shared/crud/styles/crudPrimitives.module.scss";
import TicketDialog, { type TicketDialogMode } from "./TicketDialog";
import {
  buildTicketListQueryVariables,
  buildUserTicketListQueryVariables,
  hasSupportTicketFiltersApplied,
  hasUserSupportTicketFiltersApplied,
  mapSupportTicketListRowToRecord,
} from "./support-list.api";
import {
  TICKET_CATEGORY_LABEL,
  TICKET_CATEGORY_OPTIONS,
  TICKET_CLOSED_BY_LABEL,
  TICKET_CLOSED_BY_OPTIONS,
  TICKET_PRIORITY_LABEL,
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS_LABEL,
  TICKET_STATUS_OPTIONS,
} from "./support-labels.util";
import {
  EMPTY_SUPPORT_TICKET_LIST_FILTERS,
  EMPTY_USER_SUPPORT_TICKET_LIST_FILTERS,
  type SupportTicketListFilters,
  type SupportTicketListRow,
  type SupportTicketRecord,
  type TicketListQuery,
  type TicketListQueryVariables,
  type TicketPriority,
  type TicketStatus,
  type UserSupportTicketListFilters,
  type UserTicketListQuery,
  type UserTicketListQueryVariables,
} from "./support.types";

type SupportListViewMode = "staff" | "endUser";

function getSupportTicketColumnVisibility(
  viewMode: SupportListViewMode,
  isMobile: boolean,
): VisibilityState {
  const staffDefaults: VisibilityState = {
    id: false,
    title: true,
    category: true,
    priority: true,
    status: true,
    closedBy: false,
    closedByUserName: false,
    closedAt: false,
    createdByUserName: true,
    updatedByUserName: false,
    messageCount: true,
    lastMessageBody: false,
    attachmentCount: false,
    createdAt: false,
    updatedAt: true,
  };

  const endUserDefaults: VisibilityState = {
    id: false,
    title: true,
    category: false,
    priority: false,
    status: false,
    closedBy: false,
    closedAt: false,
    messageCount: false,
    lastMessageBody: false,
    attachmentCount: false,
    createdAt: false,
    updatedAt: true,
  };

  const defaults = viewMode === "staff" ? staffDefaults : endUserDefaults;

  if (!isMobile) {
    return defaults;
  }

  return {
    ...defaults,
    status: true,
    updatedAt: false,
  };
}

const COLUMN_WIDTH_BY_ID: Record<string, string> = {
  id: "14rem",
  title: "8rem",
  category: "9rem",
  priority: "8rem",
  status: "10rem",
  closedBy: "9rem",
  closedByUserName: "12rem",
  closedAt: "10rem",
  createdByUserName: "12rem",
  updatedByUserName: "12rem",
  messageCount: "8rem",
  lastMessageBody: "18rem",
  attachmentCount: "8rem",
  createdAt: "10rem",
  updatedAt: "10rem",
  actions: "6rem",
};

const TABLE_TOOLBAR_OPTIONS = {
  showSearch: true,
  showColumnVisibility: true,
  showRefresh: true,
  showFilterButton: true,
} as const;

const EMPTY_DISPLAY = "—";
const TITLE_CELL_MAX_WIDTH = "7rem";
const LAST_MESSAGE_CELL_MAX_WIDTH = "18rem";

const STATUS_COLOR: Record<
  TicketStatus,
  "default" | "primary" | "success" | "warning" | "error" | "info"
> = {
  OPEN: "warning",
  ANSWERED: "info",
  CLOSED: "default",
};

const PRIORITY_COLOR: Record<
  TicketPriority,
  "default" | "primary" | "success" | "warning" | "error" | "info"
> = {
  LOW: "default",
  MEDIUM: "info",
  HIGH: "error",
};

function orEmpty(value: string): string {
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "-" ? EMPTY_DISPLAY : trimmed;
}

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

function truncateText(value: string, maxLength = 80): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}…`;
}

function selectTicketListPage(
  data: TicketListQuery | undefined,
): ServerPageResult<SupportTicketListRow> | null {
  const page = data?.ticketList;
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

function selectUserTicketListPage(
  data: UserTicketListQuery | undefined,
): ServerPageResult<SupportTicketListRow> | null {
  const page = data?.userTicketList;
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

type SupportTicketListInnerProps = {
  readonly viewMode: SupportListViewMode;
  readonly canCreate: boolean;
  readonly canReply: boolean;
  readonly isSuperAdmin: boolean;
  readonly rows: SupportTicketRecord[];
  readonly loading: boolean;
  readonly error: unknown;
  readonly onRefresh: () => void;
  readonly pagination: ServerPaginatedPaginationProps;
  readonly appliedFilters: SupportTicketListFilters | UserSupportTicketListFilters;
  readonly pendingFilters: SupportTicketListFilters | UserSupportTicketListFilters;
  readonly onApplyFilters: () => void;
  readonly onClearFilters: () => void;
  readonly onPendingFilterChange: <K extends keyof SupportTicketListFilters>(
    key: K,
    value: SupportTicketListFilters[K],
  ) => void;
  readonly onPendingStaffFilterChange: <K extends keyof SupportTicketListFilters>(
    key: K,
    value: SupportTicketListFilters[K],
  ) => void;
  readonly searchQuery: string;
  readonly onSearchQueryChange: (value: string) => void;
  readonly debouncedPendingFilters: SupportTicketListFilters | UserSupportTicketListFilters;
};

function SupportTicketListInner({
  viewMode,
  canCreate,
  canReply,
  isSuperAdmin,
  rows,
  loading,
  error,
  onRefresh,
  pagination,
  appliedFilters,
  pendingFilters,
  onApplyFilters,
  onClearFilters,
  onPendingFilterChange,
  onPendingStaffFilterChange,
  searchQuery,
  onSearchQueryChange,
  debouncedPendingFilters,
}: SupportTicketListInnerProps): ReactElement {
  const isMobile = useMediaQuery((muiTheme: Theme) => muiTheme.breakpoints.down("md"));
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const hasShownLoadErrorRef = useRef(false);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    getSupportTicketColumnVisibility(viewMode, isMobile),
  );
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const applyFiltersRef = useRef<(() => void) | null>(null);

  const [dialogMode, setDialogMode] = useState<TicketDialogMode>("view");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogRecord, setDialogRecord] = useState<SupportTicketRecord | null>(null);

  const hasAppliedFilters = useMemo(() => {
    if (searchQuery.trim() !== "") {
      return true;
    }
    return viewMode === "staff"
      ? hasSupportTicketFiltersApplied(appliedFilters as SupportTicketListFilters)
      : hasUserSupportTicketFiltersApplied(appliedFilters as UserSupportTicketListFilters);
  }, [appliedFilters, searchQuery, viewMode]);

  useEffect(() => {
    setColumnVisibility(getSupportTicketColumnVisibility(viewMode, isMobile));
  }, [isMobile, viewMode]);

  useEffect(() => {
    applyFiltersRef.current = onApplyFilters;
  });

  useEffect(() => {
    if (!showColumnFilters) {
      return;
    }
    applyFiltersRef.current?.();
  }, [debouncedPendingFilters, showColumnFilters, onApplyFilters]);

  const openCreateDialog = (): void => {
    setDialogMode("create");
    setDialogRecord(null);
    setDialogOpen(true);
  };

  const openViewDialog = (record: SupportTicketRecord): void => {
    setDialogMode("view");
    setDialogRecord(record);
    setDialogOpen(true);
  };

  const handleDialogClose = (): void => {
    setDialogOpen(false);
    setDialogRecord(null);
  };

  const handleDialogSuccess = (): void => {
    setDialogOpen(false);
    setDialogRecord(null);
    onRefresh();
  };

  const columns = useMemo<ColumnDef<SupportTicketRecord>[]>(() => {
    const sharedColumns: ColumnDef<SupportTicketRecord>[] = [
      {
        accessorKey: "title",
        header: t("table.pages.support.columns.title"),
        cell: (info) => (
          <Typography
            variant="body2"
            fontWeight={700}
            title={orEmpty(info.getValue() as string)}
            sx={{
              maxWidth: TITLE_CELL_MAX_WIDTH,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {orEmpty(info.getValue() as string)}
          </Typography>
        ),
      },
      {
        accessorKey: "category",
        header: t("table.pages.support.columns.category"),
        cell: (info) => (
          <Chip
            size="small"
            variant="outlined"
            label={TICKET_CATEGORY_LABEL[info.getValue() as keyof typeof TICKET_CATEGORY_LABEL]}
          />
        ),
      },
      {
        accessorKey: "priority",
        header: t("table.pages.support.columns.priority"),
        cell: (info) => {
          const priority = info.getValue() as TicketPriority;
          return (
            <Chip
              size="small"
              variant="outlined"
              color={PRIORITY_COLOR[priority] ?? "default"}
              label={TICKET_PRIORITY_LABEL[priority]}
            />
          );
        },
      },
      {
        accessorKey: "status",
        header: t("table.pages.support.columns.status"),
        cell: (info) => {
          const status = info.getValue() as TicketStatus;
          return (
            <Chip
              size="small"
              variant="outlined"
              color={STATUS_COLOR[status] ?? "default"}
              label={TICKET_STATUS_LABEL[status]}
            />
          );
        },
      },
      {
        accessorKey: "messageCount",
        header: t("table.pages.support.columns.messageCount"),
        cell: (info) => (
          <Typography variant="body2" className={crudPrimitives.tabularNums}>
            {(info.getValue() as number).toLocaleString("fa-IR")}
          </Typography>
        ),
      },
      {
        accessorKey: "lastMessageBody",
        header: t("table.pages.support.columns.lastMessageBody"),
        cell: (info) => (
          <Typography
            variant="body2"
            color="text.secondary"
            title={orEmpty(info.getValue() as string)}
            sx={{
              maxWidth: LAST_MESSAGE_CELL_MAX_WIDTH,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {truncateText(orEmpty(info.getValue() as string))}
          </Typography>
        ),
      },
      {
        accessorKey: "attachmentCount",
        header: t("table.pages.support.columns.attachmentCount"),
        cell: (info) => (
          <Typography variant="body2" className={crudPrimitives.tabularNums}>
            {(info.getValue() as number).toLocaleString("fa-IR")}
          </Typography>
        ),
      },
      {
        accessorKey: "closedBy",
        header: t("table.pages.support.columns.closedBy"),
        cell: (info) => {
          const value = info.getValue() as string;
          if (value === "-" || !value.trim()) {
            return (
              <Typography variant="body2" color="text.secondary">
                {EMPTY_DISPLAY}
              </Typography>
            );
          }
          return (
            <Typography variant="body2">
              {TICKET_CLOSED_BY_LABEL[value as keyof typeof TICKET_CLOSED_BY_LABEL] ?? value}
            </Typography>
          );
        },
      },
      {
        accessorKey: "closedByUserName",
        header: t("table.pages.support.columns.closedByUserName"),
        cell: (info) => (
          <Typography variant="body2">{orEmpty(info.getValue() as string)}</Typography>
        ),
      },
      {
        accessorKey: "closedAt",
        header: t("table.pages.support.columns.closedAt"),
        cell: (info) => (
          <Typography variant="body2" className={crudPrimitives.tabularNums}>
            {formatDate(info.getValue() as string)}
          </Typography>
        ),
      },
      {
        accessorKey: "createdByUserName",
        header: t("table.pages.support.columns.createdByUserName"),
        cell: (info) => (
          <Typography variant="body2">{orEmpty(info.getValue() as string)}</Typography>
        ),
      },
      {
        accessorKey: "updatedByUserName",
        header: t("table.pages.support.columns.updatedByUserName"),
        cell: (info) => (
          <Typography variant="body2">{orEmpty(info.getValue() as string)}</Typography>
        ),
      },
      {
        accessorKey: "createdAt",
        header: t("table.pages.support.columns.createdAt"),
        cell: (info) => (
          <Typography variant="body2" className={crudPrimitives.tabularNums}>
            {formatDate(info.getValue() as string)}
          </Typography>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: t("table.pages.support.columns.updatedAt"),
        cell: (info) => (
          <Typography variant="body2" className={crudPrimitives.tabularNums}>
            {formatDate(info.getValue() as string)}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: t("table.columns.actions"),
        cell: ({ row }) => (
          <CrudRowActions
            onView={() => openViewDialog(row.original)}
            viewLabel={t("pages.support.actions.view")}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ];

    if (viewMode === "staff") {
      return sharedColumns;
    }

    return sharedColumns.filter(
      (column) =>
        !("accessorKey" in column) ||
        (column.accessorKey !== "createdByUserName" &&
          column.accessorKey !== "updatedByUserName" &&
          column.accessorKey !== "closedByUserName"),
    );
  }, [canReply, t, viewMode]);

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

  const renderTextFilter = (key: "title" | "messageBody" | "id", label: string): ReactElement => (
    <TextField
      size="small"
      fullWidth
      aria-label={label}
      value={pendingFilters[key]}
      onChange={(event) => onPendingFilterChange(key, event.target.value)}
      InputProps={{
        endAdornment:
          pendingFilters[key].trim() !== "" ? (
            <InputAdornment position="end">
              <Tooltip title={t("table.dataGrid.filter.clearField")} arrow>
                <IconButton
                  size="small"
                  edge="end"
                  aria-label={t("table.dataGrid.filter.clearField")}
                  onClick={() => onPendingFilterChange(key, "")}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ) : undefined,
      }}
    />
  );

  const renderStaffTextFilter = (
    key: "createdByUserId" | "updatedByUserId" | "closedByUserId" | "attachmentFileId",
    label: string,
  ): ReactElement => (
    <TextField
      size="small"
      fullWidth
      aria-label={label}
      value={(pendingFilters as SupportTicketListFilters)[key]}
      onChange={(event) => onPendingStaffFilterChange(key, event.target.value)}
    />
  );

  const renderSelectFilter = (
    key: "category" | "priority" | "status" | "closedBy",
    label: string,
    options: readonly string[],
    labels: Record<string, string>,
  ): ReactElement => (
    <TextField
      select
      size="small"
      fullWidth
      aria-label={label}
      value={pendingFilters[key]}
      onChange={(event) =>
        onPendingFilterChange(key, event.target.value as SupportTicketListFilters[typeof key])
      }
    >
      <MenuItem value="ALL">{t("table.filters.all")}</MenuItem>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {labels[option] ?? option}
        </MenuItem>
      ))}
    </TextField>
  );

  const renderDateFilter = (
    fromKey: "createdAtFrom" | "updatedAtFrom" | "closedAtFrom",
    toKey: "createdAtTo" | "updatedAtTo" | "closedAtTo",
    fromLabel: string,
    toLabel: string,
  ): ReactElement => (
    <Stack spacing={1}>
      <JalaliDateFilterField
        ariaLabel={fromLabel}
        label={fromLabel}
        value={pendingFilters[fromKey]}
        onChange={(value) => onPendingFilterChange(fromKey, value)}
      />
      <JalaliDateFilterField
        ariaLabel={toLabel}
        label={toLabel}
        value={pendingFilters[toKey]}
        onChange={(value) => onPendingFilterChange(toKey, value)}
      />
    </Stack>
  );

  const renderFilterCell = (column: Column<SupportTicketRecord, unknown>) => {
    if (column.id === "title") {
      return renderTextFilter("title", t("table.pages.support.columns.title"));
    }
    if (column.id === "category") {
      return renderSelectFilter(
        "category",
        t("table.pages.support.columns.category"),
        TICKET_CATEGORY_OPTIONS,
        TICKET_CATEGORY_LABEL,
      );
    }
    if (column.id === "priority") {
      return renderSelectFilter(
        "priority",
        t("table.pages.support.columns.priority"),
        TICKET_PRIORITY_OPTIONS,
        TICKET_PRIORITY_LABEL,
      );
    }
    if (column.id === "status") {
      return renderSelectFilter(
        "status",
        t("table.pages.support.columns.status"),
        TICKET_STATUS_OPTIONS,
        TICKET_STATUS_LABEL,
      );
    }
    if (column.id === "closedBy") {
      return renderSelectFilter(
        "closedBy",
        t("table.pages.support.columns.closedBy"),
        TICKET_CLOSED_BY_OPTIONS,
        TICKET_CLOSED_BY_LABEL,
      );
    }
    if (column.id === "lastMessageBody") {
      return renderTextFilter("messageBody", t("table.pages.support.columns.lastMessageBody"));
    }
    if (column.id === "createdByUserName" && viewMode === "staff") {
      return renderStaffTextFilter(
        "createdByUserId",
        t("table.pages.support.columns.createdByUserName"),
      );
    }
    if (column.id === "updatedByUserName" && viewMode === "staff") {
      return renderStaffTextFilter(
        "updatedByUserId",
        t("table.pages.support.columns.updatedByUserName"),
      );
    }
    if (column.id === "closedByUserName" && viewMode === "staff") {
      return renderStaffTextFilter(
        "closedByUserId",
        t("table.pages.support.columns.closedByUserName"),
      );
    }
    if (column.id === "attachmentCount") {
      return (
        <TextField
          size="small"
          fullWidth
          aria-label={t("table.pages.support.columns.attachmentCount")}
          value={pendingFilters.attachmentFileId}
          onChange={(event) => onPendingFilterChange("attachmentFileId", event.target.value)}
        />
      );
    }
    if (column.id === "createdAt") {
      return renderDateFilter(
        "createdAtFrom",
        "createdAtTo",
        t("table.pages.support.filters.createdAtFrom"),
        t("table.pages.support.filters.createdAtTo"),
      );
    }
    if (column.id === "updatedAt") {
      return renderDateFilter(
        "updatedAtFrom",
        "updatedAtTo",
        t("table.pages.support.filters.updatedAtFrom"),
        t("table.pages.support.filters.updatedAtTo"),
      );
    }
    if (column.id === "closedAt") {
      return renderDateFilter(
        "closedAtFrom",
        "closedAtTo",
        t("table.pages.support.filters.closedAtFrom"),
        t("table.pages.support.filters.closedAtTo"),
      );
    }
    return null;
  };

  return (
    <>
      <EntityTableShell<SupportTicketRecord>
        table={table}
        pagedRows={table.getRowModel().rows}
        isMobile={isMobile}
        searchValue={searchQuery}
        onSearchChange={(event: ChangeEvent<HTMLInputElement>) =>
          onSearchQueryChange(event.target.value)
        }
        onClearSearch={() => onSearchQueryChange("")}
        onRefresh={onRefresh}
        loading={loading}
        showNewButton={canCreate}
        newButtonText={t("table.entity.createButton", {
          title: t("pages.support.createEntityTitle"),
        })}
        onNewClick={openCreateDialog}
        toolbarOptions={TABLE_TOOLBAR_OPTIONS}
        showColumnFilters={showColumnFilters}
        onShowColumnFiltersChange={setShowColumnFilters}
        onApplyFilters={onApplyFilters}
        onClearFilters={() => {
          onClearFilters();
          onSearchQueryChange("");
        }}
        renderFilterCell={renderFilterCell}
        columnWidthById={COLUMN_WIDTH_BY_ID}
        noDataLabel={error ? t("errors.general.loadData") : undefined}
        hasActiveFilters={hasAppliedFilters}
        pagination={pagination}
      />

      <TicketDialog
        open={dialogOpen}
        mode={dialogMode}
        record={dialogRecord}
        canReply={canReply && dialogMode === "view"}
        isSuperAdmin={isSuperAdmin}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
}

type SupportTicketListShellProps = {
  readonly canCreate: boolean;
  readonly canReply: boolean;
  readonly isSuperAdmin: boolean;
};

function StaffSupportTicketList({
  canCreate,
  canReply,
  isSuperAdmin,
}: SupportTicketListShellProps): ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [appliedFilters, setAppliedFilters] = useState<SupportTicketListFilters>(
    EMPTY_SUPPORT_TICKET_LIST_FILTERS,
  );
  const [pendingFilters, setPendingFilters] = useState<SupportTicketListFilters>(
    EMPTY_SUPPORT_TICKET_LIST_FILTERS,
  );
  const debouncedPendingFilters = useDebounce(pendingFilters, 500);

  const buildVariables = useCallback(
    ({ page, pageSize }: { page: number; pageSize: number }) =>
      buildTicketListQueryVariables(debouncedSearchQuery, appliedFilters, page, pageSize),
    [appliedFilters, debouncedSearchQuery],
  );

  const { items: rows, loading, error, onRefresh, pagination, page } = useServerPaginatedQuery<
    TicketListQuery,
    TicketListQueryVariables,
    SupportTicketListRow,
    SupportTicketRecord
  >({
    query: TICKET_LIST_QUERY,
    variables: buildVariables,
    selectPage: selectTicketListPage,
    mapItem: mapSupportTicketListRowToRecord,
    resetPageDeps: [debouncedSearchQuery, appliedFilters],
  });

  useBadgeCountFirstPageReload({
    enabled: true,
    isOnFirstPage: page === 1,
    reload: onRefresh,
  });

  return (
    <SupportTicketListInner
      viewMode="staff"
      canCreate={canCreate}
      canReply={canReply}
      isSuperAdmin={isSuperAdmin}
      rows={rows}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      pagination={pagination}
      appliedFilters={appliedFilters}
      pendingFilters={pendingFilters}
      onApplyFilters={() => setAppliedFilters({ ...pendingFilters })}
      onClearFilters={() => {
        setPendingFilters(EMPTY_SUPPORT_TICKET_LIST_FILTERS);
        setAppliedFilters(EMPTY_SUPPORT_TICKET_LIST_FILTERS);
      }}
      onPendingFilterChange={(key, value) =>
        setPendingFilters((prev) => ({ ...prev, [key]: value }))
      }
      onPendingStaffFilterChange={(key, value) =>
        setPendingFilters((prev) => ({ ...prev, [key]: value }))
      }
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      debouncedPendingFilters={debouncedPendingFilters}
    />
  );
}

function EndUserSupportTicketList({
  canCreate,
  canReply,
  isSuperAdmin,
}: SupportTicketListShellProps): ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [appliedFilters, setAppliedFilters] = useState<UserSupportTicketListFilters>(
    EMPTY_USER_SUPPORT_TICKET_LIST_FILTERS,
  );
  const [pendingFilters, setPendingFilters] = useState<UserSupportTicketListFilters>(
    EMPTY_USER_SUPPORT_TICKET_LIST_FILTERS,
  );
  const debouncedPendingFilters = useDebounce(pendingFilters, 500);

  const buildVariables = useCallback(
    ({ page, pageSize }: { page: number; pageSize: number }) =>
      buildUserTicketListQueryVariables(debouncedSearchQuery, appliedFilters, page, pageSize),
    [appliedFilters, debouncedSearchQuery],
  );

  const { items: rows, loading, error, onRefresh, pagination, page } = useServerPaginatedQuery<
    UserTicketListQuery,
    UserTicketListQueryVariables,
    SupportTicketListRow,
    SupportTicketRecord
  >({
    query: USER_TICKET_LIST_QUERY,
    variables: buildVariables,
    selectPage: selectUserTicketListPage,
    mapItem: mapSupportTicketListRowToRecord,
    resetPageDeps: [debouncedSearchQuery, appliedFilters],
  });

  useBadgeCountFirstPageReload({
    enabled: true,
    isOnFirstPage: page === 1,
    reload: onRefresh,
  });

  return (
    <SupportTicketListInner
      viewMode="endUser"
      canCreate={canCreate}
      canReply={canReply}
      isSuperAdmin={isSuperAdmin}
      rows={rows}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      pagination={pagination}
      appliedFilters={appliedFilters}
      pendingFilters={pendingFilters}
      onApplyFilters={() => setAppliedFilters({ ...pendingFilters })}
      onClearFilters={() => {
        setPendingFilters(EMPTY_USER_SUPPORT_TICKET_LIST_FILTERS);
        setAppliedFilters(EMPTY_USER_SUPPORT_TICKET_LIST_FILTERS);
      }}
      onPendingFilterChange={(key, value) =>
        setPendingFilters((prev) => ({ ...prev, [key]: value }))
      }
      onPendingStaffFilterChange={() => undefined}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      debouncedPendingFilters={debouncedPendingFilters}
    />
  );
}

const SupportList = (): ReactElement => {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isSuperAdmin = roles.includes("SUPER_ADMIN");
  const isAdmin = roles.includes("ADMIN");
  const isStaff = isSuperAdmin || isAdmin;

  if (isStaff) {
    return (
      <StaffSupportTicketList
        canCreate
        canReply
        isSuperAdmin
      />
    );
  }

  return (
    <EndUserSupportTicketList
      canCreate
      canReply
      isSuperAdmin={false}
    />
  );
};

export default SupportList;
