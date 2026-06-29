import { Field, GraphQLISODateTime, ObjectType } from "@nestjs/graphql";
import GraphQLJSON from "graphql-type-json";

import { GeneralSubscriptionUpdateType } from "../../../../enums";

@ObjectType()
export class GeneralSubscriptionGqlResponse {
  @Field(() => GeneralSubscriptionUpdateType, {
    description: "General update type emitted by backend",
  })
  updateType: GeneralSubscriptionUpdateType;

  @Field(() => String, {
    nullable: true,
    description:
      "Optional scoped identifier for this update (for example, ticket or product id)",
  })
  targetId?: string;

  @Field(() => GraphQLISODateTime, {
    description: "UTC timestamp when this update was generated",
  })
  createdAt: Date;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: "Type-specific payload object",
  })
  payload?: Record<string, unknown>;
}
