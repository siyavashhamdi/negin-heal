import { Field, Float, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class MediaCompressionTrimRequestedGqlResponse {
  @Field(() => Float, {
    nullable: true,
    description: "Requested trim start in seconds",
  })
  startSeconds?: number | null;

  @Field(() => Float, {
    nullable: true,
    description: "Requested trim end in seconds",
  })
  endSeconds?: number | null;
}

@ObjectType()
export class MediaCompressionTrimAppliedGqlResponse {
  @Field(() => Float, { description: "Applied trim start in seconds" })
  startSeconds: number;

  @Field(() => Float, { description: "Applied trim end in seconds" })
  endSeconds: number;

  @Field(() => Float, { description: "Resulting media duration in seconds" })
  durationSeconds: number;
}

@ObjectType()
export class MediaCompressionTrimGqlResponse {
  @Field(() => MediaCompressionTrimRequestedGqlResponse, {
    description: "Trim range requested by the caller",
  })
  requested: MediaCompressionTrimRequestedGqlResponse;

  @Field(() => MediaCompressionTrimAppliedGqlResponse, {
    description: "Trim range applied during processing",
  })
  applied: MediaCompressionTrimAppliedGqlResponse;
}

@ObjectType()
export class MediaResolutionGqlResponse {
  @Field(() => Int, { description: "Media width in pixels" })
  width: number;

  @Field(() => Int, { description: "Media height in pixels" })
  height: number;
}
