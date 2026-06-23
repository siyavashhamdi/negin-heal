import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MigrationService } from "./migration.service";
import {
  AppSetting,
  AppSettingSchema,
  Course,
  CourseReview,
  CourseReviewSchema,
  CourseSchema,
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
  UserCourse,
  UserCourseSchema,
  UserSchema,
} from "../../database/schemas";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppSetting.name, schema: AppSettingSchema },
      { name: Course.name, schema: CourseSchema },
      { name: CourseReview.name, schema: CourseReviewSchema },
      { name: Migration.name, schema: MigrationSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Coupon.name, schema: CouponSchema },
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
