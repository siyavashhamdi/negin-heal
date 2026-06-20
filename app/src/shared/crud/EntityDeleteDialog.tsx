import { type ReactElement } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { useTranslation } from "../../hooks/useTranslation";
import ModalFooterActions from "./ModalFooterActions";

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
        <ModalFooterActions
          pinFooterToBottomOnMobile={isCompact}
          actions={[
            {
              key: "close",
              label: "بستن",
              onClick: onCancel,
              color: "inherit",
              variant: "outlined",
              disabled: loading,
            },
            {
              key: "confirm",
              label: t("table.dataGrid.deleteDialog.confirm"),
              onClick: onConfirm,
              color: "error",
              variant: "contained",
              disabled: loading,
            },
          ]}
        />
      </Box>
    </Dialog>
  );
};

export default EntityDeleteDialog;
