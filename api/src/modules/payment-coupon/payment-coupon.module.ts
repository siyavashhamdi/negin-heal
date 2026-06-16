import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import {
  PaymentCouponCreateMutation,
  PaymentCouponDeleteMutation,
  PaymentCouponUpdateMutation,
} from "./graphql/mutations";
import {
  PaymentCouponListQuery,
  PaymentCouponValidateQuery,
} from "./graphql/queries";
import { PaymentCouponService } from "./payment-coupon.service";

@Module({
  imports: [DatabaseModule],
  providers: [
    PaymentCouponService,
    PaymentCouponCreateMutation,
    PaymentCouponDeleteMutation,
    PaymentCouponUpdateMutation,
    PaymentCouponListQuery,
    PaymentCouponValidateQuery,
  ],
  exports: [PaymentCouponService],
})
export class PaymentCouponModule {}
