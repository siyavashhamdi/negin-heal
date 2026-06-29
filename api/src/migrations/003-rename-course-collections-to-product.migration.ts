import { BaseMigration, registerMigration } from "./core";
import { migrateCourseCollectionsToProduct } from "./course-to-product-migration.helpers";

export class Migration003_RenameCourseCollectionsToProduct extends BaseMigration {
  version = 3;
  name = "RenameCourseCollectionsToProduct";

  async up(): Promise<void> {
    if (!this.connection?.db) {
      throw new Error("Database connection not available");
    }

    await migrateCourseCollectionsToProduct(this.connection.db);
  }
}

registerMigration(Migration003_RenameCourseCollectionsToProduct);
