import { type MouseEvent, type ReactElement, useMemo } from "react";
import DatePicker from "react-multi-date-picker";
import "react-multi-date-picker/styles/layouts/prime.css";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { Value } from "react-multi-date-picker";
import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import { Clear as ClearIcon } from "@mui/icons-material";
import { useThemeMode } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import {
  formatJalaliParamDate,
  parseJalaliParamDate,
} from "../../utilities/jalali-date-param.util";

import styles from "./JalaliDateFilterField.module.scss";
import AppTooltip from "../AppTooltip";

export interface JalaliDateFilterFieldProps {
  /** Used for accessibility (and floating label text when `label` is set). */
  ariaLabel: string;
  /** MUI floating label inside the field; matches other supplementary filters. */
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown inside the field when empty and no floating label is set. */
  placeholder?: string;
  required?: boolean;
}

const JalaliDateFilterField = ({
  ariaLabel,
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: JalaliDateFilterFieldProps): ReactElement => {
  const { t } = useTranslation();
  const { mode } = useThemeMode();
  const useFloatingLabel = label != null && label !== "";
  const pickerValue = parseJalaliParamDate(value);
  const hasValue = value.trim() !== "";

  const calendarClassName = useMemo(
    () =>
      mode === "dark"
        ? "rmdp-prime bg-dark jalali-date-filter-popup"
        : "rmdp-prime jalali-date-filter-popup",
    [mode]
  );

  const handleChange = (next: Value): void => {
    if (next == null) {
      onChange("");
      return;
    }
    const picked = Array.isArray(next) ? next[0] : next;
    if (!picked) {
      onChange("");
      return;
    }
    const asObject =
      picked instanceof DateObject
        ? picked
        : new DateObject({
            date: picked,
            calendar: persian,
            locale: persian_fa,
          });
    onChange(formatJalaliParamDate(asObject));
  };

  const handleClear = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    onChange("");
  };

  return (
    <Box className={styles.root}>
      <DatePicker
        value={pickerValue}
        onChange={handleChange}
        onOpenPickNewDate={false}
        calendar={persian}
        locale={persian_fa}
        format="YYYY/MM/DD"
        calendarPosition="bottom-center"
        className={calendarClassName}
        arrowClassName="jalali-date-filter-arrow"
        containerClassName={styles.pickerContainer}
        render={(displayValue, openCalendar) => (
          <TextField
            size="small"
            fullWidth
            label={useFloatingLabel ? label : undefined}
            placeholder={useFloatingLabel ? undefined : (placeholder ?? "۱۴۰۳/۰۱/۰۱")}
            value={displayValue ?? ""}
            required={required}
            onClick={openCalendar}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCalendar();
              }
            }}
            inputProps={{
              readOnly: true,
              className: styles.textFieldInput,
              "aria-label": useFloatingLabel ? undefined : ariaLabel,
            }}
            InputLabelProps={useFloatingLabel ? { "aria-label": ariaLabel } : undefined}
            InputProps={{
              endAdornment: hasValue ? (
                <InputAdornment position="end">
                  <AppTooltip title={t("table.dataGrid.filter.clearField")} arrow>
                    <span>
                      <IconButton
                        size="small"
                        aria-label={t("table.dataGrid.filter.clearField")}
                        onMouseDown={handleClear}
                        onClick={handleClear}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </AppTooltip>
                </InputAdornment>
              ) : undefined,
            }}
          />
        )}
      />
    </Box>
  );
};

export default JalaliDateFilterField;
