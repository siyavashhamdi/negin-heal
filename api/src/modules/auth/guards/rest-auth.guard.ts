import { AuthGuard } from "@nestjs/passport";
import { ExecutionContext, Injectable } from "@nestjs/common";

/**
 * JWT Authentication Guard for REST APIs
 * Extracts token from Authorization header and validates it
 */
@Injectable()
export class RestAuthGuard extends AuthGuard("jwt") {
  getRequest(context: ExecutionContext) {
    // For REST APIs, the request is directly in the context
    return context.switchToHttp().getRequest();
  }
}
