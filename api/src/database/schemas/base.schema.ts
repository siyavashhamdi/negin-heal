import { Types } from "mongoose";

/**
 * Base class that provides the _id field
 * All Mongoose documents have an _id field
 */
export abstract class BaseIdSchema {
  _id!: Types.ObjectId;
}

/**
 * Generic type that adds soft delete methods to any document.
 * These methods are added by the blameablePlugin at runtime.
 *
 * @template TDocument - The document type (e.g., AnimalDocument, UserDocument)
 */
export type SoftDeletableDocument<TDocument> = TDocument & {
  softDelete(userId?: Types.ObjectId): Promise<TDocument>;
  restore(): Promise<TDocument>;
};

/**
 * Audit fields structure
 * All audit-related fields are nested in an audit object
 */
export type AuditFields = {
  createdAt: Date;
  updatedAt?: Date; // Optional: only set when document is updated, not on creation
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedBy?: Types.ObjectId;
};

/**
 * Base class that provides timestampable fields
 * Timestampable fields (audit.createdAt, audit.updatedAt, audit.deletedAt) are managed by timestampablePlugin
 *
 * These are defined here for TypeScript type safety.
 * The fields are added at runtime by the plugin, so we use ! (definite assignment assertion).
 */
export abstract class BaseTimestampableSchema extends BaseIdSchema {
  audit!: AuditFields;
}

/**
 * Base class that provides blameable fields
 * Blameable fields (audit.createdBy, audit.updatedBy, audit.deletedBy) are managed by blameablePlugin
 *
 * These are defined here for TypeScript type safety.
 * The fields are added at runtime by the plugin, so we use ! (definite assignment assertion).
 */
export abstract class BaseBlameableSchema extends BaseIdSchema {
  audit!: AuditFields;
}

/**
 * Base class that combines ID + Timestampable + Blameable fields
 * Extend this if you need all three features (most common case)
 */
export abstract class BaseIdTimestampableBlameableSchema extends BaseIdSchema {
  audit!: AuditFields;
}
