import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MigrationService } from "./migration.service";
import {
  AppSetting,
  AppSettingSchema,
  Course,
  CourseSchema,
  Migration,
  MigrationSchema,
  Notification,
  NotificationSchema,
  PaymentCoupon,
  PaymentCouponSchema,
  Session,
  SessionSchema,
  StoredFile,
  StoredFileSchema,
  Ticket,
  TicketSchema,
  User,
  UserCourse,
  UserCourseSchema,
  UserSchema,
} from "../../database/schemas";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppSetting.name, schema: AppSettingSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Migration.name, schema: MigrationSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: PaymentCoupon.name, schema: PaymentCouponSchema },
      { name: Session.name, schema: SessionSchema },
      { name: StoredFile.name, schema: StoredFileSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: User.name, schema: UserSchema },
      { name: UserCourse.name, schema: UserCourseSchema },
    ]),
  ],
  providers: [MigrationService],
  exports: [MongooseModule, MigrationService],
})
export class DatabaseModule {}
