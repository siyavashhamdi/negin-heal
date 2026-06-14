import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class CourseChapterRequiredException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.COURSE_CHAPTER_REQUIRED.code;

  getCode(): string {
    return CourseChapterRequiredException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.COURSE_CHAPTER_REQUIRED.message;
  }
}
