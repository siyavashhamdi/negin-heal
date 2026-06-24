import { useState, type ReactElement } from "react";
import { TextField, type TextFieldProps } from "@mui/material";
import formStyles from "../styles/LoginFormShared.module.scss";
import { RequiredFieldLabel } from "./RequiredFieldLabel";

type LoginAdornedTextFieldProps = TextFieldProps & {
  /** Hide InputProps.endAdornment until the label floats up (focus or value). */
  endAdornmentOnlyWhenLabelShrunk?: boolean;
};

/**
 * Outlined login field with start/end adornments.
 * MUI shrinks the label whenever adornments exist; we only shrink on focus or value
 * so the label rests inside the field like a normal floating label.
 */
export function LoginAdornedTextField({
  value,
  required,
  label,
  inputProps,
  InputLabelProps,
  InputProps,
  className,
  onFocus,
  onBlur,
  variant = "outlined",
  endAdornmentOnlyWhenLabelShrunk = false,
  ...props
}: LoginAdornedTextFieldProps): ReactElement {
  const [focused, setFocused] = useState(false);
  const hasValue = String(value ?? "").trim().length > 0;
  const labelShrunk = focused || hasValue;

  const resolvedInputProps =
    endAdornmentOnlyWhenLabelShrunk && InputProps
      ? {
          ...InputProps,
          "data-label-shrunk": labelShrunk ? "true" : "false",
        }
      : InputProps;

  return (
    <TextField
      {...props}
      value={value}
      label={<RequiredFieldLabel required={required}>{label}</RequiredFieldLabel>}
      required={false}
      variant={variant}
      className={[
        formStyles.textField,
        endAdornmentOnlyWhenLabelShrunk ? formStyles.passwordInputField : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      InputLabelProps={{
        ...InputLabelProps,
        shrink: labelShrunk,
        required: false,
      }}
      InputProps={resolvedInputProps}
      inputProps={{
        ...inputProps,
        ...(required ? { "aria-required": true } : {}),
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
    />
  );
}
