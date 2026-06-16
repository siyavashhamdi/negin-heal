import type { ReactElement, ReactNode } from "react";
import { Autocomplete, Box, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import type { TextFieldProps } from "@mui/material/TextField";

export type EntityAutocompleteOption = {
  readonly id: string;
  readonly label: string;
  readonly subtitle?: string;
};

type EntityAutocompleteFieldProps<TOption extends EntityAutocompleteOption> = {
  readonly options: readonly TOption[];
  readonly value: TOption | null;
  readonly onChange: (value: TOption | null) => void;
  readonly label: string;
  readonly placeholder?: string;
  readonly helperText?: ReactNode;
  readonly noOptionsText?: string;
  readonly loading?: boolean;
  readonly required?: boolean;
  readonly fullWidth?: boolean;
  readonly size?: TextFieldProps["size"];
  readonly inputValue?: string;
  readonly onInputChange?: (value: string) => void;
};

export default function EntityAutocompleteField<TOption extends EntityAutocompleteOption>({
  options,
  value,
  onChange,
  label,
  placeholder,
  helperText,
  noOptionsText,
  loading = false,
  required = false,
  fullWidth = true,
  size = "small",
  inputValue,
  onInputChange,
}: EntityAutocompleteFieldProps<TOption>): ReactElement {
  return (
    <Autocomplete<TOption, false, false, false>
      fullWidth={fullWidth}
      size={size}
      options={[...options]}
      value={value}
      inputValue={inputValue}
      loading={loading}
      filterOptions={(autocompleteOptions) => autocompleteOptions}
      isOptionEqualToValue={(option, selectedValue) => option.id === selectedValue.id}
      getOptionLabel={(option) => option.label}
      onInputChange={(_, nextInputValue) => onInputChange?.(nextInputValue)}
      onChange={(_, nextValue) => onChange(nextValue)}
      noOptionsText={noOptionsText}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={700}>
              {option.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {option.subtitle || option.id}
            </Typography>
          </Stack>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          required={required}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
