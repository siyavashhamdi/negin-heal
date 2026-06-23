import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export interface ICourseValidationFailedExceptionData {
  message: string;
}

export class CourseValidationFailedException extends Exception<ICourseValidationFailedExceptionData> {
  static readonly code = EXCEPTION_CONSTANT.COURSE_VALIDATION_FAILED.code;

  getCode(): string {
    return CourseValidationFailedException.code;
  }

  getMessage(): string {
    return this.payload.message;
  }
}

export function resolveCourseValidationMessageFromError(
  errorMessage: string,
): ICourseValidationFailedExceptionData {
  return { message: errorMessage };
}
