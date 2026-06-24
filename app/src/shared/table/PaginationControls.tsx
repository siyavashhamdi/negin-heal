import { type ReactElement } from "react";
import {
  Box,
  ButtonBase,
  Typography,
  Pagination,
  PaginationItem,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import type { PaginationRenderItemParams } from "@mui/material/Pagination";
import { useTranslation } from "../../hooks/useTranslation";
import { usePaginationGoToPagePopover } from "./PaginationGoToPagePopover";
import styles from "./styles/PaginationControls.module.scss";
import AppTooltip from "../AppTooltip";

function paginationItemTooltipKey(type: PaginationRenderItemParams["type"]): string | null {
  switch (type) {
    case "first":
      return "table.pagination.firstPage";
    case "previous":
      return "table.pagination.previousPage";
    case "next":
      return "table.pagination.nextPage";
    case "last":
      return "table.pagination.lastPage";
    case "start-ellipsis":
    case "end-ellipsis":
      return "table.pagination.goToPage";
    default:
      return null;
  }
}

function isPaginationEllipsis(type: PaginationRenderItemParams["type"]): boolean {
  return type === "start-ellipsis" || type === "end-ellipsis";
}

export interface PaginationControlsProps {
  count: number;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  onPageSizeChange: (event: { target: { value: string } }) => void;
  showingText?: string;
  rowsPerPageText?: string;
  pageSizeOptions?: number[];
}

const PaginationControls = ({
  count,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  showingText,
  rowsPerPageText,
  pageSizeOptions = [4, 10, 25, 50, 100],
}: PaginationControlsProps): ReactElement => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const paginationSize = isMobile ? "small" : "medium";
  const { openGoToPagePopover, goToPagePopover } = usePaginationGoToPagePopover({
    totalPages,
    onPageChange,
  });

  const renderEllipsisItem = (): ReactElement => {
    const goToPageLabel = t("table.pagination.goToPage");

    return (
      <AppTooltip title={goToPageLabel} arrow>
        <ButtonBase
          className={[
            styles.ellipsisButton,
            "MuiPaginationItem-root",
            "MuiPaginationItem-ellipsis",
            "MuiPaginationItem-rounded",
            paginationSize === "small"
              ? "MuiPaginationItem-sizeSmall"
              : "MuiPaginationItem-sizeMedium",
          ].join(" ")}
          aria-label={goToPageLabel}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openGoToPagePopover(event.currentTarget);
          }}
        >
          …
        </ButtonBase>
      </AppTooltip>
    );
  };

  const renderPaginationItem = (item: PaginationRenderItemParams): ReactElement => {
    if (isPaginationEllipsis(item.type)) {
      return renderEllipsisItem();
    }

    const tooltipKey = paginationItemTooltipKey(item.type);
    const paginationItem = <PaginationItem {...item} />;

    if (tooltipKey == null) {
      return paginationItem;
    }

    return (
      <AppTooltip title={t(tooltipKey)} arrow>
        <span>{paginationItem}</span>
      </AppTooltip>
    );
  };

  return (
    <Box className={styles.root}>
      <Typography variant="body2" color="text.secondary" className={styles.summary}>
        {showingText || t("table.pagination.showing", { count, total })}
      </Typography>

      <Box className={styles.controlsRow}>
        {rowsPerPageText && !isMobile ? (
          <Box
            className={styles.pageSizeWrap}
            sx={{
              minWidth: theme.spacing(15),
              flexShrink: 0,
              maxWidth: "100%",
            }}
          >
            <FormControl size="small" fullWidth className={styles.pageSizeControl}>
              <InputLabel className={styles.inputLabel}>{rowsPerPageText}</InputLabel>
              <Select
                value={pageSize.toString()}
                label={rowsPerPageText}
                onChange={onPageSizeChange}
                className={styles.select}
              >
                {pageSizeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ) : null}

        <Pagination
          count={totalPages}
          page={page}
          onChange={onPageChange}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
          siblingCount={isMobile ? 0 : 1}
          boundaryCount={isMobile ? 0 : 1}
          size={paginationSize}
          className={styles.pagination}
          renderItem={renderPaginationItem}
        />
      </Box>

      {goToPagePopover}
    </Box>
  );
};

export default PaginationControls;
