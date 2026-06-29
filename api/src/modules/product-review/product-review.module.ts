import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import { FileModule } from "../file";
import { UserModule } from "../user";
import { ProductReviewService } from "./product-review.service";
import {
  ProductReviewSubmitMutation,
  ProductReviewModerationUpdateMutation,
} from "./graphql/mutations";
import {
  ProductReviewListQuery,
  UserProductReviewListQuery,
} from "./graphql/queries";

@Module({
  imports: [DatabaseModule, FileModule, UserModule],
  providers: [
    ProductReviewService,
    ProductReviewSubmitMutation,
    ProductReviewModerationUpdateMutation,
    ProductReviewListQuery,
    UserProductReviewListQuery,
  ],
  exports: [ProductReviewService],
})
export class ProductReviewModule {}
