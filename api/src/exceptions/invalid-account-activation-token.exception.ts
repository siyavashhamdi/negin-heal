import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class InvalidAccountActivationTokenException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.INVALID_ACCOUNT_ACTIVATION_TOKEN.code;

  getCode(): string {
    return InvalidAccountActivationTokenException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.INVALID_ACCOUNT_ACTIVATION_TOKEN.message;
  }
}
