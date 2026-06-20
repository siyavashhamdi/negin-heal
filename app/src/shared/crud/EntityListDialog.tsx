import { type ReactElement, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  type DialogProps,
} from "@mui/material";

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
          pb: description ? 1 : undefined,
        }}
      >
        <Typography variant="h6" component="p" fontWeight={700}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        ) : null}
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
