import { JwtModule } from "@nestjs/jwt";
import { Module, forwardRef } from "@nestjs/common";

import { UserService } from "./user.service";
import { UserSecurityService } from "./user.security.service";
import { UserCaptchaService } from "./user-captcha.service";
import { UserSubscriptionService } from "./user-subscription.service";
import { AuthModule } from "../auth";
import { AppSettingsModule } from "../app-settings";
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
  UserForgotPasswordMutation,
  UserSignupMutation,
  UserProfileUpdateMutation,
  UserResetPasswordMutation,
  UserSendSampleEmailMutation,
  UserUpdateMutation,
  UserVerifyLoginCodeMutation,
  GlobalAnouncementSendMutation,
} from "./graphql/mutations";
import * as UserQueries from "./graphql/queries";
import * as UserSubscriptions from "./graphql/subscriptions";

@Module({
  imports: [
    AppSettingsModule,
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
    UserCaptchaService,
    UserSubscriptionService,
    UserLoginMutation,
    UserLogoutMutation,
    UserCreateMutation,
    UserRequestLoginCodeMutation,
    UserRequestSignupCodeMutation,
    UserResolveAuthIdentityMutation,
    UserForgotPasswordMutation,
    UserSignupMutation,
    UserProfileUpdateMutation,
    UserResetPasswordMutation,
    UserSendSampleEmailMutation,
    UserUpdateMutation,
    UserVerifyLoginCodeMutation,
    GlobalAnouncementSendMutation,
    UserQueries.UserMeQuery,
    UserQueries.UserListQuery,
    UserQueries.UserLoginCaptchaQuery,
    UserSubscriptions.GeneralUpdatesSubscription,
  ],
  exports: [UserService, UserSubscriptionService],
})
export class UserModule {}
