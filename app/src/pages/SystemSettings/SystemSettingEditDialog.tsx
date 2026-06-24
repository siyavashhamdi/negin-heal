import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { useQuery } from "@apollo/client/react";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { CircularProgress, Stack, Typography } from "@mui/material";

import { APP_SETTING_UPDATE_MUTATION } from "../../graphql/mutations/appSettingUpdate.mutation";
import { APP_SETTING_DETAIL_QUERY } from "../../graphql/queries/appSettingDetail.query";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import { hasFormChanges } from "../../utils/formChange.util";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import ModalFooterActions from "../../shared/crud/ModalFooterActions";
import { createModalSaveSuccessHandler } from "../../shared/crud/modalFooterActions.util";
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
import systemSettingsStyles from "./styles/system-settings.module.scss";

interface SystemSettingEditDialogProps {
  readonly settingId: string | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSaved: () => void;
  readonly closeOnSave?: boolean;
}

const SystemSettingEditDialog = ({
  settingId,
  open,
  onClose,
  onSaved,
  closeOnSave = true,
}: SystemSettingEditDialogProps): ReactElement => {
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const [form, setForm] = useState<AppSettingEditFormState | null>(null);
  const [initialForm, setInitialForm] = useState<AppSettingEditFormState | null>(null);

  const { data, loading: detailLoading } = useQuery<
    AppSettingDetailQuery,
    AppSettingDetailQueryVariables
  >(APP_SETTING_DETAIL_QUERY, {
    variables: { input: { id: settingId ?? "" } },
    skip: !open || !settingId,
    fetchPolicy: "network-only",
  });

  const detail =
    settingId && data?.appSettingDetail?.id === settingId ? data.appSettingDetail : null;

  const [updateSetting, updateSettingResult] = useMutationWithSnackbar<
    AppSettingUpdateMutation,
    AppSettingUpdateMutationVariables
  >(APP_SETTING_UPDATE_MUTATION, {
    successMessage: "تنظیمات با موفقیت ذخیره شد.",
    onSuccess: createModalSaveSuccessHandler({ onClose, onSaved, closeOnSave }),
  });

  useEffect(() => {
    if (!open) {
      setForm(null);
      setInitialForm(null);
      return;
    }
    if (detail) {
      const nextForm = buildInitialEditForm(detail);
      setInitialForm(nextForm);
      setForm(nextForm);
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
  const hasEditFormChanges =
    initialForm != null && form != null && hasFormChanges(initialForm, form);
  const canSubmit = Boolean(detail && form && !detailLoading && !isSaving) && hasEditFormChanges;

  return (
    <EntityModalShell
      open={open}
      onClose={onClose}
      disableClose={isSaving}
      hasUnsavedChanges={canSubmit}
      title="ویرایش تنظیمات سامانه"
      subtitle={
        detail?.label?.trim() || detail?.key?.trim() || "مقدار و وضعیت این تنظیم را تغییر دهید."
      }
      maxWidth="lg"
      resetKey={settingId != null ? `${settingId}-${Boolean(form)}` : undefined}
      useFormWrapper
      onSubmit={handleSubmit}
      closeOnSave={closeOnSave}
      footer={
        <ModalFooterActions
          actions={[
            {
              key: "close",
              isCloseButton: true,
              onClick: onClose,
              disabled: isSaving,
            },
            {
              key: "submit",
              label: isSaving
                ? t("pages.usersManagement.edit.saving")
                : t("pages.usersManagement.edit.save"),
              type: "submit",
              icon: <SaveRoundedIcon />,
              disabled: !canSubmit,
            },
          ]}
        />
      }
    >
      {detailLoading || !detail || !form ? (
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 260 }} spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            در حال دریافت مقدار تنظیم...
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={2.5} className={systemSettingsStyles.latinValueForm}>
          <CommonSettingFields detail={detail} form={form} updateForm={updateForm} />
          {form.valueType === "JSON" && form.jsonValue ? (
            <JsonValueEditor jsonValue={form.jsonValue} updateJson={updateJson} />
          ) : (
            <ScalarValueEditor form={form} settingKey={detail.key} updateForm={updateForm} />
          )}
        </Stack>
      )}
    </EntityModalShell>
  );
};

export default SystemSettingEditDialog;
