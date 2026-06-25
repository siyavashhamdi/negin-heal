import { type ReactElement } from "react";
import { TextField } from "@mui/material";

import type { DurationParts } from "./durationTimeInput.util";
import styles from "./DurationTimeInput.module.scss";

export type DurationTimeInputValue = DurationParts;

type DurationTimeInputProps = {
  readonly label: string;
  readonly value: DurationTimeInputValue;
  readonly onChange: (value: DurationTimeInputValue) => void;
  readonly disabled?: boolean;
  readonly helperText?: string;
  readonly error?: boolean;
  readonly errorMessage?: string | null;
};

function DurationTimeInput({
  label,
  value,
  onChange,
  disabled = false,
  helperText,
  error = false,
  errorMessage,
}: DurationTimeInputProps): ReactElement {
  const updatePart = (part: keyof DurationParts, nextValue: string): void => {
    onChange({
      ...value,
      [part]: nextValue,
    });
  };

  return (
    <div className={styles.root}>
      <span className={styles.label}>{label}</span>
      <div className={styles.fields}>
        <TextField
          className={styles.field}
          label="ساعت"
          type="number"
          value={value.hours}
          onChange={(event) => updatePart("hours", event.target.value)}
          disabled={disabled}
          inputProps={{ min: 0, step: 1 }}
          error={error}
          fullWidth
          size="small"
        />
        <TextField
          className={styles.field}
          label="دقیقه"
          type="number"
          value={value.minutes}
          onChange={(event) => updatePart("minutes", event.target.value)}
          disabled={disabled}
          inputProps={{ min: 0, max: 59, step: 1 }}
          error={error}
          fullWidth
          size="small"
        />
        <TextField
          className={styles.field}
          label="ثانیه"
          type="number"
          value={value.seconds}
          onChange={(event) => updatePart("seconds", event.target.value)}
          disabled={disabled}
          inputProps={{ min: 0, max: 59.9, step: 0.1 }}
          error={error}
          fullWidth
          size="small"
        />
      </div>
      {error && errorMessage ? (
        <span className={styles.helperText} style={{ color: "var(--mui-palette-error-main)" }}>
          {errorMessage}
        </span>
      ) : helperText ? (
        <span className={styles.helperText}>{helperText}</span>
      ) : null}
    </div>
  );
}

export default DurationTimeInput;
