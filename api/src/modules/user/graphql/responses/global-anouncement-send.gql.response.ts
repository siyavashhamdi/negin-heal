import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class GlobalAnouncementSendGqlResponse {
  @Field(() => Int, {
    description: "Number of active subscribed users that received the update",
  })
  deliveredUsers: number;

  @Field(() => Int, {
    description:
      "Number of active users subscribed to the general updates channel",
  })
  activeSubscribedUsers: number;
}
