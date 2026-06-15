import type { ReactElement, ReactNode } from "react";
import { Paper, Stack } from "@mui/material";

const SectionPaper = ({ children }: { readonly children: ReactNode }): ReactElement => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: "background.paper" }}>
    <Stack spacing={2}>{children}</Stack>
  </Paper>
);

export default SectionPaper;
