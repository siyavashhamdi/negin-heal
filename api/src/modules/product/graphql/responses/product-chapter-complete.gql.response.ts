import { Field, GraphQLISODateTime, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ProductChapterCompleteGqlResponse {
  @Field({ description: "Completed chapter key" })
  key: string;

  @Field({ description: "Chapter title snapshot at completion time" })
  titleSnapshot: string;

  @Field(() => GraphQLISODateTime, {
    description: "When the learner confirmed chapter completion",
  })
  userCompletedAt: Date;

  @Field(() => Int, {
    description:
      "Total chapters the learner has marked complete in this product",
  })
  completedChapterCount: number;

  @Field(() => Int, {
    description:
      "Total unlocked chapters the learner can complete in this product right now",
  })
  accessibleChapterCount: number;
}
