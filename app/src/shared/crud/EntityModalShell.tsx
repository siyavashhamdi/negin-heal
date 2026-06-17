import { type FormEventHandler, type ReactElement, type ReactNode } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
  type Breakpoint,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { crudModalFooterSx, crudModalTitleSx } from "./modalThemeSx";
import styles from "./styles/EntityModalShell.module.scss";

export interface EntityModalShellProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  maxWidth?: Breakpoint;
  fullWidth?: boolean;
  useFormWrapper?: boolean;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  pinFooterToBottomOnMobile?: boolean;
}

const EntityModalShell = ({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidth = "sm",
  fullWidth = true,
  useFormWrapper = false,
  onSubmit,
  pinFooterToBottomOnMobile = false,
}: EntityModalShellProps): ReactElement => {
  const theme = useTheme();
  const { isCompact, dialogProps, getPaperProps, getContentProps } = useMobileDialogProps();
  const { t } = useTranslation();

  const dialogContentClassName = `${styles.modalDialogContent} ${
    isCompact ? styles.modalDialogContentScrollMobile : styles.modalDialogContentScrollDesktop
  }`;

  const body = (
    <>
      <DialogTitle className={styles.modalDialogTitle} sx={crudModalTitleSx(theme)}>
        <Typography variant="h6" component="div" className={styles.modalTitleTypography}>
          {title}
        </Typography>
        <IconButton aria-label={t("table.dataGrid.modal.close")} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent {...getContentProps({ className: dialogContentClassName })}>
        {children}
      </DialogContent>

      <DialogActions
        sx={crudModalFooterSx(theme, {
          pinFooterToBottomOnMobile,
        })}
      >
        {footer}
      </DialogActions>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      {...dialogProps}
      fullWidth={fullWidth}
      PaperProps={getPaperProps({
        className: isCompact ? styles.modalPaperMobileFlex : undefined,
      })}
    >
      {useFormWrapper ? (
        <Box
          component="form"
          onSubmit={onSubmit}
          className={isCompact ? styles.modalFormRootMobile : undefined}
        >
          {body}
        </Box>
      ) : (
        body
      )}
    </Dialog>
  );
};

export default EntityModalShell;
