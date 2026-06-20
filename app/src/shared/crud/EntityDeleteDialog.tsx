import { type ReactElement, type ReactNode } from "react";
import { Typography } from "@mui/material";
import { useTranslation } from "../../hooks/useTranslation";
import EntityConfirmDialogShell from "./EntityConfirmDialogShell";
import ModalFooterActions from "./ModalFooterActions";

interface EntityDeleteDialogProps {
  open: boolean;
  entityTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const EntityDeleteDialog = ({
  open,
  entityTitle,
  onCancel,
  onConfirm,
  loading = false,
  icon,
  children,
}: EntityDeleteDialogProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <EntityConfirmDialogShell
      open={open}
      onClose={loading ? undefined : onCancel}
      title={t("table.dataGrid.deleteDialog.title")}
      subjectLine={entityTitle}
      icon={icon}
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
      <Typography variant="body2" color="text.secondary">
        {t("table.entity.deleteConfirmMessage", { title: entityTitle })}
      </Typography>
      {children}
    </EntityConfirmDialogShell>
  );
};

export default EntityDeleteDialog;
