import { Types } from "mongoose";
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

/**
 * Validator constraint that checks if a value is a valid MongoDB ObjectId
 * Accepts both string and ObjectId instances
 * Works with @Transform(toObjectId) and handles all input types like the transform
 */
@ValidatorConstraint({ name: "isObjectId", async: false })
export class IsObjectIdConstraint implements ValidatorConstraintInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(value: unknown, _args: ValidationArguments): boolean {
    // If it's already an ObjectId instance, it's valid
    if (value instanceof Types.ObjectId) {
      return true;
    }

    // If it's a string, check if it's a valid ObjectId format
    if (typeof value === "string") {
      return Types.ObjectId.isValid(value);
    }

    // Handle null/undefined
    // Note: @IsOptional() will skip validation for null/undefined values
    // @IsNotEmpty() will fail validation for null/undefined before this validator runs
    // So returning false here is safe - it will only be checked if the value is present
    if (value === null || value === undefined) {
      return false;
    }

    // For arrays (when used with each: true), class-validator will call this for each element
    // So we don't need to handle arrays here - each element will be validated individually

    // Otherwise, it's invalid
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(_args: ValidationArguments): string {
    return "Value must be a valid MongoDB ObjectId";
  }
}

/**
 * Decorator that validates a value is a MongoDB ObjectId (string or ObjectId instance)
 * This works with @Transform(toObjectId) because it accepts both string and ObjectId
 * Handles all input types like the transform:
 * - ObjectId instances: valid
 * - Valid string: valid
 * - Invalid string: invalid
 * - null/undefined: invalid (use @IsOptional() if field is optional)
 * - Arrays: use with { each: true } to validate each element
 *
 * @example
 * ```typescript
 * // Required field
 * @Field(() => ID)
 * @IsObjectId({ message: "Team ID must be a valid MongoDB ObjectId" })
 * @Transform(toObjectId)
 * teamId: Types.ObjectId;
 *
 * // Optional field
 * @Field(() => ID, { nullable: true })
 * @IsOptional()
 * @IsObjectId({ message: "Team ID must be a valid MongoDB ObjectId" })
 * @Transform(toObjectIdOptional)
 * teamId?: Types.ObjectId;
 *
 * // Array field
 * @Field(() => [ID])
 * @IsArray()
 * @IsObjectId({ each: true, message: "Each ID must be a valid MongoDB ObjectId" })
 * @Transform(toObjectIdArray)
 * roomIds: Types.ObjectId[];
 * ```
 */
export function IsObjectId(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsObjectIdConstraint,
    });
  };
}
