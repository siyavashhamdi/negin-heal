import { type ReactElement, type ReactNode, isValidElement, cloneElement } from "react";
import { WarningAmberRounded as WarningAmberRoundedIcon } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { useTranslation } from "../../hooks/useTranslation";
import EntityConfirmDialogShell from "./EntityConfirmDialogShell";
import ModalFooterActions from "./ModalFooterActions";
import confirmStyles from "./styles/EntityConfirmDialog.module.scss";

interface EntityDeleteDialogProps {
  open: boolean;
  entityTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  /** Centered layout with icon, bold message, and action buttons matching product delete dialogs. */
  prominent?: boolean;
}

const EntityDeleteDialog = ({
  open,
  entityTitle,
  onCancel,
  onConfirm,
  loading = false,
  icon,
  children,
  prominent = false,
}: EntityDeleteDialogProps): ReactElement => {
  const { t } = useTranslation();
  const { isCompact } = useMobileDialogProps();

  const resolvedIcon =
    icon ??
    (prominent ? (
      <Box className={confirmStyles.confirmDialogIconDestructive}>
        <WarningAmberRoundedIcon />
      </Box>
    ) : undefined);

  const resolvedHint =
    prominent && children != null && isValidElement(children)
      ? cloneElement(children, {
          className: [confirmStyles.confirmDialogHint, children.props.className]
            .filter(Boolean)
            .join(" "),
        })
      : children;

  return (
    <EntityConfirmDialogShell
      open={open}
      onClose={loading ? undefined : onCancel}
      subjectLine={prominent ? entityTitle : undefined}
      subjectClassName={prominent ? confirmStyles.confirmDialogSubjectHighlight : undefined}
      icon={resolvedIcon}
      paperClassName={
        prominent
          ? [
              confirmStyles.confirmDialogPaper,
              isCompact ? confirmStyles.confirmDialogPaperMobileDestructive : undefined,
            ]
              .filter(Boolean)
              .join(" ")
          : undefined
      }
      contentClassName={prominent ? confirmStyles.confirmDialogContent : undefined}
      bodyClassName={prominent ? confirmStyles.confirmDialogBody : undefined}
      actionsClassName={prominent ? confirmStyles.confirmDialogActions : undefined}
      footer={
        <ModalFooterActions
          actions={[
            {
              key: "close",
              isCloseButton: true,
              onClick: onCancel,
              disabled: loading,
            },
            {
              key: "confirm",
              label: t("table.dataGrid.deleteDialog.confirm"),
              onClick: onConfirm,
              isDestructive: true,
              disabled: loading,
            },
          ]}
        />
      }
    >
      <Typography
        variant="body2"
        color={prominent ? undefined : "text.secondary"}
        className={prominent ? confirmStyles.confirmDialogMessage : undefined}
      >
        {t("table.entity.deleteConfirmMessage", { title: entityTitle })}
      </Typography>
      {resolvedHint}
    </EntityConfirmDialogShell>
  );
};

export default EntityDeleteDialog;
