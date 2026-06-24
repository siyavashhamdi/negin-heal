import { Model } from "mongoose";

import { InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { User, UserDocument } from "../../database/schemas";
import { EXCEPTION_CONSTANT } from "../../constants/exception.constant";
import { PasswordValidator, UsernameValidator } from "@/utils";

@Injectable()
export class UserSecurityService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async throwIfUserDoesNotExist(username: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ username: username.trim() });
    if (!user) {
      throw new NotFoundException({
        key: EXCEPTION_CONSTANT.USER_NOT_FOUND,
        params: { username },
      });
    }

    return user;
  }

  throwIfAccountIsLocked(user: UserDocument) {
    if (
      user.authentication?.lockedUntil &&
      user.authentication.lockedUntil > new Date()
    ) {
      throw new BadRequestException(EXCEPTION_CONSTANT.ACCOUNT_LOCKED);
    }
  }

  async throwIfPasswordPolicyIsViolated(password: string) {
    const passwordValidation = PasswordValidator.validate(password);
    if (!passwordValidation.valid) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.PASSWORD_POLICY_VIOLATION,
      );
    }

    return passwordValidation;
  }

  throwIfUsernameLengthIsInvalid(username: string): void {
    const usernameValidation = UsernameValidator.validate(username);
    if (!usernameValidation.valid) {
      throw new BadRequestException(EXCEPTION_CONSTANT.USERNAME_MIN_LENGTH);
    }
  }
}
