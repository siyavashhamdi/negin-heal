import { toWesternDigits } from "./persian-digits.util";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length > 0 && EMAIL_REGEX.test(trimmed);
};

export const sanitizeMobilePhoneInput = (value: string): string =>
  toWesternDigits(value).replace(/\D/g, "");

export const isValidMobilePhone = (value: string): boolean => {
  const digits = sanitizeMobilePhoneInput(value);
  return /^09\d{9}$/.test(digits) || /^9\d{9}$/.test(digits) || /^989\d{9}$/.test(digits);
};
