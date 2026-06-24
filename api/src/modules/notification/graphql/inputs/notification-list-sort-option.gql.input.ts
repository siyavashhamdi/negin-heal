import { IsEnum, IsOptional } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

import { SortingOrder } from "../../../../common/pagination/input";

@InputType()
export class NotificationListSortOptionInput {
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
    description: "Sort by read date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  readAt?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by archive date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  archivedAt?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by visibility expiration date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  visibleUntil?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by title",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  title?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by message",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  message?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by notification source",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  source?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by notification mode",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  mode?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by read state",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  isRead?: SortingOrder;
}
