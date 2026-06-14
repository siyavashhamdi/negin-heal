import { type ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useTranslation } from "../../hooks/useTranslation";

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

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{t("table.dataGrid.deleteDialog.title")}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {t("table.entity.deleteConfirmMessage", { title: entityTitle })}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="primary" variant="outlined" disabled={loading}>
          {t("table.dataGrid.deleteDialog.cancel")}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
          {t("table.dataGrid.deleteDialog.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EntityDeleteDialog;
