import { Module } from "@nestjs/common";

import { AppSettingsModule } from "../app-settings";
import { BadgeModule } from "../badge";
import { DatabaseModule } from "../database";
import { FileModule } from "../file";
import { CouponModule } from "../coupon";
import { UserModule } from "../user";
import { CoursePaymentController } from "./api/course-payment.controller";
import { CourseService } from "./course.service";
import {
  CourseCreateMutation,
  CourseDeleteMutation,
  CoursePaymentManualCreateMutation,
  CoursePaymentStatusUpdateMutation,
  CoursePurchaseSubmitMutation,
  CourseUpdateMutation,
} from "./graphql/mutations";
import {
  CourseListQuery,
  CoursePaymentListQuery,
  UserCourseDetailQuery,
  UserCourseListQuery,
} from "./graphql/queries";

@Module({
  imports: [
    AppSettingsModule,
    BadgeModule,
    DatabaseModule,
    FileModule,
    CouponModule,
    UserModule,
  ],
  controllers: [CoursePaymentController],
  providers: [
    CourseService,
    CourseCreateMutation,
    CourseDeleteMutation,
    CoursePaymentManualCreateMutation,
    CoursePaymentStatusUpdateMutation,
    CoursePurchaseSubmitMutation,
    CourseUpdateMutation,
    CourseListQuery,
    CoursePaymentListQuery,
    UserCourseDetailQuery,
    UserCourseListQuery,
  ],
  exports: [CourseService],
})
export class CourseModule {}
