import { type ReactElement } from "react";
import { Box, IconButton } from "@mui/material";
import {
  DeleteOutline as DeleteOutlineIcon,
  FileDownloadOutlined as FileDownloadOutlinedIcon,
  EditOutlined as EditOutlinedIcon,
  GroupsOutlined as GroupsOutlinedIcon,
  HistoryOutlined as HistoryOutlinedIcon,
  HowToRegOutlined as HowToRegOutlinedIcon,
  LinkOffOutlined as LinkOffOutlinedIcon,
  ListAltOutlined as ListAltOutlinedIcon,
  MenuOutlined as MenuOutlinedIcon,
  PersonOffOutlined as PersonOffOutlinedIcon,
  VisibilityOutlined as VisibilityOutlinedIcon,
} from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import styles from "./styles/EntityTableShell.module.scss";
import AppTooltip from "../AppTooltip";

interface CrudRowActionsProps {
  /** When omitted, the view action is hidden. */
  onView?: () => void;
  viewLabel?: string;
  /** When omitted, the edit action is hidden (read-only lists). */
  onEdit?: () => void;
  /** When omitted, the delete action is hidden (read-only lists). */
  onDelete?: () => void;
  /** When set, shows activate/deactivate toggle instead of delete. */
  isActive?: boolean;
  onToggleActive?: () => void;
  activateLabel?: string;
  deactivateLabel?: string;
  /** Optional row action (e.g. members list) when the feature is wired up. */
  onMembersList?: () => void;
  membersListLabel?: string;
  /** Optional activity-license download action. */
  onDownloadActivityLicense?: () => void;
  downloadActivityLicenseLabel?: string;
  /** Optional credential download action. */
  onDownloadCredential?: () => void;
  downloadCredentialLabel?: string;
  /** Optional operation-history action (تاریخچه عملیات). */
  onOperationHistory?: () => void;
  operationHistoryLabel?: string;
  /** Optional menu-access action (اعمال دسترسی). */
  onMenuAccess?: () => void;
  menuAccessLabel?: string;
  /** Optional menu items access action (دسترسی آیتم‌های منو). */
  onMenuItemsAccess?: () => void;
  menuItemsAccessLabel?: string;
  /** Optional role users list action (فهرست کاربران). */
  onUsersList?: () => void;
  usersListLabel?: string;
  /** Optional disconnect-from-organization action (قطع ارتباط با سازمان). */
  onDisconnectOrganization?: () => void;
  disconnectOrganizationLabel?: string;
}

const CrudRowActions = ({
  onView,
  viewLabel,
  onEdit,
  onDelete,
  isActive,
  onToggleActive,
  activateLabel,
  deactivateLabel,
  onMembersList,
  membersListLabel,
  onDownloadActivityLicense,
  downloadActivityLicenseLabel,
  onDownloadCredential,
  downloadCredentialLabel,
  onOperationHistory,
  operationHistoryLabel,
  onMenuAccess,
  menuAccessLabel,
  onMenuItemsAccess,
  menuItemsAccessLabel,
  onUsersList,
  usersListLabel,
  onDisconnectOrganization,
  disconnectOrganizationLabel,
}: CrudRowActionsProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <Box className={styles.actionsCellFlex}>
      {onView != null ? (
        <AppTooltip title={viewLabel ?? t("table.dataGrid.rowActions.viewDetails")} arrow>
          <IconButton size="small" onClick={onView}>
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
      ) : null}
      {onMembersList != null ? (
        <AppTooltip title={membersListLabel ?? ""} arrow>
          <IconButton size="small" onClick={onMembersList}>
            <GroupsOutlinedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
      ) : null}
      {onDownloadActivityLicense != null ? (
        <AppTooltip title={downloadActivityLicenseLabel ?? ""} arrow>
          <IconButton size="small" onClick={onDownloadActivityLicense}>
            <FileDownloadOutlinedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
      ) : null}
      {onDownloadCredential != null ? (
        <AppTooltip title={downloadCredentialLabel ?? ""} arrow>
          <IconButton size="small" onClick={onDownloadCredential}>
            <FileDownloadOutlinedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
      ) : null}
      {onMenuAccess != null ? (
        <AppTooltip title={menuAccessLabel ?? ""} arrow>
          <IconButton size="small" onClick={onMenuAccess}>
            <MenuOutlinedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
      ) : null}
      {onMenuItemsAccess != null ? (
        <AppTooltip title={menuItemsAccessLabel ?? ""} arrow>
          <IconButton size="small" onClick={onMenuItemsAccess}>
            <ListAltOutlinedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
      ) : null}
      {onUsersList != null ? (
        <AppTooltip title={usersListLabel ?? ""} arrow>
          <IconButton size="small" onClick={onUsersList}>
            <GroupsOutlinedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
      ) : null}
      {onEdit != null ? (
        <AppTooltip title={t("table.dataGrid.rowActions.edit")} arrow>
          <IconButton size="small" onClick={onEdit}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
      ) : null}
      {onDisconnectOrganization != null ? (
        <AppTooltip title={disconnectOrganizationLabel ?? ""} arrow>
          <IconButton size="small" color="error" onClick={onDisconnectOrganization}>
            <LinkOffOutlinedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
      ) : null}
      {onOperationHistory != null ? (
        <AppTooltip title={operationHistoryLabel ?? ""} arrow>
          <IconButton size="small" onClick={onOperationHistory}>
            <HistoryOutlinedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
      ) : null}
      {onToggleActive != null ? (
        isActive ? (
          <AppTooltip title={deactivateLabel ?? ""} arrow>
            <IconButton size="small" color="error" onClick={onToggleActive}>
              <PersonOffOutlinedIcon fontSize="small" />
            </IconButton>
          </AppTooltip>
        ) : (
          <AppTooltip title={activateLabel ?? ""} arrow>
            <IconButton size="small" color="success" onClick={onToggleActive}>
              <HowToRegOutlinedIcon fontSize="small" />
            </IconButton>
          </AppTooltip>
        )
      ) : null}
      {onDelete != null && onToggleActive == null ? (
        <AppTooltip title={t("table.dataGrid.rowActions.delete")} arrow>
          <IconButton size="small" color="error" onClick={onDelete}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
      ) : null}
    </Box>
  );
};

export default CrudRowActions;
