import { IsEnum, IsOptional } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

import { SortingOrder } from "../../../../common/pagination/input";

@InputType()
export class TicketListSortOptionInput {
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
    description: "Sort by ticket title",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  title?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by ticket category",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  category?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by ticket priority",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  priority?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by ticket status",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  status?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by ticket close actor",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  closedBy?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by ticket close date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  closedAt?: SortingOrder;
}
