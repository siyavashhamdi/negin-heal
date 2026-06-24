import { UseGuards, NotFoundException } from "@nestjs/common";
import { EXCEPTION_CONSTANT } from "../../../../constants/exception.constant";
import { Query, Resolver, Context } from "@nestjs/graphql";
import { Types } from "mongoose";

import { UserRole } from "../../../../enums";
import { UserService } from "../../user.service";
import { FileService } from "../../../file/file.service";
import { resolveAvatarAccessUrl } from "../../../file/file-access-url.util";
import { GraphQLContextUtil } from "../../../../utils";
import { UserDocument } from "../../../../database/schemas";
import { GqlAuthGuard } from "../../../auth";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { UserMeGqlResponse } from "../responses/user-me.gql.response";

@Resolver(() => UserMeGqlResponse)
@UseGuards(GqlAuthGuard)
export class UserMeQuery {
  constructor(
    private readonly userService: UserService,
    private readonly fileService: FileService,
  ) {}

  @Query(() => UserMeGqlResponse, {
    name: "me",
    description: "Get the currently authenticated user's information",
  })
  async me(@Context() context: GraphQLContext): Promise<UserMeGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);

    // Fetch full user data from database
    const userDoc = await this.userService.findById(user.userId);

    if (!userDoc) {
      throw new NotFoundException(EXCEPTION_CONSTANT.USER_NOT_FOUND);
    }

    // Convert to GraphQL response
    const userObj =
      (
        userDoc as UserDocument & { toObject?: () => Record<string, unknown> }
      ).toObject?.() || userDoc;
    const avatarFileId = userObj.profile?.avatarFileId as
      | Types.ObjectId
      | undefined;
    const avatarAccessUrlMap = await this.fileService.getAccessUrlMap([
      avatarFileId,
    ]);
    const avatarAccessUrl = resolveAvatarAccessUrl(
      avatarFileId,
      avatarAccessUrlMap,
    );

    return {
      id: userDoc._id,
      username: userObj.username,
      roles: (userObj.roles || []) as UserRole[],
      status: userObj.status,
      profile: userObj.profile
        ? {
            firstName: userObj.profile.firstName,
            lastName: userObj.profile.lastName,
            email: userObj.profile.email,
            phoneNumber: userObj.profile.phoneNumber,
            avatarAccessUrl,
            bio: userObj.profile.bio,
          }
        : undefined,
      preferences: userObj.preferences
        ? {
            language: userObj.preferences.language,
            timezone: userObj.preferences.timezone,
            notificationsEnabled:
              userObj.preferences.notificationsEnabled ?? true,
            theme: userObj.preferences.theme,
          }
        : undefined,
      verification: this.userService.resolveUserVerification(userDoc),
    } as UserMeGqlResponse;
  }
}
