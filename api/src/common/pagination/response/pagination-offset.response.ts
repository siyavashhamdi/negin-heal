import { Field, Int, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

const FIELD_DESCRIPTION = {
  LIMIT: "Number of items requested",
  SKIP: "Number of items skipped (offset)",
  TOTAL: "Total number of items",
  COUNT: "Number of items returned in this page",
};

@ObjectType()
export class PaginationOffsetResponse {
  @Field(() => Int, { description: FIELD_DESCRIPTION.LIMIT })
  @ApiProperty({ description: FIELD_DESCRIPTION.LIMIT })
  limit: number;

  @Field(() => Int, { description: FIELD_DESCRIPTION.SKIP })
  @ApiProperty({ description: FIELD_DESCRIPTION.SKIP })
  skip: number;

  @Field(() => Int, { description: FIELD_DESCRIPTION.TOTAL })
  @ApiProperty({ description: FIELD_DESCRIPTION.TOTAL })
  total: number;

  @Field(() => Int, { description: FIELD_DESCRIPTION.COUNT })
  @ApiProperty({
    description: FIELD_DESCRIPTION.COUNT,
  })
  count: number;
}

// Type aliases for better naming consistency
export type PaginationOffsetGqlResponse = PaginationOffsetResponse;
export type PaginationOffsetApiResponse = PaginationOffsetResponse;
