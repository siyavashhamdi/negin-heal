import { type ReactElement, type ReactNode } from "react";
import { Stack, Typography } from "@mui/material";
import { useTranslation } from "../../hooks/useTranslation";
import { useUsersManagementEntityTitle } from "./useUsersManagementEntityTitle";
import { getFileIdFromAccessUrl } from "../../utils/fileAccessUrl.util";
import type { ManagedUserRecord } from "./users-management.types";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import ModalFooterActions from "../../shared/crud/ModalFooterActions";
import DateTimeValue from "../../shared/display/DateTimeValue";

interface UsersManagementViewModalProps {
  open: boolean;
  record: ManagedUserRecord | null;
  onClose: () => void;
}

function FieldRow({ label, value }: { label: string; value: ReactNode }): ReactElement {
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
    <EntityModalShell
      open={open}
      onClose={onClose}
      maxWidth="sm"
      title={t("table.entity.modalViewTitle", { title: entityTitle })}
      subtitle={
        [record.firstName, record.lastName].filter(Boolean).join(" ").trim() ||
        record.username?.trim() ||
        t("pages.usersManagement.viewModal.subtitle")
      }
      footer={
        <ModalFooterActions
          actions={[
            {
              key: "close",
              isCloseButton: true,
              onClick: onClose,
            },
          ]}
        />
      }
      pinFooterToBottomOnMobile
    >
      <Stack spacing={2}>
        <FieldRow label={t("pages.usersManagement.viewModal.firstName")} value={record.firstName} />
        <FieldRow label={t("pages.usersManagement.viewModal.lastName")} value={record.lastName} />
        <FieldRow label={t("pages.usersManagement.viewModal.username")} value={record.username} />
        <FieldRow label={t("pages.usersManagement.viewModal.email")} value={record.email} />
        <FieldRow label={t("pages.usersManagement.viewModal.mobile")} value={record.phoneNumber} />
        <FieldRow
          label={t("pages.usersManagement.viewModal.avatarFileId")}
          value={getFileIdFromAccessUrl(record.avatarAccessUrl) ?? "—"}
        />
        <FieldRow label={t("pages.usersManagement.viewModal.bio")} value={record.bio} />
        <FieldRow label={t("pages.usersManagement.viewModal.roleDesc")} value={record.roleDesc} />
        <FieldRow label={t("pages.usersManagement.viewModal.status")} value={record.status} />
        <FieldRow
          label={t("pages.usersManagement.viewModal.createdAt")}
          value={<DateTimeValue value={record.createdAt} emphasizeDate />}
        />
        <FieldRow
          label={t("pages.usersManagement.viewModal.updatedAt")}
          value={<DateTimeValue value={record.updatedAt} emphasizeDate />}
        />
      </Stack>
    </EntityModalShell>
  );
};

export default UsersManagementViewModal;
