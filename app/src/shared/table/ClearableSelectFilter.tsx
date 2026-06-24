import type { ReactElement } from "react";
import HoverClearSelectField, { type HoverClearSelectOption } from "../forms/HoverClearSelectField";

export interface ClearableSelectOption {
  readonly value: string;
  readonly label: string;
}

export interface ClearableSelectFilterProps {
  /** Used for accessibility (and floating label text when `label` is set). */
  ariaLabel: string;
  /** MUI floating label inside the field; moves to the top on focus or when a value is set. */
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly ClearableSelectOption[];
  /** Clear button resets to this value. An empty default means no filter is applied. */
  defaultValue?: string;
  /** @deprecated Empty default no longer renders a synthetic "all" option in the list. */
  defaultOptionLabel?: string;
  disabled?: boolean;
}

const ClearableSelectFilter = ({
  ariaLabel,
  label,
  value,
  onChange,
  options,
  defaultValue = "",
  disabled = false,
}: ClearableSelectFilterProps): ReactElement => {
  return (
    <HoverClearSelectField
      ariaLabel={ariaLabel}
      label={label}
      value={value}
      onChange={onChange}
      options={options as readonly HoverClearSelectOption[]}
      defaultValue={defaultValue}
      disabled={disabled}
    />
  );
};

export default ClearableSelectFilter;
