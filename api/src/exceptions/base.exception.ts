/**
 * Base abstract exception class
 * All custom exceptions should extend this class
 */
export abstract class Exception<T = null> extends Error {
  readonly payload: T;
  readonly code: string;

  constructor(...args: T extends null ? [] : [T]) {
    super();
    this.payload = (args[0] as T) ?? (null as T);
    this.name = this.constructor.name;
    this.message = this.getMessage();
    this.code = this.getCode();
  }

  abstract getCode(): string;

  abstract getMessage(): string;
}
