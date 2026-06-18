import { Field, GraphQLISODateTime, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class CourseChapterCompleteGqlResponse {
  @Field({ description: "Completed chapter key" })
  key: string;

  @Field({ description: "Chapter title snapshot at completion time" })
  titleSnapshot: string;

  @Field(() => GraphQLISODateTime, {
    description: "When the learner confirmed chapter completion",
  })
  userCompletedAt: Date;

  @Field(() => Int, {
    description: "Total chapters the learner has marked complete in this course",
  })
  completedChapterCount: number;

  @Field(() => Int, {
    description:
      "Total unlocked chapters the learner can complete in this course right now",
  })
  accessibleChapterCount: number;
}
