import type { ReactElement } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Button, IconButton, Stack, TextField, Typography } from "@mui/material";

import type { JsonFormState, PaymentCardForm, UpdateJsonFormState } from "./types";
import { removeAt, replaceAt, type TextFieldConfig } from "./shared";
import SectionPaper from "./SectionPaper";
import { createEmptyPaymentCard } from "./utils";

const paymentCardFields: readonly TextFieldConfig<keyof PaymentCardForm>[] = [
  { key: "cardNumber", label: "شماره کارت" },
  { key: "cardHolderName", label: "نام صاحب کارت" },
  { key: "bankName", label: "نام بانک" },
];

interface PaymentCardsEditorProps {
  readonly jsonValue: Extract<JsonFormState, { kind: "paymentCards" }>;
  readonly updateJson: UpdateJsonFormState;
}

const PaymentCardsEditor = ({ jsonValue, updateJson }: PaymentCardsEditorProps): ReactElement => (
  <Stack spacing={2}>
    {jsonValue.cards.map((card, index) => (
      <SectionPaper key={index}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={900}>کارت پرداخت {index + 1}</Typography>
          <IconButton
            color="error"
            onClick={() =>
              updateJson((current) =>
                current.kind === "paymentCards"
                  ? {
                      ...current,
                      cards: removeAt(current.cards, index, createEmptyPaymentCard()),
                    }
                  : current
              )
            }
          >
            <DeleteOutlineRoundedIcon />
          </IconButton>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {paymentCardFields.map((field) => (
            <TextField
              key={field.key}
              fullWidth
              label={field.label}
              value={card[field.key]}
              onChange={(event) =>
                updateJson((current) => {
                  if (current.kind !== "paymentCards") {
                    return current;
                  }
                  const nextCard = { ...card, [field.key]: event.target.value };
                  return { ...current, cards: replaceAt(current.cards, index, nextCard) };
                })
              }
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
          current.kind === "paymentCards"
            ? { ...current, cards: [...current.cards, createEmptyPaymentCard()] }
            : current
        )
      }
    >
      افزودن کارت
    </Button>
  </Stack>
);

export default PaymentCardsEditor;
