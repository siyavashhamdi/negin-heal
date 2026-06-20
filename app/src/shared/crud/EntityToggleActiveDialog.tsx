import { type ReactElement } from "react";
import {
  HowToRegOutlined as HowToRegOutlinedIcon,
  PersonOffOutlined as PersonOffOutlinedIcon,
} from "@mui/icons-material";
import { Avatar, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "../../hooks/useTranslation";
import EntityConfirmDialogShell from "./EntityConfirmDialogShell";
import ModalFooterActions from "./ModalFooterActions";

export type EntityToggleActiveMode = "activate" | "deactivate";

interface EntityToggleActiveDialogProps {
  open: boolean;
  mode: EntityToggleActiveMode;
  /** Display name shown in the confirmation message (e.g. member full name). */
  subjectName: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const EntityToggleActiveDialog = ({
  open,
  mode,
  subjectName,
  onCancel,
  onConfirm,
  loading = false,
}: EntityToggleActiveDialogProps): ReactElement => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isActivate = mode === "activate";

  const icon = (
    <Avatar
      sx={{
        width: isMobile ? 72 : 56,
        height: isMobile ? 72 : 56,
        bgcolor: isActivate ? "success.main" : "error.main",
        color: "common.white",
      }}
    >
      {isActivate ? (
        <HowToRegOutlinedIcon sx={{ fontSize: isMobile ? 40 : 32 }} />
      ) : (
        <PersonOffOutlinedIcon sx={{ fontSize: isMobile ? 40 : 32 }} />
      )}
    </Avatar>
  );

  return (
    <EntityConfirmDialogShell
      open={open}
      title={t(
        isActivate
          ? "table.dataGrid.toggleActiveDialog.activateTitle"
          : "table.dataGrid.toggleActiveDialog.deactivateTitle"
      )}
      onClose={onCancel}
      icon={icon}
      subjectLine={subjectName}
      footer={
        <ModalFooterActions
          reverseOrderOnMobile={isMobile}
          actions={[
            {
              key: "close",
              isCloseButton: true,
              onClick: onCancel,
              disabled: loading,
            },
            {
              key: "confirm",
              label: t(
                isActivate
                  ? "table.dataGrid.toggleActiveDialog.confirmActivate"
                  : "table.dataGrid.toggleActiveDialog.confirmDeactivate"
              ),
              onClick: onConfirm,
              color: isActivate ? "success" : "error",
              variant: "contained",
              disabled: loading,
            },
          ]}
        />
      }
    >
      <Typography variant="body1" color="text.secondary" textAlign="center">
        {t(
          isActivate
            ? "table.dataGrid.toggleActiveDialog.activateMessage"
            : "table.dataGrid.toggleActiveDialog.deactivateMessage"
        )}
      </Typography>
    </EntityConfirmDialogShell>
  );
};

export default EntityToggleActiveDialog;
