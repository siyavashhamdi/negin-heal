import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class CourseReferencedFileNotFoundException extends Exception<null> {
  static readonly code =
    EXCEPTION_CONSTANT.COURSE_REFERENCED_FILE_NOT_FOUND.code;

  getCode(): string {
    return CourseReferencedFileNotFoundException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.COURSE_REFERENCED_FILE_NOT_FOUND.message;
  }
}
