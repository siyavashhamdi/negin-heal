import {
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Badge,
  Box,
  Toolbar,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  Divider,
  Typography,
  Button,
  Fab,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  ViewColumn as ViewColumnIcon,
  Add as AddIcon,
  RestartAlt as RestartAltIcon,
} from "@mui/icons-material";
import type { VisibilityState, Table } from "@tanstack/react-table";
import { useTranslation } from "../../hooks/useTranslation";
import styles from "./styles/TableToolbar.module.scss";
import attentionBadgeStyles from "./styles/AttentionBadge.module.scss";
import AppTooltip from "../AppTooltip";

export interface TableToolbarProps<T = unknown> {
  /** Search input value */
  searchValue: string;
  /** Handler for search input changes */
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Placeholder text for search input */
  searchPlaceholder: string;
  /** Handler for clear search button */
  onClearSearch?: () => void;
  /** Handler for refresh button */
  onRefresh?: () => void;
  /** Whether the table is currently loading */
  loading?: boolean;
  /** Primary actions aligned to the trailing edge of the toolbar (e.g. extra controls). */
  actions?: ReactNode;
  /**
   * Icons or controls after the search field with refresh/column visibility (e.g. filter).
   */
  searchAdjacentActions?: ReactNode;
  /** Actions rendered before the search field */
  startActions?: ReactNode;
  /** Translation function for refresh tooltip */
  refreshTooltip?: string;
  /** Translation function for clear search tooltip */
  clearSearchTooltip?: string;
  /** TanStack Table instance for column visibility */
  table?: Table<T>;
  /** Tooltip text for column visibility button */
  columnVisibilityTooltip?: string;
  /** Label for column visibility menu */
  columnVisibilityLabel?: string;
  /** When true, shows a primary "new row" control (FAB on small screens, button on larger). */
  showNewButton?: boolean;
  /** Label for the new-row control (visible on desktop; used as tooltip / aria-label on mobile). */
  newButtonText?: string;
  onNewClick?: () => void;
  /** Toggle visibility of search input. Defaults to true. */
  showSearch?: boolean;
  /** Toggle visibility of refresh button. Defaults to true. */
  showRefresh?: boolean;
  /** Toggle visibility of column visibility button. Defaults to true. */
  showColumnVisibility?: boolean;
}

function TableToolbar<T = unknown>({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onClearSearch,
  onRefresh,
  loading = false,
  actions,
  searchAdjacentActions,
  startActions,
  refreshTooltip,
  clearSearchTooltip,
  table,
  columnVisibilityTooltip,
  columnVisibilityLabel,
  showNewButton = false,
  newButtonText,
  onNewClick,
  showSearch = true,
  showRefresh = true,
  showColumnVisibility = true,
}: TableToolbarProps<T>): ReactElement {
  const { t } = useTranslation();
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const defaultColumnVisibilityRef = useRef<VisibilityState | null>(null);
  const isMobileToolbar = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const clearLabel = clearSearchTooltip ?? t("table.toolbar.clearSearch");
  const refreshLabel = refreshTooltip ?? t("table.toolbar.refresh");
  const columnVisibilityLabelText = columnVisibilityTooltip ?? t("table.toolbar.columnVisibility");

  const handleClearSearch = () => {
    if (onClearSearch) {
      onClearSearch();
    } else {
      const event = {
        target: { value: "" },
      } as ChangeEvent<HTMLInputElement>;
      onSearchChange(event);
    }
  };

  const handleColumnMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setColumnMenuAnchor(event.currentTarget);
  };

  const handleColumnMenuClose = () => {
    setColumnMenuAnchor(null);
  };

  const toggleColumnVisibility = (columnId: string) => {
    if (!table) {
      return;
    }
    table.setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !(prev[columnId] ?? true),
    }));
  };

  const visibleColumns = table
    ? table.getAllColumns().filter((column) => column.getCanHide() && column.id !== "actions")
    : [];
  if (defaultColumnVisibilityRef.current === null && visibleColumns.length > 0) {
    defaultColumnVisibilityRef.current = visibleColumns.reduce<VisibilityState>((acc, column) => {
      acc[column.id] = column.getIsVisible();
      return acc;
    }, {});
  }

  const hasColumnVisibilityChanges = visibleColumns.some((column) => {
    const defaultVisible = defaultColumnVisibilityRef.current?.[column.id] ?? true;
    return column.getIsVisible() !== defaultVisible;
  });

  const handleResetColumnVisibilityDefaults = () => {
    if (!table || defaultColumnVisibilityRef.current == null) {
      return;
    }
    table.setColumnVisibility(defaultColumnVisibilityRef.current);
  };

  const canRenderNewButton = Boolean(showNewButton && newButtonText?.trim() && onNewClick);
  const newButtonLabel = newButtonText?.trim() ?? "";

  const newRowControl =
    canRenderNewButton && onNewClick ? (
      isMobileToolbar ? (
        <AppTooltip title={newButtonLabel} arrow>
          <Fab color="primary" size="small" aria-label={newButtonLabel} onClick={onNewClick}>
            <AddIcon />
          </Fab>
        </AppTooltip>
      ) : (
        <AppTooltip title={newButtonLabel} arrow>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={onNewClick}
            className={styles.createButtonNoShrink}
          >
            {newButtonLabel}
          </Button>
        </AppTooltip>
      )
    ) : null;

  const showTrailing = Boolean(newRowControl || actions);

  return (
    <Toolbar className={styles.toolbar}>
      <Box className={styles.leftCluster}>
        {startActions}
        <Box className={styles.searchRow}>
          {showSearch ? (
            <TextField
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={onSearchChange}
              size="small"
              className={`${styles.searchField} ${searchValue.trim() ? styles.searchFieldHasValue : ""}`}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchValue ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      edge="end"
                      aria-label={clearLabel}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          ) : null}
          <Box className={styles.iconActions}>
            {showRefresh && onRefresh && !isMobileToolbar && (
              <AppTooltip title={refreshLabel} arrow>
                <span>
                  <IconButton
                    color="default"
                    onClick={onRefresh}
                    disabled={loading}
                    aria-label={refreshLabel}
                    className={`${styles.iconActionButton} ${styles.refreshButton}`}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </span>
              </AppTooltip>
            )}
            {showColumnVisibility && table && visibleColumns.length > 0 && (
              <>
                <AppTooltip title={columnVisibilityLabelText} arrow>
                  <IconButton
                    color={hasColumnVisibilityChanges ? "primary" : "default"}
                    onClick={handleColumnMenuOpen}
                    aria-label={columnVisibilityLabelText}
                    className={styles.iconActionButton}
                  >
                    <Badge
                      variant="dot"
                      overlap="circular"
                      invisible={!hasColumnVisibilityChanges}
                      className={attentionBadgeStyles.attentionBadgeBlue}
                    >
                      <ViewColumnIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </AppTooltip>
                <Menu
                  anchorEl={columnMenuAnchor}
                  open={Boolean(columnMenuAnchor)}
                  onClose={handleColumnMenuClose}
                  PaperProps={{
                    className: styles.columnMenuPaper,
                  }}
                >
                  {columnVisibilityLabel && (
                    <>
                      <Box className={styles.columnMenuHeader}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {columnVisibilityLabel}
                        </Typography>
                        <AppTooltip title={t("table.toolbar.columnVisibilityResetDefault")} arrow>
                          <span>
                            <IconButton
                              size="small"
                              onClick={handleResetColumnVisibilityDefaults}
                              disabled={!hasColumnVisibilityChanges}
                              aria-label={t("table.toolbar.columnVisibilityResetDefault")}
                            >
                              <RestartAltIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </AppTooltip>
                      </Box>
                      <Divider />
                    </>
                  )}
                  {visibleColumns.map((column) => {
                    const isVisible = column.getIsVisible();
                    const defaultVisible = defaultColumnVisibilityRef.current?.[column.id] ?? true;
                    const isChangedFromDefault = isVisible !== defaultVisible;
                    return (
                      <MenuItem
                        key={column.id}
                        onClick={() => toggleColumnVisibility(column.id)}
                        dense
                      >
                        <Checkbox
                          checked={isVisible}
                          size="small"
                          sx={{
                            color: isChangedFromDefault ? "error.main" : "primary.main",
                            "&.Mui-checked": {
                              color: isChangedFromDefault ? "error.main" : "primary.main",
                            },
                          }}
                        />
                        <ListItemText
                          primary={
                            typeof column.columnDef.header === "string"
                              ? column.columnDef.header
                              : column.id
                          }
                        />
                      </MenuItem>
                    );
                  })}
                </Menu>
              </>
            )}
            {searchAdjacentActions}
          </Box>
        </Box>
      </Box>
      {showTrailing ? (
        <Box className={styles.trailingActions}>
          {newRowControl}
          {actions}
        </Box>
      ) : null}
    </Toolbar>
  );
}

export default TableToolbar;
