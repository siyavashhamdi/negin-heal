import { Types } from "mongoose";

/**
 * Transform function to convert GraphQL ID scalar (string) to MongoDB ObjectId
 * This is useful for @Transform decorator from class-transformer
 *
 * If the value is already an ObjectId, it returns it as-is.
 * If the value is a valid string, it converts it to ObjectId.
 * If the value is invalid, it returns the value as-is to let @IsMongoId() validation handle the error.
 *
 * @example
 * ```typescript
 * @Field(() => ID)
 * @IsMongoId({ message: "Team ID must be a valid MongoDB ObjectId" })
 * @Transform(toObjectId)
 * teamId: Types.ObjectId;
 * ```
 */
export function toObjectId({
  value,
}: {
  value: unknown;
}): Types.ObjectId | unknown {
  if (value instanceof Types.ObjectId) {
    return value;
  }
  if (typeof value === "string" && Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }
  // Return value as-is if invalid - let @IsMongoId() validation handle the error
  return value;
}

/**
 * Transform function to convert GraphQL ID scalar (string) to MongoDB ObjectId (optional)
 * Returns undefined if value is null/undefined, otherwise converts to ObjectId
 *
 * @example
 * ```typescript
 * @Field(() => ID, { nullable: true })
 * @Transform(toObjectIdOptional)
 * teamId?: Types.ObjectId;
 * ```
 */
export function toObjectIdOptional({
  value,
}: {
  value: unknown;
}): Types.ObjectId | undefined | unknown {
  if (value === null || value === undefined) {
    return undefined;
  }
  const transformed = toObjectId({ value });
  return transformed instanceof Types.ObjectId ? transformed : transformed;
}

/**
 * Like toObjectIdOptional, but preserves explicit null for nullable fields that
 * should clear a stored reference on update.
 */
export function toNullableObjectId({
  value,
}: {
  value: unknown;
}): Types.ObjectId | null | undefined | unknown {
  if (value === null) {
    return null;
  }

  return toObjectIdOptional({ value });
}

/**
 * Transform function to convert array of GraphQL ID scalars (strings) to MongoDB ObjectIds
 *
 * @example
 * ```typescript
 * @Field(() => [ID])
 * @IsArray()
 * @IsMongoId({ each: true })
 * @Transform(toObjectIdArray)
 * roomIds: Types.ObjectId[];
 * ```
 */
export function toObjectIdArray({
  value,
}: {
  value: unknown;
}): Types.ObjectId[] | unknown {
  if (!Array.isArray(value)) {
    // Return value as-is if not an array - let @IsArray() validation handle the error
    return value;
  }
  return value.map((item) => {
    const transformed = toObjectId({ value: item });
    return transformed instanceof Types.ObjectId ? transformed : item;
  });
}

/**
 * Transform function to convert array of GraphQL ID scalars (strings) to MongoDB ObjectIds (optional)
 * Returns undefined if value is null/undefined, otherwise converts array to ObjectIds
 *
 * @example
 * ```typescript
 * @Field(() => [ID], { nullable: true })
 * @Transform(toObjectIdArrayOptional)
 * roomIds?: Types.ObjectId[];
 * ```
 */
export function toObjectIdArrayOptional({
  value,
}: {
  value: unknown;
}): Types.ObjectId[] | undefined | unknown {
  if (value === null || value === undefined) {
    return undefined;
  }
  const transformed = toObjectIdArray({ value });
  return Array.isArray(transformed) &&
    transformed.every((item) => item instanceof Types.ObjectId)
    ? (transformed as Types.ObjectId[])
    : transformed;
}
