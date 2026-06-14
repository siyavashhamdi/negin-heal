import { type ReactElement, type ReactNode } from "react";
import { Box, useTheme } from "@mui/material";
import styles from "./styles/SupplementaryFiltersBar.module.scss";

export interface SupplementaryFiltersBarProps {
  /** Table-specific filter controls (use {@link SupplementaryFilterField} per field). */
  children: ReactNode;
}

/**
 * Shared strip for SP/API filters that are not table columns.
 * Rendered by {@link EntityTableShell} when column filters are visible.
 */
const SupplementaryFiltersBar = ({ children }: SupplementaryFiltersBarProps): ReactElement => {
  const theme = useTheme();

  return (
    <Box className={styles.bar} sx={{ borderBottom: `0.0625rem solid ${theme.palette.divider}` }}>
      {children}
    </Box>
  );
};

export default SupplementaryFiltersBar;
