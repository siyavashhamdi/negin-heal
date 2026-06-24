import type { ReactElement } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Button, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";

import type { JsonFormState, UpdateJsonFormState, UsdtWalletForm } from "./types";
import { removeAt, replaceAt, type TextFieldConfig } from "./shared";
import SectionPaper from "./SectionPaper";
import { WALLET_NETWORK_OPTIONS, createEmptyUsdtWallet } from "./utils";

const usdtWalletFields: readonly TextFieldConfig<keyof UsdtWalletForm>[] = [
  { key: "address", label: "آدرس کیف پول" },
];

interface UsdtWalletsEditorProps {
  readonly jsonValue: Extract<JsonFormState, { kind: "usdtWallets" }>;
  readonly updateJson: UpdateJsonFormState;
}

const UsdtWalletsEditor = ({ jsonValue, updateJson }: UsdtWalletsEditorProps): ReactElement => (
  <Stack spacing={2}>
    {jsonValue.wallets.map((wallet, index) => (
      <SectionPaper key={index}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={900}>کیف پول {index + 1}</Typography>
          <IconButton
            color="error"
            onClick={() =>
              updateJson((current) =>
                current.kind === "usdtWallets"
                  ? {
                      ...current,
                      wallets: removeAt(current.wallets, index, createEmptyUsdtWallet()),
                    }
                  : current
              )
            }
          >
            <DeleteOutlineRoundedIcon />
          </IconButton>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            fullWidth
            label="شبکه"
            value={wallet.network}
            onChange={(event) =>
              updateJson((current) => {
                if (current.kind !== "usdtWallets") {
                  return current;
                }
                const nextWallet = {
                  ...wallet,
                  network: event.target.value as UsdtWalletForm["network"],
                };
                return { ...current, wallets: replaceAt(current.wallets, index, nextWallet) };
              })
            }
          >
            {WALLET_NETWORK_OPTIONS.map((network) => (
              <MenuItem key={network} value={network}>
                {network}
              </MenuItem>
            ))}
          </TextField>
          {usdtWalletFields.map((field) => (
            <TextField
              key={field.key}
              fullWidth
              label={field.label}
              value={wallet[field.key]}
              onChange={(event) =>
                updateJson((current) => {
                  if (current.kind !== "usdtWallets") {
                    return current;
                  }
                  const nextWallet = { ...wallet, [field.key]: event.target.value };
                  return { ...current, wallets: replaceAt(current.wallets, index, nextWallet) };
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
          current.kind === "usdtWallets"
            ? { ...current, wallets: [...current.wallets, createEmptyUsdtWallet()] }
            : current
        )
      }
    >
      افزودن کیف پول
    </Button>
  </Stack>
);

export default UsdtWalletsEditor;
