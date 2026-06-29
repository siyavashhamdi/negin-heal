import { Module } from "@nestjs/common";

import { AppSettingsModule } from "../app-settings";
import { BadgeModule } from "../badge";
import { DatabaseModule } from "../database";
import { FileModule } from "../file";
import { CouponModule } from "../coupon";
import { NotificationModule } from "../notification";
import { PushNotificationModule } from "../push-notification";
import { UserModule } from "../user";
import { ZarinPalProxyModule } from "../zarinpal-proxy";
import {
  ChapterReleaseNotificationCron,
  GatewayPaymentExpiryCron,
} from "../../cron/jobs";
import { ProductPaymentController } from "./api/product-payment.controller";
import { ChapterReleaseNotificationService } from "./chapter-release-notification.service";
import { GatewayPaymentExpiryService } from "./gateway-payment-expiry.service";
import { ProductService } from "./product.service";
import {
  ProductChapterCompleteMutation,
  ProductCreateMutation,
  ProductDeleteMutation,
  ProductPaymentManualCreateMutation,
  ProductPaymentStatusUpdateMutation,
  ProductPurchaseSubmitMutation,
  ProductUpdateMutation,
} from "./graphql/mutations";
import {
  ProductDeleteDependenciesQuery,
  ProductDetailQuery,
  ProductListQuery,
  ProductPaymentDetailQuery,
  ProductPaymentListQuery,
  UserProductDetailQuery,
  UserProductListQuery,
} from "./graphql/queries";

@Module({
  imports: [
    AppSettingsModule,
    BadgeModule,
    DatabaseModule,
    FileModule,
    CouponModule,
    NotificationModule,
    PushNotificationModule,
    UserModule,
    ZarinPalProxyModule,
  ],
  controllers: [ProductPaymentController],
  providers: [
    ChapterReleaseNotificationCron,
    ChapterReleaseNotificationService,
    GatewayPaymentExpiryCron,
    GatewayPaymentExpiryService,
    ProductService,
    ProductChapterCompleteMutation,
    ProductCreateMutation,
    ProductDeleteMutation,
    ProductPaymentManualCreateMutation,
    ProductPaymentStatusUpdateMutation,
    ProductPurchaseSubmitMutation,
    ProductUpdateMutation,
    ProductDeleteDependenciesQuery,
    ProductDetailQuery,
    ProductListQuery,
    ProductPaymentDetailQuery,
    ProductPaymentListQuery,
    UserProductDetailQuery,
    UserProductListQuery,
  ],
  exports: [ChapterReleaseNotificationService, ProductService],
})
export class ProductModule {}
