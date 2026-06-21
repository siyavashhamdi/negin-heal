import type { ReactElement } from "react";

import EntityAutocompleteField from "./EntityAutocompleteField";
import {
  ACTIVE_END_USER_COMBOBOX_LABEL,
  ACTIVE_END_USER_COMBOBOX_NO_OPTIONS_TEXT,
  ACTIVE_END_USER_COMBOBOX_PLACEHOLDER,
  type ActiveEndUserOption,
} from "./active-end-user.util";

export type ActiveEndUserComboboxProps = {
  readonly options: readonly ActiveEndUserOption[];
  readonly value: ActiveEndUserOption | null;
  readonly inputValue: string;
  readonly loading?: boolean;
  readonly onInputChange: (value: string) => void;
  readonly onChange: (value: ActiveEndUserOption | null) => void;
  readonly required?: boolean;
  readonly fullWidth?: boolean;
  readonly disabled?: boolean;
};

function ActiveEndUserCombobox({
  options,
  value,
  inputValue,
  loading = false,
  onInputChange,
  onChange,
  required = false,
  fullWidth = true,
  disabled = false,
}: ActiveEndUserComboboxProps): ReactElement {
  return (
    <EntityAutocompleteField
      options={options}
      value={value}
      inputValue={inputValue}
      loading={loading}
      onInputChange={onInputChange}
      onChange={onChange}
      noOptionsText={ACTIVE_END_USER_COMBOBOX_NO_OPTIONS_TEXT}
      label={ACTIVE_END_USER_COMBOBOX_LABEL}
      placeholder={ACTIVE_END_USER_COMBOBOX_PLACEHOLDER}
      imageVariant="circular"
      latinSubtitle
      required={required}
      fullWidth={fullWidth}
      disabled={disabled}
    />
  );
}

export default ActiveEndUserCombobox;
