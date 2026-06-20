import { type FormEventHandler, type ReactElement, type ReactNode } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
  type Breakpoint,
} from "@mui/material";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { crudModalFooterSx, crudModalTitleSx } from "./modalThemeSx";
import styles from "./styles/EntityModalShell.module.scss";

export interface EntityModalShellProps {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: Breakpoint;
  fullWidth?: boolean;
  useFormWrapper?: boolean;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  pinFooterToBottomOnMobile?: boolean;
  /** When false, a successful save should not call onClose automatically. */
  closeOnSave?: boolean;
}

const EntityModalShell = ({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = "sm",
  fullWidth = true,
  useFormWrapper = false,
  onSubmit,
  pinFooterToBottomOnMobile = true,
}: EntityModalShellProps): ReactElement => {
  const theme = useTheme();
  const { isCompact, dialogProps, getPaperProps, getContentProps } = useMobileDialogProps();

  const dialogContentClassName = `${styles.modalDialogContent} ${
    isCompact ? styles.modalDialogContentScrollMobile : styles.modalDialogContentScrollDesktop
  }`;

  const renderHeader = (): ReactElement => (
    <DialogTitle className={styles.modalDialogTitle} sx={crudModalTitleSx(theme)}>
      <Stack spacing={subtitle ? 0.5 : 0}>
        <Typography variant="h6" component="div" className={styles.modalTitleTypography}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" component="div">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
    </DialogTitle>
  );

  const renderContent = (): ReactElement => (
    <DialogContent {...getContentProps({ className: dialogContentClassName })}>{children}</DialogContent>
  );

  const renderFooter = (): ReactElement | null =>
    footer != null ? (
      <Box component="footer" sx={crudModalFooterSx(theme, { pinFooterToBottomOnMobile })}>
        {footer}
      </Box>
    ) : null;

  const renderedBody = (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
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
          {renderedBody}
        </Box>
      ) : (
        renderedBody
      )}
    </Dialog>
  );
};

export default EntityModalShell;
