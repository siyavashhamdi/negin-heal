import { type ReactElement } from "react";

import { useTranslation } from "../../../hooks/useTranslation";
import {
  latinIdentityFieldInputProps,
  resolveAuthIdentityValidationMessageKey,
  sanitizeAuthIdentityInput,
  type SubmittedAuthIdentityValidationError,
} from "../../../utilities/contact-validation.util";
import formStyles from "../styles/LoginFormShared.module.scss";
import { AuthIdentityInputAdornment } from "./AuthIdentityInputAdornment";
import { LoginAdornedTextField } from "./LoginAdornedTextField";

interface AuthIdentityTextFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly autoFocus?: boolean;
  readonly required?: boolean;
  readonly error?: SubmittedAuthIdentityValidationError | null;
  readonly helperText?: string;
  readonly labelKey?: string;
  readonly requiredMessageKey?: string;
}

export function AuthIdentityTextField({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  required = true,
  error = null,
  helperText,
  labelKey = "auth.login.identityFieldTitle",
  requiredMessageKey,
}: AuthIdentityTextFieldProps): ReactElement {
  const { t } = useTranslation();

  const resolvedHelperText = error
    ? t(
        resolveAuthIdentityValidationMessageKey(error, {
          requiredMessageKey,
        })
      )
    : helperText;

  return (
    <LoginAdornedTextField
      fullWidth
      label={t(labelKey)}
      type="text"
      value={value}
      onChange={(event) => onChange(sanitizeAuthIdentityInput(event.target.value))}
      inputProps={{
        ...latinIdentityFieldInputProps,
        inputMode: "text",
        className: formStyles.latinInput,
      }}
      InputProps={{
        startAdornment: <AuthIdentityInputAdornment identity={value} />,
      }}
      autoComplete="username"
      autoFocus={autoFocus}
      disabled={disabled}
      required={required}
      error={Boolean(error)}
      helperText={resolvedHelperText}
    />
  );
}
