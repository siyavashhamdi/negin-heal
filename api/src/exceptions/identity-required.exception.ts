import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class IdentityRequiredException extends Exception<null> {
  getCode(): string {
    return EXCEPTION_CONSTANT.IDENTITY_REQUIRED.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.IDENTITY_REQUIRED.message;
  }
}
