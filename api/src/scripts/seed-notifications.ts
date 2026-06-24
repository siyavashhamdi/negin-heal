/**
 * Seeds test notifications for every active user.
 *
 * Run from api/:
 *   npm run seed:notifications
 *
 * Re-running removes previous seed notifications (payload.seedTag = "seed:notifications")
 * before inserting fresh ones.
 */
import { resolve } from "path";
import { config } from "dotenv";
import mongoose, { Types } from "mongoose";

import { NotificationMode, NotificationSource } from "../enums";

config({ path: resolve(process.cwd(), ".env") });

const SEED_TAG = "seed:notifications";

type SeedNotificationTemplate = {
  source: NotificationSource;
  mode: NotificationMode;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  isRead?: boolean;
  minutesAgo?: number;
};

type SeedNotificationDocument = {
  userId: Types.ObjectId;
  isGlobalAnnouncement: false;
  source: NotificationSource;
  mode: NotificationMode;
  title: string;
  message: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  audit: {
    createdAt: Date;
  };
};

const NOTIFICATION_TEMPLATES: SeedNotificationTemplate[] = [
  {
    source: NotificationSource.OTHER,
    mode: NotificationMode.INFO,
    title: "اعلان تستی",
    message:
      "این یک اعلان آزمایشی است. برای بررسی لیست اعلان‌ها، نشانگر خوانده‌نشده و فیلترها از آن استفاده کنید.",
    minutesAgo: 5,
  },
  {
    source: NotificationSource.COURSE,
    mode: NotificationMode.SUCCESS,
    title: "دسترسی دوره فعال شد",
    message:
      "دوره «بازسازی رابطه عاطفی» برای حساب شما فعال شد. از بخش دوره‌ها می‌توانید یادگیری را ادامه دهید.",
    payload: {
      action: {
        label: "مشاهده دوره‌ها",
        href: "/courses",
      },
    },
    minutesAgo: 45,
  },
  {
    source: NotificationSource.PAYMENT,
    mode: NotificationMode.WARNING,
    title: "پرداخت در انتظار تأیید",
    message:
      "یک پرداخت اخیر هنوز تأیید نشده است. در صورت تکمیل پرداخت، چند دقیقه صبر کنید یا از پشتیبانی پیگیری کنید.",
    minutesAgo: 120,
  },
  {
    source: NotificationSource.TICKET,
    mode: NotificationMode.ERROR,
    title: "پاسخ جدید تیکت",
    message:
      "پشتیبانی به تیکت شما پاسخ داده است. برای مشاهده جزئیات به بخش تیکت‌ها بروید.",
    payload: {
      action: {
        label: "مشاهده تیکت‌ها",
        href: "/support/tickets",
      },
    },
    isRead: true,
    minutesAgo: 360,
  },
];

function getRequiredEnv(name: "MONGODB_URI" | "MONGODB_DATABASE"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required. Add it to api/.env before seeding.`);
  }

  return value;
}

function parseCountArg(): number {
  const countArg = process.argv.find((arg) => arg.startsWith("--count="));
  if (!countArg) {
    return NOTIFICATION_TEMPLATES.length;
  }

  const parsed = Number.parseInt(countArg.slice("--count=".length), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("--count must be a positive integer.");
  }

  return Math.min(parsed, NOTIFICATION_TEMPLATES.length);
}

function buildNotificationsForUser(
  userId: Types.ObjectId,
  count: number,
  now: Date,
): SeedNotificationDocument[] {
  return NOTIFICATION_TEMPLATES.slice(0, count).map((template) => {
    const createdAt = new Date(
      now.getTime() - (template.minutesAgo ?? 0) * 60 * 1000,
    );
    const isRead = template.isRead ?? false;

    return {
      userId,
      isGlobalAnnouncement: false,
      source: template.source,
      mode: template.mode,
      title: template.title,
      message: template.message,
      payload: {
        seedTag: SEED_TAG,
        ...(template.payload ?? {}),
      },
      isRead,
      ...(isRead ? { readAt: createdAt } : {}),
      audit: {
        createdAt,
      },
    };
  });
}

async function seedNotifications(): Promise<void> {
  const uri = getRequiredEnv("MONGODB_URI");
  const dbName = getRequiredEnv("MONGODB_DATABASE");
  const countPerUser = parseCountArg();

  await mongoose.connect(uri, { dbName });

  const db = mongoose.connection.db;
  const usersCollection = db.collection("users");
  const notificationsCollection = db.collection("notifications");

  const removed = await notificationsCollection.deleteMany({
    "payload.seedTag": SEED_TAG,
  });

  const users = await usersCollection
    .find(
      {
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      },
      { projection: { _id: 1, username: 1 } },
    )
    .toArray();

  if (users.length === 0) {
    console.log("No users found. Skipping notification seed.");
    console.log(
      `Removed ${removed.deletedCount} previous ${SEED_TAG} notifications.`,
    );
    return;
  }

  const now = new Date();
  const notifications = users.flatMap((user) =>
    buildNotificationsForUser(user._id, countPerUser, now),
  );

  const result = await notificationsCollection.insertMany(notifications);

  console.log(
    `Seeded ${result.insertedCount} notifications for ${users.length} users (${countPerUser} per user).`,
  );
  console.log(
    `Removed ${removed.deletedCount} previous ${SEED_TAG} notifications.`,
  );
}

seedNotifications()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to seed notifications: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
