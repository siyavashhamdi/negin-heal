import { type ReactElement, type ReactNode } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
  type Breakpoint,
} from "@mui/material";
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

      <Box
        component="footer"
        className={styles.confirmDialogActions}
        sx={crudModalFooterSx(theme, { pinFooterToBottomOnMobile: true })}
      >
        {footer}
      </Box>
    </Dialog>
  );
};

export default EntityConfirmDialogShell;
