import { BaseMigration } from "./base.migration";

/**
 * Type for a concrete migration class (not abstract)
 */
export type MigrationClass = new () => BaseMigration & {
  version: number;
  name: string;
};

/**
 * Registry for all migrations.
 * Migrations should be imported and added to this array.
 * They will be automatically sorted by version and executed in order.
 */
export const MIGRATIONS: Array<MigrationClass> = [];

/**
 * Register a migration class.
 * This is called automatically when migrations are imported,
 * but can also be called manually if needed.
 */
export function registerMigration(MigrationClass: MigrationClass): void {
  // Check for duplicate versions
  const existing = MIGRATIONS.find(
    (m) => new m().version === new MigrationClass().version,
  );
  if (existing) {
    throw new Error(
      `Migration version ${new MigrationClass().version} is already registered`,
    );
  }
  MIGRATIONS.push(MigrationClass);
}
