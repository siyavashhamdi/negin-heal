import { InputType } from "@nestjs/graphql";

import { ProductWriteGqlInput } from "./product-common.gql.input";

@InputType()
export class ProductCreateGqlInput extends ProductWriteGqlInput {}
