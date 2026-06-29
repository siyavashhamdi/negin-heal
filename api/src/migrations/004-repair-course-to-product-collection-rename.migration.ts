import { BaseMigration, registerMigration } from "./core";
import { migrateCourseCollectionsToProduct } from "./course-to-product-migration.helpers";

/**
 * Repairs databases where migration 003 completed but collection renames were
 * skipped because empty target collections already existed (e.g. created by Mongoose).
 */
export class Migration004_RepairCourseToProductCollectionRename extends BaseMigration {
  version = 4;
  name = "RepairCourseToProductCollectionRename";

  async up(): Promise<void> {
    if (!this.connection?.db) {
      throw new Error("Database connection not available");
    }

    await migrateCourseCollectionsToProduct(this.connection.db);
  }
}

registerMigration(Migration004_RepairCourseToProductCollectionRename);
