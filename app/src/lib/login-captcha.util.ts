export const LOGIN_CAPTCHA_TOKEN_PREFIX = "mock-captcha-token:" as const;
export const LOGIN_CAPTCHA_DISABLED_TOKEN = `${LOGIN_CAPTCHA_TOKEN_PREFIX}disabled` as const;

/** Persian (۰–۹) and Arabic-Indic (٠–٩) digits → ASCII. */
const NON_ASCII_DIGIT_TO_ASCII: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

export function normalizeCaptchaAnswer(value: string): string {
  let normalized = value.trim().toUpperCase();
  for (const [from, to] of Object.entries(NON_ASCII_DIGIT_TO_ASCII)) {
    normalized = normalized.split(from).join(to);
  }
  return normalized;
}

export function captchaResponseMatchesChallenge(
  challenge: string,
  response: string
): boolean {
  return normalizeCaptchaAnswer(challenge) === normalizeCaptchaAnswer(response);
}

export function buildLoginCaptchaToken(challenge: string, response: string): string {
  const payload = JSON.stringify({
    challenge,
    response: response.trim(),
    ts: Date.now(),
  });
  return `${LOGIN_CAPTCHA_TOKEN_PREFIX}${btoa(payload)}`;
}
