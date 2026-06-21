import type { ReactElement } from "react";

import ActiveEndUserCombobox from "./ActiveEndUserCombobox";
import { type ActiveEndUserOption } from "./active-end-user.util";
import { useActiveEndUserSearch } from "./useActiveEndUserSearch";

export type { ActiveEndUserOption } from "./active-end-user.util";

export type ActiveEndUserPickerFieldProps = {
  readonly value: ActiveEndUserOption | null;
  readonly onChange: (value: ActiveEndUserOption | null) => void;
  readonly enabled?: boolean;
  readonly required?: boolean;
  readonly fullWidth?: boolean;
  readonly disabled?: boolean;
};

function ActiveEndUserPickerField({
  value,
  onChange,
  enabled = true,
  required = false,
  fullWidth = true,
  disabled = false,
}: ActiveEndUserPickerFieldProps): ReactElement {
  const combobox = useActiveEndUserSearch({ value, onChange, enabled });

  return (
    <ActiveEndUserCombobox
      options={combobox.options}
      value={value}
      inputValue={combobox.inputValue}
      loading={combobox.loading}
      onInputChange={combobox.onInputChange}
      onChange={combobox.onChange}
      required={required}
      fullWidth={fullWidth}
      disabled={disabled}
    />
  );
}

export default ActiveEndUserPickerField;
