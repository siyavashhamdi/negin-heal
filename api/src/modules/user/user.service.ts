import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { FilterQuery, Model, Types } from "mongoose";

import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  forwardRef,
  ConflictException,
} from "@nestjs/common";

import {
  UserLoginGqlResponse,
  UserResolveAuthIdentityGqlResponse,
  UserRequestLoginCodeGqlResponse,
  UserSignupGqlInput,
  UserVerifyLoginCodeGqlResponse,
} from "./graphql";
import {
  AppSettingValueType,
  GeneralSubscriptionUpdateType,
  UserRole,
  UserStatus,
} from "../../enums";
import { SessionService } from "../auth/session.service";
import { SessionClientContext } from "../../database/schemas/session-client-context.schema";
import { EmailService } from "../email";
import { AppSettingsService } from "../app-settings";
import { FileService, FileAccessUrlDescriptor } from "../file/file.service";
import { resolveAvatarAccessUrl } from "../file/file-access-url.util";
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
  APP_SETTING_KEY,
  LOGIN_CAPTCHA_FAILED_ATTEMPTS_THRESHOLD,
} from "../../constants";
import {
  DUPLICATE_IDENTITY_KEY_BY_FIELD,
  EXCEPTION_CONSTANT,
  type DuplicateIdentityField,
} from "../../constants/exception.constant";
import { EMAIL_SEND_COOLDOWN_MS } from "../../constants/email.constant";
import { buildVerificationStatusSubscriptionPayload } from "../../constants/verification-status-subscription.constant";
import { PAGINATION_CONSTANT } from "../../constants/pagination.constant";
import { SortingOrder } from "../../common/pagination/input";
import { buildSortOptions } from "../../common/pagination/utils";
import { env } from "../../config";
import { USER_FACING_SUCCESS } from "../../constants/user-facing-success.constant";
import { MongodbErrorUtil } from "../../utils/mongodb-error.util";
import {
  isValidEmail,
  isValidMobilePhone,
  normalizeAuthIdentityForSubmit,
  normalizeAuthIdentityMobileForSubmit,
  resolveAuthIdentityLookup,
} from "../../utils/contact-validation.util";
import {
  sanitizeLatinEmail,
  sanitizeLatinUsername,
} from "../../utils/latin-identity.util";
import {
  UserCreateGqlInput,
  UserForgotPasswordGqlInput,
  UserListGqlInput,
  UserDetailGqlInput,
  UserListSortOptionInput,
  UserProfileUpdateGqlInput,
  UserResetPasswordGqlInput,
  UserUpdateGqlInput,
} from "./graphql/inputs";
import {
  UserListGqlResponse,
  UserListPaginatedOffsetGqlResponse,
  UserListSummaryGqlResponse,
  UserMutationGqlResponse,
  UserPasswordResetGqlResponse,
} from "./graphql/responses";
import { UserSubscriptionService } from "./user-subscription.service";

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
  private readonly logger = new Logger(UserService.name);
  private readonly SALT_ROUNDS = 10;
  private readonly LOGIN_CODE_TTL_MS = 5 * 60 * 1000;
  private readonly SIGNUP_CODE_TTL_MS = 5 * 60 * 1000;
  private readonly MAX_LOGIN_CODE_ATTEMPTS = 5;
  private readonly MAX_SIGNUP_CODE_ATTEMPTS = 5;
  private readonly MAX_PASSWORD_RESET_OTP_ATTEMPTS = 5;
  private readonly DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;
  private readonly ACCOUNT_ACTIVATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
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
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  async findActiveStaffUserIds(): Promise<string[]> {
    const staffUsers = await this.userModel
      .find({
        roles: { $in: [UserRole.SUPER_ADMIN] },
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
    clientContext?: SessionClientContext,
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
      throw new BadRequestException(EXCEPTION_CONSTANT.INVALID_CREDENTIALS);
    }

    return this.createLoginSession(user, rememberMe, clientContext);
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
      throw new BadRequestException(EXCEPTION_CONSTANT.CAPTCHA_REQUIRED);
    }

    const verificationStatus = this.userCaptchaService.verifyCaptcha(
      captchaId,
      captchaValue,
    );

    if (verificationStatus === CaptchaVerificationStatus.EXPIRED) {
      throw new BadRequestException(EXCEPTION_CONSTANT.CAPTCHA_EXPIRED);
    }

    if (verificationStatus === CaptchaVerificationStatus.INVALID) {
      throw new BadRequestException(EXCEPTION_CONSTANT.CAPTCHA_INVALID);
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

    const normalizedIdentity = normalizeAuthIdentityForSubmit(identity);

    const isProduction = process.env.NODE_ENV === "production";
    const message = USER_FACING_SUCCESS.LOGIN_CODE_SENT;

    if (!isProduction) {
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

    this.throwIfOutboundEmailCooldownActive(
      user.authentication.lastPasswordResetEmailSentAt,
    );

    const resetCode = this.generateLoginCode();
    const resetCodeHash = this.hashPasswordResetOtp(resetCode);
    const resetCodeTtlMinutes = await this.getPasswordResetTokenTtlMinutes();

    const sentAt = new Date();

    await this.userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          "authentication.passwordResetToken.hash": resetCodeHash,
          "authentication.passwordResetToken.createdAt": sentAt,
          "authentication.passwordResetToken.attempts": 0,
          "authentication.lastPasswordResetEmailSentAt": sentAt,
        },
      },
    );

    this.dispatchOutboundEmail(async () => {
      await this.emailService.sendPasswordResetEmail({
        to: recipientEmail,
        resetCode,
        expiresInMinutes: resetCodeTtlMinutes,
      });
    }, `password-reset:${recipientEmail}`);

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[auth] Password reset code for ${recipientEmail}: ${resetCode}`,
      );
    }

    return genericResponse;
  }

  async activateAccount(token: string): Promise<UserPasswordResetGqlResponse> {
    const normalizedToken = this.normalizeOptionalText(token);
    if (!normalizedToken) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.INVALID_ACCOUNT_ACTIVATION_TOKEN,
      );
    }

    const tokenHash = this.hashAccountActivationToken(normalizedToken);
    const oldestValidCreatedAt = new Date(
      Date.now() - this.ACCOUNT_ACTIVATION_TTL_MS,
    );

    const user = await this.userModel
      .findOne({
        "authentication.accountActivationToken.hash": tokenHash,
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      })
      .exec();

    if (!user?.authentication.accountActivationToken?.createdAt) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.INVALID_ACCOUNT_ACTIVATION_TOKEN,
      );
    }

    if (this.isEmailVerified(user)) {
      return {
        success: true,
        message: USER_FACING_SUCCESS.EMAIL_ALREADY_VERIFIED,
      };
    }

    const tokenCreatedAt = user.authentication.accountActivationToken.createdAt;
    if (tokenCreatedAt < oldestValidCreatedAt) {
      await this.clearAccountActivationToken(user._id);
      throw new BadRequestException(
        EXCEPTION_CONSTANT.INVALID_ACCOUNT_ACTIVATION_TOKEN,
      );
    }

    const verifiedAt = new Date();

    await this.userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          "verification.emailVerifiedAt": verifiedAt,
        },
        $unset: {
          "authentication.accountActivationToken": "",
          "authentication.emailActivatedAt": "",
          "verification.email": "",
        },
      },
    );

    await this.publishVerificationStatusUpdate(user._id, {
      emailVerifiedAt: verifiedAt,
      mobileVerifiedAt: this.resolveMobileVerifiedAt(user),
    });

    return {
      success: true,
      message: USER_FACING_SUCCESS.EMAIL_VERIFIED,
    };
  }

  async requestEmailVerification(
    userId: Types.ObjectId,
  ): Promise<UserPasswordResetGqlResponse> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(EXCEPTION_CONSTANT.USER_NOT_FOUND);
    }

    const recipientEmail = this.normalizeOptionalText(user.profile?.email);
    if (!recipientEmail || !this.looksLikeEmail(recipientEmail)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.EMAIL_REQUIRED);
    }

    if (this.isEmailVerified(user)) {
      return {
        success: true,
        message: USER_FACING_SUCCESS.EMAIL_ALREADY_VERIFIED,
      };
    }

    this.throwIfOutboundEmailCooldownActive(
      user.verification?.lastEmailVerificationSentAt,
    );

    const userFirstName =
      this.normalizeOptionalText(user.profile?.firstName) || "کاربر عزیز";

    const verificationToken = await this.issueAccountActivationToken(userId, {
      markVerificationEmailSent: true,
    });
    const verificationUrl = `${this.resolveAppBaseUrl()}/activate?token=${encodeURIComponent(verificationToken)}`;

    this.dispatchOutboundEmail(async () => {
      await this.emailService.sendVerifyEmail({
        to: recipientEmail,
        userFirstName,
        verificationUrl,
      });
    }, `verify-email:${recipientEmail}`);

    if (process.env.NODE_ENV !== "production") {
      console.log(`[auth] Verification email requested for ${recipientEmail}`);
    }

    return {
      success: true,
      message: USER_FACING_SUCCESS.VERIFICATION_EMAIL_SENT,
    };
  }

  resolveUserVerification(user: UserDocument): {
    emailVerifiedAt?: Date;
    mobileVerifiedAt?: Date;
  } {
    const emailVerifiedAt = this.resolveEmailVerifiedAt(user);
    const mobileVerifiedAt = this.resolveMobileVerifiedAt(user);

    return {
      ...(emailVerifiedAt ? { emailVerifiedAt } : {}),
      ...(mobileVerifiedAt ? { mobileVerifiedAt } : {}),
    };
  }

  private resolveEmailVerifiedAt(user: UserDocument): Date | undefined {
    if (user.verification?.emailVerifiedAt) {
      return user.verification.emailVerifiedAt;
    }

    const legacyActivatedAt = (
      user.authentication as { emailActivatedAt?: Date }
    ).emailActivatedAt;
    if (legacyActivatedAt) {
      return legacyActivatedAt;
    }

    const legacyEmailVerified = (
      user.verification as { email?: boolean } | undefined
    )?.email;
    if (legacyEmailVerified === true) {
      return user.audit?.updatedAt ?? user.audit?.createdAt;
    }

    return undefined;
  }

  private resolveMobileVerifiedAt(user: UserDocument): Date | undefined {
    if (user.verification?.mobileVerifiedAt) {
      return user.verification.mobileVerifiedAt;
    }

    const legacyMobileVerified = (
      user.verification as { mobile?: boolean } | undefined
    )?.mobile;
    if (legacyMobileVerified === true) {
      return user.audit?.updatedAt ?? user.audit?.createdAt;
    }

    return undefined;
  }

  private isEmailVerified(user: UserDocument): boolean {
    return Boolean(this.resolveEmailVerifiedAt(user));
  }

  private async publishVerificationStatusUpdate(
    userId: Types.ObjectId,
    verification: {
      emailVerifiedAt?: Date | null;
      mobileVerifiedAt?: Date | null;
    },
  ): Promise<void> {
    try {
      await this.userSubscriptionService.publishToUser({
        userId: userId.toString(),
        updateType: GeneralSubscriptionUpdateType.VERIFICATION_STATUS,
        payload: buildVerificationStatusSubscriptionPayload(verification),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to publish verification status update for user ${userId.toString()}: ${message}`,
      );
    }
  }

  async resetPassword(
    identity: UserResetPasswordGqlInput["identity"],
    otp: UserResetPasswordGqlInput["otp"],
    newPassword: UserResetPasswordGqlInput["newPassword"],
  ): Promise<UserPasswordResetGqlResponse> {
    const normalizedIdentity = this.normalizeOptionalText(identity);
    if (!normalizedIdentity) {
      throw new BadRequestException(EXCEPTION_CONSTANT.IDENTITY_REQUIRED);
    }

    const password = this.normalizeRequiredText(newPassword, "Password");
    await this.userSecurityService.throwIfPasswordPolicyIsViolated(password);

    const resetCode = otp.trim();
    if (!/^\d{6}$/.test(resetCode)) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.INVALID_PASSWORD_RESET_TOKEN,
      );
    }

    const resetCodeTtlMinutes = await this.getPasswordResetTokenTtlMinutes();
    const oldestValidCreatedAt = new Date(
      Date.now() - resetCodeTtlMinutes * 60 * 1000,
    );
    const resetCodeHash = this.hashPasswordResetOtp(resetCode);
    const tokenOwner = await this.userModel.findOne({
      ...this.buildIdentityFilter(normalizedIdentity),
      status: UserStatus.ACTIVE,
      $or: [
        { "audit.deletedAt": null },
        { "audit.deletedAt": { $exists: false } },
      ],
    });

    if (!tokenOwner?.authentication.passwordResetToken?.hash) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.INVALID_PASSWORD_RESET_TOKEN,
      );
    }

    const resetTokenCreatedAt =
      tokenOwner.authentication.passwordResetToken?.createdAt;
    if (!resetTokenCreatedAt || resetTokenCreatedAt < oldestValidCreatedAt) {
      await this.clearPasswordResetToken(tokenOwner._id);
      throw new BadRequestException(
        EXCEPTION_CONSTANT.EXPIRED_PASSWORD_RESET_TOKEN,
      );
    }

    if (tokenOwner.authentication.passwordResetToken.hash !== resetCodeHash) {
      await this.incrementPasswordResetOtpAttempts(tokenOwner._id);
      throw new BadRequestException(
        EXCEPTION_CONSTANT.INVALID_PASSWORD_RESET_TOKEN,
      );
    }

    const passwordSalt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, passwordSalt);
    const user = await this.userModel.findOneAndUpdate(
      {
        _id: tokenOwner._id,
        "authentication.passwordResetToken.hash": resetCodeHash,
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
      throw new BadRequestException(
        EXCEPTION_CONSTANT.INVALID_PASSWORD_RESET_TOKEN,
      );
    }

    await this.sessionService.revokeAllUserSessions(user._id);

    return {
      success: true,
      message: USER_FACING_SUCCESS.PASSWORD_RESET_SUCCESSFUL,
    };
  }

  async requestSignupCode(
    mobile: string,
  ): Promise<UserRequestLoginCodeGqlResponse> {
    const normalizedMobile = this.normalizePhoneNumber(mobile);

    if (!normalizedMobile) {
      throw new BadRequestException(EXCEPTION_CONSTANT.INVALID_MOBILE);
    }

    await this.assertIdentityFieldsAreUnique({ mobile: normalizedMobile });

    const code = this.generateLoginCode();
    this.signupCodesByMobile.set(normalizedMobile, {
      code,
      attempts: 0,
      expiresAt: new Date(Date.now() + this.SIGNUP_CODE_TTL_MS),
    });

    const isProduction = process.env.NODE_ENV === "production";
    const message = USER_FACING_SUCCESS.SIGNUP_CODE_SENT;

    if (!isProduction) {
      // TODO: replace this with the SMS provider integration.
      console.log(`[auth] Signup code for ${normalizedMobile}: ${code}`);
    }

    return {
      success: true,
      message,
    };
  }

  async signup(
    input: UserSignupGqlInput,
    clientContext?: SessionClientContext,
  ): Promise<UserLoginGqlResponse> {
    if (env.CAPTCHA_ENABLED) {
      this.throwIfCaptchaIsInvalid(input.captchaId, input.captchaValue);
    }

    const username = input.username?.trim()
      ? sanitizeLatinUsername(input.username).toLowerCase()
      : undefined;
    const email = input.email?.trim()
      ? sanitizeLatinEmail(input.email).toLowerCase()
      : undefined;
    const mobile = input.mobile?.trim()
      ? normalizeAuthIdentityMobileForSubmit(input.mobile)
      : undefined;

    if (!username && !email && !mobile) {
      throw new BadRequestException(EXCEPTION_CONSTANT.IDENTITY_REQUIRED);
    }

    if (email && !isValidEmail(email)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.INVALID_EMAIL);
    }

    if (input.mobile?.trim() && !mobile) {
      throw new BadRequestException(EXCEPTION_CONSTANT.INVALID_MOBILE);
    }

    if (input.username?.trim()) {
      this.userSecurityService.throwIfUsernameLengthIsInvalid(input.username);
    }

    const password = input.password?.trim();
    const signupCode = input.signupCode?.trim();

    if (!password && !signupCode) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.SIGNUP_CREDENTIAL_REQUIRED,
      );
    }

    if (signupCode) {
      if (!mobile) {
        throw new BadRequestException(
          EXCEPTION_CONSTANT.SIGNUP_CREDENTIAL_REQUIRED,
        );
      }

      this.verifyPendingSignupCode(mobile, signupCode);
    }

    if (password) {
      await this.userSecurityService.throwIfPasswordPolicyIsViolated(password);
    }

    await this.assertIdentityFieldsAreUnique({ username, email, mobile });

    const finalUsername = await this.resolveSignupUsername(
      username,
      email,
      mobile,
    );
    await this.assertUsernameIsUnique(finalUsername);
    const finalPassword = password || randomBytes(24).toString("base64url");
    const passwordSalt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(finalPassword, passwordSalt);

    const profile: Record<string, string> = {
      firstName: input.profile.firstName.trim(),
    };

    const lastName = this.normalizeOptionalText(input.profile.lastName);
    if (lastName) {
      profile.lastName = lastName;
    }

    if (email) {
      profile.email = email;
    }

    if (mobile) {
      profile.phoneNumber = mobile;
    }

    let createdUser: UserDocument;
    try {
      [createdUser] = await this.userModel.create([
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
    } catch (error) {
      this.rethrowIfDuplicateIdentityKey(error);
    }

    if (mobile) {
      this.signupCodesByMobile.delete(mobile);
    }

    this.dispatchWelcomeEmailIfPossible(createdUser._id, profile);

    return this.createLoginSession(
      createdUser,
      input.rememberMe === true,
      clientContext,
    );
  }

  async verifyLoginCode(
    identity: string,
    code: string,
    rememberMe: boolean = false,
    clientContext?: SessionClientContext,
  ): Promise<UserVerifyLoginCodeGqlResponse> {
    const user = await this.findByIdentityOrThrow(identity);
    this.userSecurityService.throwIfAccountIsLocked(user);

    const loginCodeKey = this.toLoginCodeKey(user._id);
    const pendingCode = this.loginCodesByUserId.get(loginCodeKey);

    if (!pendingCode || pendingCode.expiresAt.getTime() < Date.now()) {
      this.loginCodesByUserId.delete(loginCodeKey);
      throw new BadRequestException(EXCEPTION_CONSTANT.INVALID_CREDENTIALS);
    }

    if (pendingCode.code !== code.trim()) {
      pendingCode.attempts += 1;
      if (pendingCode.attempts >= this.MAX_LOGIN_CODE_ATTEMPTS) {
        this.loginCodesByUserId.delete(loginCodeKey);
      }
      throw new BadRequestException(EXCEPTION_CONSTANT.INVALID_CREDENTIALS);
    }

    this.loginCodesByUserId.delete(loginCodeKey);

    const loginResult = await this.createLoginSession(
      user,
      rememberMe,
      clientContext,
    );

    return {
      success: true,
      message: USER_FACING_SUCCESS.LOGIN_SUCCESSFUL,
      userId: user._id,
      accessToken: loginResult.accessToken,
    };
  }

  private async createLoginSession(
    user: UserDocument,
    rememberMe: boolean = false,
    clientContext?: SessionClientContext,
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
    // If rememberMe is true, use 30 days, otherwise use default (60d / 2 months)
    const expiresIn = rememberMe
      ? process.env.JWT_REMEMBER_ME_EXPIRES_IN || "30d"
      : process.env.JWT_EXPIRES_IN || "60d";
    const expiresInSeconds = this.parseExpiresIn(expiresIn);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Create session in database first to get session._id
    const session = await this.sessionService.createSession(
      user._id,
      expiresAt,
      clientContext,
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
      throw new BadRequestException(EXCEPTION_CONSTANT.INVALID_CREDENTIALS);
    }

    return user;
  }

  private buildIdentityFilter(identity: string): FilterQuery<User> {
    const lookup = resolveAuthIdentityLookup(
      normalizeAuthIdentityForSubmit(identity),
    );

    return {
      [lookup.field]: lookup.value,
    };
  }

  private buildPasswordResetIdentityFilter(
    input: UserForgotPasswordGqlInput,
  ): FilterQuery<User> {
    const identity = this.normalizeOptionalText(input.identity);
    if (!identity) {
      throw new BadRequestException(EXCEPTION_CONSTANT.IDENTITY_REQUIRED);
    }

    return this.buildIdentityFilter(identity);
  }

  private buildPasswordResetRequestedResponse(): UserPasswordResetGqlResponse {
    return {
      success: true,
      message: USER_FACING_SUCCESS.PASSWORD_RESET_REQUESTED,
    };
  }

  private async clearPasswordResetToken(userId: Types.ObjectId): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          "authentication.passwordResetToken.hash": null,
          "authentication.passwordResetToken.attempts": 0,
        },
      },
    );
  }

  private async incrementPasswordResetOtpAttempts(
    userId: Types.ObjectId,
  ): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user?.authentication.passwordResetToken?.hash) {
      return;
    }

    const nextAttempts =
      (user.authentication.passwordResetToken.attempts || 0) + 1;

    if (nextAttempts >= this.MAX_PASSWORD_RESET_OTP_ATTEMPTS) {
      await this.clearPasswordResetToken(userId);
      return;
    }

    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          "authentication.passwordResetToken.attempts": nextAttempts,
        },
      },
    );
  }

  private hashPasswordResetOtp(code: string): string {
    return createHash("sha256").update(code.trim()).digest("hex");
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

  private async assertUsernameIsUnique(
    username: string,
    excludeUserId?: Types.ObjectId,
  ): Promise<void> {
    const normalizedUsername = this.normalizeUsernameOrEmail(username);
    const duplicateExists = await this.userModel.exists({
      username: normalizedUsername,
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    });

    if (duplicateExists) {
      throw new ConflictException(DUPLICATE_IDENTITY_KEY_BY_FIELD.username);
    }
  }

  private async assertEmailIsUnique(
    email: string,
    excludeUserId?: Types.ObjectId,
  ): Promise<void> {
    const normalizedEmail = this.normalizeUsernameOrEmail(email);
    const duplicateExists = await this.userModel.exists({
      "profile.email": normalizedEmail,
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    });

    if (duplicateExists) {
      throw new ConflictException(DUPLICATE_IDENTITY_KEY_BY_FIELD.email);
    }
  }

  private async assertMobileIsUnique(
    mobile: string,
    excludeUserId?: Types.ObjectId,
  ): Promise<void> {
    const normalizedMobile = this.normalizePhoneNumber(mobile);
    if (!normalizedMobile) {
      return;
    }

    const duplicateExists = await this.userModel.exists({
      "profile.phoneNumber": normalizedMobile,
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    });

    if (duplicateExists) {
      throw new ConflictException(DUPLICATE_IDENTITY_KEY_BY_FIELD.mobile);
    }
  }

  private async assertIdentityFieldsAreUnique(identity: {
    username?: string;
    email?: string;
    mobile?: string;
  }): Promise<void> {
    const hasAnyIdentity = Boolean(
      identity.username?.trim() ||
      identity.email?.trim() ||
      identity.mobile?.trim(),
    );

    if (!hasAnyIdentity) {
      throw new BadRequestException(EXCEPTION_CONSTANT.IDENTITY_REQUIRED);
    }

    if (identity.username?.trim()) {
      await this.assertUsernameIsUnique(identity.username);
    }

    if (identity.email?.trim()) {
      await this.assertEmailIsUnique(identity.email);
    }

    if (identity.mobile?.trim()) {
      await this.assertMobileIsUnique(identity.mobile);
    }
  }

  private async assertUpdateIdentityFieldsAreUnique(
    input: UserUpdateGqlInput,
  ): Promise<void> {
    if (this.hasOwnInputField(input, "username")) {
      const username = this.normalizeOptionalText(input.username);
      if (username) {
        await this.assertUsernameIsUnique(username, input.id);
      }
    }

    if (input.profile && this.hasOwnInputField(input.profile, "email")) {
      const email = this.normalizeOptionalText(input.profile.email);
      if (email) {
        await this.assertEmailIsUnique(email, input.id);
      }
    }

    if (input.profile && this.hasOwnInputField(input.profile, "phoneNumber")) {
      const phoneNumber = input.profile.phoneNumber
        ? this.normalizePhoneNumber(input.profile.phoneNumber)
        : undefined;
      if (phoneNumber) {
        await this.assertMobileIsUnique(phoneNumber, input.id);
      }
    }
  }

  private rethrowIfDuplicateIdentityKey(error: unknown): never {
    if (MongodbErrorUtil.isDuplicateKeyError(error)) {
      const field = this.resolveDuplicateIdentityField(error);
      throw new ConflictException(
        field
          ? DUPLICATE_IDENTITY_KEY_BY_FIELD[field]
          : EXCEPTION_CONSTANT.IDENTITY_ALREADY_EXISTS,
      );
    }

    throw error;
  }

  private resolveDuplicateIdentityField(
    error: unknown,
  ): DuplicateIdentityField | undefined {
    if (!error || typeof error !== "object" || !("keyPattern" in error)) {
      return undefined;
    }

    const keyPattern = (error as { keyPattern?: Record<string, unknown> })
      .keyPattern;
    if (!keyPattern) {
      return undefined;
    }

    if ("username" in keyPattern) {
      return "username";
    }

    if ("profile.email" in keyPattern) {
      return "email";
    }

    if ("profile.phoneNumber" in keyPattern) {
      return "mobile";
    }

    return undefined;
  }

  private normalizeUsernameOrEmail(value: string): string {
    const trimmed = value.trim();
    if (trimmed.includes("@")) {
      return sanitizeLatinEmail(trimmed).toLowerCase();
    }
    return sanitizeLatinUsername(trimmed).toLowerCase();
  }

  private looksLikeEmail(value?: string): boolean {
    if (!value) {
      return false;
    }
    return isValidEmail(value);
  }

  private throwIfOutboundEmailCooldownActive(lastSentAt?: Date): void {
    if (!lastSentAt) {
      return;
    }

    const elapsedMs = Date.now() - lastSentAt.getTime();
    if (elapsedMs < EMAIL_SEND_COOLDOWN_MS) {
      throw new BadRequestException(EXCEPTION_CONSTANT.EMAIL_SEND_COOLDOWN);
    }
  }

  /**
   * Dispatches outbound email without blocking the API handler.
   * Delivery failures are logged only and must not affect the HTTP/GraphQL response.
   */
  private dispatchOutboundEmail(
    task: () => Promise<void>,
    context: string,
  ): void {
    void task().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Outbound email failed (${context}): ${message}`);
    });
  }

  private dispatchWelcomeEmailIfPossible(
    userId: Types.ObjectId,
    profile: {
      email?: string;
      firstName?: string;
    },
  ): void {
    this.dispatchOutboundEmail(
      async () => {
        const recipientEmail = this.normalizeOptionalText(profile.email);
        if (!recipientEmail || !this.looksLikeEmail(recipientEmail)) {
          return;
        }

        const userFirstName =
          this.normalizeOptionalText(profile.firstName) || "کاربر عزیز";

        const verificationToken =
          await this.issueAccountActivationToken(userId);
        const activationUrl = `${this.resolveAppBaseUrl()}/activate?token=${encodeURIComponent(verificationToken)}`;

        await this.emailService.sendWelcomeEmail({
          to: recipientEmail,
          userFirstName,
          activationUrl,
        });
      },
      `welcome:${profile.email ?? userId.toString()}`,
    );
  }

  private async issueAccountActivationToken(
    userId: Types.ObjectId,
    options?: { markVerificationEmailSent?: boolean },
  ): Promise<string> {
    const token = randomBytes(32).toString("base64url");
    const hash = this.hashAccountActivationToken(token);
    const sentAt = new Date();

    const $set: Record<string, unknown> = {
      "authentication.accountActivationToken.hash": hash,
      "authentication.accountActivationToken.createdAt": sentAt,
    };

    if (options?.markVerificationEmailSent) {
      $set["verification.lastEmailVerificationSentAt"] = sentAt;
    }

    await this.userModel.updateOne({ _id: userId }, { $set });

    return token;
  }

  private async clearAccountActivationToken(
    userId: Types.ObjectId,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $unset: {
          "authentication.accountActivationToken": "",
        },
      },
    );
  }

  private hashAccountActivationToken(token: string): string {
    return createHash("sha256").update(token.trim()).digest("hex");
  }

  private resolveAppBaseUrl(): string {
    const configuredUrl = env.APP_URL ?? env.BASE_URL;
    if (!configuredUrl?.trim()) {
      return "http://localhost:8080";
    }

    return configuredUrl.replace(/\/+$/, "");
  }

  private normalizePhoneNumber(value: string): string | undefined {
    return normalizeAuthIdentityMobileForSubmit(value);
  }

  private throwIfInvalidEmail(value: string | undefined): void {
    if (value && !isValidEmail(value)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.INVALID_EMAIL);
    }
  }

  private throwIfInvalidMobilePhone(value: string | undefined): void {
    if (value && !isValidMobilePhone(value)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.INVALID_MOBILE);
    }
  }

  private verifyPendingSignupCode(mobile: string, signupCode: string): void {
    const pendingCode = this.signupCodesByMobile.get(mobile);

    if (!pendingCode || pendingCode.expiresAt.getTime() < Date.now()) {
      this.signupCodesByMobile.delete(mobile);
      throw new BadRequestException(
        EXCEPTION_CONSTANT.INVALID_SIGNUP_VERIFICATION_CODE,
      );
    }

    if (pendingCode.code !== signupCode) {
      pendingCode.attempts += 1;
      if (pendingCode.attempts >= this.MAX_SIGNUP_CODE_ATTEMPTS) {
        this.signupCodesByMobile.delete(mobile);
      }
      throw new BadRequestException(
        EXCEPTION_CONSTANT.INVALID_SIGNUP_VERIFICATION_CODE,
      );
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
    await this.sessionService.logoutSession(sessionId);
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
      return 60 * 24 * 60 * 60; // Default to 60 days (2 months)
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
        return 60 * 24 * 60 * 60;
    }
  }

  async validateUser(payload: JwtPayload) {
    if (!payload.jti) {
      return null;
    }

    // First, find the session by ID (jti is session._id)
    const session = await this.sessionService.findSessionById(payload.jti);

    if (!session) {
      // Session not found, expired, logged out, or revoked
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
    this.userSecurityService.throwIfUsernameLengthIsInvalid(username);
    const password = this.normalizeRequiredText(input.password, "Password");
    await this.userSecurityService.throwIfPasswordPolicyIsViolated(password);

    const profile = await this.buildUserCreateProfile(input.profile);
    const email = profile.email;
    const mobile = profile.phoneNumber;

    await this.assertIdentityFieldsAreUnique({
      username,
      email,
      mobile,
    });

    const passwordSalt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, passwordSalt);
    let createdUser: UserDocument;
    try {
      [createdUser] = await this.userModel.create([
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
    } catch (error) {
      this.rethrowIfDuplicateIdentityKey(error);
    }

    this.dispatchWelcomeEmailIfPossible(
      createdUser._id,
      createdUser.profile ?? {},
    );

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
      throw new NotFoundException(EXCEPTION_CONSTANT.USER_NOT_FOUND);
    }

    await this.assertUpdateIdentityFieldsAreUnique(input);

    const { passwordChanged, shouldRevokeSessions, update, verificationReset } =
      await this.buildUserUpdate(input, existingUser);

    if (!update.$set && !update.$unset) {
      return this.toUserMutationResponse(
        existingUser.toObject() as UserListRecord,
      );
    }

    let updatedUser: UserListRecord | null;
    try {
      updatedUser = await this.userModel
        .findByIdAndUpdate(input.id, update, {
          new: true,
          runValidators: true,
        })
        .lean<UserListRecord>()
        .exec();
    } catch (error) {
      this.rethrowIfDuplicateIdentityKey(error);
    }

    if (!updatedUser) {
      throw new NotFoundException(EXCEPTION_CONSTANT.USER_NOT_FOUND);
    }

    if (passwordChanged || shouldRevokeSessions) {
      await this.sessionService.revokeAllUserSessions(input.id);
    }

    if (
      verificationReset.emailVerificationCleared ||
      verificationReset.mobileVerificationCleared
    ) {
      const userDoc = updatedUser as UserDocument;
      await this.publishVerificationStatusUpdate(input.id, {
        emailVerifiedAt: this.resolveEmailVerifiedAt(userDoc) ?? null,
        mobileVerifiedAt: this.resolveMobileVerifiedAt(userDoc) ?? null,
      });
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
      throw new NotFoundException(EXCEPTION_CONSTANT.USER_NOT_FOUND);
    }

    if (updatesEmail && this.normalizeOptionalText(user.profile?.email)) {
      throw new BadRequestException(EXCEPTION_CONSTANT.EMAIL_ALREADY_SET);
    }

    if (
      updatesPhoneNumber &&
      this.normalizeOptionalText(user.profile?.phoneNumber)
    ) {
      throw new BadRequestException(EXCEPTION_CONSTANT.PHONE_ALREADY_SET);
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
      throw new NotFoundException(EXCEPTION_CONSTANT.USER_NOT_FOUND);
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      normalizedCurrentPassword,
      user.authentication.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException(EXCEPTION_CONSTANT.INVALID_CREDENTIALS);
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
        this.toUserListSummaryResponse(user, avatarAccessUrlMap),
      ),
      pagination: {
        limit,
        skip,
        total,
        count: users.length,
      },
    };
  }

  async detail(input: UserDetailGqlInput): Promise<UserListGqlResponse> {
    const user = await this.userModel
      .findOne({
        _id: input.id,
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      })
      .lean<UserListRecord>()
      .exec();

    if (!user) {
      throw new NotFoundException(EXCEPTION_CONSTANT.USER_NOT_FOUND);
    }

    const avatarAccessUrlMap = await this.fileService.getAccessUrlMap([
      user.profile?.avatarFileId,
    ]);

    return this.toUserListResponse(user, avatarAccessUrlMap);
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
        this.buildFullNameSearchCondition(filters.query),
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
      query.roles = { $eq: [filters.role] };
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
      this.throwIfInvalidEmail(email);
      normalizedProfile.email = this.normalizeUsernameOrEmail(email);
    }

    const phoneNumberRaw = this.normalizeOptionalText(profile.phoneNumber);
    if (phoneNumberRaw) {
      this.throwIfInvalidMobilePhone(phoneNumberRaw);
      const phoneNumber = this.normalizePhoneNumber(phoneNumberRaw);
      if (phoneNumber) {
        normalizedProfile.phoneNumber = phoneNumber;
      }
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
    verificationReset: {
      emailVerificationCleared: boolean;
      mobileVerificationCleared: boolean;
    };
    update: UserUpdateOperation;
  }> {
    const set: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};
    let passwordChanged = false;
    const verificationReset = {
      emailVerificationCleared: false,
      mobileVerificationCleared: false,
    };

    if (this.hasOwnInputField(input, "username")) {
      const username = this.normalizeRequiredText(input.username, "Username");
      this.userSecurityService.throwIfUsernameLengthIsInvalid(username);
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
      Object.assign(
        verificationReset,
        this.applyVerificationResetOnContactChange(input, existingUser, unset),
      );
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
      verificationReset,
      update,
    };
  }

  private applyVerificationResetOnContactChange(
    input: UserUpdateGqlInput,
    existingUser: UserDocument,
    unset: Record<string, 1>,
  ): {
    emailVerificationCleared: boolean;
    mobileVerificationCleared: boolean;
  } {
    const result = {
      emailVerificationCleared: false,
      mobileVerificationCleared: false,
    };

    if (!input.profile) {
      return result;
    }

    if (this.hasOwnInputField(input.profile, "email")) {
      const nextEmail = this.resolveProfileEmailValueForComparison(
        input.profile.email,
      );
      const currentEmail = this.normalizeOptionalText(
        existingUser.profile?.email,
      );

      if (nextEmail !== currentEmail) {
        unset["verification.emailVerifiedAt"] = 1;
        unset["authentication.accountActivationToken"] = 1;
        result.emailVerificationCleared = Boolean(
          existingUser.verification?.emailVerifiedAt,
        );
      }
    }

    if (this.hasOwnInputField(input.profile, "phoneNumber")) {
      const nextPhoneNumber = this.resolveProfilePhoneNumberValueForComparison(
        input.profile.phoneNumber,
      );
      const currentPhoneNumber = this.normalizeOptionalText(
        existingUser.profile?.phoneNumber,
      );

      if (nextPhoneNumber !== currentPhoneNumber) {
        unset["verification.mobileVerifiedAt"] = 1;
        result.mobileVerificationCleared = Boolean(
          existingUser.verification?.mobileVerifiedAt,
        );
      }
    }

    return result;
  }

  private resolveProfileEmailValueForComparison(
    rawValue: string | null | undefined,
  ): string | undefined {
    if (rawValue === null || rawValue === undefined) {
      return undefined;
    }

    if (typeof rawValue !== "string") {
      return undefined;
    }

    this.throwIfInvalidEmail(rawValue);
    return this.normalizeUsernameOrEmail(rawValue) || undefined;
  }

  private resolveProfilePhoneNumberValueForComparison(
    rawValue: string | null | undefined,
  ): string | undefined {
    if (rawValue === null || rawValue === undefined) {
      return undefined;
    }

    if (typeof rawValue !== "string") {
      return undefined;
    }

    this.throwIfInvalidMobilePhone(rawValue);
    return this.normalizePhoneNumber(rawValue);
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
      normalize: (value) => {
        this.throwIfInvalidEmail(value);
        return this.normalizeUsernameOrEmail(value);
      },
      set,
      unset,
    });
    this.applyNullableNormalizedTextUpdate(
      profile,
      "phoneNumber",
      "profile.phoneNumber",
      {
        normalize: (value) => {
          this.throwIfInvalidMobilePhone(value);
          return this.normalizePhoneNumber(value);
        },
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
      throw new NotFoundException(EXCEPTION_CONSTANT.AVATAR_FILE_NOT_FOUND);
    }

    if (!avatarFile.mimeType?.startsWith("image/")) {
      throw new BadRequestException(EXCEPTION_CONSTANT.AVATAR_MUST_BE_IMAGE);
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
      throw new BadRequestException({
        key: EXCEPTION_CONSTANT.VALIDATION_FAILED,
        params: { fieldName },
      });
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

  private toUserListSummaryResponse(
    user: UserListRecord,
    avatarAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
  ): UserListSummaryGqlResponse {
    const avatarAccessUrl = resolveAvatarAccessUrl(
      user.profile?.avatarFileId,
      avatarAccessUrlMap,
    );

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
            avatarAccessUrl,
            bio: user.profile.bio,
          }
        : undefined,
      createdAt: user.audit?.createdAt,
      updatedAt: user.audit?.updatedAt,
    };
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
    const avatarAccessUrl = resolveAvatarAccessUrl(
      user.profile?.avatarFileId,
      avatarAccessUrlMap,
    );

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
            avatarAccessUrl,
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

  private buildFullNameSearchCondition(searchText: string): FilterQuery<User> {
    return {
      $expr: {
        $regexMatch: {
          input: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$profile.firstName", ""] },
                  " ",
                  { $ifNull: ["$profile.lastName", ""] },
                ],
              },
            },
          },
          regex: this.escapeRegex(searchText),
          options: "i",
        },
      },
    };
  }

  private escapeRegex(value: string): string {
    return value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
