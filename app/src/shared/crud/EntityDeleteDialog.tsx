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
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { useTranslation } from "../../hooks/useTranslation";
import { crudModalFooterSx } from "./modalThemeSx";

interface EntityDeleteDialogProps {
  open: boolean;
  entityTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const EntityDeleteDialog = ({
  open,
  entityTitle,
  onCancel,
  onConfirm,
  loading = false,
}: EntityDeleteDialogProps): ReactElement => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isCompact, dialogProps, getPaperProps, getContentProps } = useMobileDialogProps();

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="xs"
      {...dialogProps}
      PaperProps={getPaperProps()}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: isCompact ? "100%" : undefined,
        }}
      >
        <DialogTitle>{t("table.dataGrid.deleteDialog.title")}</DialogTitle>
        <DialogContent
          dividers={isCompact}
          {...getContentProps({ sx: isCompact ? { flex: "1 1 auto" } : undefined })}
        >
          <Typography variant="body2" color="text.secondary">
            {t("table.entity.deleteConfirmMessage", { title: entityTitle })}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={crudModalFooterSx(theme, {
            pinFooterToBottomOnMobile: isCompact,
          })}
        >
          <Stack
            direction={isCompact ? "column-reverse" : "row"}
            spacing={1.5}
            sx={{
              width: "100%",
              justifyContent: isCompact ? "stretch" : "flex-end",
              "& .MuiButton-root": {
                width: isCompact ? "100%" : "auto",
                minWidth: isCompact ? undefined : "8rem",
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
