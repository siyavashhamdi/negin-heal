import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { useQuery } from "@apollo/client/react";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";

import { APP_SETTING_UPDATE_MUTATION } from "../../graphql/mutations/appSettingUpdate.mutation";
import { APP_SETTING_DETAIL_QUERY } from "../../graphql/queries/appSettingDetail.query";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import ModalFooterActions from "../../shared/crud/ModalFooterActions";
import type { AppSettingRecord } from "./system-settings-list.api";
import {
  CommonSettingFields,
  JsonValueEditor,
  ScalarValueEditor,
  buildInitialEditForm,
  buildUpdateVariables,
  type AppSettingDetailQuery,
  type AppSettingDetailQueryVariables,
  type AppSettingEditFormState,
  type AppSettingUpdateMutation,
  type AppSettingUpdateMutationVariables,
  type JsonFormState,
} from "./edit";

interface SystemSettingEditDialogProps {
  readonly record: AppSettingRecord | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

const SystemSettingEditDialog = ({
  record,
  open,
  onClose,
  onSaved,
}: SystemSettingEditDialogProps): ReactElement => {
  const isMobile = useMediaQuery((muiTheme: Theme) => muiTheme.breakpoints.down("md"));
  const { dialogProps, getPaperProps, getContentProps } = useMobileDialogProps({
    breakpoint: "md",
  });
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const [form, setForm] = useState<AppSettingEditFormState | null>(null);
  const settingId = record?.id ?? "";

  const { data, loading: detailLoading } = useQuery<
    AppSettingDetailQuery,
    AppSettingDetailQueryVariables
  >(APP_SETTING_DETAIL_QUERY, {
    variables: { input: { id: settingId } },
    skip: !open || !settingId,
    fetchPolicy: "network-only",
  });

  const detail = data?.appSettingDetail?.id === settingId ? data.appSettingDetail : null;

  const [updateSetting, updateSettingResult] = useMutationWithSnackbar<
    AppSettingUpdateMutation,
    AppSettingUpdateMutationVariables
  >(APP_SETTING_UPDATE_MUTATION, {
    successMessage: "تنظیمات با موفقیت ذخیره شد.",
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  useEffect(() => {
    if (!open) {
      setForm(null);
      return;
    }
    if (detail) {
      setForm(buildInitialEditForm(detail));
    }
  }, [detail, open]);

  const updateForm = (patch: Partial<AppSettingEditFormState>): void => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const updateJson = (updater: (jsonValue: JsonFormState) => JsonFormState): void => {
    setForm((prev) => {
      if (!prev?.jsonValue) {
        return prev;
      }
      return { ...prev, jsonValue: updater(prev.jsonValue) };
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!detail || !form) {
      return;
    }

    try {
      void updateSetting({ variables: buildUpdateVariables(detail, form) });
    } catch (error) {
      showError(error instanceof Error ? error.message : "فرم تنظیمات معتبر نیست.");
    }
  };

  const isSaving = updateSettingResult.loading;
  const canSubmit = Boolean(detail && form && !detailLoading && !isSaving);

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      maxWidth="lg"
      {...dialogProps}
      PaperProps={getPaperProps()}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={900}>
              ویرایش تنظیمات سامانه
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {record?.label ?? record?.key ?? ""}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers {...getContentProps({ sx: { bgcolor: "background.default" } })}>
          {detailLoading || !detail || !form ? (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 260 }} spacing={2}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                در حال دریافت مقدار تنظیم...
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              <CommonSettingFields detail={detail} form={form} updateForm={updateForm} />
              {form.valueType === "JSON" && form.jsonValue ? (
                <JsonValueEditor jsonValue={form.jsonValue} updateJson={updateJson} />
              ) : (
                <ScalarValueEditor form={form} settingKey={detail.key} updateForm={updateForm} />
              )}
            </Stack>
          )}
        </DialogContent>
        <ModalFooterActions
          reverseOrderOnMobile={isMobile}
          actions={[
            {
              key: "close",
              label: "بستن",
              onClick: onClose,
              variant: "outlined",
              color: "inherit",
              disabled: isSaving,
            },
            {
              key: "submit",
              label: isSaving
                ? t("pages.usersManagement.edit.saving")
                : t("pages.usersManagement.edit.save"),
              type: "submit",
              variant: "contained",
              color: "primary",
              icon: <SaveRoundedIcon />,
              disabled: !canSubmit,
            },
          ]}
        />
      </Box>
    </Dialog>
  );
};

export default SystemSettingEditDialog;
