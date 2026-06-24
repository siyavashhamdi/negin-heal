import type { ReactElement } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { JsonFormState, PaymentMethodForm, UpdateJsonFormState } from "./types";
import { removeAt, replaceAt } from "./shared";
import SectionPaper from "./SectionPaper";
import { PAYMENT_METHOD_LABEL, PAYMENT_METHOD_OPTIONS, createEmptyPaymentMethod } from "./utils";

interface PaymentMethodsEditorProps {
  readonly jsonValue: Extract<JsonFormState, { kind: "paymentMethods" }>;
  readonly updateJson: UpdateJsonFormState;
}

const methodStatusFields = [
  ["isVisible", "نمایش داده شود"],
  ["isActive", "قابل انتخاب باشد"],
  ["isRecommended", "پیشنهادی باشد"],
] as const;

const PaymentMethodsEditor = ({
  jsonValue,
  updateJson,
}: PaymentMethodsEditorProps): ReactElement => (
  <Stack spacing={2}>
    {jsonValue.methods.map((method, index) => (
      <SectionPaper key={index}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={900}>روش پرداخت {index + 1}</Typography>
          <IconButton
            color="error"
            onClick={() =>
              updateJson((current) =>
                current.kind === "paymentMethods"
                  ? {
                      ...current,
                      methods: removeAt(current.methods, index, createEmptyPaymentMethod()),
                    }
                  : current
              )
            }
          >
            <DeleteOutlineRoundedIcon />
          </IconButton>
        </Stack>
        <TextField
          select
          fullWidth
          label="روش پرداخت"
          value={method.method}
          onChange={(event) =>
            updateJson((current) => {
              if (current.kind !== "paymentMethods") {
                return current;
              }
              const nextMethod = {
                ...method,
                method: event.target.value as PaymentMethodForm["method"],
              };
              return { ...current, methods: replaceAt(current.methods, index, nextMethod) };
            })
          }
        >
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {PAYMENT_METHOD_LABEL[option]}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          {methodStatusFields.map(([field, label]) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={method[field]}
                  onChange={(event) =>
                    updateJson((current) => {
                      if (current.kind !== "paymentMethods") {
                        return current;
                      }
                      const nextMethod = { ...method, [field]: event.target.checked };
                      return {
                        ...current,
                        methods: replaceAt(current.methods, index, nextMethod),
                      };
                    })
                  }
                />
              }
              label={label}
            />
          ))}
        </Stack>
      </SectionPaper>
    ))}
    <Button
      variant="outlined"
      startIcon={<AddRoundedIcon />}
      onClick={() =>
        updateJson((current) =>
          current.kind === "paymentMethods"
            ? { ...current, methods: [...current.methods, createEmptyPaymentMethod()] }
            : current
        )
      }
    >
      افزودن روش پرداخت
    </Button>
  </Stack>
);

export default PaymentMethodsEditor;
