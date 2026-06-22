import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export type DuplicateIdentityField = "username" | "email" | "mobile";

const DUPLICATE_IDENTITY_EXCEPTION_BY_FIELD = {
  username: EXCEPTION_CONSTANT.USERNAME_ALREADY_EXISTS,
  email: EXCEPTION_CONSTANT.EMAIL_ALREADY_EXISTS,
  mobile: EXCEPTION_CONSTANT.MOBILE_ALREADY_EXISTS,
} as const satisfies Record<
  DuplicateIdentityField,
  { code: string; message: string }
>;

export function resolveDuplicateIdentityFieldFromMessage(
  message: string,
): DuplicateIdentityField | undefined {
  const normalized = message.toLowerCase();

  if (normalized.includes("username is already")) {
    return "username";
  }

  if (normalized.includes("email is already")) {
    return "email";
  }

  if (normalized.includes("mobile number is already")) {
    return "mobile";
  }

  return undefined;
}

export class IdentityAlreadyExistsException extends Exception<{
  field?: DuplicateIdentityField;
}> {
  constructor(field?: DuplicateIdentityField) {
    super({ field });
  }

  getCode(): string {
    const field = this.payload.field;
    if (field) {
      return DUPLICATE_IDENTITY_EXCEPTION_BY_FIELD[field].code;
    }

    return EXCEPTION_CONSTANT.IDENTITY_ALREADY_EXISTS.code;
  }

  getMessage(): string {
    const field = this.payload.field;
    if (field) {
      return DUPLICATE_IDENTITY_EXCEPTION_BY_FIELD[field].message;
    }

    return EXCEPTION_CONSTANT.IDENTITY_ALREADY_EXISTS.message;
  }
}
