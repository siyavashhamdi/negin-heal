import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, FormLabel, IconButton, InputAdornment } from "@mui/material";
import { Replay as ReplayIcon, Security as SecurityIcon } from "@mui/icons-material";
import { useTranslation } from "../../../hooks/useTranslation";
import { USER_LOGIN_CAPTCHA_QUERY } from "../../../graphql/queries/userLoginCaptcha.query";
import { LOGIN_CAPTCHA_MAX_AUTO_REFRESHES } from "../../../constants";
import { toWesternDigits } from "../../../utilities/persian-digits.util";
import { LoginAdornedTextField } from "./LoginAdornedTextField";
import { RequiredFieldLabel } from "./RequiredFieldLabel";
import formStyles from "../styles/LoginFormShared.module.scss";
import captchaStyles from "../styles/RequestLoginCode.module.scss";

const CAPTCHA_INPUT_ALLOWED_CHARS = /[^a-zA-Z0-9]/g;

const sanitizeCaptchaInput = (value: string): string =>
  toWesternDigits(value).replace(CAPTCHA_INPUT_ALLOWED_CHARS, "").slice(0, 128).toUpperCase();

interface UserLoginCaptchaResponse {
  userLoginCaptcha: {
    captchaId: string;
    imageBase64: string;
    imageMimeType: string;
    expiresAtIso: string;
  };
}

export interface LoginCaptchaFieldProps {
  readonly disabled?: boolean;
  readonly error?: boolean;
  readonly required?: boolean;
  readonly onCaptchaChange: (input: { captchaId: string; value: string; isValid: boolean }) => void;
}

export const LoginCaptchaField = ({
  disabled = false,
  error = false,
  required = false,
  onCaptchaChange,
}: LoginCaptchaFieldProps): ReactElement => {
  const { t } = useTranslation();
  const [captchaValue, setCaptchaValue] = useState("");
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);
  const { data, loading, refetch } = useQuery<UserLoginCaptchaResponse>(USER_LOGIN_CAPTCHA_QUERY, {
    fetchPolicy: "no-cache",
    nextFetchPolicy: "no-cache",
  });
  const captchaId = data?.userLoginCaptcha?.captchaId || "";
  const imageSrc = useMemo(() => {
    const image = data?.userLoginCaptcha;
    if (!image?.imageBase64 || !image.imageMimeType) {
      return "";
    }
    return `data:${image.imageMimeType};base64,${image.imageBase64}`;
  }, [data]);
  const expiresAtIso = data?.userLoginCaptcha?.expiresAtIso;

  useEffect(() => {
    const isValid = captchaValue.trim().length > 0 && Boolean(captchaId);
    onCaptchaChange({
      captchaId,
      value: captchaValue,
      isValid,
    });
  }, [captchaId, captchaValue, onCaptchaChange]);

  useEffect(() => {
    if (!expiresAtIso || autoRefreshCount >= LOGIN_CAPTCHA_MAX_AUTO_REFRESHES) {
      return undefined;
    }

    const expiresAtMs = new Date(expiresAtIso).getTime();
    if (!Number.isFinite(expiresAtMs)) {
      return undefined;
    }

    const delayMs = expiresAtMs - Date.now();
    let isActive = true;

    const refreshExpiredCaptcha = (): void => {
      setAutoRefreshCount((previous) => previous + 1);
      void refetch().finally(() => {
        if (isActive) {
          setCaptchaValue("");
        }
      });
    };

    if (delayMs <= 0) {
      refreshExpiredCaptcha();
      return () => {
        isActive = false;
      };
    }

    const timeoutId = window.setTimeout(refreshExpiredCaptcha, delayMs);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [autoRefreshCount, expiresAtIso, refetch]);

  const refreshCaptcha = useCallback(async (): Promise<void> => {
    setAutoRefreshCount(0);
    await refetch();
    setCaptchaValue("");
  }, [refetch]);

  const handleValueChange = (nextValue: string): void => {
    setCaptchaValue(sanitizeCaptchaInput(nextValue));
  };

  return (
    <Box className={captchaStyles.captchaWrapper}>
      <FormLabel component="div" className={captchaStyles.captchaSectionTitle}>
        <RequiredFieldLabel required={required}>{t("auth.login.captchaLabel")}</RequiredFieldLabel>
      </FormLabel>

      <Box className={captchaStyles.captchaRow}>
        <Box className={captchaStyles.captchaDisplayPanel}>
          <IconButton
            type="button"
            size="small"
            onClick={refreshCaptcha}
            disabled={disabled || loading}
            className={captchaStyles.captchaRefreshFab}
            aria-label={t("auth.login.refreshCaptcha")}
          >
            <ReplayIcon fontSize="small" />
          </IconButton>

          <Box className={captchaStyles.captchaDisplay} aria-hidden>
            {loading ? (
              <CircularProgress size={22} />
            ) : imageSrc ? (
              <img
                src={imageSrc}
                alt={t("auth.login.captchaLabel")}
                className={captchaStyles.captchaImage}
              />
            ) : null}
          </Box>
        </Box>

        <LoginAdornedTextField
          fullWidth
          label={t("auth.login.captchaInputLabel")}
          type="text"
          value={captchaValue}
          onChange={(event) => handleValueChange(event.target.value)}
          className={captchaStyles.captchaInputField}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SecurityIcon className={formStyles.inputIcon} />
              </InputAdornment>
            ),
          }}
          autoComplete="off"
          disabled={disabled}
          error={error}
          required={required}
          inputProps={{
            maxLength: 128,
            spellCheck: false,
            className: formStyles.latinInput,
            dir: "ltr",
            lang: "en",
            autoCapitalize: "off",
            autoCorrect: "off",
          }}
        />
      </Box>
    </Box>
  );
};
