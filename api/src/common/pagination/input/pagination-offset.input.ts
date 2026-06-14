import { Field, InputType } from "@nestjs/graphql";
import { ApiPropertyOptional } from "@nestjs/swagger";

import { OffsetPageOptionsParamsInput } from "./offset-page-options-params.input";

const FIELD_DESCRIPTION = {
  FILTERS: "Filter options (specific to the endpoint)",
  OPTIONS: "Pagination options",
};

@InputType()
export class PaginationOffsetInput<TFilter> {
  @Field(() => String, {
    nullable: true,
    description: FIELD_DESCRIPTION.FILTERS,
  })
  @ApiPropertyOptional({
    description: FIELD_DESCRIPTION.FILTERS,
    type: String,
  })
  filters?: TFilter;

  @Field(() => OffsetPageOptionsParamsInput, {
    nullable: true,
    description: FIELD_DESCRIPTION.OPTIONS,
  })
  @ApiPropertyOptional({
    description: FIELD_DESCRIPTION.OPTIONS,
    type: OffsetPageOptionsParamsInput,
  })
  options?: OffsetPageOptionsParamsInput;
}
