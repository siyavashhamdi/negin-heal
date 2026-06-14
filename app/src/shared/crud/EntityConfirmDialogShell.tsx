import { type ReactElement, type ReactNode } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  type Breakpoint,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        className: isMobile ? styles.modalPaperMobileFlex : undefined,
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 2,
        },
      }}
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
        className={isMobile ? styles.confirmDialogContentMobile : styles.confirmDialogContentDesktop}
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
