import { type FormEventHandler, type ReactElement, type ReactNode } from "react";
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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation();

  const dialogContentClassName = `${styles.modalDialogContent} ${
    isMobile ? styles.modalDialogContentScrollMobile : styles.modalDialogContentScrollDesktop
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

      <DialogContent className={dialogContentClassName}>{children}</DialogContent>

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
      fullWidth={fullWidth}
      fullScreen={isMobile}
      PaperProps={{
        className: isMobile ? styles.modalPaperMobileFlex : undefined,
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 2,
        },
      }}
    >
      {useFormWrapper ? (
        <Box
          component="form"
          onSubmit={onSubmit}
          className={isMobile ? styles.modalFormRootMobile : undefined}
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
