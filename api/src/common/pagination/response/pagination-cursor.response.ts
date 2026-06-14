import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const FIELD_DESCRIPTION = {
  TOTAL: "Total number of items",
  LIMIT: "Number of items requested",
  START_CURSOR:
    "Cursor for the first item in this page. Use this as endCursor for the previous page",
  COUNT: "Number of items returned in this page",
  END_CURSOR:
    "Cursor for the last item in this page. Use this as startCursor for the next page",
  HAS_NEXT_PAGE: "Whether there are more items available after this page",
  HAS_PREVIOUS_PAGE: "Whether there are items before this page",
};

@ObjectType()
export class PaginationCursorResponse {
  @Field(() => Int, {
    description: FIELD_DESCRIPTION.TOTAL,
  })
  @ApiProperty({
    description: FIELD_DESCRIPTION.TOTAL,
  })
  total: number;

  @Field(() => Int, { description: FIELD_DESCRIPTION.LIMIT })
  @ApiProperty({ description: FIELD_DESCRIPTION.LIMIT })
  limit: number;

  @Field(() => ID, {
    nullable: true,
    description: FIELD_DESCRIPTION.START_CURSOR,
  })
  @ApiPropertyOptional({
    description: FIELD_DESCRIPTION.START_CURSOR,
  })
  startCursor?: string;

  @Field(() => Int, { description: FIELD_DESCRIPTION.COUNT })
  @ApiProperty({
    description: FIELD_DESCRIPTION.COUNT,
  })
  count: number;

  @Field(() => ID, {
    nullable: true,
    description: FIELD_DESCRIPTION.END_CURSOR,
  })
  @ApiPropertyOptional({
    description: FIELD_DESCRIPTION.END_CURSOR,
  })
  endCursor?: string;

  @Field(() => Boolean, {
    description: FIELD_DESCRIPTION.HAS_NEXT_PAGE,
  })
  @ApiProperty({
    description: FIELD_DESCRIPTION.HAS_NEXT_PAGE,
  })
  hasNextPage: boolean;

  @Field(() => Boolean, {
    description: FIELD_DESCRIPTION.HAS_PREVIOUS_PAGE,
  })
  @ApiProperty({
    description: FIELD_DESCRIPTION.HAS_PREVIOUS_PAGE,
  })
  hasPreviousPage: boolean;
}
