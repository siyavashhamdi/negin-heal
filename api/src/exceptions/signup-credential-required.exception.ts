import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class SignupCredentialRequiredException extends Exception<null> {
  getCode(): string {
    return EXCEPTION_CONSTANT.SIGNUP_CREDENTIAL_REQUIRED.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.SIGNUP_CREDENTIAL_REQUIRED.message;
  }
}
