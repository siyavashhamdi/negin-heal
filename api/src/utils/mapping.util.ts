import { Types } from "mongoose";
import { UserMinimalGqlResponse } from "../modules/user/graphql/responses/common";

/**
 * User object structure for mapping (from MongoDB document)
 */
export interface UserForMapping {
  _id: Types.ObjectId;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarFileId?: Types.ObjectId;
  };
}

/**
 * Maps a user object to UserMinimalGqlResponse format
 * @param user - User object with _id and optional profile
 * @returns UserMinimalGqlResponse or undefined if user is not provided
 */
export function mapUserToMinimal(
  user: UserForMapping | null | undefined,
): UserMinimalGqlResponse | undefined {
  if (!user) {
    return undefined;
  }

  return {
    id: user._id,
    profile: user.profile
      ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          avatarFileId: user.profile.avatarFileId,
        }
      : undefined,
  } as UserMinimalGqlResponse;
}

/**
 * Maps a user ID to UserMinimalGqlResponse format using a users map
 * @param userId - User ID to look up
 * @param usersMap - Map of user IDs to user objects
 * @returns UserMinimalGqlResponse or undefined if user is not found
 */
export function mapUserIdToMinimal(
  userId: Types.ObjectId | null | undefined,
  usersMap: Map<string, UserForMapping>,
): UserMinimalGqlResponse | undefined {
  if (!userId) {
    return undefined;
  }

  const user = usersMap.get(userId.toString());
  if (!user) {
    return undefined;
  }

  return mapUserToMinimal(user);
}
