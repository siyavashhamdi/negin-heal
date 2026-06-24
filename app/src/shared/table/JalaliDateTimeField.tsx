import { type MouseEvent, type ReactElement, useMemo } from "react";
import DatePicker from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { Value } from "react-multi-date-picker";
import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import { Clear as ClearIcon } from "@mui/icons-material";

import { useThemeMode } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import styles from "./JalaliDateFilterField.module.scss";
import AppTooltip from "../AppTooltip";

export interface JalaliDateTimeFieldProps {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  size?: "small" | "medium";
}

function toLocalDateTimeInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function parseDateTimeValue(value: string): DateObject | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new DateObject({
    date,
    calendar: persian,
    locale: persian_fa,
  });
}

const JalaliDateTimeField = ({
  label,
  ariaLabel,
  value,
  onChange,
  required = false,
  size = "small",
}: JalaliDateTimeFieldProps): ReactElement => {
  const { t } = useTranslation();
  const { mode } = useThemeMode();
  const pickerValue = parseDateTimeValue(value);
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

    onChange(toLocalDateTimeInputValue(asObject.toDate()));
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
        format="YYYY/MM/DD HH:mm"
        calendarPosition="bottom-center"
        className={calendarClassName}
        arrowClassName="jalali-date-filter-arrow"
        containerClassName={styles.pickerContainer}
        plugins={[<TimePicker key="time-picker" position="bottom" hideSeconds />]}
        render={(displayValue, openCalendar) => (
          <TextField
            size={size}
            fullWidth
            label={label}
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
            }}
            InputLabelProps={{ "aria-label": ariaLabel }}
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

export default JalaliDateTimeField;
