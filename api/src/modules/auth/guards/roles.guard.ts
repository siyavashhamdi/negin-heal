import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";

import { ROLES_KEY } from "../decorators/roles.decorator";
import { EXCEPTION_CONSTANT } from "../../../constants/exception.constant";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      // No roles specified - allow access
      return true;
    }

    // Get user from GraphQL context
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req?.user;

    if (!user) {
      throw new ForbiddenException(EXCEPTION_CONSTANT.UNAUTHENTICATED);
    }

    // Check if user has ANY of the required roles (OR logic)
    const hasRole = requiredRoles.some(
      (role) => user.roles?.includes(role) || false,
    );

    if (!hasRole) {
      throw new ForbiddenException(EXCEPTION_CONSTANT.FORBIDDEN);
    }

    return true;
  }
}
