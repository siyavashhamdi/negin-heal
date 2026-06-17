import { type ReactElement, type ReactNode } from "react";
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

export interface EntityConfirmDialogShellProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Optional icon shown above the message (e.g. activate/deactivate). */
  icon?: ReactNode;
  /** Optional highlighted subject line (e.g. member name). */
  subjectLine?: string;
  children: ReactNode;
  footer: ReactNode;
  maxWidth?: Breakpoint;
}

const EntityConfirmDialogShell = ({
  open,
  title,
  onClose,
  icon,
  subjectLine,
  children,
  footer,
  maxWidth = "xs",
}: EntityConfirmDialogShellProps): ReactElement => {
  const theme = useTheme();
  const { isCompact, dialogProps, getPaperProps, getContentProps } = useMobileDialogProps();
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      {...dialogProps}
      PaperProps={getPaperProps({
        className: isCompact ? styles.modalPaperMobileFlex : undefined,
      })}
    >
      <DialogTitle className={styles.modalDialogTitle} sx={crudModalTitleSx(theme)}>
        <Typography variant="h6" component="div" className={styles.modalTitleTypography}>
          {title}
        </Typography>
        <IconButton aria-label={t("table.dataGrid.modal.close")} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        {...getContentProps({
          className: isCompact
            ? styles.confirmDialogContentMobile
            : styles.confirmDialogContentDesktop,
        })}
      >
        <Box className={styles.confirmDialogBody}>
          {icon ? <Box className={styles.confirmDialogIconWrap}>{icon}</Box> : null}
          {subjectLine ? (
            <Typography variant="subtitle1" component="p" className={styles.confirmDialogSubject}>
              {subjectLine}
            </Typography>
          ) : null}
          {children}
        </Box>
      </DialogContent>

      <DialogActions
        className={styles.confirmDialogActions}
        sx={crudModalFooterSx(theme, { pinFooterToBottomOnMobile: true })}
      >
        {footer}
      </DialogActions>
    </Dialog>
  );
};

export default EntityConfirmDialogShell;
