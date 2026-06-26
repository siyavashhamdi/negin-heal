import { Module } from "@nestjs/common";

import { AppSettingsModule } from "../app-settings";
import { BadgeModule } from "../badge";
import { DatabaseModule } from "../database";
import { FileModule } from "../file";
import { CouponModule } from "../coupon";
import { NotificationModule } from "../notification";
import { PushNotificationModule } from "../push-notification";
import { UserModule } from "../user";
import { ChapterReleaseNotificationCron } from "../../cron/jobs";
import { CoursePaymentController } from "./api/course-payment.controller";
import { ChapterReleaseNotificationService } from "./chapter-release-notification.service";
import { CourseService } from "./course.service";
import {
  CourseChapterCompleteMutation,
  CourseCreateMutation,
  CourseDeleteMutation,
  CoursePaymentManualCreateMutation,
  CoursePaymentStatusUpdateMutation,
  CoursePurchaseSubmitMutation,
  CourseUpdateMutation,
} from "./graphql/mutations";
import {
  CourseDeleteDependenciesQuery,
  CourseDetailQuery,
  CourseListQuery,
  CoursePaymentDetailQuery,
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
    NotificationModule,
    PushNotificationModule,
    UserModule,
  ],
  controllers: [CoursePaymentController],
  providers: [
    ChapterReleaseNotificationCron,
    ChapterReleaseNotificationService,
    CourseService,
    CourseChapterCompleteMutation,
    CourseCreateMutation,
    CourseDeleteMutation,
    CoursePaymentManualCreateMutation,
    CoursePaymentStatusUpdateMutation,
    CoursePurchaseSubmitMutation,
    CourseUpdateMutation,
    CourseDeleteDependenciesQuery,
    CourseDetailQuery,
    CourseListQuery,
    CoursePaymentDetailQuery,
    CoursePaymentListQuery,
    UserCourseDetailQuery,
    UserCourseListQuery,
  ],
  exports: [ChapterReleaseNotificationService, CourseService],
})
export class CourseModule {}
