import type { ReactElement } from "react";
import { Checkbox, FormControlLabel, Stack, TextField } from "@mui/material";

import type { JsonFormState, UpdateJsonFormState } from "./types";
import { HTML_TEXTAREA_ROWS } from "./shared";
import SectionPaper from "./SectionPaper";
import EmailTemplatesEditor from "./EmailTemplatesEditor";
import ObjectFieldsEditor from "./ObjectFieldsEditor";
import PaymentCardsEditor from "./PaymentCardsEditor";
import PaymentMethodsEditor from "./PaymentMethodsEditor";
import SupportContactEditor from "./SupportContactEditor";
import UsdtWalletsEditor from "./UsdtWalletsEditor";

const usdtRateFields = [
  { key: "valueIrt", label: "نرخ هر USDT به تومان", type: "number" },
  { key: "feeUsdt", label: "کارمزد ثابت USDT", type: "number" },
  { key: "coefficient", label: "ضریب محاسبه", type: "number" },
] as const;

const zarinpalFields = [
  { key: "merchantId", label: "مرچنت آیدی" },
  { key: "requestUrl", label: "آدرس Request", type: "url" },
  { key: "verifyUrl", label: "آدرس Verify", type: "url" },
  { key: "startPayUrl", label: "آدرس StartPay", type: "url" },
  { key: "minAmountIrr", label: "حداقل مبلغ ریالی", type: "number" },
  { key: "proxyBaseUrl", label: "آدرس پروکسی زرین‌پال (اختیاری)", type: "url" },
  { key: "proxyApiKey", label: "کلید API پروکسی (اختیاری)", type: "password" },
] as const;

const smtpFields = [
  { key: "host", label: "هاست SMTP" },
  { key: "port", label: "پورت", type: "number" },
  { key: "username", label: "نام کاربری" },
  { key: "password", label: "گذرواژه", type: "password" },
  { key: "fromName", label: "نام فرستنده" },
  { key: "fromEmail", label: "ایمیل فرستنده", type: "email" },
] as const;

const backupFields = [{ key: "rarPassword", label: "رمز آرشیو RAR", type: "password" }] as const;

const telegramFields = [
  { key: "botToken", label: "توکن ربات", type: "password" },
  { key: "chatId", label: "شناسه چت" },
  { key: "apiBaseUrl", label: "آدرس API", type: "url" },
] as const;

interface JsonValueEditorProps {
  readonly jsonValue: JsonFormState;
  readonly updateJson: UpdateJsonFormState;
}

const JsonValueEditor = ({ jsonValue, updateJson }: JsonValueEditorProps): ReactElement | null => {
  switch (jsonValue.kind) {
    case "paymentCards":
      return <PaymentCardsEditor jsonValue={jsonValue} updateJson={updateJson} />;
    case "paymentMethods":
      return <PaymentMethodsEditor jsonValue={jsonValue} updateJson={updateJson} />;
    case "usdtWallets":
      return <UsdtWalletsEditor jsonValue={jsonValue} updateJson={updateJson} />;
    case "usdtIrtRate":
      return (
        <ObjectFieldsEditor
          value={jsonValue.rate}
          fields={usdtRateFields}
          onChange={(rate) =>
            updateJson((current) =>
              current.kind === "usdtIrtRate" ? { ...current, rate } : current
            )
          }
        />
      );
    case "zarinpalConfig":
      return (
        <ObjectFieldsEditor
          value={jsonValue.config}
          fields={zarinpalFields}
          onChange={(config) =>
            updateJson((current) =>
              current.kind === "zarinpalConfig" ? { ...current, config } : current
            )
          }
        />
      );
    case "emailSmtpConfig":
      return (
        <Stack spacing={2}>
          <ObjectFieldsEditor
            value={jsonValue.config}
            fields={smtpFields}
            onChange={(config) =>
              updateJson((current) =>
                current.kind === "emailSmtpConfig" ? { ...current, config } : current
              )
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={jsonValue.config.secure}
                onChange={(event) =>
                  updateJson((current) =>
                    current.kind === "emailSmtpConfig"
                      ? {
                          ...current,
                          config: { ...current.config, secure: event.target.checked },
                        }
                      : current
                  )
                }
              />
            }
            label="اتصال امن SMTP فعال باشد"
          />
        </Stack>
      );
    case "backupConfig":
      return (
        <ObjectFieldsEditor
          value={jsonValue.config}
          fields={backupFields}
          onChange={(config) =>
            updateJson((current) =>
              current.kind === "backupConfig" ? { ...current, config } : current
            )
          }
        />
      );
    case "telegramConfig":
      return (
        <ObjectFieldsEditor
          value={jsonValue.config}
          fields={telegramFields}
          onChange={(config) =>
            updateJson((current) =>
              current.kind === "telegramConfig" ? { ...current, config } : current
            )
          }
        />
      );
    case "emailTemplates":
      return <EmailTemplatesEditor jsonValue={jsonValue} updateJson={updateJson} />;
    case "supportContact":
      return <SupportContactEditor jsonValue={jsonValue} updateJson={updateJson} />;
    case "rawJson":
      return (
        <SectionPaper>
          <TextField
            fullWidth
            multiline
            minRows={HTML_TEXTAREA_ROWS}
            maxRows={HTML_TEXTAREA_ROWS}
            label="JSON خام"
            value={jsonValue.value}
            onChange={(event) =>
              updateJson((current) =>
                current.kind === "rawJson" ? { ...current, value: event.target.value } : current
              )
            }
          />
        </SectionPaper>
      );
    default:
      return null;
  }
};

export default JsonValueEditor;
