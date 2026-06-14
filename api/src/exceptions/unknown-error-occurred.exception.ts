import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

interface IUnknownErrorExceptionData {
  originalError?: unknown;
}

export class UnknownErrorOccurredException extends Exception<IUnknownErrorExceptionData> {
  static readonly code = EXCEPTION_CONSTANT.UNKNOWN_ERROR_OCCURRED.code;

  getCode(): string {
    return EXCEPTION_CONSTANT.UNKNOWN_ERROR_OCCURRED.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.UNKNOWN_ERROR_OCCURRED.message;
  }
}
