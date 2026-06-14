import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class AccountLockedException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.ACCOUNT_LOCKED.code;

  getCode(): string {
    return AccountLockedException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.ACCOUNT_LOCKED.message;
  }
}
