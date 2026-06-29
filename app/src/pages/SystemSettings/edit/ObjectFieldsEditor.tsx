import type { ChangeEvent, ReactElement } from "react";
import { Stack, TextField } from "@mui/material";

import PasswordTextField from "./PasswordTextField";
import { type TextFieldConfig } from "./shared";
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
      {fields.map((field) => {
        const fieldProps = {
          fullWidth: true as const,
          label: field.label,
          value: String(value[field.key] ?? ""),
          onChange: (event: ChangeEvent<HTMLInputElement>) =>
            onChange({ ...value, [field.key]: event.target.value }),
          sx: { flexBasis: { md: "calc(50% - 8px)" } },
        };

        if (field.type === "password") {
          return <PasswordTextField key={field.key} {...fieldProps} />;
        }

        return <TextField key={field.key} {...fieldProps} type={field.type ?? "text"} />;
      })}
    </Stack>
  </SectionPaper>
);

export default ObjectFieldsEditor;
