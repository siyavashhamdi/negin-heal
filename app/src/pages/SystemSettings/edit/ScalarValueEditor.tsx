import type { ReactElement } from "react";
import { Checkbox, FormControlLabel, TextField } from "@mui/material";

import type { AppSettingEditFormState, UpdateEditFormState } from "./types";
import { HTML_TEXTAREA_ROWS } from "./shared";
import { SCALAR_NUMBER_FIELD_CONFIG } from "./scalar-setting-fields";
import SectionPaper from "./SectionPaper";

interface ScalarValueEditorProps {
  readonly form: AppSettingEditFormState;
  readonly settingKey: string;
  readonly updateForm: UpdateEditFormState;
}

const ScalarValueEditor = ({
  form,
  settingKey,
  updateForm,
}: ScalarValueEditorProps): ReactElement | null => {
  if (form.valueType === "BOOLEAN") {
    return (
      <SectionPaper>
        <FormControlLabel
          control={
            <Checkbox
              checked={form.booleanValue}
              onChange={(event) => updateForm({ booleanValue: event.target.checked })}
            />
          }
          label="مقدار فعال / درست باشد"
        />
      </SectionPaper>
    );
  }

  if (form.valueType === "NUMBER") {
    const numberFieldConfig = SCALAR_NUMBER_FIELD_CONFIG[settingKey];

    return (
      <SectionPaper>
        <TextField
          fullWidth
          required
          type="number"
          label={numberFieldConfig?.label ?? "مقدار عددی"}
          helperText={numberFieldConfig?.helperText}
          value={form.scalarValue}
          onChange={(event) => updateForm({ scalarValue: event.target.value })}
          inputProps={{
            min: numberFieldConfig?.min ?? 0,
            step: 1,
          }}
        />
      </SectionPaper>
    );
  }

  if (form.valueType === "STRING") {
    const isLargeHtml = settingKey.includes("PAGE");
    return (
      <SectionPaper>
        <TextField
          fullWidth
          multiline={isLargeHtml}
          minRows={isLargeHtml ? HTML_TEXTAREA_ROWS : undefined}
          maxRows={isLargeHtml ? HTML_TEXTAREA_ROWS : undefined}
          label={isLargeHtml ? "محتوای HTML" : "مقدار متنی"}
          value={form.scalarValue}
          onChange={(event) => updateForm({ scalarValue: event.target.value })}
        />
      </SectionPaper>
    );
  }

  return null;
};

export default ScalarValueEditor;
