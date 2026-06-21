export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NORMALIZED_MOBILE_PHONE_REGEX = /^09\d{9}$/;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && EMAIL_REGEX.test(trimmed);
}

export function normalizeMobilePhone(value: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (/^09\d{9}$/.test(digits)) {
    return digits;
  }
  if (/^9\d{9}$/.test(digits)) {
    return `0${digits}`;
  }
  if (/^989\d{9}$/.test(digits)) {
    return `0${digits.slice(2)}`;
  }

  return undefined;
}

export function isValidMobilePhone(value: string): boolean {
  return normalizeMobilePhone(value) !== undefined;
}
