import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { UserRole, UserStatus } from "../../enums";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

function normalizeEmail(value?: string | null): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function normalizePhoneNumber(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (/^09\d{9}$/.test(digits)) {
    return digits;
  }
  if (/^9\d{9}$/.test(digits)) {
    return `0${digits}`;
  }
  if (/^989\d{9}$/.test(digits)) {
    return `0${digits.slice(2)}`;
  }

  return trimmed;
}

/**
 * Mongoose Schemas for nested objects
 * These define the database structure and validation rules
 */
export const UserAuthenticationSchema = new MongooseSchema(
  {
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    lastLoginAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
  },
  { _id: false },
);

export const UserProfileSchema = new MongooseSchema(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: {
      lowercase: true,
      set: normalizeEmail,
      trim: true,
      type: String,
    },
    avatarFileId: { type: Types.ObjectId, ref: "StoredFile" },
    bio: { type: String },
    phoneNumber: {
      set: normalizePhoneNumber,
      trim: true,
      type: String,
    },
  },
  { _id: false },
);

export const UserPreferencesSchema = new MongooseSchema(
  {
    language: { type: String, default: "fa" },
    timezone: { type: String, default: "UTC" },
    notificationsEnabled: { type: Boolean, default: true },
    theme: { type: String, default: "light" },
  },
  { _id: false },
);

/**
 * TypeScript Types (derived from Mongoose schemas)
 * These provide compile-time type checking and IntelliSense
 */
export type UserAuthentication = {
  passwordHash: string;
  passwordSalt: string;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
};

export type UserProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarFileId?: Types.ObjectId;
  bio?: string;
  phoneNumber?: string;
};

export type UserPreferences = {
  language?: string;
  timezone?: string;
  notificationsEnabled: boolean;
  theme?: string;
};

export type UserDocument = User & Document;

@Schema()
export class User extends BaseIdTimestampableBlameableSchema {
  // Username (top-level as it's used for unique indexing and login)
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    type: String,
  })
  username: string;

  // Authentication Fields (using high-level type)
  @Prop({ type: UserAuthenticationSchema, required: true })
  authentication: UserAuthentication;

  // Profile Fields (using high-level type)
  @Prop({ type: UserProfileSchema, default: {} })
  profile?: UserProfile;

  // Preferences Fields (using high-level type)
  @Prop({
    type: UserPreferencesSchema,
    default: () => ({
      language: "en",
      timezone: "UTC",
      notificationsEnabled: true,
      theme: "dark",
    }),
  })
  preferences: UserPreferences;

  // Roles & Status
  @Prop({
    default: [],
    enum: Object.values(UserRole),
    type: [String],
  })
  roles: UserRole[];

  @Prop({
    default: UserStatus.ACTIVE,
    enum: Object.values(UserStatus),
    type: String,
  })
  status: UserStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Apply timestampable, blameable, and soft-delete plugins
UserSchema.plugin(timestampablePlugin);
UserSchema.plugin(blameablePlugin);
UserSchema.plugin(softDeletePlugin);

// Create indexes for performance
// Note: username index is created automatically by unique: true in @Prop decorator
UserSchema.index(
  { "profile.email": 1 },
  {
    name: "uniq_profile_email_non_empty",
    partialFilterExpression: {
      "profile.email": { $exists: true, $gt: "", $type: "string" },
    },
    unique: true,
  },
);
UserSchema.index(
  { "profile.phoneNumber": 1 },
  {
    name: "uniq_profile_phone_non_empty",
    partialFilterExpression: {
      "profile.phoneNumber": { $exists: true, $gt: "", $type: "string" },
    },
    unique: true,
  },
);
UserSchema.index({ roles: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ "profile.avatarFileId": 1 });
UserSchema.index({ "audit.createdAt": -1 }); // Index for sorting by creation date (descending)
