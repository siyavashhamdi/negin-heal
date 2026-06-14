import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class IdentityAlreadyExistsException extends Exception<null> {
  getCode(): string {
    return EXCEPTION_CONSTANT.IDENTITY_ALREADY_EXISTS.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.IDENTITY_ALREADY_EXISTS.message;
  }
}
