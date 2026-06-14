import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class InvalidCredentialsException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.INVALID_CREDENTIALS.code;

  getCode(): string {
    return InvalidCredentialsException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.INVALID_CREDENTIALS.message;
  }
}
