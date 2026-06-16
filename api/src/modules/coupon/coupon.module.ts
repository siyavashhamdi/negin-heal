import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import {
  CouponCreateMutation,
  CouponDeleteMutation,
  CouponUpdateMutation,
} from "./graphql/mutations";
import {
  CouponListQuery,
  CouponValidateQuery,
} from "./graphql/queries";
import { CouponService } from "./coupon.service";

@Module({
  imports: [DatabaseModule],
  providers: [
    CouponService,
    CouponCreateMutation,
    CouponDeleteMutation,
    CouponUpdateMutation,
    CouponListQuery,
    CouponValidateQuery,
  ],
  exports: [CouponService],
})
export class CouponModule {}
