import { IsEnum, IsOptional } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

import { SortingOrder } from "../../../../common/pagination/input";

@InputType()
export class UserProductReviewListSortOptionInput {
  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by rating submission date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  ratedAt?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by star rating",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  stars?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by thread creation date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  createdAt?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by thread last update date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  updatedAt?: SortingOrder;
}
