import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";

import {
  Course,
  CourseChapter,
  CourseDocument,
  NotificationDocument,
  UserCourse,
  UserCourseDocument,
} from "../../database/schemas";
import {
  GeneralSubscriptionUpdateType,
  GlobalAnouncementMessageType,
  NotificationMode,
  NotificationSource,
  UserCoursePurchaseStatus,
} from "../../enums";
import { UserSubscriptionService } from "../user";
import { NotificationService } from "../notification";
import { PushNotificationService } from "../push-notification";
import {
  resolveWebPushBody,
  resolveWebPushTitle,
} from "../push-notification/utils/resolve-web-push-content.util";
import { coercePaidAt } from "./chapter-access.util";
import {
  buildChapterReleasePushClaimFilter,
  buildChapterReleaseRetryClaimFilter,
  findDueChapterReleaseNotifications,
  getCompletedNotificationChapterKeys,
} from "./chapter-release-notification.util";

const USER_COURSE_BATCH_SIZE = 200;
const CHAPTER_RELEASE_NOTIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

type GradualReleaseCourse = Pick<Course, "title" | "chapters"> & {
  _id: Types.ObjectId;
};

type PendingReleaseUserCourse = Pick<
  UserCourse,
  "courseId" | "courseSnapshot" | "purchase" | "chapterReleaseNotifications"
> & {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
};

export type ChapterReleaseNotificationRunResult = {
  scannedUserCourses: number;
  notifiedChapters: number;
  skippedChapters: number;
};

@Injectable()
export class ChapterReleaseNotificationService {
  private readonly logger = new Logger(ChapterReleaseNotificationService.name);

  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourseDocument>,
    private readonly notificationService: NotificationService,
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async processPendingNotifications(): Promise<ChapterReleaseNotificationRunResult> {
    const gradualCourses = await this.findGradualReleaseCourses();

    if (!gradualCourses.length) {
      this.logger.log(
        "Chapter release check: no courses with scheduled chapter unlocks found; nothing to notify.",
      );
      return {
        scannedUserCourses: 0,
        notifiedChapters: 0,
        skippedChapters: 0,
      };
    }

    const courseById = new Map(
      gradualCourses.map((course) => [course._id.toString(), course]),
    );
    const courseIds = gradualCourses.map((course) => course._id);

    let scannedUserCourses = 0;
    let notifiedChapters = 0;
    let skippedChapters = 0;
    let lastUserCourseId: Types.ObjectId | undefined;

    while (true) {
      const userCourses = await this.findPendingReleaseUserCourses(
        courseIds,
        lastUserCourseId,
      );

      if (!userCourses.length) {
        break;
      }

      for (const userCourse of userCourses) {
        scannedUserCourses += 1;

        const course = courseById.get(userCourse.courseId.toString());
        if (!course) {
          continue;
        }

        const chaptersToNotify = this.findChaptersPendingReleaseNotification(
          course,
          userCourse,
        );

        for (const chapter of chaptersToNotify) {
          try {
            const didNotify = await this.notifyChapterReleased(
              userCourse,
              course,
              chapter,
            );

            if (didNotify) {
              notifiedChapters += 1;
            } else {
              skippedChapters += 1;
            }
          } catch (error) {
            skippedChapters += 1;
            this.logger.error(
              `Failed chapter release notification for userCourse=${userCourse._id.toString()} chapter=${chapter.key}`,
              error instanceof Error ? error.stack : String(error),
            );
          }
        }
      }

      lastUserCourseId = userCourses[userCourses.length - 1]?._id;
      if (userCourses.length < USER_COURSE_BATCH_SIZE) {
        break;
      }
    }

    if (notifiedChapters > 0) {
      this.logger.log(
        `Chapter release notifications sent: ${notifiedChapters} chapter(s) across ${scannedUserCourses} user course(s)`,
      );
    } else {
      this.logger.log(
        "Chapter release check completed: no due chapter unlock notifications found.",
      );
    }

    return {
      scannedUserCourses,
      notifiedChapters,
      skippedChapters,
    };
  }

  private async findGradualReleaseCourses(): Promise<GradualReleaseCourse[]> {
    return this.courseModel
      .find({
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
        chapters: {
          $elemMatch: {
            isFree: { $ne: true },
            visibleAfterMinutes: { $gte: 0, $type: "number" },
          },
        },
      })
      .select({ title: 1, chapters: 1 })
      .lean<GradualReleaseCourse[]>()
      .exec();
  }

  private async findPendingReleaseUserCourses(
    courseIds: Types.ObjectId[],
    lastUserCourseId?: Types.ObjectId,
  ): Promise<PendingReleaseUserCourse[]> {
    const query: FilterQuery<UserCourse> = {
      courseId: { $in: courseIds },
      "purchase.status": UserCoursePurchaseStatus.PAID,
      "purchase.paidAt": { $exists: true, $ne: null },
      $or: [
        { "audit.deletedAt": null },
        { "audit.deletedAt": { $exists: false } },
      ],
    };

    if (lastUserCourseId) {
      query._id = { $gt: lastUserCourseId };
    }

    return this.userCourseModel
      .find(query)
      .sort({ _id: 1 })
      .limit(USER_COURSE_BATCH_SIZE)
      .select({
        userId: 1,
        courseId: 1,
        courseSnapshot: 1,
        purchase: 1,
        chapterReleaseNotifications: 1,
      })
      .lean<PendingReleaseUserCourse[]>()
      .exec();
  }

  private findChaptersPendingReleaseNotification(
    course: GradualReleaseCourse,
    userCourse: PendingReleaseUserCourse,
  ): CourseChapter[] {
    const paidAt = userCourse.purchase.paidAt;
    if (!coercePaidAt(paidAt)) {
      return [];
    }

    const notifiedKeys = getCompletedNotificationChapterKeys(
      userCourse.chapterReleaseNotifications?.chapters,
    );

    return findDueChapterReleaseNotifications(
      course.chapters || [],
      paidAt,
      notifiedKeys,
      new Date(),
    );
  }

  private async notifyChapterReleased(
    userCourse: PendingReleaseUserCourse,
    course: GradualReleaseCourse,
    chapter: CourseChapter,
  ): Promise<boolean> {
    const courseId = userCourse.courseId.toString();
    const courseTitle =
      this.normalizeText(userCourse.courseSnapshot?.title) ||
      this.normalizeText(course.title) ||
      "دوره";
    const chapterTitle = this.normalizeText(chapter.title) || "فصل";
    const title = "فصل جدید قابل مشاهده است";
    const message = `فصل «${chapterTitle}» از دوره «${courseTitle}» اکنون برای شما قابل دسترس است.`;
    const notificationPayload: Record<string, unknown> = {
      courseId,
      chapterKey: chapter.key,
    };
    const visibleUntil = new Date(
      Date.now() + CHAPTER_RELEASE_NOTIFICATION_TTL_MS,
    );
    const subscriptionPayload: Record<string, unknown> = {
      ...notificationPayload,
      messageType: GlobalAnouncementMessageType.SNACKBAR,
      isPushNotification: true,
      title: null,
      description: message,
      mode: NotificationMode.INFO,
    };

    const claimed = await this.claimChapterNotificationSlot(
      userCourse._id,
      chapter.key,
      chapterTitle,
    );

    if (!claimed) {
      return false;
    }

    let notification: NotificationDocument;

    try {
      notification = await this.notificationService.createForEndUser({
        userId: userCourse.userId,
        source: NotificationSource.COURSE_CHAPTER,
        mode: NotificationMode.SUCCESS,
        title,
        message,
        payload: notificationPayload,
        visibleUntil,
      });

      const linkResult = await this.userCourseModel.updateOne(
        { _id: userCourse._id },
        {
          $set: {
            "chapterReleaseNotifications.chapters.$[chapter].notificationId":
              notification._id,
          },
        },
        {
          arrayFilters: [
            {
              "chapter.key": chapter.key,
              $or: [
                { "chapter.notificationId": { $exists: false } },
                { "chapter.notificationId": null },
              ],
            },
          ],
        },
      );

      if (linkResult.matchedCount === 0) {
        this.logger.warn(
          `Chapter release notification created but userCourse link failed for userCourse=${userCourse._id.toString()} chapter=${chapter.key}`,
        );
      }
    } catch (error) {
      await this.userCourseModel.updateOne(
        { _id: userCourse._id },
        {
          $pull: {
            "chapterReleaseNotifications.chapters": { key: chapter.key },
          },
        },
      );
      throw error;
    }

    await this.userSubscriptionService.publishToUser({
      userId: userCourse.userId.toString(),
      updateType: GeneralSubscriptionUpdateType.NOTIFICATION,
      targetId: notification._id.toString(),
      payload: subscriptionPayload,
    });

    void this.pushNotificationService.deliverToUser(
      userCourse.userId.toString(),
      {
        title: resolveWebPushTitle(subscriptionPayload, title),
        body: resolveWebPushBody(subscriptionPayload, message),
        notificationId: notification._id.toString(),
        payload: subscriptionPayload,
        tag: notification._id.toString(),
      },
    );

    return true;
  }

  private async claimChapterNotificationSlot(
    userCourseId: Types.ObjectId,
    chapterKey: string,
    chapterTitle: string,
  ): Promise<boolean> {
    const notificationSentAt = new Date();
    const chapterEntry = {
      key: chapterKey,
      titleSnapshot: chapterTitle,
      notificationSentAt,
    };

    const retryResult = await this.userCourseModel.updateOne(
      buildChapterReleaseRetryClaimFilter(userCourseId, chapterKey),
      {
        $set: {
          "chapterReleaseNotifications.chapters.$.titleSnapshot": chapterTitle,
          "chapterReleaseNotifications.chapters.$.notificationSentAt":
            notificationSentAt,
        },
      },
    );

    if (retryResult.matchedCount > 0) {
      return true;
    }

    const claimResult = await this.userCourseModel.updateOne(
      buildChapterReleasePushClaimFilter(userCourseId, chapterKey),
      {
        $push: {
          "chapterReleaseNotifications.chapters": chapterEntry,
        },
      },
    );

    return claimResult.modifiedCount > 0;
  }

  private normalizeText(value?: string | null): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
  }
}
