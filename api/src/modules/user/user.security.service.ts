import { Model } from "mongoose";

import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";

import { User, UserDocument } from "../../database/schemas";
import {
  UserNotFoundException,
  AccountLockedException,
  PasswordPolicyViolationException,
} from "../../exceptions";
import { PasswordValidator } from "@/utils";

@Injectable()
export class UserSecurityService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async throwIfUserDoesNotExist(username: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ username: username.trim() });
    if (!user) {
      throw new UserNotFoundException({ username });
    }

    return user;
  }

  throwIfAccountIsLocked(user: UserDocument) {
    if (
      user.authentication?.lockedUntil &&
      user.authentication.lockedUntil > new Date()
    ) {
      throw new AccountLockedException();
    }
  }

  async throwIfPasswordPolicyIsViolated(password: string) {
    const passwordValidation = PasswordValidator.validate(password);
    if (!passwordValidation.valid) {
      throw new PasswordPolicyViolationException();
    }

    return passwordValidation;
  }
}
