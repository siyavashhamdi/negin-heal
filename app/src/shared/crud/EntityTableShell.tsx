import {
  type ChangeEvent,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Badge,
  Box,
  Fade,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  useTheme,
} from "@mui/material";
import { darken, lighten } from "@mui/material/styles";
import {
  FilterAltOff as FilterAltOffIcon,
  Search as SearchIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";
import {
  flexRender,
  type Column,
  type Row,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import { useTranslation } from "../../hooks/useTranslation";
import { useElementViewportFillHeight } from "../../hooks/useElementViewportFillHeight";
import SupplementaryFilterField from "../table/SupplementaryFilterField";
import SupplementaryFiltersBar from "../table/SupplementaryFiltersBar";
import TablePaginationFooter from "../table/TablePaginationFooter";
import TableToolbar from "../table/TableToolbar";
import styles from "./styles/EntityTableShell.module.scss";
import { TruncatedTableCellContent } from "../OverflowTooltip";
import attentionBadgeStyles from "../table/styles/AttentionBadge.module.scss";
import {
  sumColumnWidthsRem,
  columnWidthPercent,
  columnWidthRem,
} from "../table/resolve-column-widths.util";
import AppTooltip from "../AppTooltip";

interface EntityTableShellToolbarOptions {
  showSearch?: boolean;
  showColumnVisibility?: boolean;
  showRefresh?: boolean;
  showFilterButton?: boolean;
}

interface EntityTableShellPaginationProps {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalFiltered: number;
  pagedRowsCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
}

/**
 * Column id → hidden. `true` hides; `false` shows. Omitted ids stay visible.
 */
export type EntityTableShellHiddenColumns = Record<string, boolean>;

function isColumnHiddenByShellMap(
  columnId: string,
  hiddenColumns: EntityTableShellHiddenColumns | null | undefined
): boolean {
  if (hiddenColumns == null) {
    return false;
  }
  return hiddenColumns[columnId] === true;
}

function stickyOffsetsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function getColumnHeaderLabel<TData>(column: Column<TData, unknown>): string {
  const headerDef = column.columnDef.header;
  if (typeof headerDef === "string") {
    return headerDef;
  }
  return column.id;
}

interface HiddenColumnFilterSlot<TData extends object> {
  column: Column<TData, unknown>;
  filterNode: ReactNode;
  label: string;
}

export interface EntityTableShellProps<TData extends object> {
  table: TanstackTable<TData>;
  pagedRows: Row<TData>[];
  isMobile: boolean;
  searchValue: string;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearSearch?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  showNewButton?: boolean;
  newButtonText?: string;
  onNewClick?: () => void;
  toolbarOptions?: EntityTableShellToolbarOptions;
  /**
   * When `null` or omitted, all columns render. Per id: `true` hide, `false` show.
   */
  hiddenColumns?: EntityTableShellHiddenColumns | null;
  showColumnFilters?: boolean;
  hasActiveFilters?: boolean;
  onShowColumnFiltersChange?: (visible: boolean) => void;
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  renderFilterCell?: (column: Column<TData, unknown>) => ReactNode;
  /**
   * Filters rendered below the search toolbar (always visible when provided).
   */
  filtersBelowToolbar?: ReactNode;
  /**
   * Extra filters above the table when column filters are visible (not tied to columns).
   * Pass a table-specific {@link SupplementaryFiltersBar} (e.g. `RoomsSupplementaryFilters`).
   * Column filters for hidden columns are relocated here automatically by {@link EntityTableShell}.
   */
  supplementaryFilters?: ReactNode;
  columnWidthById?: Record<string, string>;
  /**
   * `ratio` (default): rem values are weights; columns share the table width proportionally.
   * `fixed`: rem values are absolute column widths; table width is the sum of visible columns.
   */
  columnLayoutMode?: "ratio" | "fixed";
  /**
   * @deprecated No longer affects column layout — data widths come from {@link columnWidthById} only.
   * Filter dropdowns render in a popper and do not require wider columns.
   */
  columnFilterWidthById?: Record<string, string>;
  /**
   * Filter cells spanning multiple columns (anchor column id → colspan count).
   * Skipped columns render no filter cell.
   */
  filterCellColSpanById?: Record<string, number>;
  /** @deprecated Ignored — table fills container width; rem weights define column ratios. */
  tableMinWidth?: string;
  pinnedActionColumnId?: string;
  noDataLabel?: string;
  pagination: EntityTableShellPaginationProps;
  /** On mobile, sizes the shell to the remaining viewport height below the table top. Disabled while column filters are visible. Defaults to true. */
  fillAvailableHeight?: boolean;
  /** Opens the row's primary action when the user clicks anywhere on the row (except the actions column). */
  onRowClick?: (row: TData) => void;
}

const MOBILE_TABLE_ROWS_MIN_VISIBLE = 10;

function EntityTableShell<TData extends object>({
  table,
  pagedRows,
  isMobile,
  searchValue,
  onSearchChange,
  onClearSearch,
  onRefresh,
  loading = false,
  showNewButton,
  newButtonText,
  onNewClick,
  toolbarOptions,
  hiddenColumns = null,
  showColumnFilters,
  hasActiveFilters,
  onShowColumnFiltersChange,
  onApplyFilters,
  onClearFilters,
  renderFilterCell,
  filtersBelowToolbar,
  supplementaryFilters,
  columnWidthById = {},
  columnLayoutMode = "ratio",
  columnFilterWidthById: _columnFilterWidthById,
  filterCellColSpanById,
  tableMinWidth: _tableMinWidth,
  pinnedActionColumnId = "actions",
  noDataLabel,
  pagination,
  fillAvailableHeight = true,
  onRowClick,
}: EntityTableShellProps<TData>): ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const effectiveColumnWidthById = useMemo(() => ({ ...columnWidthById }), [columnWidthById]);
  const [internalShowColumnFilters, setInternalShowColumnFilters] = useState(false);
  const resolvedShowColumnFilters = showColumnFilters ?? internalShowColumnFilters;
  const supplementaryChromeRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const listPaperRef = useRef<HTMLDivElement>(null);
  const tableHeadRef = useRef<HTMLTableSectionElement>(null);
  const columnFilterRowRef = useRef<HTMLTableRowElement>(null);
  const [supplementaryChromeHeightPx, setSupplementaryChromeHeightPx] = useState(0);
  const [columnFilterRowHeightPx, setColumnFilterRowHeightPx] = useState(0);
  const [, setStickyHeaderTopsPx] = useState<number[]>([]);
  const [, setStickyFilterTopPx] = useState<number | null>(null);
  const showColumnFilterRow = resolvedShowColumnFilters && renderFilterCell != null;
  const useNaturalPageHeight = isMobile && resolvedShowColumnFilters;
  const shouldFillViewport = fillAvailableHeight && isMobile && !resolvedShowColumnFilters;
  const { ref: tableShellRef, heightPx: viewportFillHeightPx } =
    useElementViewportFillHeight(shouldFillViewport);

  const toggleShowColumnFilters = (): void => {
    const next = !resolvedShowColumnFilters;
    if (onShowColumnFiltersChange) {
      onShowColumnFiltersChange(next);
      return;
    }
    setInternalShowColumnFilters(next);
  };

  const {
    showSearch = true,
    showColumnVisibility = true,
    showRefresh = true,
    showFilterButton = true,
  } = toolbarOptions ?? {};

  const pinnedActionColumnBorder = `0.0625rem solid ${theme.palette.divider}`;
  const tableCellRowBorder = `1px solid ${theme.palette.divider}`;
  const tableRowDividerShadow = `inset 0 -0.0625rem 0 ${theme.palette.divider}`;
  const opaquePinnedRowHoverBg = useMemo(() => {
    const paper = theme.palette.background.paper;
    const o = theme.palette.action.hoverOpacity;
    return theme.palette.mode === "dark" ? lighten(paper, o) : darken(paper, o);
  }, [theme]);
  const pinnedActionHeaderBg = theme.palette.mode === "dark" ? theme.palette.grey[900] : "#f8fafc";

  // Recompute each render; do not memoize on `table` (stable ref, visibility state changes).
  const shellVisibleLeafColumns = table
    .getVisibleLeafColumns()
    .filter((c) => !isColumnHiddenByShellMap(c.id, hiddenColumns));
  const shellVisibleLeafColumnCount = shellVisibleLeafColumns.length;
  const shellVisibleLeafColumnIds = useMemo(
    () => shellVisibleLeafColumns.map((column) => column.id),
    [shellVisibleLeafColumns]
  );
  const useFixedColumnWidths =
    columnLayoutMode === "fixed" || !isMobile || resolvedShowColumnFilters;
  const tableContentWidth = useMemo(
    () =>
      useFixedColumnWidths
        ? sumColumnWidthsRem(shellVisibleLeafColumnIds, effectiveColumnWidthById)
        : undefined,
    [effectiveColumnWidthById, shellVisibleLeafColumnIds, useFixedColumnWidths]
  );
  const columnVisibilityState = table.getState().columnVisibility;

  const hiddenColumnFilterSlots = useMemo((): HiddenColumnFilterSlot<TData>[] => {
    if (!renderFilterCell) {
      return [];
    }
    const visibleColumnIds = new Set(
      table
        .getVisibleLeafColumns()
        .filter((column) => !isColumnHiddenByShellMap(column.id, hiddenColumns))
        .map((column) => column.id)
    );
    const slots: HiddenColumnFilterSlot<TData>[] = [];
    for (const column of table.getAllLeafColumns()) {
      if (visibleColumnIds.has(column.id) || column.id === pinnedActionColumnId) {
        continue;
      }
      const filterNode = renderFilterCell(column);
      if (filterNode == null) {
        continue;
      }
      slots.push({
        column,
        filterNode,
        label: getColumnHeaderLabel(column),
      });
    }
    return slots;
  }, [columnVisibilityState, hiddenColumns, pinnedActionColumnId, renderFilterCell, table]);

  const resolvedSupplementaryFilters = useMemo((): ReactNode => {
    const hasHiddenColumnFilters = hiddenColumnFilterSlots.length > 0;
    if (!supplementaryFilters && !hasHiddenColumnFilters) {
      return null;
    }
    return (
      <>
        {supplementaryFilters}
        {hasHiddenColumnFilters ? (
          <SupplementaryFiltersBar>
            {hiddenColumnFilterSlots.map(({ column, filterNode, label }) => (
              <SupplementaryFilterField key={column.id} label={label} width="md" variant="floating">
                {filterNode}
              </SupplementaryFilterField>
            ))}
          </SupplementaryFiltersBar>
        ) : null}
      </>
    );
  }, [hiddenColumnFilterSlots, supplementaryFilters]);

  const showSupplementaryChrome =
    resolvedShowColumnFilters && Boolean(resolvedSupplementaryFilters);

  useLayoutEffect(() => {
    const node = supplementaryChromeRef.current;
    if (!showSupplementaryChrome || !node) {
      setSupplementaryChromeHeightPx(0);
      return;
    }
    const update = (): void => {
      setSupplementaryChromeHeightPx(Math.ceil(node.getBoundingClientRect().height));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [showSupplementaryChrome, resolvedSupplementaryFilters]);

  useLayoutEffect(() => {
    const row = columnFilterRowRef.current;
    if (!showColumnFilterRow || !row) {
      setColumnFilterRowHeightPx(0);
      return;
    }
    const update = (): void => {
      setColumnFilterRowHeightPx(Math.ceil(row.getBoundingClientRect().height));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(row);
    return () => {
      observer.disconnect();
    };
  }, [showColumnFilterRow, renderFilterCell, shellVisibleLeafColumnCount]);

  const headerGroupCount = table.getHeaderGroups().length;

  useLayoutEffect(() => {
    const head = tableHeadRef.current;
    const container = tableContainerRef.current;
    if (!head) {
      setStickyHeaderTopsPx([]);
      setStickyFilterTopPx(null);
      return;
    }

    const measureStickyHeadLayout = (): void => {
      if (container && container.scrollTop > 0) {
        return;
      }

      const headTop = head.getBoundingClientRect().top;
      const headerRows = Array.from(head.querySelectorAll("tr")).slice(0, headerGroupCount);
      const nextHeaderTopsPx = headerRows.map((row) =>
        Math.round(row.getBoundingClientRect().top - headTop)
      );

      let nextFilterTopPx: number | null = null;
      const filterRow = columnFilterRowRef.current;
      if (showColumnFilterRow && filterRow) {
        nextFilterTopPx = Math.round(filterRow.getBoundingClientRect().top - headTop);
      }

      setStickyHeaderTopsPx((prev) =>
        stickyOffsetsEqual(prev, nextHeaderTopsPx) ? prev : nextHeaderTopsPx
      );
      setStickyFilterTopPx((prev) => (prev === nextFilterTopPx ? prev : nextFilterTopPx));
    };

    measureStickyHeadLayout();
    const observer = new ResizeObserver(measureStickyHeadLayout);
    observer.observe(head);
    const onScroll = (): void => {
      if (container?.scrollTop === 0) {
        measureStickyHeadLayout();
      }
    };
    container?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      container?.removeEventListener("scroll", onScroll);
    };
  }, [
    headerGroupCount,
    isMobile,
    columnVisibilityState,
    shellVisibleLeafColumnCount,
    showColumnFilterRow,
  ]);

  const extraShellHeightPx = supplementaryChromeHeightPx + columnFilterRowHeightPx;
  const bodyRowHeightPx = isMobile ? 48 : 56;
  const mobileTableRowsMinHeightPx = bodyRowHeightPx * MOBILE_TABLE_ROWS_MIN_VISIBLE;

  const headerRowRef = useRef<HTMLTableRowElement>(null);
  const [headerRowHeightPx, setHeaderRowHeightPx] = useState(isMobile ? 40 : 56);

  useLayoutEffect(() => {
    const row = headerRowRef.current;
    if (!row) {
      return;
    }
    const update = (): void => {
      setHeaderRowHeightPx(Math.ceil(row.getBoundingClientRect().height));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(row);
    return () => {
      observer.disconnect();
    };
  }, [isMobile, shellVisibleLeafColumnCount]);

  const tableColumnFilters = table.getState().columnFilters;
  const hasTableColumnFilters = Array.isArray(tableColumnFilters) && tableColumnFilters.length > 0;
  const resolvedHasActiveFilters = hasActiveFilters ?? hasTableColumnFilters;

  const pinnedActionCellSx = (
    columnId: string,
    zIndex: number,
    backgroundColor: string
  ): Record<string, unknown> | undefined => {
    if (isMobile || columnId !== pinnedActionColumnId) {
      return undefined;
    }
    return {
      position: "sticky",
      insetInlineEnd: 0,
      zIndex,
      backgroundColor,
      borderInlineStart: pinnedActionColumnBorder,
    };
  };

  return (
    <Paper
      ref={listPaperRef}
      elevation={0}
      className={`${styles.listPaper} entity-table-shell`}
      sx={{
        border: `0.0625rem solid ${theme.palette.divider}`,
      }}
    >
      <Box
        ref={tableShellRef}
        className={`${styles.tableShell}${
          shouldFillViewport && viewportFillHeightPx != null
            ? ` ${styles.tableShellViewportFill}`
            : ""
        }${useNaturalPageHeight ? ` ${styles.tableShellNaturalHeight}` : ""}`}
        style={
          shouldFillViewport && viewportFillHeightPx != null
            ? {
                minHeight: viewportFillHeightPx,
                maxHeight: viewportFillHeightPx,
              }
            : useNaturalPageHeight
              ? ({
                  "--entity-table-rows-min-height": `${mobileTableRowsMinHeightPx}px`,
                } as CSSProperties)
              : ({
                  "--entity-table-shell-extra": `${extraShellHeightPx}px`,
                } as CSSProperties)
        }
      >
        <TableToolbar<TData>
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={t("table.toolbar.searchPlaceholder")}
          onClearSearch={onClearSearch}
          onRefresh={showRefresh ? onRefresh : undefined}
          loading={loading}
          refreshTooltip={t("table.toolbar.refresh")}
          clearSearchTooltip={t("table.toolbar.clearSearch")}
          table={showColumnVisibility ? table : undefined}
          columnVisibilityTooltip={t("table.toolbar.columnVisibility")}
          columnVisibilityLabel={t("table.toolbar.columnVisibilityLabel")}
          showSearch={showSearch}
          showRefresh={showRefresh}
          showColumnVisibility={showColumnVisibility}
          searchAdjacentActions={
            showFilterButton ? (
              <AppTooltip
                title={
                  resolvedShowColumnFilters
                    ? t("table.dataGrid.toolbar.hideColumnFilters")
                    : t("table.dataGrid.toolbar.toggleColumnFilters")
                }
                arrow
              >
                <IconButton
                  color={resolvedShowColumnFilters ? "primary" : "default"}
                  onClick={toggleShowColumnFilters}
                >
                  <Badge
                    variant="dot"
                    overlap="circular"
                    invisible={!resolvedHasActiveFilters}
                    className={attentionBadgeStyles.attentionBadgeRed}
                  >
                    <TuneIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </AppTooltip>
            ) : null
          }
          showNewButton={showNewButton}
          newButtonText={newButtonText}
          onNewClick={onNewClick}
        />

        {filtersBelowToolbar ? (
          <Box
            sx={{
              px: { xs: 1, md: 2 },
              py: 1,
              borderBottom: `0.0625rem solid ${theme.palette.divider}`,
            }}
          >
            {filtersBelowToolbar}
          </Box>
        ) : null}

        <Fade in={showSupplementaryChrome} timeout={{ enter: 220, exit: 180 }} unmountOnExit>
          <Box ref={supplementaryChromeRef}>{resolvedSupplementaryFilters}</Box>
        </Fade>

        <Box className={styles.tableScrollFrame}>
          <Box ref={tableContainerRef} className={styles.tableContainerFlex}>
            <Table
              size={isMobile ? "small" : "medium"}
              className={useFixedColumnWidths ? styles.tableLayoutFixed : styles.tableLayoutAuto}
              sx={{
                ...(tableContentWidth != null
                  ? columnLayoutMode === "fixed"
                    ? { width: tableContentWidth, minWidth: tableContentWidth }
                    : { width: "100%", minWidth: tableContentWidth }
                  : { width: "100%" }),
                borderCollapse: "separate",
                borderSpacing: 0,
                "& tbody .MuiTableCell-root": {
                  borderBottom: tableCellRowBorder,
                },
                "& thead .MuiTableCell-head": {
                  backgroundColor: pinnedActionHeaderBg,
                  borderBottom: "none",
                  boxShadow: tableRowDividerShadow,
                },
              }}
            >
              <colgroup>
                {shellVisibleLeafColumns.map((column) => (
                  <col
                    key={column.id}
                    style={{
                      width:
                        columnLayoutMode === "fixed"
                          ? columnWidthRem(column.id, effectiveColumnWidthById)
                          : columnWidthPercent(
                              column.id,
                              shellVisibleLeafColumnIds,
                              effectiveColumnWidthById
                            ),
                    }}
                  />
                ))}
              </colgroup>
              <TableHead>
                {table.getHeaderGroups().map((headerGroup, headerGroupIndex) => (
                  <TableRow
                    key={headerGroup.id}
                    ref={headerGroupIndex === 0 ? headerRowRef : undefined}
                  >
                    {shellVisibleLeafColumns.map((column) => {
                      const header = headerGroup.headers.find(
                        (h) => h.column.id === column.id && !h.isPlaceholder
                      );
                      if (!header) {
                        return null;
                      }
                      const headerRowZIndex = 40 - headerGroup.depth;
                      const isActionsColumn = column.id === pinnedActionColumnId;
                      return (
                        <TableCell
                          key={header.id}
                          align="center"
                          className={isActionsColumn ? styles.actionsColumnCell : undefined}
                          sx={{
                            position: "sticky",
                            top: 0,
                            zIndex: headerRowZIndex,
                            backgroundColor: pinnedActionHeaderBg,
                            fontWeight: 700,
                            whiteSpace: "normal",
                            minWidth: 0,
                            overflow: "hidden",
                            ...pinnedActionCellSx(
                              column.id,
                              headerRowZIndex + 1,
                              pinnedActionHeaderBg
                            ),
                          }}
                        >
                          {header.column.getCanSort() ? (
                            <TableSortLabel
                              active={header.column.getIsSorted() !== false}
                              direction={header.column.getIsSorted() === "asc" ? "asc" : "desc"}
                              onClick={header.column.getToggleSortingHandler()}
                              sx={{
                                whiteSpace: "normal",
                                transform: "translateX(0.8rem)",
                              }}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </TableSortLabel>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                {resolvedShowColumnFilters && renderFilterCell ? (
                  <TableRow ref={columnFilterRowRef}>
                    {(() => {
                      let columnsToSkip = 0;
                      return shellVisibleLeafColumns.map((column, columnIndex) => {
                        if (columnsToSkip > 0) {
                          columnsToSkip -= 1;
                          return null;
                        }

                        const isActionsColumn = column.id === pinnedActionColumnId;
                        const requestedColSpan = filterCellColSpanById?.[column.id] ?? 1;
                        const maxColSpan = shellVisibleLeafColumns.length - columnIndex;
                        const colSpan = Math.max(1, Math.min(requestedColSpan, maxColSpan));
                        columnsToSkip = colSpan - 1;

                        return (
                          <TableCell
                            key={`${column.id}-filter`}
                            align={isActionsColumn ? "center" : "inherit"}
                            colSpan={colSpan}
                            className={
                              isActionsColumn
                                ? `${styles.tableFilterCell} ${styles.actionsColumnCell}`
                                : styles.tableFilterCell
                            }
                            sx={{
                              position: "sticky",
                              top: `${headerRowHeightPx}px`,
                              zIndex: 30,
                              backgroundColor: pinnedActionHeaderBg,
                              minWidth: 0,
                              whiteSpace: isActionsColumn ? "nowrap" : undefined,
                              ...pinnedActionCellSx(column.id, 31, pinnedActionHeaderBg),
                            }}
                          >
                            {isActionsColumn && onApplyFilters && onClearFilters ? (
                              <Box className={styles.actionsCellFlex}>
                                <AppTooltip title={t("table.dataGrid.filter.applyFilters")} arrow>
                                  <IconButton size="small" color="primary" onClick={onApplyFilters}>
                                    <SearchIcon fontSize="small" />
                                  </IconButton>
                                </AppTooltip>
                                <AppTooltip
                                  title={t("table.dataGrid.filter.clearAllFilters")}
                                  arrow
                                >
                                  <IconButton size="small" color="default" onClick={onClearFilters}>
                                    <FilterAltOffIcon fontSize="small" />
                                  </IconButton>
                                </AppTooltip>
                              </Box>
                            ) : (
                              renderFilterCell(column)
                            )}
                          </TableCell>
                        );
                      });
                    })()}
                  </TableRow>
                ) : null}
              </TableHead>
              <TableBody>
                {pagedRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={shellVisibleLeafColumnCount}
                      align="center"
                      className={styles.noDataCell}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {noDataLabel ?? t("table.dataGrid.emptyState.noData")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedRows.map((row) => {
                    const visibleCells = row.getVisibleCells();
                    return (
                      <TableRow
                        key={row.id}
                        hover
                        onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                        className={onRowClick ? styles.clickableRow : undefined}
                      >
                        {shellVisibleLeafColumns.map((column) => {
                          const cell = visibleCells.find((c) => c.column.id === column.id);
                          if (!cell) {
                            return null;
                          }
                          const bodyPinnedBg = theme.palette.background.paper;
                          const isActionsColumn = column.id === pinnedActionColumnId;
                          const cellContent = flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          );
                          return (
                            <TableCell
                              key={cell.id}
                              align="center"
                              className={isActionsColumn ? styles.actionsColumnCell : undefined}
                              onClick={
                                isActionsColumn ? (event) => event.stopPropagation() : undefined
                              }
                              sx={{
                                minWidth: 0,
                                overflow: "hidden",
                                ...pinnedActionCellSx(column.id, 1, bodyPinnedBg),
                                ...(isActionsColumn && !isMobile
                                  ? {
                                      "@media (hover: hover)": {
                                        ".MuiTableRow-root:hover &": {
                                          backgroundColor: opaquePinnedRowHoverBg,
                                        },
                                      },
                                    }
                                  : {}),
                              }}
                            >
                              {isActionsColumn ? (
                                cellContent
                              ) : (
                                <TruncatedTableCellContent>{cellContent}</TruncatedTableCellContent>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>
          <Box className={styles.tableSideRailStart} aria-hidden />
          <Box className={styles.tableSideRailEnd} aria-hidden />
        </Box>

        <TablePaginationFooter
          count={pagination.pagedRowsCount}
          total={pagination.totalFiltered}
          page={pagination.currentPage}
          pageSize={pagination.pageSize}
          totalPages={pagination.totalPages}
          onPageChange={(_event, value) => pagination.onPageChange(value)}
          onPageSizeChange={(event) => pagination.onPageSizeChange(Number(event.target.value))}
          showingText={t("table.pagination.showing", {
            count: pagination.pagedRowsCount,
            total: pagination.totalFiltered,
          })}
          rowsPerPageText={t("table.pagination.rowsPerPage")}
        />
      </Box>
    </Paper>
  );
}

export default EntityTableShell;
