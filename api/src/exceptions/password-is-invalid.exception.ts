import { EXCEPTION_CONSTANT } from "../constants";

export class PassworkIsInvalidException {
  getCode(): string {
    return EXCEPTION_CONSTANT.PASSWORD_VALIDATION_FAILED.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.PASSWORD_VALIDATION_FAILED.message;
  }
}
