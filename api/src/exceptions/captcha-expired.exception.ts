import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class CaptchaExpiredException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.CAPTCHA_EXPIRED.code;

  getCode(): string {
    return CaptchaExpiredException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.CAPTCHA_EXPIRED.message;
  }
}
