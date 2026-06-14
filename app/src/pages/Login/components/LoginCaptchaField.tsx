import { useState, type CSSProperties, type ReactElement } from "react";
import { Box, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import { Replay as ReplayIcon, Security as SecurityIcon } from "@mui/icons-material";
import { useTranslation } from "../../../hooks/useTranslation";
import {
  buildLoginCaptchaToken,
  captchaResponseMatchesChallenge,
} from "../../../lib/login-captcha.util";
import formStyles from "../styles/LoginFormShared.module.scss";
import captchaStyles from "../styles/RequestLoginCode.module.scss";

const CAPTCHA_LENGTH = 5;
const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const createCaptchaChallenge = (length = CAPTCHA_LENGTH): string =>
  Array.from({ length }, () => {
    const idx = Math.floor(Math.random() * CAPTCHA_CHARS.length);
    return CAPTCHA_CHARS[idx] ?? "A";
  }).join("");

const captchaRandom = (min: number, max: number): number => min + Math.random() * (max - min);
const captchaRound1 = (value: number): number => Math.round(value * 10) / 10;

interface CaptchaCharSpec {
  readonly angleDeg: number;
  readonly translateXRem: number;
  readonly translateYRem: number;
  readonly marginInlineStartRem: number;
  readonly marginInlineEndRem: number;
}

const createCaptchaCharSpecs = (length: number): CaptchaCharSpec[] =>
  Array.from({ length }, () => ({
    angleDeg: captchaRound1(captchaRandom(-30, 30)),
    translateXRem: captchaRound1(captchaRandom(-0.4375, 0.4375)),
    translateYRem: captchaRound1(captchaRandom(-0.5, 0.5)),
    marginInlineStartRem: captchaRound1(captchaRandom(0, 0.2)),
    marginInlineEndRem: captchaRound1(captchaRandom(0.03, 0.42)),
  }));

const CAPTCHA_NOISE_LINE_COUNT_MIN = 4;
const CAPTCHA_NOISE_LINE_COUNT_MAX = 7;

interface CaptchaNoiseLineSpec {
  readonly angleDeg: number;
  readonly widthPercent: number;
  readonly topPercent: number;
  readonly leftPercent: number;
}

const createCaptchaNoiseLines = (): CaptchaNoiseLineSpec[] => {
  const count =
    CAPTCHA_NOISE_LINE_COUNT_MIN +
    Math.floor(Math.random() * (CAPTCHA_NOISE_LINE_COUNT_MAX - CAPTCHA_NOISE_LINE_COUNT_MIN + 1));
  return Array.from({ length: count }, () => ({
    angleDeg: Math.round((Math.random() * 150 - 75) * 10) / 10,
    widthPercent: Math.round((22 + Math.random() * 68) * 10) / 10,
    topPercent: Math.round((8 + Math.random() * 84) * 10) / 10,
    leftPercent: Math.round((8 + Math.random() * 84) * 10) / 10,
  }));
};

export interface LoginCaptchaFieldProps {
  readonly disabled?: boolean;
  readonly error?: boolean;
  readonly onTokenChange: (token: string) => void;
  readonly onValidityChange?: (isValid: boolean) => void;
}

export const LoginCaptchaField = ({
  disabled = false,
  error = false,
  onTokenChange,
  onValidityChange,
}: LoginCaptchaFieldProps): ReactElement => {
  const { t } = useTranslation();
  const [captchaChallenge, setCaptchaChallenge] = useState<string>(() => createCaptchaChallenge());
  const [captchaCharSpecs, setCaptchaCharSpecs] = useState<CaptchaCharSpec[]>(() =>
    createCaptchaCharSpecs(CAPTCHA_LENGTH)
  );
  const [captchaNoiseLines, setCaptchaNoiseLines] = useState<CaptchaNoiseLineSpec[]>(() =>
    createCaptchaNoiseLines()
  );
  const [captchaValue, setCaptchaValue] = useState("");

  const refreshCaptcha = (): void => {
    const nextChallenge = createCaptchaChallenge();
    setCaptchaChallenge(nextChallenge);
    setCaptchaCharSpecs(createCaptchaCharSpecs(nextChallenge.length));
    setCaptchaNoiseLines(createCaptchaNoiseLines());
    setCaptchaValue("");
    onTokenChange("");
    onValidityChange?.(false);
  };

  const handleValueChange = (nextValue: string): void => {
    setCaptchaValue(nextValue);
    const isValid =
      nextValue.trim().length > 0 &&
      captchaResponseMatchesChallenge(captchaChallenge, nextValue);
    onValidityChange?.(isValid);
    onTokenChange(
      isValid ? buildLoginCaptchaToken(captchaChallenge, nextValue) : ""
    );
  };

  return (
    <Box className={captchaStyles.captchaWrapper}>
      <Typography component="div" className={captchaStyles.captchaSectionTitle}>
        {t("auth.login.captchaLabel")}
      </Typography>

      <Box className={captchaStyles.captchaRow}>
        <Box className={captchaStyles.captchaDisplayPanel}>
          <IconButton
            type="button"
            size="small"
            onClick={refreshCaptcha}
            disabled={disabled}
            className={captchaStyles.captchaRefreshFab}
            aria-label={t("auth.login.refreshCaptcha")}
          >
            <ReplayIcon fontSize="small" />
          </IconButton>

          <Box className={captchaStyles.captchaDisplay} aria-hidden>
            <Box component="span" className={captchaStyles.captchaCharGroup}>
              {captchaChallenge.split("").map((char, index) => {
                const spec = captchaCharSpecs[index];
                if (!spec) {
                  return null;
                }
                const charTransform =
                  `translate(${spec.translateXRem}rem, ${spec.translateYRem}rem) ` +
                  `rotate(${spec.angleDeg}deg)`;
                return (
                  <span
                    key={`${captchaChallenge}-${index}`}
                    className={captchaStyles.captchaChar}
                    style={
                      {
                        "--captcha-char-transform": charTransform,
                        "--captcha-ms": `${spec.marginInlineStartRem}rem`,
                        "--captcha-me": `${spec.marginInlineEndRem}rem`,
                      } as CSSProperties
                    }
                  >
                    {char}
                  </span>
                );
              })}
            </Box>
            {captchaNoiseLines.map((line, noiseIndex) => (
              <span
                key={`captcha-noise-${noiseIndex}-${line.angleDeg}-${line.widthPercent}`}
                className={captchaStyles.captchaNoiseLine}
                style={
                  {
                    "--captcha-noise-left": `${line.leftPercent}%`,
                    "--captcha-noise-top": `${line.topPercent}%`,
                    "--captcha-noise-width": `${line.widthPercent}%`,
                    "--captcha-noise-transform": `translate(-50%, -50%) rotate(${line.angleDeg}deg)`,
                  } as CSSProperties
                }
              />
            ))}
          </Box>
        </Box>

        <TextField
          fullWidth
          label={t("auth.login.captchaInputLabel")}
          placeholder={t("auth.login.captchaInputPlaceholder")}
          variant="outlined"
          type="text"
          value={captchaValue}
          onChange={(event) => handleValueChange(event.target.value.slice(0, 128))}
          className={`${formStyles.textField} ${captchaStyles.captchaInputField}`}
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
          inputProps={{
            maxLength: 128,
            spellCheck: false,
          }}
        />
      </Box>
    </Box>
  );
};
