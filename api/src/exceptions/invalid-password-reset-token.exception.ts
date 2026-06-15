import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class InvalidPasswordResetTokenException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.INVALID_PASSWORD_RESET_TOKEN.code;

  getCode(): string {
    return InvalidPasswordResetTokenException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.INVALID_PASSWORD_RESET_TOKEN.message;
  }
}
