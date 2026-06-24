import { ExtractJwt, Strategy } from "passport-jwt";

import { PassportStrategy } from "@nestjs/passport";
import {
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from "@nestjs/common";

import { SecurityConfig } from "../../config";
import { EXCEPTION_CONSTANT } from "../../constants/exception.constant";
import { UserService, JwtPayload } from "../user/user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: SecurityConfig.validateJwtSecret(),
    });
  }

  /**
   * Validate JWT payload - extracts only jti (sessionId) from token,
   * then fetches user data from database via session
   */
  async validate(payload: JwtPayload) {
    // Payload only contains jti (sessionId)
    // validateUser fetches session, then user from database
    const user = await this.userService.validateUser(payload);

    if (!user) {
      throw new UnauthorizedException(EXCEPTION_CONSTANT.SESSION_EXPIRED);
    }

    // Return user data (fresh from database) to be attached to request
    return {
      userId: user._id,
      username: user.username,
      roles: user.roles || [],
      sessionId: payload.jti, // session._id used as jti for logout functionality
    };
  }
}
