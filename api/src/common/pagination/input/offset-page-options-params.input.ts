import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

import { ApiPropertyOptional } from "@nestjs/swagger";
import { Field, InputType, Int } from "@nestjs/graphql";

import { PAGINATION_CONSTANT } from "../../../constants/pagination.constant";

const FIELD_DESCRIPTION = {
  LIMIT: "Maximum number of records to return",
  SKIP: "Number of records to skip (offset)",
};

@InputType()
export class OffsetPageOptionsParamsInput {
  @Field(() => Int, {
    nullable: true,
    defaultValue: PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_LIMIT,
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

  @Field(() => Int, {
    nullable: true,
    defaultValue: PAGINATION_CONSTANT.OFFSET_BASED.DEFAULT_SKIP,
    description: FIELD_DESCRIPTION.SKIP,
  })
  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: FIELD_DESCRIPTION.SKIP,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}
