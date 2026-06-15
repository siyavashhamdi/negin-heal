import type { ReactElement } from "react";
import { Stack, TextField } from "@mui/material";

import { TECHNICAL_VALUE_INPUT_SX, type TextFieldConfig } from "./shared";
import SectionPaper from "./SectionPaper";

interface ObjectFieldsEditorProps<TValue extends object> {
  readonly value: TValue;
  readonly fields: readonly TextFieldConfig<Extract<keyof TValue, string>>[];
  readonly onChange: (nextValue: TValue) => void;
}

const ObjectFieldsEditor = <TValue extends object>({
  value,
  fields,
  onChange,
}: ObjectFieldsEditorProps<TValue>): ReactElement => (
    <SectionPaper>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap" useFlexGap>
        {fields.map((field) => (
          <TextField
            key={field.key}
            fullWidth
            type={field.type ?? "text"}
            label={field.label}
            value={String(value[field.key] ?? "")}
            onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
            sx={{ flexBasis: { md: "calc(50% - 8px)" }, ...TECHNICAL_VALUE_INPUT_SX }}
          />
        ))}
      </Stack>
    </SectionPaper>
  );

export default ObjectFieldsEditor;
