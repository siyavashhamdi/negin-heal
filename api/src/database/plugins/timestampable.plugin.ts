import { Schema } from "mongoose";

import { addNotDeletedCondition } from "../utils/not-deleted-query.util";

/**
 * Mongoose plugin that automatically manages timestamp fields in the audit object:
 * - audit.createdAt: Set when document is created
 * - audit.updatedAt: Set when document is updated (not set on creation)
 * - audit.deletedAt: Set when document is soft deleted
 */
export function timestampablePlugin(schema: Schema) {
  // Add audit object with timestamp fields to schema
  schema.add({
    audit: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: undefined },
      deletedAt: { type: Date, default: undefined },
    },
  });

  // Helper: Check if update operation is a soft delete
  const isSoftDelete = (update: any): boolean => {
    return !!(
      update?.$set?.audit?.deletedAt ||
      update?.audit?.deletedAt ||
      update?.$set?.["audit.deletedAt"] ||
      update?.["audit.deletedAt"]
    );
  };

  // Helper: Set audit.updatedAt in update object using dot notation
  const setUpdatedAt = (update: any, now: Date): void => {
    if (!update || typeof update !== "object") return;

    if (update.$set) {
      update.$set["audit.updatedAt"] = now;
    } else {
      if (!update.audit) {
        update.audit = {};
      }
      update.audit.updatedAt = now;
    }
  };

  // Pre-save hook: sets audit.createdAt for new documents, audit.updatedAt for existing documents
  schema.pre("save", function (next) {
    const now = new Date();

    if (!this.audit) {
      this.audit = {} as any;
    }
    const audit = this.audit as any;

    if (this.isNew) {
      audit.createdAt = now;
    } else if (!audit.deletedAt) {
      // Only set updatedAt for existing documents (not soft deletes)
      audit.updatedAt = now;
    }

    next();
  });

  // Shared update hook: sets audit.updatedAt for update operations and excludes soft-deleted records
  const updateHook = function (this: any, next: () => void) {
    const update = this.getUpdate() as any;
    const query = this.getQuery();

    // Exclude already soft-deleted records from updates (unless it's a soft delete operation)
    if (!isSoftDelete(update)) {
      const queryWithCondition = addNotDeletedCondition(query);
      this.setQuery(queryWithCondition);
      setUpdatedAt(update, new Date());
    }

    next();
  };

  schema.pre("updateOne", updateHook);
  schema.pre("updateMany", updateHook);
  schema.pre("findOneAndUpdate", updateHook);
  schema.pre("findOneAndReplace", updateHook);
  schema.pre("replaceOne", updateHook);

  // Modify find queries to exclude soft-deleted documents by default
  const findHook = function (this: any, next: () => void) {
    const options = this.getOptions?.() ?? {};

    if (!options.includeDeleted) {
      const query = this.getQuery();
      this.setQuery(addNotDeletedCondition(query));
    }

    next();
  };

  schema.pre("find", findHook);
  schema.pre("findOne", findHook);
  schema.pre("findOneAndUpdate", findHook);
  schema.pre("findOneAndReplace", findHook);
  schema.pre("countDocuments", findHook);
  schema.pre("distinct", findHook);
}
