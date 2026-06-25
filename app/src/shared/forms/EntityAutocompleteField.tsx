import type { ReactElement, ReactNode } from "react";
import ImageNotSupportedRoundedIcon from "@mui/icons-material/ImageNotSupportedRounded";
import {
  Autocomplete,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  createFilterOptions,
} from "@mui/material";
import type { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import { resolveAvatarInitial } from "../../utils/storedUser.util";
import { AvatarInitial } from "../display/AvatarInitial";
import { CachedFileAvatar } from "../display/CachedFileAvatar";
import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";

import styles from "./EntityAutocompleteField.module.scss";

export type EntityAutocompleteOption = {
  readonly id: string;
  readonly label: string;
  readonly subtitle?: string;
  readonly imageUrl?: string | null;
  readonly imageAccessUrl?: FileAccessUrl | null;
};

type EntityAutocompleteImageVariant = "circular" | "rounded";

type EntityAutocompleteFieldBaseProps<TOption extends EntityAutocompleteOption> = {
  readonly options: readonly TOption[];
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

export type EntityAutocompleteFieldProps<TOption extends EntityAutocompleteOption> =
  | (EntityAutocompleteFieldBaseProps<TOption> & {
      readonly multiple?: false;
      readonly value: TOption | null;
      readonly onChange: (value: TOption | null) => void;
    })
  | (EntityAutocompleteFieldBaseProps<TOption> & {
      readonly multiple: true;
      readonly value: readonly TOption[];
      readonly onChange: (value: TOption[]) => void;
    });

function EntityOptionThumbnail({
  imageUrl,
  imageAccessUrl,
  label,
  variant,
  size = "small",
  context = "input",
}: {
  readonly imageUrl?: string | null;
  readonly imageAccessUrl?: FileAccessUrl | null;
  readonly label: string;
  readonly variant: EntityAutocompleteImageVariant;
  readonly size?: TextFieldProps["size"];
  readonly context?: "input" | "option" | "chip";
}): ReactElement {
  const avatarVariant = variant === "circular" ? "circular" : "rounded";
  const avatarSize =
    context === "option"
      ? size === "small"
        ? 44
        : 52
      : context === "chip"
        ? 20
        : size === "small"
          ? 24
          : 32;
  const avatarSx = {
    width: avatarSize,
    height: avatarSize,
    bgcolor: "action.hover",
    flexShrink: 0,
  } as const;
  const placeholderIconSize =
    context === "option"
      ? size === "small"
        ? 22
        : 26
      : context === "chip"
        ? 12
        : size === "small"
          ? 14
          : 18;
  const initialFontSize =
    context === "option"
      ? size === "small"
        ? "1.125rem"
        : "1.25rem"
      : context === "chip"
        ? "0.75rem"
        : size === "small"
          ? "0.875rem"
          : "1rem";

  if (imageAccessUrl || imageUrl) {
    return (
      <CachedFileAvatar
        accessUrl={imageAccessUrl}
        networkUrl={imageUrl}
        fileId={imageAccessUrl?.fileId}
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
        <ImageNotSupportedRoundedIcon sx={{ fontSize: placeholderIconSize, display: "block" }} />
      </Avatar>
    );
  }

  const initial = resolveAvatarInitial(label);

  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        ...avatarSx,
        borderRadius: "50%",
        color: "text.secondary",
        position: "relative",
        overflow: "hidden",
        fontSize: initialFontSize,
        fontWeight: 700,
        userSelect: "none",
      }}
    >
      <AvatarInitial initial={initial} />
    </Box>
  );
}

function renderEntityOption<TOption extends EntityAutocompleteOption>(
  props: React.HTMLAttributes<HTMLLIElement>,
  option: TOption,
  imageVariant: EntityAutocompleteImageVariant,
  size: TextFieldProps["size"],
  latinSubtitle: boolean
): ReactElement {
  return (
    <Box component="li" {...props} key={option.id}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
        <EntityOptionThumbnail
          imageUrl={option.imageUrl}
          imageAccessUrl={option.imageAccessUrl}
          label={option.label}
          variant={imageVariant}
          size={size}
          context="option"
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
  );
}

function EntityAutocompleteField<TOption extends EntityAutocompleteOption>(
  props: EntityAutocompleteFieldProps<TOption>
): ReactElement {
  const {
    options,
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
    multiple = false,
  } = props;

  const usesServerSideSearch = onInputChange != null;
  const filterOptions = usesServerSideSearch
    ? (autocompleteOptions: TOption[]) => autocompleteOptions
    : createFilterOptions<TOption>({
        stringify: (option) => `${option.label} ${option.subtitle ?? ""} ${option.id}`,
      });
  const sortOptions = usesServerSideSearch ? (optionList: TOption[]) => optionList : undefined;

  const renderLoadingEndAdornment = (
    endAdornment: AutocompleteRenderInputParams["InputProps"]["endAdornment"]
  ): ReactElement => (
    <>
      {loading ? <CircularProgress color="inherit" size={18} /> : null}
      {endAdornment}
    </>
  );

  if (multiple) {
    return (
      <Autocomplete<TOption, true, false, false>
        fullWidth={fullWidth}
        size={size}
        disabled={disabled}
        multiple
        disableCloseOnSelect
        filterSelectedOptions
        options={[...options]}
        value={[...props.value]}
        inputValue={inputValue}
        loading={loading}
        filterOptions={filterOptions}
        {...(sortOptions ? { sortOptions } : {})}
        isOptionEqualToValue={(option, selectedValue) => option.id === selectedValue.id}
        getOptionLabel={(option) => option.label}
        onInputChange={(_, nextInputValue, reason) => {
          if (reason === "input" || reason === "clear") {
            onInputChange?.(nextInputValue);
          }
        }}
        onChange={(_, nextValue) => props.onChange(nextValue)}
        noOptionsText={noOptionsText}
        renderOption={(optionProps, option) =>
          renderEntityOption(optionProps, option, imageVariant, size, latinSubtitle)
        }
        renderTags={(selectedOptions, getTagProps) =>
          selectedOptions.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });

            return (
              <Chip
                key={key}
                {...tagProps}
                size="small"
                label={option.label}
                avatar={
                  option.imageAccessUrl || option.imageUrl ? (
                    <CachedFileAvatar
                      accessUrl={option.imageAccessUrl}
                      networkUrl={option.imageUrl}
                      fileId={option.imageAccessUrl?.fileId}
                      alt=""
                      variant="rounded"
                    />
                  ) : (
                    <Avatar variant="rounded" sx={{ color: "text.secondary" }}>
                      <ImageNotSupportedRoundedIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                  )
                }
              />
            );
          })
        }
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
              classes: {
                ...params.InputProps.classes,
                root: [params.InputProps.classes?.root, styles.multipleInputRoot]
                  .filter(Boolean)
                  .join(" "),
              },
              endAdornment: renderLoadingEndAdornment(params.InputProps.endAdornment),
            }}
          />
        )}
      />
    );
  }

  return (
    <Autocomplete<TOption, false, false, false>
      fullWidth={fullWidth}
      size={size}
      disabled={disabled}
      options={[...options]}
      value={props.value}
      inputValue={inputValue}
      loading={loading}
      filterOptions={filterOptions}
      {...(sortOptions ? { sortOptions } : {})}
      isOptionEqualToValue={(option, selectedValue) => option.id === selectedValue.id}
      getOptionLabel={(option) => option.label}
      onInputChange={(_, nextInputValue, reason) => {
        if (reason === "input" || reason === "clear") {
          onInputChange?.(nextInputValue);
        }
      }}
      onChange={(_, nextValue) => props.onChange(nextValue)}
      noOptionsText={noOptionsText}
      renderOption={(optionProps, option) =>
        renderEntityOption(optionProps, option, imageVariant, size, latinSubtitle)
      }
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
            startAdornment: props.value ? (
              <>
                <Box sx={{ display: "flex", alignItems: "center", alignSelf: "center", mr: 0.5 }}>
                  <EntityOptionThumbnail
                    imageUrl={props.value.imageUrl}
                    imageAccessUrl={props.value.imageAccessUrl}
                    label={props.value.label}
                    variant={imageVariant}
                    size={size}
                    context="input"
                  />
                </Box>
                {params.InputProps.startAdornment}
              </>
            ) : (
              params.InputProps.startAdornment
            ),
            endAdornment: renderLoadingEndAdornment(params.InputProps.endAdornment),
          }}
        />
      )}
    />
  );
}

export default EntityAutocompleteField;
