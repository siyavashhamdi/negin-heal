import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

export class CourseItemContentRequiredException extends Exception<null> {
  static readonly code = EXCEPTION_CONSTANT.COURSE_ITEM_CONTENT_REQUIRED.code;

  getCode(): string {
    return CourseItemContentRequiredException.code;
  }

  getMessage(): string {
    return EXCEPTION_CONSTANT.COURSE_ITEM_CONTENT_REQUIRED.message;
  }
}
