import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

import {
  resolveInvalidAuthIdentityErrorKind,
  isValidAuthIdentityMobileInput,
} from "../utils/auth-identity.util";
import {
  isLatinEmailValue,
  isLatinUsername,
  isValidLatinAuthIdentity,
  LATIN_AUTH_IDENTITY_CHARSET_REGEX,
  LATIN_EMAIL_CHARSET_REGEX,
  LATIN_USERNAME_REGEX,
} from "../utils/latin-identity.util";

@ValidatorConstraint({ name: "isLatinUsername", async: false })
export class IsLatinUsernameConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === "string" && isLatinUsername(value);
  }

  defaultMessage(): string {
    return "Username must start with an English letter or number and may only contain letters, numbers, dots, underscores, and hyphens";
  }
}

@ValidatorConstraint({ name: "isLatinEmail", async: false })
export class IsLatinEmailConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === "string" && isLatinEmailValue(value);
  }

  defaultMessage(): string {
    return "Email must start with an English letter or number and be a valid email address";
  }
}

@ValidatorConstraint({ name: "isLatinAuthIdentity", async: false })
export class IsLatinAuthIdentityConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === "string" && isValidLatinAuthIdentity(value);
  }

  defaultMessage(args: ValidationArguments): string {
    const value = args.value;
    if (typeof value === "string") {
      const errorKind = resolveInvalidAuthIdentityErrorKind(value);
      if (errorKind === "email") {
        return "Email must start with an English letter or number and be a valid email address";
      }
      if (errorKind === "mobile") {
        return "Mobile number must be 09xxxxxxxxx, 9xxxxxxxxx, 989xxxxxxxxx, exactly +989xxxxxxxxx, or + followed by at least 8 digits";
      }
    }

    return "Identity must start with an English letter or number and be a valid username, email, or mobile number";
  }
}

@ValidatorConstraint({ name: "isAuthIdentityMobile", async: false })
export class IsAuthIdentityMobileConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === "string" && isValidAuthIdentityMobileInput(value);
  }

  defaultMessage(): string {
    return "Mobile number must be 09xxxxxxxxx, 9xxxxxxxxx, 989xxxxxxxxx, exactly +989xxxxxxxxx, or + followed by at least 8 digits";
  }
}

export function IsLatinUsername(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsLatinUsernameConstraint,
    });
  };
}

export function IsLatinEmail(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsLatinEmailConstraint,
    });
  };
}

export function IsLatinAuthIdentity(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsLatinAuthIdentityConstraint,
    });
  };
}

export function IsAuthIdentityMobile(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAuthIdentityMobileConstraint,
    });
  };
}

export function IsLatinEmailCharset(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: {
        message:
          "Email must start with an English letter or number and may only contain valid email symbols",
        ...validationOptions,
      },
      constraints: [],
      validator: {
        validate(value: unknown): boolean {
          return (
            typeof value === "string" &&
            (value.trim().length === 0 ||
              LATIN_EMAIL_CHARSET_REGEX.test(value.trim()))
          );
        },
      },
    });
  };
}

export function IsLatinUsernameCharset(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: {
        message:
          "Username must start with an English letter or number and may only contain letters, numbers, dots, underscores, and hyphens",
        ...validationOptions,
      },
      constraints: [],
      validator: {
        validate(value: unknown): boolean {
          return (
            typeof value === "string" &&
            (value.trim().length === 0 ||
              LATIN_USERNAME_REGEX.test(value.trim()))
          );
        },
      },
    });
  };
}

export function IsLatinAuthIdentityCharset(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: {
        message:
          "Identity must start with an English letter or number and may only contain valid symbols",
        ...validationOptions,
      },
      constraints: [],
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (typeof value !== "string") {
            return false;
          }

          const trimmed = value.trim();
          if (!trimmed) {
            return args.constraints.includes("optional");
          }

          return LATIN_AUTH_IDENTITY_CHARSET_REGEX.test(trimmed);
        },
      },
    });
  };
}
