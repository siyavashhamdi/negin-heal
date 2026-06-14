import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class InvalidSignupVerificationCodeException extends Exception<null> {
  getCode(): string {
    return EXCEPTION_CONSTANT.INVALID_SIGNUP_VERIFICATION_CODE.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.INVALID_SIGNUP_VERIFICATION_CODE.message;
  }
}
