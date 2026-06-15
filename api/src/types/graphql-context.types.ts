import { Types } from "mongoose";
import { Request } from "express";

import { UserRole } from "../enums";

/**
 * User information attached to request by JWT strategy
 */
export interface AuthenticatedUser {
  userId: Types.ObjectId;
  username: string;
  roles: UserRole[];
  sessionId: string;
}

/**
 * Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  subscriptionConnectionId?: string;
}

/**
 * GraphQL Context structure
 */
export interface GraphQLContext {
  req: AuthenticatedRequest;
  user?: AuthenticatedUser;
}
