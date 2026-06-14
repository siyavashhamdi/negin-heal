import * as bcrypt from "bcrypt";
import { BaseMigration, registerMigration } from "./core";
import { UserRole, UserStatus } from "../enums";

/**
 * Default super-admin users to create
 * These are platform-level administrators with full system access
 */
interface DefaultSuperAdminUser {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

const DEFAULT_SUPER_ADMIN_USERS: DefaultSuperAdminUser[] = [
  {
    username: "admin",
    password: "123456aA!",
    firstName: "سوپرادمین",
    lastName: "سیستم",
    phoneNumber: "+1234567890",
  },
];

/**
 * Migration: Create Default Super Admin Users
 *
 * This migration creates default super-admin users for the system.
 * These users have SUPER_ADMIN role and can manage platform-level settings.
 *
 * Note:
 * - This migration is idempotent - it checks if users already exist before creating
 * - Passwords are hashed using bcrypt (10 salt rounds)
 * - Users are created with ACTIVE status
 */
export class Migration001_CreateDefaultSuperAdminUsers extends BaseMigration {
  version = 1;
  name = "CreateDefaultSuperAdminUsers";
  private readonly SALT_ROUNDS = 10;

  async up(): Promise<void> {
    if (!this.connection?.db) {
      throw new Error("Database connection not available");
    }

    const db = this.connection.db;
    const usersCollection = db.collection("users");

    console.log(
      `🔄 Starting migration ${this.version} (${this.name}) - Creating ${DEFAULT_SUPER_ADMIN_USERS.length} default super-admin users...`,
    );

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of DEFAULT_SUPER_ADMIN_USERS) {
      try {
        // Check if user already exists
        const existingUser = await usersCollection.findOne({
          username: userData.username,
        });

        if (existingUser) {
          console.log(
            `ℹ️  User with username ${userData.username} already exists, skipping`,
          );
          skippedCount++;
          continue;
        }

        // Generate salt and hash password
        const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
        const passwordHash = await bcrypt.hash(userData.password, salt);

        // Create user document
        const userDocument = {
          username: userData.username,
          authentication: {
            passwordHash,
            passwordSalt: salt,
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
          profile: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            phoneNumber: userData.phoneNumber || null,
            avatarFileId: null,
            bio: null,
          },
          preferences: {
            language: "en",
            timezone: "UTC",
            notificationsEnabled: true,
            theme: "dark",
          },
          roles: [UserRole.SUPER_ADMIN],
          status: UserStatus.ACTIVE,
          audit: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: null,
            updatedBy: null,
          },
          deletedAt: null,
          deletedBy: null,
        };

        // Insert user
        await usersCollection.insertOne(userDocument);
        console.log(`✅ Created super-admin user: ${userData.username}`);
        createdCount++;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `❌ Failed to create user ${userData.username}: ${errorMessage}`,
        );
        throw error;
      }
    }

    console.log(
      `✅ Migration ${this.version} (${this.name}) completed successfully - Created: ${createdCount}, Skipped: ${skippedCount}`,
    );
  }

  async down(): Promise<void> {
    // Rollback: Remove default super-admin users
    if (!this.connection?.db) {
      throw new Error("Database connection not available");
    }

    const db = this.connection.db;
    const usersCollection = db.collection("users");

    console.log(
      `🔄 Rolling back migration ${this.version} (${this.name}) - Removing default super-admin users...`,
    );

    const result = await usersCollection.deleteMany({
      username: { $in: DEFAULT_SUPER_ADMIN_USERS.map((u) => u.username) },
      roles: UserRole.SUPER_ADMIN,
    });

    console.log(
      `✅ Migration ${this.version} (${this.name}) rolled back - Removed ${result.deletedCount} user(s)`,
    );
  }
}

// Auto-register this migration
registerMigration(Migration001_CreateDefaultSuperAdminUsers);
