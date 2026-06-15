import type { ReactElement } from "react";
import { Checkbox, FormControlLabel, TextField } from "@mui/material";

import type { AppSettingEditFormState, UpdateEditFormState } from "./types";
import { HTML_TEXTAREA_ROWS, TECHNICAL_VALUE_INPUT_SX } from "./shared";
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
    return (
      <SectionPaper>
        <TextField
          fullWidth
          required
          type="number"
          label="مقدار عددی"
          value={form.scalarValue}
          onChange={(event) => updateForm({ scalarValue: event.target.value })}
          sx={TECHNICAL_VALUE_INPUT_SX}
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
          label={isLargeHtml ? "محتوای HTML" : "مقدار متنی"}
          value={form.scalarValue}
          onChange={(event) => updateForm({ scalarValue: event.target.value })}
          sx={TECHNICAL_VALUE_INPUT_SX}
        />
      </SectionPaper>
    );
  }

  return null;
};

export default ScalarValueEditor;
