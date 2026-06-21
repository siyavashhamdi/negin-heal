import type { ReactElement, ReactNode } from "react";
import { Paper, Stack } from "@mui/material";
import { APP_SURFACE_BG } from "../../../shared/crud/modalThemeSx";

const SectionPaper = ({ children }: { readonly children: ReactNode }): ReactElement => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: APP_SURFACE_BG }}>
    <Stack spacing={2}>{children}</Stack>
  </Paper>
);

export default SectionPaper;
