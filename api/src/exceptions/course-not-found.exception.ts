import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class CourseNotFoundException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.COURSE_NOT_FOUND.code;

  getCode(): string {
    return CourseNotFoundException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.COURSE_NOT_FOUND.message;
  }
}
