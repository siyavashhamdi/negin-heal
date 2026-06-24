import { Connection, Model } from "mongoose";

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";

import { MigrationStatus } from "../../enums";
import { MigrationClass } from "../../migrations/core";
import { Migration, MigrationDocument } from "../../database/schemas";
import {
  formatInfrastructureConnectionError,
  resolveInfrastructureConnectionFailure,
} from "../../utils/infrastructure-connection-error.util";

/**
 * Service responsible for discovering and executing database migrations.
 * Runs automatically when the module is initialized via OnModuleInit.
 *
 * The service:
 * - Discovers all registered migrations
 * - Compares current database version with available migrations
 * - Executes pending migrations in order
 * - Tracks migration state and prevents concurrent execution
 */
@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);
  private static readonly STALE_LOCK_THRESHOLD = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Migration.name)
    private readonly migrationModel: Model<MigrationDocument>,
  ) {}

  /**
   * Automatically runs migrations when the module is initialized.
   */
  async onModuleInit(): Promise<void> {
    await this.runMigrations();
  }

  /**
   * Discovers all migration classes and runs pending migrations in order.
   * This method is called automatically on module initialization.
   *
   * Flow:
   * 1. Check for locked migrations (handle stale locks)
   * 2. Discover all registered migrations
   * 3. Get current database version from MongoDB
   * 4. Find migrations with version > current database version
   * 5. Execute pending migrations in order
   */
  async runMigrations(): Promise<void> {
    this.logger.log("🔄 Starting database migration process...");

    try {
      const isMongoAvailable = await this.verifyMongoConnection();
      if (!isMongoAvailable) {
        this.logger.warn(
          "⚠️ Skipping database migrations until MongoDB is available.",
        );
        return;
      }

      // Check and handle running/stale migrations
      await this.handleRunningMigrations();

      // Discover all registered migrations
      const allMigrations = this.discoverMigrations();

      if (allMigrations.length === 0) {
        this.logger.log(
          "✅ No migrations found. Database schema is up to date.",
        );
        return;
      }

      // Sort migrations by version
      const sortedMigrations = this.sortMigrationsByVersion(allMigrations);
      this.logger.log(
        `📋 Found ${sortedMigrations.length} migration(s) registered`,
      );

      // Get current database version from MongoDB
      const currentDbVersion = await this.getCurrentVersion();
      this.logger.log(`📊 Current database version: ${currentDbVersion}`);

      // Check for any failed migrations before proceeding
      const failedMigrations = await this.migrationModel
        .find({ status: MigrationStatus.FAILED })
        .sort({ version: 1 })
        .exec();

      if (failedMigrations.length > 0) {
        const failedVersions = failedMigrations
          .map((m) => m.version)
          .join(", ");
        this.logger.error(
          `❌ Cannot proceed: Found ${failedMigrations.length} failed migration(s): ${failedVersions}`,
        );
        this.logger.error(
          "⚠️  Please fix the failed migrations before running new ones.",
        );
        throw new Error(
          `Failed migrations detected: ${failedVersions}. Fix them before continuing.`,
        );
      }

      // Find migrations that need to be executed (version > currentDbVersion)
      const pendingMigrations = sortedMigrations.filter((MigrationClass) => {
        const version = this.getMigrationVersion(MigrationClass);
        return version > currentDbVersion;
      });

      if (pendingMigrations.length === 0) {
        this.logger.log("✅ Database is up to date. No migrations to run.");
        return;
      }

      this.logger.log(
        `🚀 Found ${pendingMigrations.length} pending migration(s) to execute in order`,
      );

      // Execute pending migrations SEQUENTIALLY (one by one)
      // If any migration fails, the process stops immediately
      let executedCount = 0;
      let lastExecutedVersion = currentDbVersion;

      for (const MigrationClass of pendingMigrations) {
        const version = this.getMigrationVersion(MigrationClass);
        const name = this.getMigrationName(MigrationClass);

        try {
          this.logger.log(
            `📌 Processing migration ${executedCount + 1}/${pendingMigrations.length}: v${version} (${name})`,
          );

          // Execute migration - if this throws, loop stops
          await this.executeMigration(MigrationClass);
          executedCount++;
          lastExecutedVersion = version;

          this.logger.log(
            `✅ Migration v${version} completed. Continuing to next migration...`,
          );
        } catch (error) {
          // Migration failed - stop execution immediately
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          this.logger.error(
            `🛑 Migration v${version} (${name}) FAILED. Stopping migration process.`,
          );
          this.logger.error(
            `❌ No further migrations will be executed until this issue is resolved.`,
          );
          this.logger.error(
            `📊 Progress: ${executedCount} migration(s) completed successfully before failure.`,
          );
          this.logger.error(
            `🔧 Database is at version ${lastExecutedVersion}. Fix migration v${version} and restart the application.`,
          );

          // Re-throw to ensure the error propagates and stops the process
          throw new Error(
            `Migration v${version} (${name}) failed: ${errorMessage}. Execution stopped. ${executedCount} migration(s) completed before failure.`,
          );
        }
      }

      // All migrations completed successfully
      const finalVersion = await this.getCurrentVersion();
      this.logger.log(
        `✅ Migration process completed successfully! Database updated from version ${currentDbVersion} to ${finalVersion} (${executedCount} migration(s) executed)`,
      );
    } catch (error) {
      const infrastructureMessage =
        resolveInfrastructureConnectionFailure(error);

      if (infrastructureMessage) {
        this.logger.error(infrastructureMessage);
        this.logger.warn(
          "⚠️ Skipping database migrations until MongoDB is available.",
        );
        return;
      }

      // Log error and re-throw to stop application startup
      this.logger.error("❌ Migration process failed and stopped:", error);
      this.logger.error(
        "🛑 Application startup blocked. Fix migration issues and restart.",
      );
      throw error;
    }
  }

  private async verifyMongoConnection(): Promise<boolean> {
    try {
      if (!this.connection.db) {
        throw new Error("MongoDB connection is not established");
      }

      await this.connection.db.admin().ping();
      return true;
    } catch (error) {
      const message = formatInfrastructureConnectionError("mongodb", error);
      this.logger.error(message);
      return false;
    }
  }

  /**
   * Handles running migrations, detecting stale migrations if necessary.
   * Uses status: "running" + startedAt to detect concurrent/stale executions.
   */
  private async handleRunningMigrations(): Promise<void> {
    const runningMigration = await this.migrationModel.findOne({
      status: MigrationStatus.RUNNING,
    });

    if (!runningMigration) {
      return;
    }

    this.logger.warn(
      `⚠️  Migration is currently running: version ${runningMigration.version} (${runningMigration.name})`,
    );

    // Check if migration is stale (started but never completed)
    const runningAge =
      Date.now() - (runningMigration.startedAt?.getTime() || 0);

    if (runningAge > MigrationService.STALE_LOCK_THRESHOLD) {
      this.logger.warn(
        `🔓 Stale running migration detected (${Math.round(runningAge / 1000)}s old). Marking as failed...`,
      );
      await this.migrationModel.updateOne(
        { _id: runningMigration._id },
        {
          status: MigrationStatus.FAILED,
          error: "Stale running migration detected and marked as failed",
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      );
    } else {
      this.logger.error(
        "❌ Migration is currently running by another process. Please wait for it to complete.",
      );
      throw new Error(
        `Migration is running: ${runningMigration.name} (version ${runningMigration.version})`,
      );
    }
  }

  /**
   * Discovers all migration classes from the migration registry.
   * Migrations are automatically registered when imported in migrations/index.ts
   */
  private discoverMigrations(): MigrationClass[] {
    // Lazy import to avoid circular dependency issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    require("../../migrations");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MIGRATIONS } = require("../../migrations/core");
    return [...MIGRATIONS];
  }

  /**
   * Sorts migrations by version number (ascending).
   */
  private sortMigrationsByVersion(
    migrations: MigrationClass[],
  ): MigrationClass[] {
    return [...migrations].sort(
      (a, b) => this.getMigrationVersion(a) - this.getMigrationVersion(b),
    );
  }

  /**
   * Gets the version number from a migration class.
   */
  private getMigrationVersion(MigrationClass: MigrationClass): number {
    const instance = new MigrationClass();
    return instance.version;
  }

  /**
   * Gets the name from a migration class.
   */
  private getMigrationName(MigrationClass: MigrationClass): string {
    const instance = new MigrationClass();
    return instance.name;
  }

  /**
   * Executes a single migration with proper error handling and state tracking.
   */
  private async executeMigration(
    MigrationClass: MigrationClass,
  ): Promise<void> {
    const version = this.getMigrationVersion(MigrationClass);
    const name = this.getMigrationName(MigrationClass);
    const migration = new MigrationClass();
    migration.setConnection(this.connection);

    const startTime = Date.now();
    let migrationRecord: MigrationDocument = null;

    try {
      this.logger.log(`⚡ Executing migration v${version}: ${name}`);

      // Create or update migration record with "running" status
      // Use atomic operation to prevent concurrent execution
      // Only update if status is not "running" (prevents race conditions)
      migrationRecord = await this.migrationModel.findOneAndUpdate(
        { version, status: { $ne: MigrationStatus.RUNNING } }, // Only update if not already running
        {
          version,
          name,
          status: MigrationStatus.RUNNING,
          startedAt: new Date(),
          error: undefined,
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true, new: true },
      );

      // Check if another process started the migration (race condition)
      if (!migrationRecord) {
        const existing = await this.migrationModel.findOne({ version });
        if (existing?.status === MigrationStatus.RUNNING) {
          throw new Error(
            `Migration v${version} (${name}) is already running by another process`,
          );
        }
        throw new Error(
          `Failed to create migration record for v${version} (${name})`,
        );
      }

      // Execute the migration up() method
      await migration.up();

      const executionTime = Date.now() - startTime;

      // Update record as completed
      await this.migrationModel.updateOne(
        { _id: migrationRecord._id },
        {
          status: MigrationStatus.COMPLETED,
          completedAt: new Date(),
          executionTimeMs: executionTime,
          error: undefined,
          updatedAt: new Date(),
        },
      );

      this.logger.log(
        `✅ Migration v${version}: ${name} completed successfully in ${executionTime}ms`,
      );
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `❌ Migration v${version}: ${name} failed after ${executionTime}ms`,
      );
      this.logger.error(`Error details: ${errorMessage}`);

      // Update or create record as failed
      if (migrationRecord) {
        await this.migrationModel.updateOne(
          { _id: migrationRecord._id },
          {
            status: MigrationStatus.FAILED,
            completedAt: new Date(),
            executionTimeMs: executionTime,
            error: errorMessage,
            metadata: errorStack ? { stack: errorStack } : undefined,
            updatedAt: new Date(),
          },
        );
      } else {
        await this.migrationModel.insertOne({
          version,
          name,
          status: MigrationStatus.FAILED,
          startedAt: new Date(startTime),
          completedAt: new Date(),
          executionTimeMs: executionTime,
          error: errorMessage,
          metadata: errorStack ? { stack: errorStack } : undefined,
        });
      }

      throw error;
    }
  }

  /**
   * Gets the current database version from MongoDB.
   * Returns the highest completed migration version, or 0 if no migrations have been run.
   */
  async getCurrentVersion(): Promise<number> {
    const latest = await this.migrationModel
      .findOne({ status: MigrationStatus.COMPLETED })
      .sort({ version: -1 })
      .select("version")
      .lean()
      .exec();

    return latest?.version ?? 0;
  }

  /**
   * Get all migration records.
   */
  async getAllMigrations(): Promise<MigrationDocument[]> {
    return this.migrationModel.find().sort({ version: 1 }).exec();
  }

  /**
   * Manually reset stuck migrations (use with caution).
   * Marks all "running" migrations older than threshold as "failed".
   */
  async resetStuckMigrations(): Promise<void> {
    const result = await this.migrationModel.updateMany(
      {
        status: MigrationStatus.RUNNING,
        startedAt: {
          $lt: new Date(Date.now() - MigrationService.STALE_LOCK_THRESHOLD),
        },
      },
      {
        status: MigrationStatus.FAILED,
        error: "Manually reset stuck migration",
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    );
    this.logger.warn(`Reset ${result.modifiedCount} stuck migration(s)`);
  }

  /**
   * Get all failed migrations with details.
   * Useful for debugging and recovery.
   */
  async getFailedMigrations(): Promise<MigrationDocument[]> {
    return this.migrationModel
      .find({ status: MigrationStatus.FAILED })
      .sort({ version: 1 })
      .exec();
  }

  /**
   * Reset a failed migration to pending status so it can be retried.
   * Use this after fixing the migration code.
   *
   * @param version The version number of the migration to reset
   */
  async resetFailedMigration(version: number): Promise<void> {
    const migration = await this.migrationModel.findOne({
      version,
      status: MigrationStatus.FAILED,
    });

    if (!migration) {
      throw new Error(`No failed migration found with version ${version}`);
    }

    await this.migrationModel.updateOne(
      { _id: migration._id },
      {
        $set: {
          status: MigrationStatus.PENDING,
          error: undefined,
          startedAt: undefined,
          completedAt: undefined,
          executionTimeMs: undefined,
          metadata: undefined,
          updatedAt: new Date(),
        },
      },
    );

    this.logger.log(
      `✅ Reset migration v${version} (${migration.name}) to pending status. Ready to retry.`,
    );
  }

  /**
   * Delete a migration record completely.
   * Use with caution - only if you want to remove the migration record entirely.
   *
   * @param version The version number of the migration to delete
   */
  async deleteMigrationRecord(version: number): Promise<void> {
    const result = await this.migrationModel.deleteOne({ version });
    if (result.deletedCount === 0) {
      throw new Error(`No migration found with version ${version}`);
    }
    this.logger.warn(
      `⚠️  Deleted migration record v${version}. It will run again on next startup.`,
    );
  }

  /**
   * Mark a failed migration as completed manually.
   * Use this ONLY if you've manually fixed the database state.
   *
   * @param version The version number of the migration to mark as completed
   */
  async markMigrationAsCompleted(version: number): Promise<void> {
    const migration = await this.migrationModel.findOne({
      version,
      status: MigrationStatus.FAILED,
    });

    if (!migration) {
      throw new Error(`No failed migration found with version ${version}`);
    }

    await this.migrationModel.updateOne(
      { _id: migration._id },
      {
        $set: {
          status: MigrationStatus.COMPLETED,
          error: "Manually marked as completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    this.logger.warn(
      `⚠️  Marked migration v${version} (${migration.name}) as completed. Ensure database state is correct.`,
    );
  }
}
