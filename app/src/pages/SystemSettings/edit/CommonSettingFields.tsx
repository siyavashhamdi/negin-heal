import type { ReactElement } from "react";
import { Checkbox, FormControlLabel, Stack, TextField } from "@mui/material";

import type {
  AppSettingDetail,
  AppSettingEditFormState,
  UpdateEditFormState,
} from "./types";
import { TECHNICAL_VALUE_INPUT_SX, MULTILINE_TEXTAREA_MIN_ROWS, MULTILINE_TEXTAREA_MAX_ROWS } from "./shared";
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
        label="عنوان"
        value={form.label}
        onChange={(event) => updateForm({ label: event.target.value })}
      />
      <TextField
        fullWidth
        label="کلید"
        value={detail.key}
        disabled
        sx={TECHNICAL_VALUE_INPUT_SX}
      />
      <TextField
        fullWidth
        label="نوع مقدار"
        value={form.valueType}
        disabled
        sx={TECHNICAL_VALUE_INPUT_SX}
      />
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
