import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";

import {
  Course,
  CourseDocument,
  Notification,
  NotificationDocument,
  Ticket,
  TicketDocument,
  UserCourse,
  UserCourseDocument,
} from "../../database/schemas";
import { TicketStatus, UserCoursePurchaseStatus, UserRole } from "../../enums";
import { AuthenticatedUser } from "../../types/graphql-context.types";
import { BadgeCountGqlResponse } from "./graphql/responses";

@Injectable()
export class BadgeService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourseDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
  ) {}

  async getCount(user: AuthenticatedUser): Promise<BadgeCountGqlResponse> {
    const isStaff = this.isStaff(user);

    const [courses, payments, notifications, tickets] = await Promise.all([
      this.countCourses(isStaff),
      isStaff ? this.countPendingPayments() : Promise.resolve(null),
      this.countUnreadNotifications(user),
      this.countTickets(user, isStaff),
    ]);

    return {
      courses,
      payments,
      notifications,
      tickets,
    };
  }

  private countCourses(isStaff: boolean): Promise<number> {
    const filterQuery: FilterQuery<Course> = isStaff ? {} : { isActive: true };

    return this.courseModel.countDocuments(filterQuery).exec();
  }

  private countPendingPayments(): Promise<number> {
    return this.userCourseModel
      .countDocuments({
        "purchase.status": UserCoursePurchaseStatus.PENDING,
      })
      .exec();
  }

  private countUnreadNotifications(user: AuthenticatedUser): Promise<number> {
    return this.notificationModel
      .countDocuments({
        userId: user.userId,
        isGlobalAnnouncement: false,
        isRead: false,
      })
      .exec();
  }

  private countTickets(
    user: AuthenticatedUser,
    isStaff: boolean,
  ): Promise<number> {
    const filterQuery: FilterQuery<Ticket> = isStaff
      ? { status: TicketStatus.OPEN }
      : {
          "audit.createdBy": user.userId,
          status: TicketStatus.ANSWERED,
        };

    return this.ticketModel.countDocuments(filterQuery).exec();
  }

  private isStaff(user: AuthenticatedUser): boolean {
    return (
      user.roles?.includes(UserRole.SUPER_ADMIN) ||
      user.roles?.includes(UserRole.ADMIN)
    );
  }
}
