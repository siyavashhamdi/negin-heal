import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class ExpiredPasswordResetTokenException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.EXPIRED_PASSWORD_RESET_TOKEN.code;

  getCode(): string {
    return ExpiredPasswordResetTokenException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.EXPIRED_PASSWORD_RESET_TOKEN.message;
  }
}
