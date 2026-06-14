import { IsEnum, IsOptional } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

import { SortingOrder } from "../../../../common/pagination/input/sorting-order.enum";

@InputType()
export class UserListSortOptionInput {
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
    description: "Sort by username",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  username?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by first name",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  firstName?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by last name",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  lastName?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by email address",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  email?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by phone number",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  phoneNumber?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by account status",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  status?: SortingOrder;
}
