import { type ReactElement, type ReactNode, useRef } from "react";
import { useScrollContainerToTopOnOpen } from "../../hooks/useScrollContainerToTopOnOpen";
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
import confirmStyles from "./styles/EntityConfirmDialog.module.scss";
import styles from "./styles/EntityModalShell.module.scss";

export interface EntityConfirmDialogShellProps {
  open: boolean;
  /** Omit for icon/message-only confirmations (delete, unsaved changes). */
  title?: string;
  onClose?: () => void;
  /** Optional icon shown above the message (e.g. activate/deactivate). */
  icon?: ReactNode;
  /** Optional highlighted subject line (e.g. member name). */
  subjectLine?: string;
  children: ReactNode;
  footer: ReactNode;
  maxWidth?: Breakpoint;
  /** Re-run scroll reset when dialog content identity changes. */
  resetKey?: unknown;
  paperClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
  bodyClassName?: string;
  actionsClassName?: string;
  subjectClassName?: string;
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
  resetKey,
  paperClassName,
  titleClassName,
  contentClassName,
  bodyClassName,
  actionsClassName,
  subjectClassName,
}: EntityConfirmDialogShellProps): ReactElement => {
  const theme = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const { isCompact, dialogProps, getPaperProps, getContentProps } = useMobileDialogProps();
  const { onEntered } = useScrollContainerToTopOnOpen(open, contentRef, resetKey);

  const dialogTitleClassName = [styles.modalDialogTitle, titleClassName].filter(Boolean).join(" ");
  const showTitle = Boolean(title?.trim());

  const dialogContentClassName = [
    isCompact ? styles.confirmDialogContentMobile : styles.confirmDialogContentDesktop,
    !showTitle ? confirmStyles.confirmDialogContentNoTitle : undefined,
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ");
  const dialogBodyClassName = [styles.confirmDialogBody, bodyClassName].filter(Boolean).join(" ");
  const dialogActionsClassName = [styles.confirmDialogActions, actionsClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      {...dialogProps}
      TransitionProps={{ onEntered }}
      PaperProps={getPaperProps({
        className:
          [isCompact ? styles.modalPaperMobileFlex : undefined, paperClassName]
            .filter(Boolean)
            .join(" ") || undefined,
      })}
    >
      {showTitle ? (
        <DialogTitle className={dialogTitleClassName} sx={crudModalTitleSx(theme)}>
          <Typography variant="h6" component="div" className={styles.modalTitleTypography}>
            {title}
          </Typography>
        </DialogTitle>
      ) : null}

      <DialogContent
        ref={contentRef}
        {...getContentProps({
          className: dialogContentClassName,
        })}
      >
        <Box className={dialogBodyClassName}>
          {icon ? <Box className={styles.confirmDialogIconWrap}>{icon}</Box> : null}
          {subjectLine ? (
            <Typography
              variant="subtitle1"
              component="p"
              className={[styles.confirmDialogSubject, subjectClassName].filter(Boolean).join(" ")}
            >
              {subjectLine}
            </Typography>
          ) : null}
          {children}
        </Box>
      </DialogContent>

      <Box
        component="footer"
        className={dialogActionsClassName}
        sx={crudModalFooterSx(theme, { pinFooterToBottomOnMobile: true })}
      >
        {footer}
      </Box>
    </Dialog>
  );
};

export default EntityConfirmDialogShell;
