import type { ReactElement } from "react";
import { Checkbox, FormControlLabel, Stack, TextField } from "@mui/material";

import type { AppSettingDetail, AppSettingEditFormState, UpdateEditFormState } from "./types";
import { MULTILINE_TEXTAREA_MIN_ROWS, MULTILINE_TEXTAREA_MAX_ROWS } from "./shared";
import systemSettingsStyles from "../styles/system-settings.module.scss";
import SectionPaper from "./SectionPaper";

interface CommonSettingFieldsProps {
  readonly detail: AppSettingDetail;
  readonly form: AppSettingEditFormState;
  readonly updateForm: UpdateEditFormState;
}

const CommonSettingFields = ({
  detail,
  form,
  updateForm,
}: CommonSettingFieldsProps): ReactElement => (
  <SectionPaper>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      <TextField
        fullWidth
        required
        className={systemSettingsStyles.persianValueField}
        label="عنوان"
        value={form.label}
        onChange={(event) => updateForm({ label: event.target.value })}
      />
      <TextField fullWidth label="کلید" value={detail.key} disabled />
      <TextField fullWidth label="نوع مقدار" value={form.valueType} disabled />
    </Stack>
    <TextField
      fullWidth
      multiline
      minRows={MULTILINE_TEXTAREA_MIN_ROWS}
      maxRows={MULTILINE_TEXTAREA_MAX_ROWS}
      label="توضیحات"
      value={form.description}
      onChange={(event) => updateForm({ description: event.target.value })}
    />
    <FormControlLabel
      control={
        <Checkbox
          checked={form.isActive}
          onChange={(event) => updateForm({ isActive: event.target.checked })}
        />
      }
      label="فعال باشد"
    />
  </SectionPaper>
);

export default CommonSettingFields;
