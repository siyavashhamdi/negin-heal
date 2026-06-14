import { Schema, Types } from "mongoose";
import { AsyncLocalStorage } from "async_hooks";

/**
 * AsyncLocalStorage for request-scoped blameable context
 * This allows Mongoose hooks to access the current user ID from any async context
 */
const blameableStorage = new AsyncLocalStorage<{
  userId: Types.ObjectId;
}>();

/**
 * Get the current blameable context (userId) from AsyncLocalStorage
 */
export function getBlameableContext(): { userId: Types.ObjectId } {
  return blameableStorage.getStore();
}

/**
 * Run a function within a blameable context
 */
export function runWithBlameableContext<T>(
  context: { userId: Types.ObjectId },
  fn: () => T,
): T {
  return blameableStorage.run(context, fn);
}

/**
 * Helper: Get userId as ObjectId (already is ObjectId or null)
 */
function toObjectId(userId: Types.ObjectId): Types.ObjectId {
  return userId;
}

/**
 * Helper: Check if update operation is a soft delete
 */
function isSoftDelete(update: any): boolean {
  return !!(
    update?.$set?.["audit.deletedAt"] ||
    update?.["audit.deletedAt"] ||
    update?.$set?.audit?.deletedAt ||
    update?.audit?.deletedAt
  );
}

/**
 * Helper: Set audit.updatedBy in update object using dot notation
 */
function setUpdatedByInUpdate(
  update: any,
  userIdObjectId: Types.ObjectId,
): void {
  if (!update || typeof update !== "object") return;

  if (update.$set) {
    update.$set["audit.updatedBy"] = userIdObjectId;
  } else {
    if (!update.audit) {
      update.audit = {};
    }
    update.audit.updatedBy = userIdObjectId;
  }
}

/**
 * Mongoose plugin that automatically sets blameable fields in the audit object:
 * - audit.createdBy: Set when document is created
 * - audit.updatedBy: Set when document is updated
 * - audit.deletedBy: Set when document is soft deleted
 *
 * Uses AsyncLocalStorage to get the current user ID from the request context.
 */
export function blameablePlugin(schema: Schema) {
  // Add blameable fields to audit object in schema
  // Note: audit object is created by timestampablePlugin, we just add blameable fields to it
  if (!schema.path("audit")) {
    schema.add({
      audit: {
        createdBy: { type: Schema.Types.ObjectId, default: undefined },
        updatedBy: { type: Schema.Types.ObjectId, default: undefined },
        deletedBy: { type: Schema.Types.ObjectId, default: undefined },
      },
    });
  } else {
    // Ensure audit object has blameable fields if it already exists
    const auditSchema = schema.path("audit") as any;
    if (auditSchema.schema) {
      auditSchema.schema.add({
        createdBy: { type: Schema.Types.ObjectId, default: undefined },
        updatedBy: { type: Schema.Types.ObjectId, default: undefined },
        deletedBy: { type: Schema.Types.ObjectId, default: undefined },
      });
    }
  }

  // Pre-save hook: sets audit.createdBy for new documents, audit.updatedBy for modified documents
  schema.pre("save", function (next) {
    const userIdObjectId = toObjectId(getBlameableContext()?.userId);

    if (!this.audit) {
      this.audit = {} as any;
    }
    const audit = this.audit as any;

    if (userIdObjectId) {
      if (this.isNew && !audit.createdBy) {
        audit.createdBy = userIdObjectId;
      } else if (!this.isNew && this.isModified() && !audit.deletedAt) {
        audit.updatedBy = userIdObjectId;
      }
    }

    // Remove null/undefined fields to avoid storing them
    if (!audit.createdBy) delete audit.createdBy;
    if (!audit.updatedBy) delete audit.updatedBy;
    if (!audit.deletedBy) delete audit.deletedBy;

    next();
  });

  // Pre-insertMany hook: sets audit.createdBy for bulk insert operations
  schema.pre("insertMany", function (next, docs: any[]) {
    const userIdObjectId = toObjectId(getBlameableContext()?.userId);

    if (userIdObjectId && Array.isArray(docs)) {
      docs.forEach((doc) => {
        if (doc && typeof doc === "object") {
          if (!doc.audit) {
            doc.audit = {};
          }
          if (!doc.audit.createdBy) {
            doc.audit.createdBy = userIdObjectId;
          }
        }
      });
    }

    next();
  });

  // Pre-update hooks: sets audit.updatedBy for update operations
  const updateHook = function (this: any, next: () => void) {
    const update = this.getUpdate();
    const userIdObjectId = toObjectId(getBlameableContext()?.userId);

    if (userIdObjectId && !isSoftDelete(update)) {
      setUpdatedByInUpdate(update, userIdObjectId);
    }

    next();
  };

  schema.pre("updateOne", updateHook);
  schema.pre("findOneAndUpdate", updateHook);
  schema.pre("updateMany", updateHook);

  // Add softDelete method to documents (sets audit.deletedBy)
  schema.methods.softDelete = function (userId?: Types.ObjectId) {
    const userIdObjectId = toObjectId(userId || getBlameableContext()?.userId);

    if (!this.audit) {
      this.audit = {} as any;
    }
    const audit = this.audit as any;

    audit.deletedAt = new Date();
    if (userIdObjectId) {
      audit.deletedBy = userIdObjectId;
    } else {
      delete audit.deletedBy;
    }

    return this.save();
  };

  // Add restore method to documents
  schema.methods.restore = function () {
    if (this.audit) {
      const audit = this.audit as any;
      delete audit.deletedAt;
      delete audit.deletedBy;
    }
    return this.save();
  };
}
