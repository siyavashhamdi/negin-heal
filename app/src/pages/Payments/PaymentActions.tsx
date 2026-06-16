import { AddRounded as AddRoundedIcon } from "@mui/icons-material";
import { Button, DialogActions, Stack } from "@mui/material";
import type { Theme } from "@mui/material/styles";

import CrudRowActions from "../../shared/crud/CrudRowActions";
import { crudModalFooterSx } from "../../shared/crud/modalThemeSx";

type PaymentRowActionsProps = {
  readonly onReview: () => void;
};

type ManualPaymentDialogActionsProps = {
  readonly theme: Theme;
  readonly isMobile: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
  readonly cancelDisabled: boolean;
  readonly submitDisabled: boolean;
  readonly isUploadingFile: boolean;
  readonly isSubmitting: boolean;
};

type ReviewPaymentDialogActionsProps = {
  readonly theme: Theme;
  readonly isMobile: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
  readonly cancelDisabled: boolean;
  readonly submitDisabled: boolean;
  readonly cancelLabel: string;
};

export function PaymentRowActions({ onReview }: PaymentRowActionsProps) {
  return <CrudRowActions onView={onReview} viewLabel="بررسی" />;
}

export function ManualPaymentDialogActions({
  theme,
  isMobile,
  onCancel,
  onSubmit,
  cancelDisabled,
  submitDisabled,
  isUploadingFile,
  isSubmitting,
}: ManualPaymentDialogActionsProps) {
  return (
    <DialogActions
      sx={crudModalFooterSx(theme, {
        pinFooterToBottomOnMobile: true,
      })}
    >
      <Stack
        direction={isMobile ? "column-reverse" : "row"}
        spacing={1.5}
        sx={{
          width: "100%",
          justifyContent: isMobile ? "stretch" : "flex-end",
          "& .MuiButton-root": {
            width: isMobile ? "100%" : "auto",
            minWidth: isMobile ? undefined : "8rem",
          },
        }}
      >
        <Button variant="outlined" color="inherit" onClick={onCancel} disabled={cancelDisabled}>
          انصراف
        </Button>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onSubmit}
          disabled={submitDisabled}
        >
          {isUploadingFile
            ? "در حال آپلود فایل..."
            : isSubmitting
              ? "در حال ثبت..."
              : "ثبت پرداخت دستی"}
        </Button>
      </Stack>
    </DialogActions>
  );
}

export function ReviewPaymentDialogActions({
  theme,
  isMobile,
  onCancel,
  onSubmit,
  cancelDisabled,
  submitDisabled,
  cancelLabel,
}: ReviewPaymentDialogActionsProps) {
  return (
    <DialogActions
      sx={crudModalFooterSx(theme, {
        pinFooterToBottomOnMobile: true,
      })}
    >
      <Stack
        direction={isMobile ? "column-reverse" : "row"}
        spacing={1.5}
        sx={{
          width: "100%",
          justifyContent: isMobile ? "stretch" : "flex-end",
          "& .MuiButton-root": {
            width: isMobile ? "100%" : "auto",
            minWidth: isMobile ? undefined : "6.5rem",
          },
        }}
      >
        <Button variant="outlined" color="inherit" onClick={onCancel} disabled={cancelDisabled}>
          {cancelLabel}
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitDisabled}>
          ثبت نتیجه بررسی
        </Button>
      </Stack>
    </DialogActions>
  );
}
