import { IsEnum, IsOptional } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

import { SortingOrder } from "../../../../common/pagination/input";

@InputType()
export class ProductListSortOptionInput {
  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by manual display rank",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  sortOrder?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by creation date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  createdAt?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by last update date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  updatedAt?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by product title",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  title?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by price in IRT",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  priceIrt?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by active state",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  isActive?: SortingOrder;
}
