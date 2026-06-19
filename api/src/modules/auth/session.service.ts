import { Model, Types } from "mongoose";

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { SessionStatus } from "../../enums";
import { Session, SessionDocument } from "../../database/schemas";
import { SessionClientContext } from "../../database/schemas/session-client-context.schema";

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async createSession(
    userId: Types.ObjectId,
    expiresAt: Date,
    clientContext?: SessionClientContext,
  ): Promise<SessionDocument> {
    const session = new this.sessionModel({
      userId,
      expiresAt,
      clientContext,
      status: SessionStatus.ACTIVE,
      lastActivityAt: new Date(),
    });

    return session.save();
  }

  /**
   * Find session by ID (session._id used as jti in JWT)
   */
  async findSessionById(sessionId: string): Promise<SessionDocument> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(sessionId)) {
      return null;
    }

    return this.sessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      status: SessionStatus.ACTIVE,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });
  }

  /**
   * Mark a specific session as logged out.
   */
  async logoutSession(sessionId: string): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return;
    }

    await this.sessionModel.updateOne(
      {
        _id: new Types.ObjectId(sessionId),
        status: SessionStatus.ACTIVE,
      },
      {
        status: SessionStatus.LOGGED_OUT,
        revokedAt: new Date(),
      },
    );
  }

  /**
   * Revoke all sessions for a user (password change or security action)
   */
  async revokeAllUserSessions(userId: Types.ObjectId): Promise<number> {
    const result = await this.sessionModel.updateMany(
      {
        userId,
        status: SessionStatus.ACTIVE,
        revokedAt: { $exists: false },
      },
      {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
      },
    );

    return result.modifiedCount;
  }

  /**
   * Revoke all sessions except the current one (login from new device)
   */
  async revokeAllSessionsExcept(
    userId: Types.ObjectId,
    currentSessionId: string,
  ): Promise<number> {
    if (!Types.ObjectId.isValid(currentSessionId)) {
      return 0;
    }

    const result = await this.sessionModel.updateMany(
      {
        userId,
        _id: { $ne: new Types.ObjectId(currentSessionId) },
        status: SessionStatus.ACTIVE,
        revokedAt: { $exists: false },
      },
      {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
      },
    );

    return result.modifiedCount;
  }

  /**
   * Update last activity timestamp for a session
   */
  async updateLastActivity(sessionId: string): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return;
    }

    await this.sessionModel.updateOne(
      { _id: new Types.ObjectId(sessionId) },
      { lastActivityAt: new Date() },
    );
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: Types.ObjectId): Promise<SessionDocument[]> {
    return this.sessionModel.find({
      userId,
      status: SessionStatus.ACTIVE,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });
  }

  /**
   * Clean up expired sessions (called by cron job or migration)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    return result.deletedCount || 0;
  }
}
