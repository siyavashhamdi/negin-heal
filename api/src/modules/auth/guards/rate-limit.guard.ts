import { Reflector } from "@nestjs/core";
import { SetMetadata } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { AuthenticatedRequest } from "../../../types/graphql-context.types";

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitOptions {
  ttl: number; // Time window in seconds
  limit: number; // Max requests per window
}

export const RATE_LIMIT_KEY = "rateLimit";
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      // No rate limit specified - allow access
      return true;
    }

    // Support both GraphQL and REST contexts
    const request = this.getRequest(context);
    const identifier = this.getIdentifier(request);

    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    if (!record || now > record.resetAt) {
      // First request or window expired - reset
      rateLimitStore.set(identifier, {
        count: 1,
        resetAt: now + options.ttl * 1000,
      });
      return true;
    }

    if (record.count >= options.limit) {
      // Rate limit exceeded
      // TODO: Disabled temporarily
      // const remainingSeconds = Math.ceil((record.resetAt - now) / 1000);
      // throw new HttpException(
      //   `Too many requests. Please try again in ${remainingSeconds} seconds.`,
      //   HttpStatus.TOO_MANY_REQUESTS,
      // );
    }

    // Increment counter
    record.count++;
    return true;
  }

  private getRequest(
    context: ExecutionContext,
  ): AuthenticatedRequest | Request {
    // Try GraphQL context first
    try {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req;
    } catch {
      // Fall back to HTTP context for REST endpoints
      return context.switchToHttp().getRequest<Request>();
    }
  }

  private getIdentifier(request: AuthenticatedRequest | Request): string {
    // Use IP address + user ID (if authenticated) for identification
    const ip =
      request?.ip ||
      (request as { connection?: { remoteAddress?: string } }).connection
        ?.remoteAddress ||
      (request as { socket?: { remoteAddress?: string } }).socket
        ?.remoteAddress ||
      "unknown";
    const user = (request as AuthenticatedRequest).user;
    const userId = user?.userId || "";
    return `${ip}:${userId}`;
  }
}
