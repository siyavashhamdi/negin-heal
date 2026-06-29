import { type ReactElement } from "react";
import { TextField } from "@mui/material";

import type { DurationParts } from "./durationTimeInput.util";
import styles from "./MediaTrimRangeInput.module.scss";

export type InlineDurationValue = DurationParts;

type InlineDurationFieldsProps = {
  readonly value: InlineDurationValue;
  readonly onChange: (value: InlineDurationValue) => void;
  readonly disabled?: boolean;
  readonly error?: boolean;
  readonly groupLabel: string;
};

function InlineDurationFields({
  value,
  onChange,
  disabled = false,
  error = false,
  groupLabel,
}: InlineDurationFieldsProps): ReactElement {
  const updatePart = (part: keyof DurationParts, nextValue: string): void => {
    onChange({
      ...value,
      [part]: nextValue,
    });
  };

  return (
    <div className={styles.trimGroup}>
      <span className={styles.trimGroupLabel}>{groupLabel}</span>
      <div className={styles.inlineFields}>
        <TextField
          className={styles.field}
          type="text"
          placeholder="س"
          value={value.hours}
          onChange={(event) => updatePart("hours", event.target.value)}
          disabled={disabled}
          inputProps={{ inputMode: "numeric", "aria-label": `${groupLabel} — ساعت` }}
          error={error}
          size="small"
        />
        <span className={styles.separator} aria-hidden>
          :
        </span>
        <TextField
          className={styles.field}
          type="text"
          placeholder="د"
          value={value.minutes}
          onChange={(event) => updatePart("minutes", event.target.value)}
          disabled={disabled}
          inputProps={{ inputMode: "numeric", "aria-label": `${groupLabel} — دقیقه` }}
          error={error}
          size="small"
        />
        <span className={styles.separator} aria-hidden>
          :
        </span>
        <TextField
          className={styles.field}
          type="text"
          placeholder="ث"
          value={value.seconds}
          onChange={(event) => updatePart("seconds", event.target.value)}
          disabled={disabled}
          inputProps={{ inputMode: "decimal", "aria-label": `${groupLabel} — ثانیه` }}
          error={error}
          size="small"
        />
      </div>
    </div>
  );
}

export type MediaTrimRangeValue = {
  readonly start: InlineDurationValue;
  readonly end: InlineDurationValue;
};

type MediaTrimRangeInputProps = {
  readonly value: MediaTrimRangeValue;
  readonly onChange: (value: MediaTrimRangeValue) => void;
  readonly disabled?: boolean;
  readonly helperText?: string;
  readonly error?: boolean;
  readonly errorMessage?: string | null;
};

function MediaTrimRangeInput({
  value,
  onChange,
  disabled = false,
  helperText,
  error = false,
  errorMessage,
}: MediaTrimRangeInputProps): ReactElement {
  return (
    <div className={styles.fieldShell}>
      <span className={styles.fieldLabel}>برش زمانی</span>
      <div
        className={[styles.fieldBody, error ? styles.fieldBodyError : ""].filter(Boolean).join(" ")}
      >
        <InlineDurationFields
          groupLabel="شروع"
          value={value.start}
          onChange={(start) => onChange({ ...value, start })}
          disabled={disabled}
          error={error}
        />
        <InlineDurationFields
          groupLabel="پایان"
          value={value.end}
          onChange={(end) => onChange({ ...value, end })}
          disabled={disabled}
          error={error}
        />
        {error && errorMessage ? (
          <span className={styles.helperText} style={{ color: "var(--mui-palette-error-main)" }}>
            {errorMessage}
          </span>
        ) : helperText ? (
          <span className={styles.helperText}>{helperText}</span>
        ) : null}
      </div>
    </div>
  );
}

export default MediaTrimRangeInput;
