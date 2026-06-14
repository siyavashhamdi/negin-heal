import type { ReactElement } from "react";
import HoverClearMultiSelectField, {
  type HoverClearMultiSelectOption,
} from "../forms/HoverClearMultiSelectField";

export interface SearchableMultiSelectOption {
  readonly value: string;
  readonly label: string;
}

export interface SearchableMultiSelectFilterProps {
  /** Used for accessibility (and floating label text when `label` is set). */
  ariaLabel: string;
  /** MUI floating label inside the field; moves to the top on focus or when values are selected. */
  label?: string;
  options: readonly SearchableMultiSelectOption[];
  value: readonly string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  disabledTooltip?: string;
  loading?: boolean;
}

const SearchableMultiSelectFilter = ({
  ariaLabel,
  label,
  options,
  value,
  onChange,
  disabled = false,
  disabledTooltip,
  loading = false,
}: SearchableMultiSelectFilterProps): ReactElement => {
  return (
    <HoverClearMultiSelectField
      ariaLabel={ariaLabel}
      label={label}
      options={options as readonly HoverClearMultiSelectOption[]}
      value={value}
      onChange={onChange}
      disabled={disabled}
      disabledTooltip={disabledTooltip}
      loading={loading}
    />
  );
};

export default SearchableMultiSelectFilter;
