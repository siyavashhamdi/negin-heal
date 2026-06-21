import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Module, forwardRef } from "@nestjs/common";

import { env } from "../../config";
import { UserModule } from "../user";
import { GqlAuthGuard } from "./auth.guard";
import { OptionalGqlAuthGuard } from "./optional-auth.guard";
import { DatabaseModule } from "../database";
import { JwtStrategy } from "./jwt.strategy";
import { RolesGuard } from "./guards/roles.guard";
import { SessionService } from "./session.service";
import { RestAuthGuard } from "./guards/rest-auth.guard";
import { RestRolesGuard } from "./guards/rest-roles.guard";
import { RateLimitGuard } from "./guards/rate-limit.guard";
import { SecurityConfig } from "../../config/security.config";

@Module({
  imports: [
    forwardRef(() => UserModule),
    DatabaseModule,
    PassportModule,
    JwtModule.register({
      secret: SecurityConfig.validateJwtSecret(),
      signOptions: {
        // @ts-expect-error - StringValue accepts string values like "60d"
        expiresIn: env.JWT_EXPIRES_IN || "60d",
      },
    }),
  ],
  providers: [
    SessionService,
    JwtStrategy,
    GqlAuthGuard,
    OptionalGqlAuthGuard,
    RestAuthGuard,
    RolesGuard,
    RestRolesGuard,
    RateLimitGuard,
  ],
  exports: [
    SessionService,
    JwtModule,
    GqlAuthGuard,
    OptionalGqlAuthGuard,
    RestAuthGuard,
    RolesGuard,
    RestRolesGuard,
    RateLimitGuard,
  ],
})
export class AuthModule {}
