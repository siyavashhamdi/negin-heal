import { AddRounded as AddRoundedIcon } from "@mui/icons-material";
import { type ReactElement } from "react";

import CrudRowActions from "../../shared/crud/CrudRowActions";
import ModalFooterActions, { type ModalFooterAction } from "../../shared/crud/ModalFooterActions";

type PaymentRowActionsProps = {
  readonly onReview: () => void;
};

type ManualPaymentDialogActionsProps = {
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
  readonly cancelDisabled: boolean;
  readonly submitDisabled: boolean;
  readonly isUploadingFile: boolean;
  readonly isSubmitting: boolean;
};

type ReviewPaymentDialogActionsProps = {
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
  readonly cancelDisabled: boolean;
  readonly submitDisabled: boolean;
};

export function PaymentRowActions({ onReview }: PaymentRowActionsProps) {
  return <CrudRowActions onView={onReview} viewLabel="بررسی" />;
}

export function ManualPaymentDialogActions({
  onCancel,
  onSubmit,
  cancelDisabled,
  submitDisabled,
  isUploadingFile,
  isSubmitting,
}: ManualPaymentDialogActionsProps): ReactElement {
  const actions: readonly ModalFooterAction[] = [
    {
      key: "close",
      isCloseButton: true,
      onClick: onCancel,
      disabled: cancelDisabled,
    },
    {
      key: "submit",
      label: isUploadingFile
        ? "در حال آپلود فایل..."
        : isSubmitting
          ? "در حال ثبت..."
          : "ثبت پرداخت دستی",
      onClick: onSubmit,
      variant: "contained",
      color: "primary",
      disabled: submitDisabled,
      icon: <AddRoundedIcon />,
    },
  ];

  return <ModalFooterActions actions={actions} />;
}

export function ReviewPaymentDialogActions({
  onCancel,
  onSubmit,
  cancelDisabled,
  submitDisabled,
}: ReviewPaymentDialogActionsProps): ReactElement {
  const actions: readonly ModalFooterAction[] = [
    {
      key: "close",
      isCloseButton: true,
      onClick: onCancel,
      disabled: cancelDisabled,
    },
    {
      key: "submit",
      label: "ثبت نتیجه بررسی",
      onClick: onSubmit,
      variant: "contained",
      color: "primary",
      disabled: submitDisabled,
    },
  ];

  return <ModalFooterActions actions={actions} />;
}
