import { type ReactElement, type SyntheticEvent } from "react";
import { Autocomplete, Box, Checkbox, IconButton, TextField, Typography } from "@mui/material";
import { Clear as ClearIcon } from "@mui/icons-material";
import { useTranslation } from "../../hooks/useTranslation";
import styles from "./HoverClearMultiSelectField.module.scss";
import AppTooltip from "../AppTooltip";

export interface HoverClearMultiSelectOption {
  readonly value: string;
  readonly label: string;
}

export interface HoverClearMultiSelectFieldProps {
  label?: string;
  ariaLabel?: string;
  options: readonly HoverClearMultiSelectOption[];
  value: readonly string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  disabledTooltip?: string;
  loading?: boolean;
}

const PERSIAN_NUMBER_FORMATTER = new Intl.NumberFormat("fa-IR");

function normalizeOptionValue(value: string): string {
  return value.trim().toLowerCase();
}

const HoverClearMultiSelectField = ({
  label,
  ariaLabel,
  options,
  value,
  onChange,
  disabled = false,
  disabledTooltip,
  loading = false,
}: HoverClearMultiSelectFieldProps): ReactElement => {
  const { t } = useTranslation();
  const useFloatingLabel = label != null && label !== "";
  const selectedSet = new Set(value.map(normalizeOptionValue));
  const selectedOptions = options.filter((option) =>
    selectedSet.has(normalizeOptionValue(option.value))
  );
  const hasSelection = value.length > 0;
  const showClearButton = !disabled && !loading && hasSelection;
  const tooltipTitle = disabled && disabledTooltip != null ? disabledTooltip : "";
  const selectedTooltipTitle = selectedOptions.map((option) => option.label).join("، ");

  const handleClear = (event: SyntheticEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    onChange([]);
  };

  const field = (
    <Box className={styles.root}>
      <Autocomplete
        multiple
        size="small"
        fullWidth
        disabled={disabled || loading}
        disableClearable
        disableCloseOnSelect
        options={options}
        value={selectedOptions}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(left, right) =>
          normalizeOptionValue(left.value) === normalizeOptionValue(right.value)
        }
        onChange={(_event, next) => onChange(next.map((option) => option.value))}
        noOptionsText={t("table.filters.noOptions")}
        openOnFocus
        autoHighlight
        ListboxProps={{ style: { maxHeight: 280 } }}
        renderOption={(props, option, { selected: isSelected }) => (
          <li {...props} key={option.value}>
            <Checkbox size="small" checked={isSelected} sx={{ mr: 1, p: 0.5 }} />
            <Typography component="span" variant="body2" sx={{ whiteSpace: "normal" }}>
              {option.label}
            </Typography>
          </li>
        )}
        renderTags={(selectedOpts) => {
          if (selectedOpts.length === 0) {
            return null;
          }
          if (selectedOpts.length > 1) {
            const countLabel = PERSIAN_NUMBER_FORMATTER.format(selectedOpts.length);
            return (
              <AppTooltip title={selectedTooltipTitle} arrow>
                <Typography
                  component="span"
                  variant="body2"
                  className={styles.selectedValue}
                  noWrap
                >
                  {`${t("table.filters.multipleSelected")} (${countLabel})`}
                </Typography>
              </AppTooltip>
            );
          }
          return (
            <AppTooltip title={selectedTooltipTitle} arrow>
              <Typography component="span" variant="body2" className={styles.selectedValue} noWrap>
                {selectedOpts[0]?.label ?? ""}
              </Typography>
            </AppTooltip>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={useFloatingLabel ? label : undefined}
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
        )}
      />
    </Box>
  );

  if (tooltipTitle === "") {
    return field;
  }

  return (
    <AppTooltip title={tooltipTitle} arrow>
      <span>{field}</span>
    </AppTooltip>
  );
};

export default HoverClearMultiSelectField;
