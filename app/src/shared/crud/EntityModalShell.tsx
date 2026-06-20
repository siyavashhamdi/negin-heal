import { type FormEventHandler, type ReactElement, type ReactNode, useRef } from "react";
import { useScrollContainerToTopOnOpen } from "../../hooks/useScrollContainerToTopOnOpen";
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
  /** Re-run scroll reset when dialog content identity changes (e.g. loaded edit record). */
  resetKey?: unknown;
  disableAutoFocus?: boolean;
  disableRestoreFocus?: boolean;
  /** Keep scrollbars visible on mobile (overrides global hide). */
  showVisibleScrollbar?: boolean;
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
  resetKey,
  disableAutoFocus,
  disableRestoreFocus,
  showVisibleScrollbar = false,
}: EntityModalShellProps): ReactElement => {
  const theme = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const { isCompact, dialogProps, getPaperProps, getContentProps } = useMobileDialogProps();
  const { onEntered } = useScrollContainerToTopOnOpen(open, contentRef, resetKey);

  const dialogContentClassName = `${styles.modalDialogContent} ${
    isCompact ? styles.modalDialogContentScrollMobile : styles.modalDialogContentScrollDesktop
  }${showVisibleScrollbar ? ` ${styles.modalDialogContentVisibleScrollbar}` : ""}`;

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
    <DialogContent
      ref={contentRef}
      {...getContentProps({ className: dialogContentClassName })}
    >
      {children}
    </DialogContent>
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
      disableAutoFocus={disableAutoFocus}
      disableRestoreFocus={disableRestoreFocus}
      {...dialogProps}
      fullWidth={fullWidth}
      TransitionProps={{ onEntered }}
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
