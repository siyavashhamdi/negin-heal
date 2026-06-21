import type { ReactElement, ReactNode } from "react";
import ImageNotSupportedRoundedIcon from "@mui/icons-material/ImageNotSupportedRounded";
import {
  Autocomplete,
  Avatar,
  Box,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { TextFieldProps } from "@mui/material/TextField";

import styles from "./EntityAutocompleteField.module.scss";

export type EntityAutocompleteOption = {
  readonly id: string;
  readonly label: string;
  readonly subtitle?: string;
  readonly imageUrl?: string | null;
};

type EntityAutocompleteImageVariant = "circular" | "rounded";

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
  readonly imageVariant?: EntityAutocompleteImageVariant;
  readonly disabled?: boolean;
  readonly latinSubtitle?: boolean;
};

function EntityOptionThumbnail({
  imageUrl,
  label,
  variant,
  size = "small",
}: {
  readonly imageUrl?: string | null;
  readonly label: string;
  readonly variant: EntityAutocompleteImageVariant;
  readonly size?: TextFieldProps["size"];
}): ReactElement {
  const avatarVariant = variant === "circular" ? "circular" : "rounded";
  const avatarSize = size === "small" ? 24 : 32;
  const avatarSx = {
    width: avatarSize,
    height: avatarSize,
    bgcolor: "action.hover",
    flexShrink: 0,
  } as const;

  if (imageUrl) {
    return (
      <Avatar
        src={imageUrl}
        alt=""
        variant={avatarVariant}
        sx={avatarSx}
      />
    );
  }

  if (variant === "rounded") {
    return (
      <Avatar
        variant="rounded"
        sx={{
          ...avatarSx,
          color: "text.secondary",
          display: "grid",
          placeItems: "center",
        }}
      >
        <ImageNotSupportedRoundedIcon sx={{ fontSize: size === "small" ? 14 : 18, display: "block" }} />
      </Avatar>
    );
  }

  const initial = label.trim().charAt(0) || "?";

  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        ...avatarSx,
        borderRadius: "50%",
        color: "text.secondary",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.875rem",
        fontWeight: 700,
        userSelect: "none",
      }}
    >
      <Box
        component="span"
        sx={{
          display: "block",
          lineHeight: 1,
          transform: "translateY(0.125rem)",
        }}
      >
        {initial}
      </Box>
    </Box>
  );
}

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
  imageVariant = "rounded",
  disabled = false,
  latinSubtitle = false,
}: EntityAutocompleteFieldProps<TOption>): ReactElement {
  return (
    <Autocomplete<TOption, false, false, false>
      fullWidth={fullWidth}
      size={size}
      disabled={disabled}
      options={[...options]}
      value={value}
      inputValue={inputValue}
      loading={loading}
      filterOptions={(autocompleteOptions) => autocompleteOptions}
      sortOptions={(optionList) => optionList}
      isOptionEqualToValue={(option, selectedValue) => option.id === selectedValue.id}
      getOptionLabel={(option) => option.label}
      onInputChange={(_, nextInputValue, reason) => {
        if (reason === "input" || reason === "clear") {
          onInputChange?.(nextInputValue);
        }
      }}
      onChange={(_, nextValue) => onChange(nextValue)}
      noOptionsText={noOptionsText}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
            <EntityOptionThumbnail
              imageUrl={option.imageUrl}
              label={option.label}
              variant={imageVariant}
              size={size}
            />
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {option.label}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                className={latinSubtitle ? styles.latinSubtitle : undefined}
              >
                {option.subtitle || option.id}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          size={size}
          required={required}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            startAdornment: value ? (
              <>
                <Box sx={{ display: "flex", alignItems: "center", alignSelf: "center", mr: 0.5 }}>
                  <EntityOptionThumbnail
                    imageUrl={value.imageUrl}
                    label={value.label}
                    variant={imageVariant}
                    size={size}
                  />
                </Box>
                {params.InputProps.startAdornment}
              </>
            ) : (
              params.InputProps.startAdornment
            ),
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
