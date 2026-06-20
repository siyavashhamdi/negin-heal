import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import {
  CouponCreateMutation,
  CouponDeleteMutation,
  CouponUpdateMutation,
} from "./graphql/mutations";
import {
  CouponDetailQuery,
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
    CouponDetailQuery,
    CouponListQuery,
    CouponValidateQuery,
  ],
  exports: [CouponService],
})
export class CouponModule {}
