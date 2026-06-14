import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import { PaymentCouponValidateQuery } from "./graphql/queries";
import { PaymentCouponService } from "./payment-coupon.service";

@Module({
  imports: [DatabaseModule],
  providers: [PaymentCouponService, PaymentCouponValidateQuery],
  exports: [PaymentCouponService],
})
export class PaymentCouponModule {}
