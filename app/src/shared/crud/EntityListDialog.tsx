import { type ReactElement, type ReactNode, useRef } from "react";
import { useScrollContainerToTopOnOpen } from "../../hooks/useScrollContainerToTopOnOpen";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
  type DialogProps,
} from "@mui/material";
import { crudModalTitleSx } from "./modalThemeSx";
import styles from "./styles/EntityModalShell.module.scss";

interface EntityListDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly maxWidth?: DialogProps["maxWidth"];
  /** Re-run scroll reset when dialog content identity changes. */
  readonly resetKey?: unknown;
}

const EntityListDialog = ({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "xl",
  resetKey,
}: EntityListDialogProps): ReactElement => {
  const theme = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const { dialogProps, getPaperProps, getContentProps } = useMobileDialogProps();
  const { onEntered } = useScrollContainerToTopOnOpen(open, contentRef, resetKey);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={maxWidth}
      {...dialogProps}
      TransitionProps={{ onEntered }}
      aria-labelledby="entity-list-dialog-title"
      PaperProps={getPaperProps()}
    >
      <DialogTitle
        id="entity-list-dialog-title"
        className={styles.modalDialogTitle}
        sx={{
          ...crudModalTitleSx(theme),
          pb: description ? 1 : undefined,
        }}
      >
        <Typography variant="h6" component="p" className={styles.modalTitleTypography}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent
        ref={contentRef}
        dividers
        {...getContentProps({
          sx: {
            p: { xs: 1, sm: 2 },
            maxHeight: "calc(100vh - 10rem)",
          },
        })}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default EntityListDialog;
