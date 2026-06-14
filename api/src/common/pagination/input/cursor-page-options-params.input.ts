import { Type } from "class-transformer";
import { IsInt, IsOptional, Min, IsString } from "class-validator";

import { ApiPropertyOptional } from "@nestjs/swagger";
import { Field, ID, InputType, Int } from "@nestjs/graphql";

import { PAGINATION_CONSTANT } from "../../../constants/pagination.constant";

const FIELD_DESCRIPTION = {
  LIMIT: "Maximum number of records to return",
  START_CURSOR: "Cursor to start after. Uses the beginning if omitted",
};

@InputType()
export class CursorPageOptionsParamsInput {
  @Field(() => Int, {
    nullable: true,
    defaultValue: PAGINATION_CONSTANT.CURSOR_BASED.DEFAULT_LIMIT,
    description: FIELD_DESCRIPTION.LIMIT,
  })
  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description: FIELD_DESCRIPTION.LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @Field(() => ID, {
    nullable: true,
    description: FIELD_DESCRIPTION.START_CURSOR,
  })
  @ApiPropertyOptional({
    description: FIELD_DESCRIPTION.START_CURSOR,
    type: String,
  })
  @IsOptional()
  @IsString()
  startCursor?: string;
}
