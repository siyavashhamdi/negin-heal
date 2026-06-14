import { JwtModule } from "@nestjs/jwt";
import { Module, forwardRef } from "@nestjs/common";

import { UserService } from "./user.service";
import { UserSecurityService } from "./user.security.service";
import { AuthModule } from "../auth";
import { DatabaseModule } from "../database";
import { EmailModule } from "../email";
import { SecurityConfig } from "../../config/security.config";
import { env } from "../../config";
import {
  UserLoginMutation,
  UserLogoutMutation,
  UserCreateMutation,
  UserRequestLoginCodeMutation,
  UserRequestSignupCodeMutation,
  UserResolveAuthIdentityMutation,
  UserSignupMutation,
  UserSendSampleEmailMutation,
  UserUpdateMutation,
  UserVerifyLoginCodeMutation,
} from "./graphql/mutations";
import * as UserQueries from "./graphql/queries";

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    forwardRef(() => AuthModule),
    JwtModule.register({
      secret: SecurityConfig.validateJwtSecret(),
      signOptions: {
        // @ts-expect-error - StringValue accepts string values like "24h"
        expiresIn: env.JWT_EXPIRES_IN || "24h",
      },
    }),
  ],
  providers: [
    UserService,
    UserSecurityService,
    UserLoginMutation,
    UserLogoutMutation,
    UserCreateMutation,
    UserRequestLoginCodeMutation,
    UserRequestSignupCodeMutation,
    UserResolveAuthIdentityMutation,
    UserSignupMutation,
    UserSendSampleEmailMutation,
    UserUpdateMutation,
    UserVerifyLoginCodeMutation,
    UserQueries.UserMeQuery,
    UserQueries.UserListQuery,
  ],
  exports: [UserService],
})
export class UserModule {}
