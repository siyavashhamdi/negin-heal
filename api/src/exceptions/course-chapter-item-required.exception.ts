import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class CourseChapterItemRequiredException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.COURSE_CHAPTER_ITEM_REQUIRED.code;

  getCode(): string {
    return CourseChapterItemRequiredException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.COURSE_CHAPTER_ITEM_REQUIRED.message;
  }
}
