import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class BadgeCountGqlResponse {
  @Field(() => Int, {
    description:
      "Product badge count. Staff users receive all products; end users receive active products.",
  })
  products: number;

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
