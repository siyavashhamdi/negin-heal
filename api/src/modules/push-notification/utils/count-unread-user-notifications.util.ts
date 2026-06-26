import { FilterQuery, Model, Types } from "mongoose";

import { Notification, NotificationDocument } from "../../../database/schemas";

export async function countUnreadUserNotifications(
  notificationModel: Model<NotificationDocument>,
  userId: string,
): Promise<number> {
  const now = new Date();
  const filterQuery: FilterQuery<NotificationDocument> = {
    $and: [
      {
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      },
      {
        userId: new Types.ObjectId(userId),
        isGlobalAnnouncement: false,
        isRead: false,
        $or: [
          { visibleUntil: null },
          { visibleUntil: { $exists: false } },
          { visibleUntil: { $gte: now } },
        ],
      },
    ],
  };

  return notificationModel.countDocuments(filterQuery).exec();
}
