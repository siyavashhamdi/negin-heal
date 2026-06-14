import { type ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "../../hooks/useTranslation";
import { useUsersManagementEntityTitle } from "./useUsersManagementEntityTitle";
import type { ManagedUserRecord } from "./users-management.types";

interface UsersManagementViewModalProps {
  open: boolean;
  record: ManagedUserRecord | null;
  onClose: () => void;
}

function FieldRow({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

const UsersManagementViewModal = ({
  open,
  record,
  onClose,
}: UsersManagementViewModalProps): ReactElement | null => {
  const { t } = useTranslation();
  const entityTitle = useUsersManagementEntityTitle();

  if (!record) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("table.entity.modalViewTitle", { title: entityTitle })}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <FieldRow
            label={t("pages.usersManagement.viewModal.firstName")}
            value={record.firstName}
          />
          <FieldRow label={t("pages.usersManagement.viewModal.lastName")} value={record.lastName} />
          <FieldRow label={t("pages.usersManagement.viewModal.username")} value={record.username} />
          <FieldRow label={t("pages.usersManagement.viewModal.email")} value={record.email} />
          <FieldRow
            label={t("pages.usersManagement.viewModal.mobile")}
            value={record.phoneNumber}
          />
          <FieldRow
            label={t("pages.usersManagement.viewModal.avatarFileId")}
            value={record.avatarFileId}
          />
          <FieldRow label={t("pages.usersManagement.viewModal.bio")} value={record.bio} />
          <FieldRow label={t("pages.usersManagement.viewModal.roleDesc")} value={record.roleDesc} />
          <FieldRow label={t("pages.usersManagement.viewModal.status")} value={record.status} />
          <FieldRow
            label={t("pages.usersManagement.viewModal.createdAt")}
            value={record.createdAt}
          />
          <FieldRow
            label={t("pages.usersManagement.viewModal.updatedAt")}
            value={record.updatedAt}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("table.dataGrid.modal.close")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UsersManagementViewModal;
