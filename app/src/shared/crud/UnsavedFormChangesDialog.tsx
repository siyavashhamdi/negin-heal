import { type ReactElement } from "react";
import { WarningAmberRounded as WarningAmberRoundedIcon } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { useTranslation } from "../../hooks/useTranslation";
import EntityConfirmDialogShell from "./EntityConfirmDialogShell";
import ModalFooterActions from "./ModalFooterActions";
import confirmStyles from "./styles/EntityConfirmDialog.module.scss";

type UnsavedFormChangesDialogProps = {
  readonly open: boolean;
  readonly onStay: () => void;
  readonly onDiscard: () => void;
};

const UnsavedFormChangesDialog = ({
  open,
  onStay,
  onDiscard,
}: UnsavedFormChangesDialogProps): ReactElement => {
  const { t } = useTranslation();
  const { isCompact } = useMobileDialogProps();

  return (
    <EntityConfirmDialogShell
      open={open}
      onClose={onStay}
      paperClassName={[
        confirmStyles.confirmDialogPaper,
        isCompact ? confirmStyles.confirmDialogPaperMobileWarning : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
      contentClassName={confirmStyles.confirmDialogContent}
      bodyClassName={confirmStyles.confirmDialogBody}
      actionsClassName={confirmStyles.confirmDialogActions}
      icon={
        <Box className={confirmStyles.confirmDialogIconWarning}>
          <WarningAmberRoundedIcon />
        </Box>
      }
      footer={
        <ModalFooterActions
          actions={[
            {
              key: "stay",
              isCloseButton: true,
              label: t("table.dataGrid.modal.unsavedChangesStay"),
              onClick: onStay,
            },
            {
              key: "discard",
              label: t("table.dataGrid.modal.unsavedChangesDiscard"),
              onClick: onDiscard,
              variant: "contained",
              color: "warning",
            },
          ]}
        />
      }
    >
      <Typography variant="body2" className={confirmStyles.confirmDialogMessage}>
        {t("table.dataGrid.modal.unsavedChangesMessage")}
      </Typography>
      <Typography variant="body2" className={confirmStyles.confirmDialogHint}>
        {t("table.dataGrid.modal.unsavedChangesHint")}
      </Typography>
    </EntityConfirmDialogShell>
  );
};

export default UnsavedFormChangesDialog;
