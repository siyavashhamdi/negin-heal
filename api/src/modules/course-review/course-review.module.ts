import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import { FileModule } from "../file";
import { UserModule } from "../user";
import { CourseReviewService } from "./course-review.service";
import {
  CourseReviewSubmitMutation,
  CourseReviewModerationUpdateMutation,
} from "./graphql/mutations";
import {
  CourseReviewListQuery,
  UserCourseReviewListQuery,
} from "./graphql/queries";

@Module({
  imports: [DatabaseModule, FileModule, UserModule],
  providers: [
    CourseReviewService,
    CourseReviewSubmitMutation,
    CourseReviewModerationUpdateMutation,
    CourseReviewListQuery,
    UserCourseReviewListQuery,
  ],
  exports: [CourseReviewService],
})
export class CourseReviewModule {}
