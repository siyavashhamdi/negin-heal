import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MigrationService } from "./migration.service";
import {
  AppSetting,
  AppSettingSchema,
  Product,
  ProductReview,
  ProductReviewSchema,
  ProductSchema,
  Migration,
  MigrationSchema,
  Notification,
  NotificationSchema,
  Coupon,
  CouponSchema,
  Session,
  SessionSchema,
  StoredFile,
  StoredFileSchema,
  Ticket,
  TicketSchema,
  User,
  UserProduct,
  UserProductSchema,
  UserSchema,
} from "../../database/schemas";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppSetting.name, schema: AppSettingSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductReview.name, schema: ProductReviewSchema },
      { name: Migration.name, schema: MigrationSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: Session.name, schema: SessionSchema },
      { name: StoredFile.name, schema: StoredFileSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: User.name, schema: UserSchema },
      { name: UserProduct.name, schema: UserProductSchema },
    ]),
  ],
  providers: [MigrationService],
  exports: [MongooseModule, MigrationService],
})
export class DatabaseModule {}
