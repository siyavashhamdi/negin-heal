import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class BadgeCountGqlResponse {
  @Field(() => Int, {
    description:
      "Course badge count. Staff users receive all courses; end users receive active courses.",
  })
  courses: number;

  @Field(() => Int, {
    nullable: true,
    description:
      "Pending payment badge count for staff users. Null for end users.",
  })
  payments?: number | null;

  @Field(() => Int, {
    nullable: true,
    description: "Unread direct notification count for the current user.",
  })
  notifications?: number | null;

  @Field(() => Int, {
    nullable: true,
    description:
      "Support ticket badge count. Staff users receive open tickets; end users receive answered own tickets.",
  })
  tickets?: number | null;
}
