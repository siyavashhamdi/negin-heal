import { type ReactElement, type ReactNode } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  type DialogProps,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";

interface EntityListDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly maxWidth?: DialogProps["maxWidth"];
}

const EntityListDialog = ({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "xl",
}: EntityListDialogProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={maxWidth}
      scroll="paper"
      aria-labelledby="entity-list-dialog-title"
    >
      <DialogTitle
        id="entity-list-dialog-title"
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          pr: 1,
          pb: description ? 1 : undefined,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" component="p" fontWeight={700}>
            {title}
          </Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        <IconButton
          aria-label={t("table.dataGrid.modal.closeAria")}
          onClick={onClose}
          size="small"
          sx={{ flexShrink: 0 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          p: { xs: 1, sm: 2 },
          maxHeight: "calc(100vh - 10rem)",
          overflow: "auto",
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default EntityListDialog;
