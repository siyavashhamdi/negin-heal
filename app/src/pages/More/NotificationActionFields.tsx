import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Stack, TextField, Typography, Box, Button } from "@mui/material";
import { type ReactElement } from "react";

import {
  buildNotificationActionPayload,
  type NotificationActionPayload,
} from "../../utilities/notification-action.util";

export type NotificationActionFormState = {
  readonly label: string;
  readonly href: string;
};

export const EMPTY_NOTIFICATION_ACTION_FORM: NotificationActionFormState = {
  label: "",
  href: "",
};

const MAX_ACTION_LABEL_LENGTH = 40;
const MAX_ACTION_HREF_LENGTH = 500;

export function hasNotificationActionFormValue(form: NotificationActionFormState): boolean {
  return Boolean(form.label.trim() || form.href.trim());
}

export function buildNotificationActionPayloadFromForm(
  form: NotificationActionFormState
): NotificationActionPayload | null {
  return buildNotificationActionPayload({
    label: form.label,
    href: form.href,
  });
}

export function isNotificationActionFormValid(form: NotificationActionFormState): boolean {
  if (!hasNotificationActionFormValue(form)) {
    return true;
  }

  return (
    form.label.length <= MAX_ACTION_LABEL_LENGTH &&
    form.href.length <= MAX_ACTION_HREF_LENGTH &&
    buildNotificationActionPayloadFromForm(form) != null
  );
}

type NotificationActionFieldsProps = {
  readonly value: NotificationActionFormState;
  readonly onChange: (value: NotificationActionFormState) => void;
  readonly disabled?: boolean;
};

const NotificationActionFields = ({
  value,
  onChange,
  disabled = false,
}: NotificationActionFieldsProps): ReactElement => {
  const hasAction = hasNotificationActionFormValue(value);

  const setField = <TField extends keyof NotificationActionFormState>(
    field: TField,
    fieldValue: NotificationActionFormState[TField]
  ): void => {
    onChange({ ...value, [field]: fieldValue });
  };

  const deleteAction = (): void => {
    onChange(EMPTY_NOTIFICATION_ACTION_FORM);
  };

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ sm: "center" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={800}>
            دکمه اقدام (اختیاری)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            اگر پر شود، دکمه‌ای در پاپ‌آپ اعلان نمایش داده می‌شود.
          </Typography>
        </Box>

        {hasAction ? (
          <Button
            type="button"
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteOutlineRoundedIcon />}
            onClick={deleteAction}
            disabled={disabled}
          >
            حذف دکمه اقدام
          </Button>
        ) : null}
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField
          label="عنوان دکمه"
          value={value.label}
          onChange={(event) => setField("label", event.target.value)}
          inputProps={{ maxLength: MAX_ACTION_LABEL_LENGTH }}
          helperText={`${value.label.length}/${MAX_ACTION_LABEL_LENGTH}`}
          fullWidth
          disabled={disabled}
        />
        <TextField
          label="آدرس لینک"
          value={value.href}
          onChange={(event) => setField("href", event.target.value)}
          inputProps={{ maxLength: MAX_ACTION_HREF_LENGTH }}
          helperText="مثال: /courses یا https://example.com"
          fullWidth
          disabled={disabled}
        />
      </Stack>
    </>
  );
};

export default NotificationActionFields;
