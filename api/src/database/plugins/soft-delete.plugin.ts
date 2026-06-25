import { Schema, Types } from "mongoose";

import { addNotDeletedCondition } from "../utils/not-deleted-query.util";
import { getBlameableContext } from "./blameable.plugin";

/**
 * Mongoose plugin that intercepts ALL delete operations and converts them to soft deletes.
 *
 * Supported delete operations (all converted to soft deletes):
 * - deleteOne() - single document deletion
 * - deleteMany() - bulk document deletion
 * - findByIdAndDelete() - find and delete by ID
 * - findOneAndDelete() - find and delete with query
 *
 * All operations set audit.deletedAt and audit.deletedBy fields instead of physically removing documents.
 *
 * Only applies to schemas that have the audit.deletedAt field (from timestampablePlugin).
 */
export function softDeletePlugin(schema: Schema) {
  // Check if schema has audit.deletedAt field
  const hasDeletedAtField =
    schema.paths["audit.deletedAt"] !== undefined ||
    schema.path("audit.deletedAt") !== undefined ||
    (schema.paths.audit !== undefined &&
      (schema.paths.audit as any).schema?.paths?.deletedAt !== undefined);

  if (!hasDeletedAtField) {
    return; // This schema doesn't support soft delete, skip plugin
  }

  // Helper: Create soft delete update object
  const createSoftDeleteUpdate = (userId?: Types.ObjectId): any => {
    const update: any = {
      $set: {
        "audit.deletedAt": new Date(),
      },
    };

    if (userId) {
      update.$set["audit.deletedBy"] = userId;
    }

    return update;
  };

  // Intercept deleteOne operation
  schema.pre("deleteOne", async function (next) {
    const userId = getBlameableContext()?.userId;
    const query = this.getQuery();
    const update = createSoftDeleteUpdate(userId);

    // Only update records that are not already soft-deleted
    const queryWithCondition = addNotDeletedCondition(query);

    // Convert deleteOne to updateOne with soft delete
    await this.model.updateOne(queryWithCondition, update).exec();

    // Prevent the actual delete operation
    this.setQuery({ _id: { $exists: false } });
    next();
  });

  // Intercept findOneAndDelete operation
  schema.pre("findOneAndDelete", async function (next) {
    const userId = getBlameableContext()?.userId;
    const query = this.getQuery();
    const update = createSoftDeleteUpdate(userId);

    // Only update records that are not already soft-deleted
    const queryWithCondition = addNotDeletedCondition(query);

    // Convert findOneAndDelete to findOneAndUpdate with soft delete
    await this.model
      .findOneAndUpdate(queryWithCondition, update, { new: true })
      .exec();

    // Prevent the actual delete operation
    this.setQuery({ _id: { $exists: false } });
    next();
  });

  // Override findByIdAndDelete static method
  schema.statics.findByIdAndDelete = function (id: any, options?: any) {
    const userId = getBlameableContext()?.userId;
    const update = createSoftDeleteUpdate(userId);

    // Only update records that are not already soft-deleted
    const query = addNotDeletedCondition({ _id: id });

    return this.findOneAndUpdate(query, update, { ...options, new: true });
  };

  // Override deleteOne static method
  schema.statics.deleteOne = function (filter: any, options?: any) {
    const userId = getBlameableContext()?.userId;
    const update = createSoftDeleteUpdate(userId);

    // Only update records that are not already soft-deleted
    const queryWithCondition = addNotDeletedCondition(filter);

    // Convert updateOne result to deleteOne result format
    const updateResult = this.updateOne(queryWithCondition, update, options);

    // Transform the result to match DeleteResult format
    return updateResult.then((result: any) => {
      return {
        acknowledged: result.acknowledged ?? true,
        deletedCount: result.modifiedCount ?? 0,
        // Include other fields from the update result for compatibility
        matchedCount: result.matchedCount ?? 0,
        modifiedCount: result.modifiedCount ?? 0,
        upsertedId: result.upsertedId ?? null,
        upsertedCount: result.upsertedCount ?? 0,
      };
    });
  };

  // Intercept deleteMany operation
  schema.pre("deleteMany", async function (next) {
    const userId = getBlameableContext()?.userId;
    const query = this.getQuery();
    const update = createSoftDeleteUpdate(userId);

    // Only update records that are not already soft-deleted
    const queryWithCondition = addNotDeletedCondition(query);

    // Convert deleteMany to updateMany with soft delete
    await this.model.updateMany(queryWithCondition, update).exec();

    // Prevent the actual delete operation
    this.setQuery({ _id: { $exists: false } });
    next();
  });

  // Override deleteMany static method
  schema.statics.deleteMany = function (filter: any, options?: any) {
    const userId = getBlameableContext()?.userId;
    const update = createSoftDeleteUpdate(userId);

    // Only update records that are not already soft-deleted
    const queryWithCondition = addNotDeletedCondition(filter);

    // Convert updateMany result to deleteMany result format
    const updateResult = this.updateMany(queryWithCondition, update, options);

    // Transform the result to match DeleteResult format
    return updateResult.then((result: any) => {
      return {
        acknowledged: result.acknowledged ?? true,
        deletedCount: result.modifiedCount ?? 0,
        // Include other fields from the update result for compatibility
        matchedCount: result.matchedCount ?? 0,
        modifiedCount: result.modifiedCount ?? 0,
        upsertedId: result.upsertedId ?? null,
        upsertedCount: result.upsertedCount ?? 0,
      };
    });
  };
}
