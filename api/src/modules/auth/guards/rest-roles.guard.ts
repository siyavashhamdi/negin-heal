import { Reflector } from "@nestjs/core";
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";

import { ROLES_KEY } from "../decorators/roles.decorator";
import { EXCEPTION_CONSTANT } from "../../../constants/exception.constant";

@Injectable()
export class RestRolesGuard implements CanActivate {
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

    // Get user from HTTP request (set by auth guard)
    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user) {
      throw new UnauthorizedException(EXCEPTION_CONSTANT.UNAUTHENTICATED);
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
