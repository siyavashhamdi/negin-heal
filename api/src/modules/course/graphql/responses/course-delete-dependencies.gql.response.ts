import { Types } from "mongoose";
import { Field, ID, Int, ObjectType, registerEnumType } from "@nestjs/graphql";

import { CourseDeleteDependencyImpact } from "../../../../enums";

registerEnumType(CourseDeleteDependencyImpact, {
  name: "CourseDeleteDependencyImpact",
  description:
    "Whether a dependency group is removed or retained when deleting a course",
});

@ObjectType()
export class CourseDeleteDependencyBreakdownGqlResponse {
  @Field({ description: "Stable breakdown key for client-side labels" })
  key: string;

  @Field(() => Int, { description: "Count for this breakdown bucket" })
  count: number;
}

@ObjectType()
export class CourseDeleteDependencySampleGqlResponse {
  @Field(() => ID, {
    nullable: true,
    description: "Optional related entity ID",
  })
  id?: Types.ObjectId;

  @Field({ description: "Primary label for the sample row" })
  label: string;

  @Field({
    nullable: true,
    description: "Optional secondary label such as status or type",
  })
  meta?: string;
}

@ObjectType()
export class CourseDeleteDependencyGroupGqlResponse {
  @Field({ description: "Stable group key for client-side labels" })
  key: string;

  @Field(() => CourseDeleteDependencyImpact, {
    description: "Whether this group is removed or retained on delete",
  })
  impact: CourseDeleteDependencyImpact;

  @Field(() => Int, { description: "Total records in this dependency group" })
  totalCount: number;

  @Field(() => [CourseDeleteDependencyBreakdownGqlResponse], {
    description: "Optional per-bucket counts inside the group",
  })
  breakdown: CourseDeleteDependencyBreakdownGqlResponse[];

  @Field(() => [CourseDeleteDependencySampleGqlResponse], {
    description: "Representative sample rows for richer UI previews",
  })
  samples: CourseDeleteDependencySampleGqlResponse[];

  @Field(() => Int, {
    description: "Number of additional sample rows not included in samples",
  })
  hiddenSampleCount: number;
}

@ObjectType()
export class CourseDeleteDependenciesSummaryGqlResponse {
  @Field(() => Int, {
    description: "Total records that will remain linked to the deleted course",
  })
  retainedCount: number;

  @Field(() => Int, {
    description: "Total records that will be removed together with the course",
  })
  removedCount: number;

  @Field({
    description: "Whether any retained dependency groups exist",
  })
  hasRetainedDependencies: boolean;

  @Field({
    description: "Whether any removed dependency groups exist",
  })
  hasRemovedDependencies: boolean;
}

@ObjectType()
export class CourseDeleteDependenciesGqlResponse {
  @Field(() => ID, { description: "Course ID" })
  courseId: Types.ObjectId;

  @Field({ description: "Course title" })
  courseTitle: string;

  @Field(() => CourseDeleteDependenciesSummaryGqlResponse, {
    description: "High-level delete impact summary",
  })
  summary: CourseDeleteDependenciesSummaryGqlResponse;

  @Field(() => [CourseDeleteDependencyGroupGqlResponse], {
    description: "Detailed dependency groups grouped by impact",
  })
  groups: CourseDeleteDependencyGroupGqlResponse[];
}
