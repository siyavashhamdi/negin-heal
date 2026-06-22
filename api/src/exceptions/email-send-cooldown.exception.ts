import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class EmailSendCooldownException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.EMAIL_SEND_COOLDOWN.code;

  getCode(): string {
    return EmailSendCooldownException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.EMAIL_SEND_COOLDOWN.message;
  }
}
