import { type ReactElement } from "react";
import { Box, useTheme } from "@mui/material";
import PaginationControls, { type PaginationControlsProps } from "./PaginationControls";
import styles from "./styles/TablePaginationFooter.module.scss";

export type TablePaginationFooterProps = PaginationControlsProps & {
  /** Optional extra class on the outer bar (e.g. page-specific layout). */
  className?: string;
};

const TablePaginationFooter = ({
  className,
  ...paginationProps
}: TablePaginationFooterProps): ReactElement => {
  const theme = useTheme();
  const barClass = [styles.bar, className].filter(Boolean).join(" ");

  return (
    <Box
      className={barClass}
      sx={{
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "#fafafa",
      }}
    >
      <PaginationControls {...paginationProps} />
    </Box>
  );
};

export default TablePaginationFooter;
