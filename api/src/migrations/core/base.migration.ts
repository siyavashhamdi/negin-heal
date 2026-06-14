import { Connection } from "mongoose";

/**
 * Base abstract class that all migrations must extend.
 * Each migration must implement the `up` method and optionally `down` for rollback.
 */
export abstract class BaseMigration {
  /**
   * The version number of this migration. Must be unique and incrementing.
   * This should be a number that increases with each migration.
   * Example: 1, 2, 3, ...
   */
  abstract version: number;

  /**
   * A human-readable name for this migration.
   * Example: "AddIndexToAnimalsCollection"
   */
  abstract name: string;

  /**
   * The database connection to use for migration operations.
   * Set by the MigrationService before calling up() or down().
   */
  protected connection?: Connection;

  /**
   * Sets the database connection for this migration.
   * @internal This is called by MigrationService, not by migration implementations.
   */
  setConnection(connection: Connection): void {
    this.connection = connection;
  }

  /**
   * Execute the migration. This method should contain the logic to
   * upgrade the database schema or data to this version.
   *
   * @throws Error if the migration fails
   */
  abstract up(): Promise<void>;

  /**
   * Rollback the migration. This method should contain the logic to
   * undo the changes made by the `up` method.
   *
   * This is optional - not all migrations need to be reversible.
   *
   * @throws Error if the rollback fails
   */
  async down(): Promise<void> {
    throw new Error(
      `Migration ${this.name} (version ${this.version}) does not support rollback`,
    );
  }
}
