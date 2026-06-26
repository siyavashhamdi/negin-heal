import { Box, CircularProgress } from "@mui/material";
import type { ReactElement } from "react";

export function RouteLoadingFallback(): ReactElement {
  return (
    <Box
      sx={{
        minHeight: "40dvh",
        display: "grid",
        placeItems: "center",
      }}
      aria-busy
      aria-live="polite"
    >
      <CircularProgress size={24} />
    </Box>
  );
}
