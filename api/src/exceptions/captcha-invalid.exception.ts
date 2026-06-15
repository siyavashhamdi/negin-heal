import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class CaptchaInvalidException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.CAPTCHA_INVALID.code;

  getCode(): string {
    return CaptchaInvalidException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.CAPTCHA_INVALID.message;
  }
}
