import { Exception } from "./base.exception";
import * as ExceptionClasses from "./index";

/**
 * Registry for all exception classes
 * Automatically discovers all exported exception classes
 */
export class ExceptionRegistry {
  private static readonly registry = new Map<
    string,
    new (...args: any[]) => Exception<any>
  >();

  /**
   * Initialize the registry by discovering all exception classes
   */
  static initialize(): void {
    Object.values(ExceptionClasses).forEach((Export) => {
      if (
        typeof Export === "function" &&
        Export.prototype instanceof Exception &&
        Export.name.endsWith("Exception")
      ) {
        this.registry.set(
          Export.name,
          Export as new (...args: any[]) => Exception<any>,
        );
      }
    });
  }

  /**
   * Create an exception instance by name
   * Dynamically instantiates the exception and reads code/message from it
   */
  static createException(
    name: string,
    errorMessage: string,
  ): Exception<any> | null {
    const ExceptionClass = this.registry.get(name);
    if (!ExceptionClass) {
      return null;
    }

    // Try no arguments first (for exceptions that don't need payload)
    try {
      return new ExceptionClass();
    } catch {
      // Try with username data if found (for UserNotFoundException)
      const usernameMatch = errorMessage.match(
        /username\s+['"]?([^\s!'"]+)['"]?/i,
      );
      if (usernameMatch?.[1]) {
        try {
          return new ExceptionClass({ username: usernameMatch[1].trim() });
        } catch {
          // Fallback to empty object
        }
      }
      // Try empty object
      try {
        return new ExceptionClass({});
      } catch {
        return null;
      }
    }
  }
}

// Initialize registry on module load
ExceptionRegistry.initialize();
