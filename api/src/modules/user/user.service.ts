import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { FilterQuery, Model, Types } from "mongoose";

import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  Injectable,
  Inject,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";

import {
  UserLoginGqlResponse,
  UserResolveAuthIdentityGqlResponse,
  UserRequestLoginCodeGqlResponse,
  UserSignupGqlInput,
  UserVerifyLoginCodeGqlResponse,
} from "./graphql";
import { AppSettingValueType, UserRole, UserStatus } from "../../enums";
import { SessionService } from "../auth/session.service";
import { EmailService } from "../email";
import { AppSettingsService } from "../app-settings";
import { FileService, FileAccessUrlDescriptor } from "../file/file.service";
import {
  StoredFile,
  StoredFileDocument,
  User,
  UserDocument,
} from "../../database/schemas";
import { UserSecurityService } from "./user.security.service";
import {
  CaptchaVerificationStatus,
  UserCaptchaService,
} from "./user-captcha.service";
import {
  ExpiredPasswordResetTokenException,
  IdentityAlreadyExistsException,
  IdentityRequiredException,
  InvalidCredentialsException,
  CaptchaExpiredException,
  CaptchaInvalidException,
  CaptchaRequiredException,
  InvalidPasswordResetTokenException,
  InvalidSignupVerificationCodeException,
  SignupCredentialRequiredException,
} from "../../exceptions";
import {
  APP_SETTING_KEY,
  LOGIN_CAPTCHA_FAILED_ATTEMPTS_THRESHOLD,
} from "../../constants";
import { PAGINATION_CONSTANT } from "../../constants/pagination.constant";
import { SortingOrder } from "../../common/pagination/input";
import { buildSortOptions } from "../../common/pagination/utils";
import { env } from "../../config";
import {
  UserCreateGqlInput,
  UserForgotPasswordGqlInput,
  UserListGqlInput,
  UserListSortOptionInput,
  UserProfileUpdateGqlInput,
  UserResetPasswordGqlInput,
  UserUpdateGqlInput,
} from "./graphql/inputs";
import {
  UserListGqlResponse,
  UserListPaginatedOffsetGqlResponse,
  UserMutationGqlResponse,
  UserPasswordResetGqlResponse,
} from "./graphql/responses";

export interface JwtPayload {
  jti: string; // session._id (MongoDB ObjectId) - only field in JWT, everything else from DB
}

interface PendingLoginCode {
  readonly code: string;
  readonly expiresAt: Date;
  attempts: number;
}

interface PendingSignupCode {
  readonly code: string;
  readonly expiresAt: Date;
  attempts: number;
}

type UserListSortField = Extract<keyof UserListSortOptionInput, string>;

type UserListRecord = Pick<
  User,
  "_id" | "username" | "roles" | "status" | "profile" | "preferences" | "audit"
>;

type UserUpdateOperation = {
  $set?: Record<string, unknown>;
  $unset?: Record<string, 1>;
};

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;
  private readonly LOGIN_CODE_TTL_MS = 5 * 60 * 1000;
  private readonly SIGNUP_CODE_TTL_MS = 5 * 60 * 1000;
  private readonly MAX_LOGIN_CODE_ATTEMPTS = 5;
  private readonly MAX_SIGNUP_CODE_ATTEMPTS = 5;
  private readonly LOGIN_CODE_TTL_MINUTES = 5;
  private readonly DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;
  private readonly loginCodesByUserId = new Map<string, PendingLoginCode>();
  private readonly signupCodesByMobile = new Map<string, PendingSignupCode>();

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(StoredFile.name)
    private readonly storedFileModel: Model<StoredFileDocument>,
    private readonly jwtService: JwtService,
    private readonly userSecurityService: UserSecurityService,
    @Inject(forwardRef(() => SessionService))
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
    private readonly appSettingsService: AppSettingsService,
    private readonly userCaptchaService: UserCaptchaService,
    private readonly fileService: FileService,
  ) {}

  async findActiveStaffUserIds(): Promise<string[]> {
    const staffUsers = await this.userModel
      .find({
        roles: { $in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        status: UserStatus.ACTIVE,
      })
      .select({ _id: 1 })
      .lean<Array<{ _id: Types.ObjectId }>>()
      .exec();

    return staffUsers.map((user) => user._id.toString());
  }

  async login(
    identity: string,
    password: string,
    captchaId?: string,
    captchaValue?: string,
    rememberMe: boolean = false,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<UserLoginGqlResponse> {
    const user = await this.findByIdentityOrThrow(identity);
    this.userSecurityService.throwIfAccountIsLocked(user);

    if (this.shouldRequireLoginCaptcha(user)) {
      this.throwIfCaptchaIsInvalid(captchaId, captchaValue);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.authentication.passwordHash,
    );

    if (!isPasswordValid) {
      await this.incrementFailedLoginAttemptsForUser(user._id);
      throw new InvalidCredentialsException();
    }

    return this.createLoginSession(user, rememberMe, deviceInfo, ipAddress);
  }

  private shouldRequireLoginCaptcha(user: UserDocument): boolean {
    return (
      env.CAPTCHA_ENABLED &&
      (user.authentication?.failedLoginAttempts || 0) >=
        LOGIN_CAPTCHA_FAILED_ATTEMPTS_THRESHOLD
    );
  }

  private throwIfCaptchaIsInvalid(
    captchaId?: string,
    captchaValue?: string,
  ): void {
    if (!captchaId?.trim() || !captchaValue?.trim()) {
      throw new CaptchaRequiredException();
    }

    const verificationStatus = this.userCaptchaService.verifyCaptcha(
      captchaId,
      captchaValue,
    );

    if (verificationStatus === CaptchaVerificationStatus.EXPIRED) {
      throw new CaptchaExpiredException();
    }

    if (verificationStatus === CaptchaVerificationStatus.INVALID) {
      throw new CaptchaInvalidException();
    }
  }

  async requestLoginCode(
    identity: string,
  ): Promise<UserRequestLoginCodeGqlResponse> {
    const user = await this.findByIdentityOrThrow(identity);
    this.userSecurityService.throwIfAccountIsLocked(user);

    const code = this.generateLoginCode();
    this.loginCodesByUserId.set(this.toLoginCodeKey(user._id), {
      code,
      attempts: 0,
      expiresAt: new Date(Date.now() + this.LOGIN_CODE_TTL_MS),
    });

    const normalizedIdentity = identity?.trim().toLowerCase();
    const isEmailIdentity = this.looksLikeEmail(normalizedIdentity);
    const userEmail = user.profile?.email?.trim().toLowerCase();
    const shouldSendEmail = Boolean(isEmailIdentity && userEmail);

    if (shouldSendEmail) {
      await this.emailService.sendLoginCodeEmail({
        to: userEmail,
        code,
        expiresInMinutes: this.LOGIN_CODE_TTL_MINUTES,
      });
    }

    const isProduction = process.env.NODE_ENV === "production";
    const message = isProduction
      ? "Login code sent."
      : `Development login code: ${code}`;

    if (!isProduction && !shouldSendEmail) {
      // TODO: replace this with the SMS provider integration for phone-based login.
      console.log(`[auth] Login code for ${normalizedIdentity}: ${code}`);
    }

    return {
      success: true,
      message,
    };
  }

  async resolveAuthIdentity(
    identity: string,
  ): Promise<UserResolveAuthIdentityGqlResponse> {
    const user = await this.userModel.findOne(
      this.buildIdentityFilter(identity),
    );
    return {
      exists: Boolean(user),
    };
  }

  async forgotPassword(
    input: UserForgotPasswordGqlInput,
  ): Promise<UserPasswordResetGqlResponse> {
    if (env.CAPTCHA_ENABLED) {
      this.throwIfCaptchaIsInvalid(input.captchaId, input.captchaValue);
    }

    const genericResponse = this.buildPasswordResetRequestedResponse();
    const filter = this.buildPasswordResetIdentityFilter(input);
    const user = await this.userModel.findOne(filter).exec();

    if (!user || user.status !== UserStatus.ACTIVE) {
      return genericResponse;
    }

    const recipientEmail = this.normalizeOptionalText(user.profile?.email);
    if (!recipientEmail || !this.looksLikeEmail(recipientEmail)) {
      return genericResponse;
    }

    const resetToken = randomBytes(32).toString("base64url");
    const resetTokenHash = this.hashPasswordResetToken(resetToken);
    const resetTokenTtlMinutes = await this.getPasswordResetTokenTtlMinutes();

    await this.userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          "authentication.passwordResetToken.hash": resetTokenHash,
          "authentication.passwordResetToken.createdAt": new Date(),
        },
      },
    );

    await this.emailService.sendPasswordResetEmail({
      to: recipientEmail,
      resetLink: this.buildPasswordResetLink(resetToken),
      expiresInMinutes: resetTokenTtlMinutes,
    });

    return genericResponse;
  }

  async resetPassword(
    resetLink: UserResetPasswordGqlInput["resetLink"],
    newPassword: UserResetPasswordGqlInput["newPassword"],
  ): Promise<UserPasswordResetGqlResponse> {
    const token = this.extractPasswordResetToken(resetLink);
    if (!token) {
      throw new InvalidPasswordResetTokenException();
    }

    const password = this.normalizeRequiredText(newPassword, "Password");
    await this.userSecurityService.throwIfPasswordPolicyIsViolated(password);

    const resetTokenTtlMinutes = await this.getPasswordResetTokenTtlMinutes();
    const oldestValidCreatedAt = new Date(
      Date.now() - resetTokenTtlMinutes * 60 * 1000,
    );
    const resetTokenHash = this.hashPasswordResetToken(token);
    const tokenOwner = await this.userModel.findOne({
      "authentication.passwordResetToken.hash": resetTokenHash,
      status: UserStatus.ACTIVE,
      $or: [
        { "audit.deletedAt": null },
        { "audit.deletedAt": { $exists: false } },
      ],
    });

    if (!tokenOwner) {
      throw new InvalidPasswordResetTokenException();
    }

    const resetTokenCreatedAt =
      tokenOwner.authentication.passwordResetToken?.createdAt;
    if (!resetTokenCreatedAt || resetTokenCreatedAt < oldestValidCreatedAt) {
      await this.userModel.updateOne(
        { _id: tokenOwner._id },
        {
          $set: {
            "authentication.passwordResetToken.hash": null,
          },
        },
      );
      throw new ExpiredPasswordResetTokenException();
    }

    const passwordSalt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, passwordSalt);
    const user = await this.userModel.findOneAndUpdate(
      {
        _id: tokenOwner._id,
        "authentication.passwordResetToken.hash": resetTokenHash,
        status: UserStatus.ACTIVE,
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      },
      {
        $set: {
          "authentication.passwordSalt": passwordSalt,
          "authentication.passwordHash": passwordHash,
          "authentication.failedLoginAttempts": 0,
          "authentication.passwordResetToken.hash": null,
        },
        $unset: {
          "authentication.lockedUntil": 1,
        },
      },
      { new: true },
    );

    if (!user) {
      throw new InvalidPasswordResetTokenException();
    }

    await this.sessionService.revokeAllUserSessions(user._id);

    return {
      success: true,
      message: "Password reset successfully.",
    };
  }

  async requestSignupCode(
    mobile: string,
  ): Promise<UserRequestLoginCodeGqlResponse> {
    const normalizedMobile = this.normalizePhoneNumber(mobile);

    if (!normalizedMobile) {
      throw new IdentityRequiredException();
    }

    await this.throwIfAnyIdentityAlreadyExists({ mobile: normalizedMobile });

    const code = this.generateLoginCode();
    this.signupCodesByMobile.set(normalizedMobile, {
      code,
      attempts: 0,
      expiresAt: new Date(Date.now() + this.SIGNUP_CODE_TTL_MS),
    });

    const isProduction = process.env.NODE_ENV === "production";
    const message = isProduction
      ? "Signup verification code sent."
      : `Development signup code: ${code}`;

    if (!isProduction) {
      // TODO: replace this with the SMS provider integration.
      console.log(`[auth] Signup code for ${normalizedMobile}: ${code}`);
    }

    return {
      success: true,
      message,
    };
  }

  async sendSampleEmail(
    userId: Types.ObjectId,
    to?: string,
  ): Promise<UserRequestLoginCodeGqlResponse> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const recipientEmail = this.normalizeUsernameOrEmail(
      to?.trim() || user.profile?.email?.trim() || "",
    );

    if (!recipientEmail || !this.looksLikeEmail(recipientEmail)) {
      throw new BadRequestException(
        "A valid recipient email is required to send a sample email",
      );
    }

    const requestedBy =
      user.profile?.firstName?.trim() ||
      user.profile?.lastName?.trim() ||
      user.username;
    const sentAt = new Date().toISOString();

    await this.emailService.sendSampleEmail({
      to: recipientEmail,
      requestedBy,
      sentAtIso: sentAt,
    });

    return {
      success: true,
      message: `Sample email sent to ${recipientEmail}.`,
    };
  }

  async signup(
    input: UserSignupGqlInput,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<UserLoginGqlResponse> {
    if (env.CAPTCHA_ENABLED) {
      this.throwIfCaptchaIsInvalid(input.captchaId, input.captchaValue);
    }

    const username = input.username?.trim()
      ? this.normalizeUsernameOrEmail(input.username)
      : undefined;
    const email = input.email?.trim()
      ? this.normalizeUsernameOrEmail(input.email)
      : undefined;
    const mobile = input.mobile?.trim()
      ? this.normalizePhoneNumber(input.mobile)
      : undefined;

    if (!username && !email && !mobile) {
      throw new IdentityRequiredException();
    }

    const password = input.password?.trim();
    const signupCode = input.signupCode?.trim();

    if (!password && !signupCode) {
      throw new SignupCredentialRequiredException();
    }

    if (signupCode) {
      if (!mobile) {
        throw new SignupCredentialRequiredException();
      }

      this.verifyPendingSignupCode(mobile, signupCode);
    }

    if (password) {
      await this.userSecurityService.throwIfPasswordPolicyIsViolated(password);
    }

    await this.throwIfAnyIdentityAlreadyExists({ username, email, mobile });

    const finalUsername = await this.resolveSignupUsername(
      username,
      email,
      mobile,
    );
    const finalPassword = password || randomBytes(24).toString("base64url");
    const passwordSalt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(finalPassword, passwordSalt);

    const profile: Record<string, string> = {
      firstName: input.profile.firstName.trim(),
      lastName: input.profile.lastName.trim(),
    };

    if (email) {
      profile.email = email;
    }

    if (mobile) {
      profile.phoneNumber = mobile;
    }

    const [createdUser] = await this.userModel.create([
      {
        username: finalUsername,
        authentication: {
          passwordHash,
          passwordSalt,
          failedLoginAttempts: 0,
        },
        profile,
        roles: [UserRole.END_USER],
        status: UserStatus.ACTIVE,
      },
    ]);

    if (mobile) {
      this.signupCodesByMobile.delete(mobile);
    }

    return this.createLoginSession(
      createdUser,
      input.rememberMe === true,
      deviceInfo,
      ipAddress,
    );
  }

  async verifyLoginCode(
    identity: string,
    code: string,
    rememberMe: boolean = false,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<UserVerifyLoginCodeGqlResponse> {
    const user = await this.findByIdentityOrThrow(identity);
    this.userSecurityService.throwIfAccountIsLocked(user);

    const loginCodeKey = this.toLoginCodeKey(user._id);
    const pendingCode = this.loginCodesByUserId.get(loginCodeKey);

    if (!pendingCode || pendingCode.expiresAt.getTime() < Date.now()) {
      this.loginCodesByUserId.delete(loginCodeKey);
      throw new InvalidCredentialsException();
    }

    if (pendingCode.code !== code.trim()) {
      pendingCode.attempts += 1;
      if (pendingCode.attempts >= this.MAX_LOGIN_CODE_ATTEMPTS) {
        this.loginCodesByUserId.delete(loginCodeKey);
      }
      throw new InvalidCredentialsException();
    }

    this.loginCodesByUserId.delete(loginCodeKey);

    const loginResult = await this.createLoginSession(
      user,
      rememberMe,
      deviceInfo,
      ipAddress,
    );

    return {
      success: true,
      message: "Logged in successfully.",
      userId: user._id,
      accessToken: loginResult.accessToken,
    };
  }

  private async createLoginSession(
    user: UserDocument,
    rememberMe: boolean = false,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<UserLoginGqlResponse> {
    // Update last login
    await this.userModel.updateOne(
      { _id: user._id },
      {
        "authentication.lastLoginAt": new Date(),
        "authentication.failedLoginAttempts": 0,
      },
    );

    // Calculate expiration time based on rememberMe flag
    // If rememberMe is true, use 30 days, otherwise use default (24h)
    const expiresIn = rememberMe
      ? process.env.JWT_REMEMBER_ME_EXPIRES_IN || "30d"
      : process.env.JWT_EXPIRES_IN || "24h";
    const expiresInSeconds = this.parseExpiresIn(expiresIn);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Create session in database first to get session._id
    const session = await this.sessionService.createSession(
      user._id,
      expiresAt,
      deviceInfo,
      ipAddress,
    );

    // Use session._id as jti in JWT
    const sessionId = session._id.toString();

    // Generate JWT token with session._id as jti
    // All user data (userId, username, roles) will be fetched from database via session
    const payload: JwtPayload = {
      jti: sessionId, // session._id used as jti - everything else from DB
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        roles: user.roles || [],
      },
    };
  }

  private async findByIdentityOrThrow(identity: string): Promise<UserDocument> {
    const user = await this.userModel.findOne(
      this.buildIdentityFilter(identity),
    );

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new InvalidCredentialsException();
    }

    return user;
  }

  private buildIdentityFilter(identity: string): FilterQuery<User> {
    const trimmedIdentity = identity.trim();
    const normalizedIdentity = this.normalizeUsernameOrEmail(trimmedIdentity);
    const phoneCandidates = this.createPhoneCandidates(trimmedIdentity);

    const conditions: FilterQuery<User>[] = [
      { username: normalizedIdentity },
      { "profile.email": normalizedIdentity },
    ];

    if (phoneCandidates.length > 0) {
      conditions.push({
        "profile.phoneNumber": {
          $in: phoneCandidates,
        },
      });
    }

    return { $and: [{ $or: conditions }] };
  }

  private buildPasswordResetIdentityFilter(
    input: UserForgotPasswordGqlInput,
  ): FilterQuery<User> {
    const identity = this.normalizeOptionalText(input.identity);
    if (!identity) {
      throw new IdentityRequiredException();
    }

    return this.buildIdentityFilter(identity);
  }

  private buildPasswordResetRequestedResponse(): UserPasswordResetGqlResponse {
    return {
      success: true,
      message:
        "If an account matches the provided information, a password reset link will be sent.",
    };
  }

  private buildPasswordResetLink(token: string): string {
    const configuredResetUrl = `${this.resolveAppUrl()}/reset-password`;

    const resetUrl = new URL(configuredResetUrl);
    resetUrl.searchParams.set("token", token);
    return resetUrl.toString();
  }

  private resolveAppUrl(): string {
    return (env.APP_URL || `http://localhost:${env.PORT}`).replace(/\/+$/, "");
  }

  private extractPasswordResetToken(resetLink: string): string {
    const trimmedResetLink = resetLink.trim();
    if (!trimmedResetLink) {
      return "";
    }

    try {
      const resetUrl = new URL(trimmedResetLink);
      const tokenFromQuery =
        resetUrl.searchParams.get("token") ||
        resetUrl.searchParams.get("resetToken");
      if (tokenFromQuery?.trim()) {
        return tokenFromQuery.trim();
      }
    } catch {
      // The input can be the raw token rather than a full URL.
    }

    return trimmedResetLink;
  }

  private hashPasswordResetToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private async getPasswordResetTokenTtlMinutes(): Promise<number> {
    const storedValue = await this.appSettingsService.getActiveSettingValue(
      APP_SETTING_KEY.PASSWORD_RESET_TOKEN_TTL_MINUTES,
      AppSettingValueType.NUMBER,
    );
    const ttlMinutes = Number(storedValue);

    return Number.isFinite(ttlMinutes) && ttlMinutes > 0
      ? Math.round(ttlMinutes)
      : this.DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES;
  }

  private async throwIfAnyIdentityAlreadyExists(identity: {
    username?: string;
    email?: string;
    mobile?: string;
  }): Promise<void> {
    const conditions: FilterQuery<User>[] = [];

    if (identity.username) {
      conditions.push({
        username: this.normalizeUsernameOrEmail(identity.username),
      });
    }

    if (identity.email) {
      conditions.push({
        "profile.email": this.normalizeUsernameOrEmail(identity.email),
      });
    }

    if (identity.mobile) {
      conditions.push({
        "profile.phoneNumber": {
          $in: this.createPhoneCandidates(identity.mobile),
        },
      });
    }

    if (conditions.length === 0) {
      throw new IdentityRequiredException();
    }

    const user = await this.userModel.findOne({ $or: conditions });
    if (user) {
      throw new IdentityAlreadyExistsException();
    }
  }

  private createPhoneCandidates(identity: string): string[] {
    const digits = identity.replace(/\D/g, "");

    if (!digits) {
      return [];
    }

    const candidates = new Set<string>([identity.trim(), digits]);
    let localMobile: string | null = null;

    if (/^09\d{9}$/.test(digits)) {
      localMobile = digits;
    } else if (/^9\d{9}$/.test(digits)) {
      localMobile = `0${digits}`;
    } else if (/^989\d{9}$/.test(digits)) {
      localMobile = `0${digits.slice(2)}`;
    }

    if (localMobile) {
      candidates.add(localMobile);
      candidates.add(`98${localMobile.slice(1)}`);
      candidates.add(`+98${localMobile.slice(1)}`);
    }

    return [...candidates];
  }

  private normalizeUsernameOrEmail(value: string): string {
    return value.trim().toLowerCase();
  }

  private looksLikeEmail(value?: string): boolean {
    if (!value) {
      return false;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private normalizePhoneNumber(value: string): string | undefined {
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

  private verifyPendingSignupCode(mobile: string, signupCode: string): void {
    const pendingCode = this.signupCodesByMobile.get(mobile);

    if (!pendingCode || pendingCode.expiresAt.getTime() < Date.now()) {
      this.signupCodesByMobile.delete(mobile);
      throw new InvalidSignupVerificationCodeException();
    }

    if (pendingCode.code !== signupCode) {
      pendingCode.attempts += 1;
      if (pendingCode.attempts >= this.MAX_SIGNUP_CODE_ATTEMPTS) {
        this.signupCodesByMobile.delete(mobile);
      }
      throw new InvalidSignupVerificationCodeException();
    }
  }

  private async resolveSignupUsername(
    username?: string,
    email?: string,
    mobile?: string,
  ): Promise<string> {
    const preferredUsername = username || email || mobile;

    if (!preferredUsername) {
      return this.generateUniqueUsername();
    }

    const normalizedUsername = this.normalizeUsernameOrEmail(preferredUsername);
    const exists = await this.userModel.exists({
      username: normalizedUsername,
    });

    if (!exists) {
      return normalizedUsername;
    }

    return this.generateUniqueUsername(normalizedUsername);
  }

  private async generateUniqueUsername(base = "user"): Promise<string> {
    const sanitizedBase =
      base.replace(/[^a-z0-9._-]/gi, "").toLowerCase() || "user";
    let candidate = sanitizedBase;
    let suffix = 0;

    while (suffix < 20) {
      const exists = await this.userModel.exists({ username: candidate });
      if (!exists) {
        return candidate;
      }
      suffix += 1;
      candidate = `${sanitizedBase}${suffix}`;
    }

    return `${sanitizedBase}${Date.now().toString().slice(-6)}`;
  }

  private generateLoginCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private toLoginCodeKey(userId: Types.ObjectId): string {
    return userId.toString();
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.revokeSession(sessionId);
  }

  /**
   * Increment failed login attempts
   */
  private async incrementFailedLoginAttemptsForUser(
    userId: Types.ObjectId,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      return;
    }

    const newAttempts = (user.authentication?.failedLoginAttempts || 0) + 1;
    const update: Record<string, unknown> = {
      "authentication.failedLoginAttempts": newAttempts,
    };

    // Lock account after 5 failed attempts for 30 minutes
    if (newAttempts >= 5) {
      update["authentication.lockedUntil"] = new Date(
        Date.now() + 30 * 60 * 1000,
      ); // 30 minutes
    }

    await this.userModel.updateOne({ _id: user._id }, update);
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 24 * 60 * 60; // Default to 24 hours
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 24 * 60 * 60;
      default:
        return 24 * 60 * 60;
    }
  }

  async validateUser(payload: JwtPayload) {
    if (!payload.jti) {
      return null;
    }

    // First, find the session by ID (jti is session._id)
    const session = await this.sessionService.findSessionById(payload.jti);

    if (!session) {
      // Session not found, expired, or revoked
      return null;
    }

    // Get user from session.userId (fresh data from database)
    const user = await this.userModel.findById(session.userId);

    if (!user || user.status !== UserStatus.ACTIVE) {
      return null;
    }

    // Update last activity for the session
    await this.sessionService.updateLastActivity(payload.jti);

    return user;
  }

  async findById(id: Types.ObjectId): Promise<UserDocument> {
    return this.userModel.findById(id);
  }

  async create(input: UserCreateGqlInput): Promise<UserMutationGqlResponse> {
    const username = this.normalizeUsernameOrEmail(
      this.normalizeRequiredText(input.username, "Username"),
    );
    const password = this.normalizeRequiredText(input.password, "Password");
    await this.userSecurityService.throwIfPasswordPolicyIsViolated(password);

    const profile = await this.buildUserCreateProfile(input.profile);
    const email = profile.email;
    const mobile = profile.phoneNumber;

    await this.throwIfAnyIdentityAlreadyExists({
      username,
      email,
      mobile,
    });

    const passwordSalt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, passwordSalt);
    const [createdUser] = await this.userModel.create([
      {
        username,
        authentication: {
          passwordHash,
          passwordSalt,
          failedLoginAttempts: 0,
        },
        profile,
        roles: input.roles,
        status: input.status ?? UserStatus.ACTIVE,
      },
    ]);

    return this.toUserMutationResponse(
      createdUser.toObject() as UserListRecord,
    );
  }

  async update(input: UserUpdateGqlInput): Promise<UserMutationGqlResponse> {
    const existingUser = await this.userModel
      .findOne({
        _id: input.id,
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      })
      .exec();

    if (!existingUser) {
      throw new NotFoundException("User not found");
    }

    await this.throwIfUpdateIdentityAlreadyExists(input);

    const { passwordChanged, shouldRevokeSessions, update } =
      await this.buildUserUpdate(input, existingUser);

    if (!update.$set && !update.$unset) {
      return this.toUserMutationResponse(
        existingUser.toObject() as UserListRecord,
      );
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(input.id, update, {
        new: true,
        runValidators: true,
      })
      .lean<UserListRecord>()
      .exec();

    if (!updatedUser) {
      throw new NotFoundException("User not found");
    }

    if (passwordChanged || shouldRevokeSessions) {
      await this.sessionService.revokeAllUserSessions(input.id);
    }

    return this.toUserMutationResponse(updatedUser);
  }

  async updateProfile(
    userId: Types.ObjectId,
    input: UserProfileUpdateGqlInput,
  ): Promise<UserMutationGqlResponse> {
    if (this.hasOwnInputField(input, "password")) {
      await this.throwIfCurrentPasswordIsInvalid(userId, input.currentPassword);
    }

    await this.throwIfLockedProfileIdentityIsUpdated(userId, input);

    const updateInput = {
      ...input,
      id: userId,
    } as UserUpdateGqlInput;

    return this.update({
      ...updateInput,
      id: userId,
    });
  }

  private async throwIfLockedProfileIdentityIsUpdated(
    userId: Types.ObjectId,
    input: UserProfileUpdateGqlInput,
  ): Promise<void> {
    if (!input.profile) {
      return;
    }

    const updatesEmail = this.hasOwnInputField(input.profile, "email");
    const updatesPhoneNumber = this.hasOwnInputField(
      input.profile,
      "phoneNumber",
    );
    if (!updatesEmail && !updatesPhoneNumber) {
      return;
    }

    const user = await this.userModel
      .findOne({
        _id: userId,
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      })
      .select({ "profile.email": 1, "profile.phoneNumber": 1 })
      .lean<Pick<User, "profile">>()
      .exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (updatesEmail && this.normalizeOptionalText(user.profile?.email)) {
      throw new BadRequestException(
        "Email is already set. Please contact support to change it.",
      );
    }

    if (
      updatesPhoneNumber &&
      this.normalizeOptionalText(user.profile?.phoneNumber)
    ) {
      throw new BadRequestException(
        "Phone number is already set. Please contact support to change it.",
      );
    }
  }

  private async throwIfCurrentPasswordIsInvalid(
    userId: Types.ObjectId,
    currentPassword: string | null | undefined,
  ): Promise<void> {
    const normalizedCurrentPassword = this.normalizeRequiredText(
      currentPassword,
      "Current password",
    );
    const user = await this.userModel
      .findOne({
        _id: userId,
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      })
      .select({ authentication: 1 })
      .exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      normalizedCurrentPassword,
      user.authentication.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new InvalidCredentialsException();
    }
  }

  async list(
    input: UserListGqlInput,
  ): Promise<UserListPaginatedOffsetGqlResponse> {
    const { filters, options } = input || {};
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_LIMIT;
    const skip = options?.skip ?? PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_SKIP;
    const filterQuery = this.buildListFilterQuery(filters);
    const sortOptions = this.resolveUserListSortOptions(options?.sort);

    const [users, total] = await Promise.all([
      this.userModel
        .find(filterQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean<UserListRecord[]>()
        .exec(),
      this.userModel.countDocuments(filterQuery).exec(),
    ]);

    const avatarAccessUrlMap = await this.fileService.getAccessUrlMap(
      users.map((user) => user.profile?.avatarFileId),
    );

    return {
      items: users.map((user) =>
        this.toUserListResponse(user, avatarAccessUrlMap),
      ),
      pagination: {
        limit,
        skip,
        total,
        count: users.length,
      },
    };
  }

  private buildListFilterQuery(
    filters?: UserListGqlInput["filters"],
  ): FilterQuery<User> {
    const query: FilterQuery<User> = {
      $and: [
        {
          $or: [
            { "audit.deletedAt": null },
            { "audit.deletedAt": { $exists: false } },
          ],
        },
      ],
    };

    if (!filters) {
      return query;
    }

    if (filters.query?.trim()) {
      const searchRegex = this.createContainsRegex(filters.query);
      this.addListOrFilter(query, [
        { username: searchRegex },
        { "profile.firstName": searchRegex },
        { "profile.lastName": searchRegex },
        { "profile.email": searchRegex },
        { "profile.phoneNumber": searchRegex },
      ]);
    }

    if (filters.id) {
      query._id = new Types.ObjectId(filters.id);
    }

    this.addListContainsFilter(query, "username", filters.username);
    this.addListContainsFilter(query, "profile.firstName", filters.firstName);
    this.addListContainsFilter(query, "profile.lastName", filters.lastName);

    if (filters.fullName?.trim()) {
      const fullNameRegex = this.createContainsRegex(filters.fullName);
      this.addListOrFilter(query, [
        { "profile.firstName": fullNameRegex },
        { "profile.lastName": fullNameRegex },
      ]);
    }

    this.addListContainsFilter(query, "profile.email", filters.email);
    this.addListContainsFilter(
      query,
      "profile.phoneNumber",
      filters.phoneNumber ?? filters.mobilePhone,
    );

    if (filters.role) {
      query.roles = filters.role;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    this.addListDateRangeFilter(
      query,
      "audit.createdAt",
      filters.createdAtFrom,
      filters.createdAtTo,
    );
    this.addListDateRangeFilter(
      query,
      "audit.updatedAt",
      filters.updatedAtFrom,
      filters.updatedAtTo,
    );

    return query;
  }

  private async buildUserCreateProfile(
    profile?: UserCreateGqlInput["profile"],
  ): Promise<User["profile"]> {
    const normalizedProfile: User["profile"] = {};

    if (!profile) {
      return normalizedProfile;
    }

    const firstName = this.normalizeOptionalText(profile.firstName);
    if (firstName) {
      normalizedProfile.firstName = firstName;
    }

    const lastName = this.normalizeOptionalText(profile.lastName);
    if (lastName) {
      normalizedProfile.lastName = lastName;
    }

    const email = this.normalizeOptionalText(profile.email);
    if (email) {
      normalizedProfile.email = this.normalizeUsernameOrEmail(email);
    }

    const phoneNumber = profile.phoneNumber
      ? this.normalizePhoneNumber(profile.phoneNumber)
      : undefined;
    if (phoneNumber) {
      normalizedProfile.phoneNumber = phoneNumber;
    }

    const bio = this.normalizeOptionalText(profile.bio);
    if (bio) {
      normalizedProfile.bio = bio;
    }

    if (profile.avatarFileId) {
      await this.ensureAvatarFileExists(profile.avatarFileId);
      normalizedProfile.avatarFileId = profile.avatarFileId;
    }

    return normalizedProfile;
  }

  private async buildUserUpdate(
    input: UserUpdateGqlInput,
    existingUser: UserDocument,
  ): Promise<{
    passwordChanged: boolean;
    shouldRevokeSessions: boolean;
    update: UserUpdateOperation;
  }> {
    const set: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};
    let passwordChanged = false;

    if (this.hasOwnInputField(input, "username")) {
      const username = this.normalizeRequiredText(input.username, "Username");
      set.username = this.normalizeUsernameOrEmail(username);
    }

    if (input.roles !== undefined) {
      set.roles = input.roles;
    }

    if (input.status !== undefined) {
      set.status = input.status;
    }

    if (input.profile) {
      await this.applyUserProfileUpdate(input.profile, set, unset);
    }

    if (input.preferences) {
      this.applyUserPreferencesUpdate(input.preferences, set, unset);
    }

    if (this.hasOwnInputField(input, "password")) {
      const password = this.normalizeRequiredText(input.password, "Password");
      await this.userSecurityService.throwIfPasswordPolicyIsViolated(password);

      const passwordSalt = await bcrypt.genSalt(this.SALT_ROUNDS);
      set["authentication.passwordSalt"] = passwordSalt;
      set["authentication.passwordHash"] = await bcrypt.hash(
        password,
        passwordSalt,
      );
      set["authentication.failedLoginAttempts"] = 0;
      unset["authentication.lockedUntil"] = 1;
      passwordChanged = true;
    }

    const update: UserUpdateOperation = {};
    if (Object.keys(set).length > 0) {
      update.$set = set;
    }
    if (Object.keys(unset).length > 0) {
      update.$unset = unset;
    }

    return {
      passwordChanged,
      shouldRevokeSessions:
        input.status !== undefined &&
        existingUser.status === UserStatus.ACTIVE &&
        input.status !== UserStatus.ACTIVE,
      update,
    };
  }

  private async applyUserProfileUpdate(
    profile: UserUpdateGqlInput["profile"],
    set: Record<string, unknown>,
    unset: Record<string, 1>,
  ): Promise<void> {
    if (!profile) {
      return;
    }

    this.applyNullableTextUpdate(profile, "firstName", "profile.firstName", {
      set,
      unset,
    });
    this.applyNullableTextUpdate(profile, "lastName", "profile.lastName", {
      set,
      unset,
    });
    this.applyNullableNormalizedTextUpdate(profile, "email", "profile.email", {
      normalize: (value) => this.normalizeUsernameOrEmail(value),
      set,
      unset,
    });
    this.applyNullableNormalizedTextUpdate(
      profile,
      "phoneNumber",
      "profile.phoneNumber",
      {
        normalize: (value) => this.normalizePhoneNumber(value),
        set,
        unset,
      },
    );
    this.applyNullableTextUpdate(profile, "bio", "profile.bio", {
      set,
      unset,
    });

    if (this.hasOwnInputField(profile, "avatarFileId")) {
      if (profile.avatarFileId === null) {
        unset["profile.avatarFileId"] = 1;
      } else if (profile.avatarFileId) {
        await this.ensureAvatarFileExists(profile.avatarFileId);
        set["profile.avatarFileId"] = profile.avatarFileId;
      }
    }
  }

  private applyUserPreferencesUpdate(
    preferences: UserUpdateGqlInput["preferences"],
    set: Record<string, unknown>,
    unset: Record<string, 1>,
  ): void {
    if (!preferences) {
      return;
    }

    this.applyNullableTextUpdate(
      preferences,
      "language",
      "preferences.language",
      {
        set,
        unset,
      },
    );
    this.applyNullableTextUpdate(
      preferences,
      "timezone",
      "preferences.timezone",
      {
        set,
        unset,
      },
    );
    this.applyNullableTextUpdate(preferences, "theme", "preferences.theme", {
      set,
      unset,
    });

    if (this.hasOwnInputField(preferences, "notificationsEnabled")) {
      if (preferences.notificationsEnabled === null) {
        unset["preferences.notificationsEnabled"] = 1;
      } else if (preferences.notificationsEnabled !== undefined) {
        set["preferences.notificationsEnabled"] =
          preferences.notificationsEnabled;
      }
    }
  }

  private async ensureAvatarFileExists(
    avatarFileId: Types.ObjectId,
  ): Promise<void> {
    const avatarFile = await this.storedFileModel
      .findById(avatarFileId)
      .select({ mimeType: 1 })
      .lean<Pick<StoredFile, "mimeType">>()
      .exec();

    if (!avatarFile) {
      throw new NotFoundException("Avatar file not found");
    }

    if (!avatarFile.mimeType?.startsWith("image/")) {
      throw new BadRequestException("Avatar file must be an image");
    }
  }

  private async throwIfUpdateIdentityAlreadyExists(
    input: UserUpdateGqlInput,
  ): Promise<void> {
    const conditions: FilterQuery<User>[] = [];

    if (this.hasOwnInputField(input, "username")) {
      const username = this.normalizeOptionalText(input.username);
      if (username) {
        conditions.push({ username: this.normalizeUsernameOrEmail(username) });
      }
    }

    if (input.profile && this.hasOwnInputField(input.profile, "email")) {
      const email = this.normalizeOptionalText(input.profile.email);
      if (email) {
        conditions.push({
          "profile.email": this.normalizeUsernameOrEmail(email),
        });
      }
    }

    if (input.profile && this.hasOwnInputField(input.profile, "phoneNumber")) {
      const phoneNumber = input.profile.phoneNumber
        ? this.normalizePhoneNumber(input.profile.phoneNumber)
        : undefined;
      if (phoneNumber) {
        conditions.push({
          "profile.phoneNumber": {
            $in: this.createPhoneCandidates(phoneNumber),
          },
        });
      }
    }

    if (conditions.length === 0) {
      return;
    }

    const duplicateUser = await this.userModel
      .findOne({
        _id: { $ne: input.id },
        $or: conditions,
      })
      .select({ _id: 1 })
      .lean()
      .exec();

    if (duplicateUser) {
      throw new IdentityAlreadyExistsException();
    }
  }

  private applyNullableTextUpdate<TInput extends object>(
    input: TInput,
    field: keyof TInput,
    path: string,
    update: {
      set: Record<string, unknown>;
      unset: Record<string, 1>;
    },
  ): void {
    this.applyNullableNormalizedTextUpdate(input, field, path, {
      ...update,
      normalize: (value) => value.trim(),
    });
  }

  private applyNullableNormalizedTextUpdate<TInput extends object>(
    input: TInput,
    field: keyof TInput,
    path: string,
    options: {
      normalize: (value: string) => string | undefined;
      set: Record<string, unknown>;
      unset: Record<string, 1>;
    },
  ): void {
    if (!this.hasOwnInputField(input, field)) {
      return;
    }

    const rawValue = input[field];
    if (rawValue === null || rawValue === undefined) {
      options.unset[path] = 1;
      return;
    }

    if (typeof rawValue !== "string") {
      return;
    }

    const normalizedValue = options.normalize(rawValue);
    if (normalizedValue) {
      options.set[path] = normalizedValue;
    } else {
      options.unset[path] = 1;
    }
  }

  private normalizeRequiredText(
    value: string | undefined,
    fieldName: string,
  ): string {
    const normalizedValue = this.normalizeOptionalText(value);
    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return normalizedValue;
  }

  private normalizeOptionalText(value?: string | null): string | undefined {
    const normalizedValue = value?.trim();
    return normalizedValue || undefined;
  }

  private hasOwnInputField<TInput extends object>(
    input: TInput,
    field: keyof TInput,
  ): boolean {
    return Object.prototype.hasOwnProperty.call(input, field);
  }

  private resolveUserListSortOptions(
    sort?: UserListSortOptionInput,
  ): Record<string, 1 | -1> {
    const sortOptions = buildSortOptions<UserListSortField>(
      sort ?? {},
      {
        createdAt: "audit.createdAt",
        updatedAt: "audit.updatedAt",
        username: "username",
        firstName: "profile.firstName",
        lastName: "profile.lastName",
        email: "profile.email",
        phoneNumber: "profile.phoneNumber",
        status: "status",
      },
      { createdAt: SortingOrder.DESC },
    );

    sortOptions._id = Object.values(sortOptions)[0] ?? -1;

    return sortOptions;
  }

  private toUserListResponse(
    user: UserListRecord,
    avatarAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): UserListGqlResponse {
    return {
      ...this.toUserMutationResponse(user, avatarAccessUrlMap),
      createdAt: user.audit?.createdAt,
      updatedAt: user.audit?.updatedAt,
    };
  }

  private toUserMutationResponse(
    user: UserListRecord,
    avatarAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): UserMutationGqlResponse {
    const avatarFileId = user.profile?.avatarFileId;

    return {
      id: user._id,
      username: user.username,
      roles: user.roles || [],
      status: user.status,
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            email: user.profile.email,
            phoneNumber: user.profile.phoneNumber,
            avatarAccessUrl: avatarFileId
              ? avatarAccessUrlMap?.get(avatarFileId.toString())
              : undefined,
            bio: user.profile.bio,
          }
        : undefined,
      preferences: user.preferences
        ? {
            language: user.preferences.language,
            timezone: user.preferences.timezone,
            notificationsEnabled: user.preferences.notificationsEnabled ?? true,
            theme: user.preferences.theme,
          }
        : undefined,
    };
  }

  private addListContainsFilter(
    query: FilterQuery<User>,
    path: string,
    value?: string,
  ): void {
    if (value?.trim()) {
      query[path] = this.createContainsRegex(value);
    }
  }

  private addListOrFilter(
    query: FilterQuery<User>,
    conditions: FilterQuery<User>[],
  ): void {
    query.$and = [
      ...(Array.isArray(query.$and) ? query.$and : []),
      { $or: conditions },
    ];
  }

  private addListDateRangeFilter(
    query: FilterQuery<User>,
    path: string,
    from?: string,
    to?: string,
  ): void {
    const range: Record<string, Date> = {};
    const fromDate = this.parseListFilterDate(from, false);
    const toDate = this.parseListFilterDate(to, true);

    if (fromDate) {
      range.$gte = fromDate;
    }

    if (toDate) {
      range.$lte = toDate;
    }

    if (Object.keys(range).length > 0) {
      query[path] = range;
    }
  }

  private parseListFilterDate(
    value: string | undefined,
    endOfDay: boolean,
  ): Date | undefined {
    if (!value?.trim()) {
      return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      date.setHours(23, 59, 59, 999);
    }

    return date;
  }

  private createContainsRegex(value: string): {
    $regex: string;
    $options: "i";
  } {
    return {
      $regex: this.escapeRegex(value),
      $options: "i",
    };
  }

  private escapeRegex(value: string): string {
    return value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
