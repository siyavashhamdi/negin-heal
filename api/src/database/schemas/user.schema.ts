import { Document, Schema as MongooseSchema, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { NativePushPlatform, UserRole, UserStatus } from "../../enums";
import { normalizeMobilePhone } from "../../utils/contact-validation.util";
import { BaseIdTimestampableBlameableSchema } from "./base.schema";
import { timestampablePlugin } from "../plugins/timestampable.plugin";
import { blameablePlugin } from "../plugins/blameable.plugin";
import { softDeletePlugin } from "../plugins/soft-delete.plugin";

function normalizeEmail(value?: string | null): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function normalizePhoneNumber(value?: string | null): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  return normalizeMobilePhone(value);
}

/**
 * Mongoose Schemas for nested objects
 * These define the database structure and validation rules
 */
export const UserPasswordResetTokenSchema = new MongooseSchema(
  {
    hash: { type: String },
    createdAt: { type: Date },
    attempts: { type: Number, default: 0 },
  },
  { _id: false },
);

export const UserAccountActivationTokenSchema = new MongooseSchema(
  {
    hash: { type: String },
    createdAt: { type: Date },
  },
  { _id: false },
);

export const UserVerificationSchema = new MongooseSchema(
  {
    emailVerifiedAt: { type: Date },
    mobileVerifiedAt: { type: Date },
    lastEmailVerificationSentAt: { type: Date },
  },
  { _id: false },
);

export const UserAuthenticationSchema = new MongooseSchema(
  {
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    lastLoginAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    passwordResetToken: { type: UserPasswordResetTokenSchema },
    accountActivationToken: { type: UserAccountActivationTokenSchema },
    lastPasswordResetEmailSentAt: { type: Date },
  },
  { _id: false },
);

export const UserProfileSchema = new MongooseSchema(
  {
    firstName: { type: String },
    /** Optional family name; users may register and update profile without it. */
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

export const UserPushSubscriptionKeysSchema = new MongooseSchema(
  {
    p256dh: { required: true, trim: true, type: String },
    auth: { required: true, trim: true, type: String },
  },
  { _id: false },
);

export const UserPushSubscriptionSchema = new MongooseSchema(
  {
    endpoint: { required: true, trim: true, type: String },
    keys: { required: true, type: UserPushSubscriptionKeysSchema },
    registeredAt: { required: true, type: Date },
    updatedAt: { type: Date },
  },
  { _id: false },
);

export const UserNativePushTokenSchema = new MongooseSchema(
  {
    token: { required: true, trim: true, type: String },
    platform: {
      required: true,
      enum: Object.values(NativePushPlatform),
      type: String,
    },
    registeredAt: { required: true, type: Date },
    updatedAt: { type: Date },
  },
  { _id: false },
);

/**
 * TypeScript Types (derived from Mongoose schemas)
 * These provide compile-time type checking and IntelliSense
 */
export type UserPasswordResetToken = {
  hash?: string | null;
  createdAt?: Date;
  attempts?: number;
};

export type UserAccountActivationToken = {
  hash?: string | null;
  createdAt?: Date;
};

export type UserAuthentication = {
  passwordHash: string;
  passwordSalt: string;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  passwordResetToken?: UserPasswordResetToken;
  accountActivationToken?: UserAccountActivationToken;
  lastPasswordResetEmailSentAt?: Date;
};

export type UserVerification = {
  emailVerifiedAt?: Date;
  mobileVerifiedAt?: Date;
  lastEmailVerificationSentAt?: Date;
};

export type UserProfile = {
  firstName?: string;
  /** Optional family name. */
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

export type UserPushSubscriptionKeys = {
  p256dh: string;
  auth: string;
};

export type UserPushSubscription = {
  endpoint: string;
  keys: UserPushSubscriptionKeys;
  registeredAt: Date;
  updatedAt?: Date;
};

export type UserNativePushToken = {
  token: string;
  platform: NativePushPlatform;
  registeredAt: Date;
  updatedAt?: Date;
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

  @Prop({
    type: UserVerificationSchema,
    default: () => ({}),
  })
  verification: UserVerification;

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

  @Prop({
    type: [UserPushSubscriptionSchema],
    default: [],
  })
  pushSubscriptions: UserPushSubscription[];

  @Prop({
    type: [UserNativePushTokenSchema],
    default: [],
  })
  nativePushTokens: UserNativePushToken[];

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

function disablePushSubscriptionSubdocumentIds(
  schema: typeof UserSchema,
): void {
  const pushSubscriptionsPath = schema.path("pushSubscriptions");
  const elementSchema =
    pushSubscriptionsPath &&
    "schema" in pushSubscriptionsPath &&
    pushSubscriptionsPath.schema
      ? pushSubscriptionsPath.schema
      : undefined;

  if (!elementSchema) {
    return;
  }

  elementSchema.set("_id", false);

  const keysPath = elementSchema.path("keys");
  const keysSchema =
    keysPath && "schema" in keysPath && keysPath.schema
      ? keysPath.schema
      : undefined;

  if (keysSchema) {
    keysSchema.set("_id", false);
  }
}

disablePushSubscriptionSubdocumentIds(UserSchema);

function disableNativePushTokenSubdocumentIds(schema: typeof UserSchema): void {
  const nativePushTokensPath = schema.path("nativePushTokens");
  const nativePushTokenSchema =
    nativePushTokensPath &&
    "schema" in nativePushTokensPath &&
    nativePushTokensPath.schema
      ? nativePushTokensPath.schema
      : undefined;

  if (nativePushTokenSchema) {
    nativePushTokenSchema.set("_id", false);
  }
}

disableNativePushTokenSubdocumentIds(UserSchema);

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
UserSchema.index(
  { "authentication.passwordResetToken.hash": 1 },
  {
    name: "idx_auth_password_reset_token_hash",
    partialFilterExpression: {
      "authentication.passwordResetToken.hash": {
        $exists: true,
        $type: "string",
      },
    },
  },
);
UserSchema.index(
  { "authentication.accountActivationToken.hash": 1 },
  {
    name: "idx_auth_account_activation_token_hash",
    partialFilterExpression: {
      "authentication.accountActivationToken.hash": {
        $exists: true,
        $type: "string",
      },
    },
  },
);
UserSchema.index(
  { "pushSubscriptions.endpoint": 1 },
  {
    name: "uniq_push_subscription_endpoint",
    unique: true,
    partialFilterExpression: {
      "pushSubscriptions.endpoint": { $exists: true, $type: "string" },
    },
  },
);
UserSchema.index(
  { "nativePushTokens.token": 1 },
  {
    name: "uniq_native_push_token",
    unique: true,
    partialFilterExpression: {
      "nativePushTokens.token": { $exists: true, $type: "string" },
    },
  },
);
