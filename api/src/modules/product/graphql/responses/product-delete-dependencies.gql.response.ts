import { Types } from "mongoose";
import { Field, ID, Int, ObjectType, registerEnumType } from "@nestjs/graphql";

import { ProductDeleteDependencyImpact } from "../../../../enums";

registerEnumType(ProductDeleteDependencyImpact, {
  name: "ProductDeleteDependencyImpact",
  description:
    "Whether a dependency group is removed or retained when deleting a product",
});

@ObjectType()
export class ProductDeleteDependencyBreakdownGqlResponse {
  @Field({ description: "Stable breakdown key for client-side labels" })
  key: string;

  @Field(() => Int, { description: "Count for this breakdown bucket" })
  count: number;
}

@ObjectType()
export class ProductDeleteDependencySampleGqlResponse {
  @Field(() => ID, {
    nullable: true,
    description: "Optional related entity ID",
  })
  id?: Types.ObjectId;

  @Field({ description: "Primary label for the sample row" })
  label: string;

  @Field({
    nullable: true,
    description: "Optional secondary label such as status or type",
  })
  meta?: string;
}

@ObjectType()
export class ProductDeleteDependencyGroupGqlResponse {
  @Field({ description: "Stable group key for client-side labels" })
  key: string;

  @Field(() => ProductDeleteDependencyImpact, {
    description: "Whether this group is removed or retained on delete",
  })
  impact: ProductDeleteDependencyImpact;

  @Field(() => Int, { description: "Total records in this dependency group" })
  totalCount: number;

  @Field(() => [ProductDeleteDependencyBreakdownGqlResponse], {
    description: "Optional per-bucket counts inside the group",
  })
  breakdown: ProductDeleteDependencyBreakdownGqlResponse[];

  @Field(() => [ProductDeleteDependencySampleGqlResponse], {
    description: "Representative sample rows for richer UI previews",
  })
  samples: ProductDeleteDependencySampleGqlResponse[];

  @Field(() => Int, {
    description: "Number of additional sample rows not included in samples",
  })
  hiddenSampleCount: number;
}

@ObjectType()
export class ProductDeleteDependenciesSummaryGqlResponse {
  @Field(() => Int, {
    description: "Total records that will remain linked to the deleted product",
  })
  retainedCount: number;

  @Field(() => Int, {
    description: "Total records that will be removed together with the product",
  })
  removedCount: number;

  @Field({
    description: "Whether any retained dependency groups exist",
  })
  hasRetainedDependencies: boolean;

  @Field({
    description: "Whether any removed dependency groups exist",
  })
  hasRemovedDependencies: boolean;
}

@ObjectType()
export class ProductDeleteDependenciesGqlResponse {
  @Field(() => ID, { description: "Product ID" })
  productId: Types.ObjectId;

  @Field({ description: "Product title" })
  productTitle: string;

  @Field(() => ProductDeleteDependenciesSummaryGqlResponse, {
    description: "High-level delete impact summary",
  })
  summary: ProductDeleteDependenciesSummaryGqlResponse;

  @Field(() => [ProductDeleteDependencyGroupGqlResponse], {
    description: "Detailed dependency groups grouped by impact",
  })
  groups: ProductDeleteDependencyGroupGqlResponse[];
}
