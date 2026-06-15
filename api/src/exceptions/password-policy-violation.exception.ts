import { EXCEPTION_CONSTANT } from "../constants";
import { Exception } from "./base.exception";

export class PasswordPolicyViolationException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.PASSWORD_POLICY_VIOLATION.code;

  getCode(): string {
    return PasswordPolicyViolationException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.PASSWORD_POLICY_VIOLATION.message;
  }
}
