import { useMemo, type ReactElement, type SyntheticEvent } from "react";
import {
  Autocomplete,
  Box,
  IconButton,
  TextField,
  Typography,
  createFilterOptions,
} from "@mui/material";
import { Clear as ClearIcon } from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import styles from "./HoverClearSelectField.module.scss";
import AppTooltip from "../AppTooltip";

export interface HoverClearSelectOption {
  readonly value: string;
  readonly label: string;
}

export interface HoverClearSelectFieldProps {
  label?: string;
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly HoverClearSelectOption[];
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
  error?: boolean;
  helperText?: string;
  omitEmptyEntries?: boolean;
}

const filterOptions = createFilterOptions<HoverClearSelectOption>();

function normalizeOptionValue(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeStoredValue(value: string, defaultValue: string): string {
  if (value === defaultValue) {
    return defaultValue;
  }
  if (value === "" && defaultValue !== "") {
    return defaultValue;
  }
  return value;
}

function isSelectableOption(option: HoverClearSelectOption): boolean {
  return (
    option.value.trim() !== "" &&
    option.label.trim() !== "" &&
    option.label !== "—" &&
    option.label !== "-"
  );
}

const HoverClearSelectField = ({
  label,
  ariaLabel,
  value,
  onChange,
  options,
  defaultValue = "",
  disabled = false,
  required = false,
  loading = false,
  error = false,
  helperText,
  omitEmptyEntries = false,
}: HoverClearSelectFieldProps): ReactElement => {
  const { t } = useTranslation();
  const useFloatingLabel = label != null && label !== "";

  const normalizedValue = normalizeStoredValue(value, defaultValue);
  const isAtDefault = normalizedValue === defaultValue;

  const selectableOptions = useMemo(
    () => (omitEmptyEntries ? options.filter(isSelectableOption) : [...options]),
    [omitEmptyEntries, options]
  );

  const selected = useMemo((): HoverClearSelectOption | null => {
    if (isAtDefault) {
      return null;
    }
    const selectedValue = normalizeOptionValue(normalizedValue);
    return (
      selectableOptions.find((option) => normalizeOptionValue(option.value) === selectedValue) ??
      null
    );
  }, [isAtDefault, normalizedValue, selectableOptions]);

  const showClearButton = !disabled && !loading && !isAtDefault;
  const selectedTooltipTitle = selected?.label ?? "";

  const handleClear = (event: SyntheticEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    onChange(defaultValue);
  };

  return (
    <Box className={styles.root}>
      <Autocomplete<HoverClearSelectOption, false, false, false>
        size="small"
        fullWidth
        disabled={disabled}
        loading={loading}
        clearIcon={null}
        options={selectableOptions}
        value={selected}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(left, right) =>
          normalizeOptionValue(left.value) === normalizeOptionValue(right.value)
        }
        onChange={(_event, option) => onChange(option?.value ?? defaultValue)}
        filterOptions={filterOptions}
        noOptionsText={t("table.filters.noOptions")}
        openOnFocus
        autoHighlight
        ListboxProps={{ style: { maxHeight: 280 } }}
        renderOption={(props, option) => (
          <li {...props} key={option.value}>
            <Typography component="span" variant="body2" sx={{ whiteSpace: "normal" }}>
              {option.label}
            </Typography>
          </li>
        )}
        renderInput={(params) => (
          <AppTooltip title={selectedTooltipTitle} arrow>
            <TextField
              {...params}
              label={useFloatingLabel ? label : undefined}
              required={required}
              error={error}
              helperText={helperText}
              inputProps={{
                ...params.inputProps,
                "aria-label": useFloatingLabel ? undefined : ariaLabel,
              }}
              InputLabelProps={{
                ...params.InputLabelProps,
                ...(useFloatingLabel && ariaLabel ? { "aria-label": ariaLabel } : {}),
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    {showClearButton ? (
                      <AppTooltip title={t("table.dataGrid.filter.clearField")} arrow>
                        <IconButton
                          size="small"
                          className={styles.clearButton}
                          aria-label={t("table.dataGrid.filter.clearField")}
                          onMouseDown={handleClear}
                          onClick={handleClear}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </AppTooltip>
                    ) : null}
                  </>
                ),
              }}
            />
          </AppTooltip>
        )}
      />
    </Box>
  );
};

export default HoverClearSelectField;
