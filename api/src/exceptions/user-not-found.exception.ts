import { format } from "util";
import { Exception } from "./base.exception";
import { EXCEPTION_CONSTANT } from "../constants";

interface IUserNotFoundExceptionData {
  username: string;
}

export class UserNotFoundException extends Exception<IUserNotFoundExceptionData> {
  getCode(): string {
    return EXCEPTION_CONSTANT.USER_NOT_FOUND.code;
  }

  getMessage(): string {
    return format(
      EXCEPTION_CONSTANT.USER_NOT_FOUND.message,
      this.payload.username,
    );
  }
}
