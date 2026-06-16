import { type ReactElement } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "../../hooks/useTranslation";
import { crudModalFooterSx } from "./modalThemeSx";

interface EntityDeleteDialogProps {
  open: boolean;
  entityTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  fullScreen?: boolean;
}

const EntityDeleteDialog = ({
  open,
  entityTitle,
  onCancel,
  onConfirm,
  loading = false,
  fullScreen = false,
}: EntityDeleteDialogProps): ReactElement => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth fullScreen={fullScreen}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: fullScreen ? "100%" : undefined,
        }}
      >
        <DialogTitle>{t("table.dataGrid.deleteDialog.title")}</DialogTitle>
        <DialogContent dividers={fullScreen} sx={{ flex: fullScreen ? "1 1 auto" : undefined }}>
          <Typography variant="body2" color="text.secondary">
            {t("table.entity.deleteConfirmMessage", { title: entityTitle })}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={crudModalFooterSx(theme, {
            pinFooterToBottomOnMobile: fullScreen,
          })}
        >
          <Stack
            direction={fullScreen ? "column-reverse" : "row"}
            spacing={1.5}
            sx={{
              width: "100%",
              justifyContent: fullScreen ? "stretch" : "flex-end",
              "& .MuiButton-root": {
                width: fullScreen ? "100%" : "auto",
                minWidth: fullScreen ? undefined : "8rem",
              },
            }}
          >
            <Button onClick={onCancel} color="inherit" variant="outlined" disabled={loading}>
              {t("table.dataGrid.deleteDialog.cancel")}
            </Button>
            <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
              {t("table.dataGrid.deleteDialog.confirm")}
            </Button>
          </Stack>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default EntityDeleteDialog;
