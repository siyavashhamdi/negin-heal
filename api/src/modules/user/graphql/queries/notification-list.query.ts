import { Args, Context, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";

import {
  Notification,
  NotificationDocument,
} from "../../../../database/schemas";
import { PAGINATION_CONSTANT } from "../../../../constants";
import { SortingOrder } from "../../../../common/pagination/input";
import { buildSortOptions } from "../../../../common/pagination/utils";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GraphQLContextUtil } from "../../../../utils";
import { GqlAuthGuard } from "../../../auth";
import {
  NotificationListGqlInput,
  NotificationListSortOptionInput,
} from "../inputs";
import {
  NotificationListGqlResponse,
  NotificationListPaginatedCursorGqlResponse,
} from "../responses";

type NotificationListSortField = Extract<
  keyof NotificationListSortOptionInput,
  string
>;
type NotificationListCursorValue = string | number | boolean | Date | null;
type NotificationListRecord = Pick<
  Notification,
  | "_id"
  | "userId"
  | "isGlobalAnnouncement"
  | "source"
  | "mode"
  | "title"
  | "message"
  | "payload"
  | "isRead"
  | "readAt"
  | "archivedAt"
  | "visibleUntil"
  | "audit"
>;

@Resolver(() => NotificationListGqlResponse)
@UseGuards(GqlAuthGuard)
export class NotificationListQuery {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  @Query(() => NotificationListPaginatedCursorGqlResponse, {
    name: "userNotificationList",
    description:
      "Get a cursor-paginated, filterable, sortable list of notifications visible to the current user",
  })
  async findUserNotifications(
    @Args("input") input: NotificationListGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<NotificationListPaginatedCursorGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);
    const { filters, options } = input || {};
    const limit =
      options?.limit ?? PAGINATION_CONSTANT.CURSOR_BASED.DEFAULT_LIMIT;
    const baseFilterQuery = this.buildListFilterQuery(user.userId, filters);
    const sortFieldMap = this.getSortFieldMap();
    const requestedSort = options?.sort ?? { createdAt: SortingOrder.DESC };
    const cursorSort = this.resolveNotificationCursorSort(requestedSort);
    const sortOptions = {
      ...buildSortOptions<NotificationListSortField>(
        requestedSort,
        sortFieldMap,
        { createdAt: SortingOrder.DESC },
      ),
      _id: cursorSort.direction,
    };
    const cursorFilterQuery = await this.buildCursorFilterQuery(
      options?.startCursor,
      baseFilterQuery,
      cursorSort.path,
      cursorSort.direction,
    );
    const filterQuery =
      cursorFilterQuery == null
        ? baseFilterQuery
        : { $and: [baseFilterQuery, cursorFilterQuery] };

    const [notificationsWithExtra, total] = await Promise.all([
      this.notificationModel
        .find(filterQuery)
        .sort(sortOptions)
        .limit(limit + 1)
        .lean<NotificationListRecord[]>()
        .exec(),
      this.notificationModel.countDocuments(baseFilterQuery).exec(),
    ]);
    const hasNextPage = notificationsWithExtra.length > limit;
    const notifications = notificationsWithExtra.slice(0, limit);
    const firstNotification = notifications[0];
    const lastNotification = notifications[notifications.length - 1];

    return {
      items: notifications.map((notification) =>
        this.toNotificationListResponse(notification),
      ),
      pagination: {
        limit,
        total,
        count: notifications.length,
        startCursor: firstNotification?._id.toString(),
        endCursor: lastNotification?._id.toString(),
        hasNextPage,
        hasPreviousPage: Boolean(options?.startCursor),
      },
    };
  }

  private buildListFilterQuery(
    userId: Types.ObjectId,
    filters?: NotificationListGqlInput["filters"],
  ): FilterQuery<Notification> {
    const query: FilterQuery<Notification> = {
      $and: [
        {
          $or: [
            { "audit.deletedAt": null },
            { "audit.deletedAt": { $exists: false } },
          ],
        },
        {
          $or: [{ userId }, { isGlobalAnnouncement: true }],
        },
      ],
    };

    if (!filters) {
      return query;
    }

    if (filters.query?.trim()) {
      const searchRegex = this.createContainsRegex(filters.query);
      this.addAndCondition(query, {
        $or: [{ title: searchRegex }, { message: searchRegex }],
      });
    }

    if (filters.id) {
      query._id = new Types.ObjectId(filters.id);
    }

    this.addContainsFilter(query, "title", filters.title);
    this.addContainsFilter(query, "message", filters.message);

    if (filters.source) {
      query.source = filters.source;
    }

    if (filters.mode) {
      query.mode = filters.mode;
    }

    if (typeof filters.isRead === "boolean") {
      query.isRead = filters.isRead;
    }

    if (typeof filters.isGlobalAnnouncement === "boolean") {
      query.isGlobalAnnouncement = filters.isGlobalAnnouncement;
    }

    if (typeof filters.isArchived === "boolean") {
      this.addAndCondition(
        query,
        filters.isArchived
          ? { archivedAt: { $type: "date" } }
          : { $or: [{ archivedAt: null }, { archivedAt: { $exists: false } }] },
      );
    }

    if (typeof filters.isVisible === "boolean") {
      const now = new Date();
      this.addAndCondition(
        query,
        filters.isVisible
          ? {
              $or: [
                { visibleUntil: null },
                { visibleUntil: { $exists: false } },
                { visibleUntil: { $gte: now } },
              ],
            }
          : { visibleUntil: { $lt: now } },
      );
    }

    this.addDateRangeFilter(
      query,
      "audit.createdAt",
      filters.createdAtFrom,
      filters.createdAtTo,
    );
    this.addDateRangeFilter(
      query,
      "audit.updatedAt",
      filters.updatedAtFrom,
      filters.updatedAtTo,
    );
    this.addDateRangeFilter(
      query,
      "readAt",
      filters.readAtFrom,
      filters.readAtTo,
    );
    this.addDateRangeFilter(
      query,
      "archivedAt",
      filters.archivedAtFrom,
      filters.archivedAtTo,
    );
    this.addDateRangeFilter(
      query,
      "visibleUntil",
      filters.visibleUntilFrom,
      filters.visibleUntilTo,
    );

    return query;
  }

  private async buildCursorFilterQuery(
    startCursor: string | undefined,
    baseFilterQuery: FilterQuery<Notification>,
    sortPath: string,
    direction: 1 | -1,
  ): Promise<FilterQuery<Notification> | null> {
    if (!startCursor || !Types.ObjectId.isValid(startCursor)) {
      return null;
    }

    const cursorId = new Types.ObjectId(startCursor);
    const cursorNotification = await this.notificationModel
      .findOne({ $and: [baseFilterQuery, { _id: cursorId }] })
      .lean<NotificationListRecord>()
      .exec();
    if (!cursorNotification) {
      return null;
    }

    const cursorValue = this.getValueByPath(cursorNotification, sortPath);

    return this.buildNullableCursorFilter(
      cursorId,
      sortPath,
      cursorValue,
      direction,
    );
  }

  private buildNullableCursorFilter(
    cursorId: Types.ObjectId,
    sortPath: string,
    cursorValue: NotificationListCursorValue,
    direction: 1 | -1,
  ): FilterQuery<Notification> {
    const missingValueQuery: FilterQuery<Notification> = {
      $or: [{ [sortPath]: null }, { [sortPath]: { $exists: false } }],
    };
    const presentValueQuery: FilterQuery<Notification> = {
      $and: [{ [sortPath]: { $exists: true } }, { [sortPath]: { $ne: null } }],
    };
    const idOperator = direction === 1 ? "$gt" : "$lt";

    if (cursorValue == null) {
      if (direction === 1) {
        return {
          $or: [
            { $and: [missingValueQuery, { _id: { $gt: cursorId } }] },
            presentValueQuery,
          ],
        };
      }

      return {
        $and: [missingValueQuery, { _id: { $lt: cursorId } }],
      };
    }

    if (direction === 1) {
      return {
        $or: [
          { [sortPath]: { $gt: cursorValue } },
          {
            $and: [
              { [sortPath]: cursorValue },
              { _id: { [idOperator]: cursorId } },
            ],
          },
        ],
      };
    }

    return {
      $or: [
        {
          $and: [presentValueQuery, { [sortPath]: { $lt: cursorValue } }],
        },
        {
          $and: [
            { [sortPath]: cursorValue },
            { _id: { [idOperator]: cursorId } },
          ],
        },
        missingValueQuery,
      ],
    };
  }

  private resolveNotificationCursorSort(
    sort?: NotificationListSortOptionInput,
  ): {
    field: NotificationListSortField;
    path: string;
    direction: 1 | -1;
  } {
    const sortFieldMap = this.getSortFieldMap();
    const sortEntries = Object.entries(sort ?? {}) as Array<
      [NotificationListSortField, SortingOrder | undefined]
    >;
    const [field, order] =
      sortEntries.find(([, sortOrder]) => sortOrder != null) ??
      (["createdAt", SortingOrder.DESC] as const);

    return {
      field,
      path: sortFieldMap[field],
      direction: order === SortingOrder.ASC ? 1 : -1,
    };
  }

  private getSortFieldMap(): Record<NotificationListSortField, string> {
    return {
      createdAt: "audit.createdAt",
      updatedAt: "audit.updatedAt",
      readAt: "readAt",
      archivedAt: "archivedAt",
      visibleUntil: "visibleUntil",
      title: "title",
      message: "message",
      source: "source",
      mode: "mode",
      isRead: "isRead",
      isGlobalAnnouncement: "isGlobalAnnouncement",
    };
  }

  private toNotificationListResponse(
    notification: NotificationListRecord,
  ): NotificationListGqlResponse {
    return {
      id: notification._id,
      userId: notification.userId,
      isGlobalAnnouncement: notification.isGlobalAnnouncement,
      source: notification.source,
      mode: notification.mode,
      title: notification.title,
      message: notification.message,
      payload: notification.payload,
      isRead: notification.isRead,
      readAt: notification.readAt,
      archivedAt: notification.archivedAt,
      visibleUntil: notification.visibleUntil,
      createdAt: notification.audit?.createdAt,
      updatedAt: notification.audit?.updatedAt,
    };
  }

  private addContainsFilter(
    query: FilterQuery<Notification>,
    path: string,
    value?: string,
  ): void {
    if (value?.trim()) {
      query[path] = this.createContainsRegex(value);
    }
  }

  private addDateRangeFilter(
    query: FilterQuery<Notification>,
    path: string,
    from?: string,
    to?: string,
  ): void {
    const range: Record<string, Date> = {};
    const fromDate = this.parseFilterDate(from, false);
    const toDate = this.parseFilterDate(to, true);

    if (fromDate) {
      range.$gte = fromDate;
    }

    if (toDate) {
      range.$lte = toDate;
    }

    if (Object.keys(range).length > 0) {
      this.addAndCondition(query, { [path]: range });
    }
  }

  private parseFilterDate(
    value: string | undefined,
    endOfDay: boolean,
  ): Date | undefined {
    if (!value?.trim()) {
      return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      date.setHours(23, 59, 59, 999);
    }

    return date;
  }

  private addAndCondition(
    query: FilterQuery<Notification>,
    condition: FilterQuery<Notification>,
  ): void {
    query.$and = [...(Array.isArray(query.$and) ? query.$and : []), condition];
  }

  private getValueByPath(
    notification: NotificationListRecord,
    path: string,
  ): NotificationListCursorValue {
    const value = path.split(".").reduce<unknown>((current, key) => {
      if (current && typeof current === "object" && key in current) {
        return (current as Record<string, unknown>)[key];
      }

      return undefined;
    }, notification);

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value instanceof Date
    ) {
      return value;
    }

    return null;
  }

  private createContainsRegex(value: string): {
    $regex: string;
    $options: "i";
  } {
    return {
      $regex: this.escapeRegex(value),
      $options: "i",
    };
  }

  private escapeRegex(value: string): string {
    return value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
