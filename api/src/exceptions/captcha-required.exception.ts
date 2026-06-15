import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class CaptchaRequiredException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.CAPTCHA_REQUIRED.code;

  getCode(): string {
    return CaptchaRequiredException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.CAPTCHA_REQUIRED.message;
  }
}
