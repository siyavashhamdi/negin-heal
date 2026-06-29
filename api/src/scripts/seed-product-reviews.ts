/**
 * Seeds review test users, mock product purchases, and product reviews.
 *
 * Run from api/:
 *   npm run seed:product-reviews
 *
 * Options:
 *   --users=100          Number of seed users to create (default: 100)
 *   --shift-dates-only   Subtract 3.5h from stored seed review/purchase dates
 *
 * Per userProduct review on every reviewable product:
 * - 1-10 user messages (rating comment + follow-ups)
 * - 1-5 PUBLIC SUPER_ADMIN replies appended after the user thread
 *
 * Re-running removes previous seed data tagged with SEED_TAG before inserting fresh data.
 */
import * as bcrypt from "bcrypt";
import { randomInt, randomUUID } from "crypto";
import { resolve } from "path";
import { config } from "dotenv";
import mongoose, { Types } from "mongoose";

import { ProductDiscountType } from "../enums/product-discount-type.enum";
import { ProductReviewVisibility } from "../enums/product-review-visibility.enum";
import { UserProductPaymentMethod } from "../enums/user-product-payment-method.enum";
import { UserProductPurchaseCurrency } from "../enums/user-product-purchase-currency.enum";
import { UserProductPurchaseStatus } from "../enums/user-product-purchase-status.enum";
import { UserRole } from "../enums/user-role.enum";
import { UserStatus } from "../enums/user-status.enum";
import { isProductFree } from "../modules/product/product-pricing.util";

config({ path: resolve(process.cwd(), ".env") });

const SEED_TAG = "seed:product-reviews";
const STORED_DATE_SHIFT_MS = 3.5 * 60 * 60 * 1000;
const USERNAME_PREFIX = "seed-review-";
const DEFAULT_PASSWORD = "SeedReview123!";
const SALT_ROUNDS = 10;

const FIRST_NAMES = [
  "سارا",
  "مریم",
  "نازنین",
  "الهام",
  "زهرا",
  "فاطمه",
  "مهسا",
  "نیلوفر",
  "پریسا",
  "شیما",
  "امیر",
  "محمد",
  "علی",
  "رضا",
  "حسین",
  "امید",
  "پویا",
  "کامران",
  "بهرام",
  "سینا",
];

const LAST_NAMES = [
  "احمدی",
  "محمدی",
  "حسینی",
  "رضایی",
  "کریمی",
  "جعفری",
  "موسوی",
  "نوری",
  "صادقی",
  "اکبری",
  "رحیمی",
  "قاسمی",
  "زارعی",
  "ملکی",
  "شریفی",
];

const REVIEW_COMMENTS = [
  "محتوای دوره بسیار کاربردی بود و تمرین‌ها کمک زیادی به من کرد.",
  "ارائه مفاهیم به زبان ساده و قابل فهم بود. از شرکت در دوره راضی‌ام.",
  "بعضی فصل‌ها می‌توانست عمیق‌تر باشد، اما در کل ارزش وقت گذاشتن داشت.",
  "بعد از این دوره توانستم در رابطه‌ام ارتباط بهتری برقرار کنم.",
  "تمرین‌های عملی عالی بودند و حس می‌کنم واقعاً پیشرفت کرده‌ام.",
  "پشتیبانی و ساختار دوره منظم بود. پیشنهاد می‌کنم.",
  "برای شروع مسیر یادگیری این موضوع، دوره خوبی است.",
  "نکات کلیدی خیلی خوب جمع‌بندی شده بودند.",
  "چند بخش را دوباره گوش دادم چون واقعاً مفید بود.",
  "انتظار داشتم مثال‌های بیشتری ببینم، اما کیفیت کلی خوب بود.",
  "از نظر علمی و عملی متعادل بود و برای زندگی روزمره قابل اجراست.",
  "این دوره دیدگاه تازه‌ای به من داد. ممنون از تیم محتوا.",
];

const ADMIN_REPLY_COMMENTS = [
  "از بازخورد شما متشکریم. خوشحالیم که دوره برایتان مفید بوده است.",
  "نکته‌ای که مطرح کردید را به تیم محتوا منتقل می‌کنیم.",
  "پیشنهاد شما در به‌روزرسانی‌های بعدی دوره در نظر گرفته می‌شود.",
  "اگر سوال دیگری دارید، از بخش پشتیبانی با ما در ارتباط باشید.",
  "ممنون از وقتی که برای نوشتن نظر گذاشتید. موفق باشید.",
  "خوشحالیم که تمرین‌های عملی برایتان کاربردی بوده‌اند.",
];

type SeedProduct = {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  priceIrt?: number;
  discount?: {
    type: ProductDiscountType;
    value: number;
  };
  isActive: boolean;
  isReviewSubmissionEnabled?: boolean;
  isReviewsSectionVisible?: boolean;
};

type SeedUser = {
  _id: Types.ObjectId;
  username: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
};

type ProductPriceSummary = {
  amountIrt: number;
  discountPercentage?: number;
  discountAmountIrt?: number;
  finalAmountIrt: number;
};

function getRequiredEnv(name: "MONGODB_URI" | "MONGODB_DATABASE"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required. Add it to api/.env before seeding.`);
  }

  return value;
}

function parsePositiveIntArg(
  flag: string,
  fallback: number,
  max?: number,
): number {
  const arg = process.argv.find((entry) => entry.startsWith(`${flag}=`));
  if (!arg) {
    return fallback;
  }

  const parsed = Number.parseInt(arg.slice(`${flag}=`.length), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${flag} must be a positive integer.`);
  }

  return max ? Math.min(parsed, max) : parsed;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(items.length)]!;
}

function randomStars(): number {
  return randomInt(1, 6);
}

function buildUsername(index: number): string {
  return `${USERNAME_PREFIX}${String(index).padStart(3, "0")}`;
}

function buildUserSnapshot(user: SeedUser): {
  fullName: string;
  username: string;
  email: string;
  phone?: string;
} {
  const firstName = user.profile?.firstName ?? "";
  const lastName = user.profile?.lastName ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    fullName: fullName || user.username,
    username: user.username,
    email: user.profile?.email ?? `${user.username}@seed.negin`,
    phone: user.profile?.phoneNumber,
  };
}

function buildReviewUserSnapshot(user: SeedUser): {
  fullName: string;
  username: string;
} {
  const snapshot = buildUserSnapshot(user);

  return {
    fullName: snapshot.fullName,
    username: snapshot.username,
  };
}

function calculateProductPriceSummary(
  product: SeedProduct,
): ProductPriceSummary {
  const amountIrt = Math.max(product.priceIrt ?? 0, 0);
  const discount = product.discount;

  if (!discount || discount.value <= 0 || amountIrt <= 0) {
    return {
      amountIrt,
      finalAmountIrt: amountIrt,
    };
  }

  const discountAmountIrt =
    discount.type === ProductDiscountType.PERCENTAGE
      ? Math.round((amountIrt * Math.min(discount.value, 100)) / 100)
      : Math.min(discount.value, amountIrt);
  const finalAmountIrt = Math.max(amountIrt - discountAmountIrt, 0);
  const discountPercentage =
    amountIrt > 0 ? Math.round((discountAmountIrt / amountIrt) * 100) : 0;

  return {
    amountIrt,
    discountPercentage,
    discountAmountIrt,
    finalAmountIrt,
  };
}

function buildPaidAt(now: Date, productIndex: number, userIndex: number): Date {
  const daysAgo = 3 + ((productIndex * 7 + userIndex * 3) % 90);
  return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

function buildRatedAt(paidAt: Date, now: Date): Date {
  const daysSincePurchase = Math.floor(
    (now.getTime() - paidAt.getTime()) / (24 * 60 * 60 * 1000),
  );
  const daysAfterPurchase =
    daysSincePurchase < 1 ? 0 : 1 + randomInt(Math.min(14, daysSincePurchase));
  return new Date(paidAt.getTime() + daysAfterPurchase * 24 * 60 * 60 * 1000);
}

function randomUserMessageCount(): number {
  return randomInt(1, 11);
}

function randomAdminReplyCount(): number {
  return randomInt(1, 6);
}

function shiftStoredDate(value: unknown): Date | undefined {
  if (value == null) {
    return undefined;
  }

  const date =
    value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Date(date.getTime() - STORED_DATE_SHIFT_MS);
}

async function shiftStoredSeedDates(
  usersCollection: mongoose.mongo.Collection,
  userProductsCollection: mongoose.mongo.Collection,
  productReviewsCollection: mongoose.mongo.Collection,
): Promise<{
  shiftedUsers: number;
  shiftedUserProducts: number;
  shiftedReviews: number;
}> {
  const reviews = await productReviewsCollection
    .find({ "audit.seedTag": SEED_TAG })
    .toArray();
  let shiftedReviews = 0;

  for (const review of reviews) {
    const $set: Record<string, unknown> = {};
    const ratedAt = shiftStoredDate(review.rating?.ratedAt);
    const ratingUpdatedAt = shiftStoredDate(review.rating?.updatedAt);
    const auditCreatedAt = shiftStoredDate(review.audit?.createdAt);
    const auditUpdatedAt = shiftStoredDate(review.audit?.updatedAt);

    if (ratedAt) {
      $set["rating.ratedAt"] = ratedAt;
    }
    if (ratingUpdatedAt) {
      $set["rating.updatedAt"] = ratingUpdatedAt;
    }
    if (auditCreatedAt) {
      $set["audit.createdAt"] = auditCreatedAt;
    }
    if (auditUpdatedAt) {
      $set["audit.updatedAt"] = auditUpdatedAt;
    }

    if (Array.isArray(review.messages) && review.messages.length > 0) {
      $set.messages = review.messages.map((message) => {
        const sentAt = shiftStoredDate(message.sentAt);
        return sentAt ? { ...message, sentAt } : message;
      });
    }

    if (Object.keys($set).length === 0) {
      continue;
    }

    await productReviewsCollection.updateOne({ _id: review._id }, { $set });
    shiftedReviews += 1;
  }

  const userProducts = await userProductsCollection
    .find({ "purchase.paymentReference": SEED_TAG })
    .toArray();
  let shiftedUserProducts = 0;

  for (const userProduct of userProducts) {
    const $set: Record<string, unknown> = {};
    const paidAt = shiftStoredDate(userProduct.purchase?.paidAt);
    const auditCreatedAt = shiftStoredDate(userProduct.audit?.createdAt);
    const auditUpdatedAt = shiftStoredDate(userProduct.audit?.updatedAt);

    if (paidAt) {
      $set["purchase.paidAt"] = paidAt;
    }
    if (auditCreatedAt) {
      $set["audit.createdAt"] = auditCreatedAt;
    }
    if (auditUpdatedAt) {
      $set["audit.updatedAt"] = auditUpdatedAt;
    }

    if (Object.keys($set).length === 0) {
      continue;
    }

    await userProductsCollection.updateOne({ _id: userProduct._id }, { $set });
    shiftedUserProducts += 1;
  }

  const users = await usersCollection
    .find({ username: { $regex: `^${USERNAME_PREFIX}` } })
    .toArray();
  let shiftedUsers = 0;

  for (const user of users) {
    const $set: Record<string, unknown> = {};
    const emailVerifiedAt = shiftStoredDate(user.verification?.emailVerifiedAt);
    const mobileVerifiedAt = shiftStoredDate(
      user.verification?.mobileVerifiedAt,
    );
    const auditCreatedAt = shiftStoredDate(user.audit?.createdAt);
    const auditUpdatedAt = shiftStoredDate(user.audit?.updatedAt);

    if (emailVerifiedAt) {
      $set["verification.emailVerifiedAt"] = emailVerifiedAt;
    }
    if (mobileVerifiedAt) {
      $set["verification.mobileVerifiedAt"] = mobileVerifiedAt;
    }
    if (auditCreatedAt) {
      $set["audit.createdAt"] = auditCreatedAt;
    }
    if (auditUpdatedAt) {
      $set["audit.updatedAt"] = auditUpdatedAt;
    }

    if (Object.keys($set).length === 0) {
      continue;
    }

    await usersCollection.updateOne({ _id: user._id }, { $set });
    shiftedUsers += 1;
  }

  return { shiftedUsers, shiftedUserProducts, shiftedReviews };
}

function buildReviewConversation(
  user: SeedUser,
  superAdminId: Types.ObjectId,
  superAdmin: SeedUser,
  ratedAt: Date,
  now: Date,
  userMessageCount: number,
  adminReplyCount: number,
): {
  ratingComment: string;
  messages: Record<string, unknown>[];
  lastMessageAt: Date;
} {
  const followUpUserCount = Math.max(userMessageCount - 1, 0);
  const totalThreadMessages = followUpUserCount + adminReplyCount;
  const messages: Record<string, unknown>[] = [];

  const conversationEndAt = now;
  const spanMs = Math.max(
    conversationEndAt.getTime() - ratedAt.getTime(),
    totalThreadMessages > 0 ? totalThreadMessages * 30 * 60 * 1000 : 0,
  );

  let messageIndex = 0;
  let lastSentAt = ratedAt;

  const nextSentAt = (): Date => {
    messageIndex += 1;
    if (totalThreadMessages === 0) {
      return ratedAt;
    }

    lastSentAt = new Date(
      ratedAt.getTime() + (messageIndex / totalThreadMessages) * spanMs,
    );
    return lastSentAt;
  };

  for (let index = 0; index < followUpUserCount; index += 1) {
    messages.push({
      key: randomUUID(),
      body: pickRandom(REVIEW_COMMENTS),
      senderUserId: new Types.ObjectId(user._id),
      senderSnapshot: buildReviewUserSnapshot(user),
      sentAt: nextSentAt(),
      moderation: {
        visibility: ProductReviewVisibility.PUBLIC,
      },
    });
  }

  for (let index = 0; index < adminReplyCount; index += 1) {
    messages.push({
      key: randomUUID(),
      body: pickRandom(ADMIN_REPLY_COMMENTS),
      senderUserId: superAdminId,
      senderSnapshot: buildReviewUserSnapshot(superAdmin),
      sentAt: nextSentAt(),
      moderation: {
        visibility: ProductReviewVisibility.PUBLIC,
      },
    });
  }

  return {
    ratingComment: pickRandom(REVIEW_COMMENTS),
    messages,
    lastMessageAt: messages.length > 0 ? lastSentAt : ratedAt,
  };
}

async function findSuperAdminUser(
  usersCollection: mongoose.mongo.Collection,
): Promise<{ id: Types.ObjectId; user: SeedUser }> {
  const superAdmin = await usersCollection.findOne(
    {
      roles: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    {
      projection: {
        username: 1,
        profile: 1,
      },
      sort: { "audit.createdAt": 1 },
    },
  );

  if (!superAdmin?._id) {
    throw new Error(
      "No active SUPER_ADMIN user found. Run migrations or create an admin user before seeding reviews.",
    );
  }

  const id = new Types.ObjectId(superAdmin._id);

  return {
    id,
    user: {
      _id: id,
      username: superAdmin.username,
      profile: superAdmin.profile,
    },
  };
}

async function cleanupPreviousSeedData(
  usersCollection: mongoose.mongo.Collection,
  userProductsCollection: mongoose.mongo.Collection,
  productReviewsCollection: mongoose.mongo.Collection,
): Promise<{
  removedUsers: number;
  removedUserProducts: number;
  removedReviews: number;
}> {
  const seedUsers = await usersCollection
    .find(
      { username: { $regex: `^${USERNAME_PREFIX}` } },
      { projection: { _id: 1 } },
    )
    .toArray();
  const seedUserIds = seedUsers.map((user) => user._id);

  const [removedReviewsByTag, removedUserProductsByTag] = await Promise.all([
    productReviewsCollection.deleteMany({ "audit.seedTag": SEED_TAG }),
    userProductsCollection.deleteMany({
      "purchase.paymentReference": SEED_TAG,
    }),
  ]);

  let removedReviewsByUser = { deletedCount: 0 };
  let removedUserProductsByUser = { deletedCount: 0 };

  if (seedUserIds.length > 0) {
    [removedReviewsByUser, removedUserProductsByUser] = await Promise.all([
      productReviewsCollection.deleteMany({ userId: { $in: seedUserIds } }),
      userProductsCollection.deleteMany({ userId: { $in: seedUserIds } }),
    ]);
  }

  const removedUsers = await usersCollection.deleteMany({
    username: { $regex: `^${USERNAME_PREFIX}` },
  });

  return {
    removedUsers: removedUsers.deletedCount ?? 0,
    removedReviews:
      (removedReviewsByTag.deletedCount ?? 0) +
      (removedReviewsByUser.deletedCount ?? 0),
    removedUserProducts:
      (removedUserProductsByTag.deletedCount ?? 0) +
      (removedUserProductsByUser.deletedCount ?? 0),
  };
}

async function createSeedUsers(
  usersCollection: mongoose.mongo.Collection,
  userCount: number,
  now: Date,
): Promise<SeedUser[]> {
  const passwordSalt = await bcrypt.genSalt(SALT_ROUNDS);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, passwordSalt);

  const users = Array.from({ length: userCount }, (_, index) => {
    const username = buildUsername(index + 1);
    const firstName = pickRandom(FIRST_NAMES);
    const lastName = pickRandom(LAST_NAMES);

    return {
      _id: new Types.ObjectId(),
      username,
      authentication: {
        passwordHash,
        passwordSalt,
        failedLoginAttempts: 0,
      },
      profile: {
        firstName,
        lastName,
        email: `${username}@seed.negin`,
        phoneNumber: `+98912${String(1000000 + index).slice(-7)}`,
      },
      verification: {
        emailVerifiedAt: now,
        mobileVerifiedAt: now,
      },
      preferences: {
        language: "fa",
        timezone: "Asia/Tehran",
        notificationsEnabled: true,
        theme: "light",
      },
      roles: [UserRole.END_USER],
      status: UserStatus.ACTIVE,
      audit: {
        createdAt: now,
        updatedAt: now,
        seedTag: SEED_TAG,
      },
    };
  });

  await usersCollection.insertMany(users);

  return users.map((user) => ({
    _id: user._id,
    username: user.username,
    profile: user.profile,
  }));
}

async function seedProductReviews(): Promise<void> {
  const uri = getRequiredEnv("MONGODB_URI");
  const dbName = getRequiredEnv("MONGODB_DATABASE");
  const userCount = parsePositiveIntArg("--users", 100);

  await mongoose.connect(uri, { dbName });

  const db = mongoose.connection.db;
  const usersCollection = db.collection("users");
  const productsCollection = db.collection("products");
  const userProductsCollection = db.collection("user_products");
  const productReviewsCollection = db.collection("product_reviews");

  if (process.argv.includes("--shift-dates-only")) {
    const shifted = await shiftStoredSeedDates(
      usersCollection,
      userProductsCollection,
      productReviewsCollection,
    );
    console.log(
      `Shifted stored seed dates back by 3.5h: users=${shifted.shiftedUsers}, user_products=${shifted.shiftedUserProducts}, reviews=${shifted.shiftedReviews}.`,
    );
    return;
  }

  const cleanup = await cleanupPreviousSeedData(
    usersCollection,
    userProductsCollection,
    productReviewsCollection,
  );

  const products = (await productsCollection
    .find(
      {
        isActive: true,
        $or: [
          { "audit.deletedAt": null },
          { "audit.deletedAt": { $exists: false } },
        ],
      },
      {
        projection: {
          title: 1,
          description: 1,
          priceIrt: 1,
          discount: 1,
          isActive: 1,
          isReviewSubmissionEnabled: 1,
          isReviewsSectionVisible: 1,
        },
      },
    )
    .sort({ sortOrder: 1, "audit.createdAt": 1 })
    .toArray()) as SeedProduct[];

  if (products.length === 0) {
    console.log("No active products found. Seed users were not created.");
    console.log(
      `Cleanup: users=${cleanup.removedUsers}, user_products=${cleanup.removedUserProducts}, reviews=${cleanup.removedReviews}.`,
    );
    return;
  }

  const reviewableProducts = products.filter(
    (product) =>
      product.isReviewSubmissionEnabled !== false &&
      product.isReviewsSectionVisible !== false,
  );

  if (reviewableProducts.length === 0) {
    console.log("No products with review submission enabled were found.");
    console.log(
      `Cleanup: users=${cleanup.removedUsers}, user_products=${cleanup.removedUserProducts}, reviews=${cleanup.removedReviews}.`,
    );
    return;
  }

  const now = new Date();
  const [users, superAdmin] = await Promise.all([
    createSeedUsers(usersCollection, userCount, now),
    findSuperAdminUser(usersCollection),
  ]);

  console.log(
    `Using SUPER_ADMIN ${superAdmin.id.toString()} (@${superAdmin.user.username}) for support replies.`,
  );

  const userProductsToInsert: Record<string, unknown>[] = [];
  const reviewsToInsert: Record<string, unknown>[] = [];
  const userMessagesPerReview: number[] = [];
  const adminRepliesPerReview: number[] = [];

  users.forEach((user, userIndex) => {
    reviewableProducts.forEach((product, productIndex) => {
      const userProductId = new Types.ObjectId();
      const paidAt = buildPaidAt(now, userIndex, productIndex);
      const ratedAt = buildRatedAt(paidAt, now);
      const stars = randomStars();
      const priceSummary = calculateProductPriceSummary(product);
      const productIsFree = isProductFree(product);
      const userSnapshot = buildUserSnapshot(user);
      const userMessageCount = randomUserMessageCount();
      const adminReplyCount = randomAdminReplyCount();
      const conversation = buildReviewConversation(
        user,
        superAdmin.id,
        superAdmin.user,
        ratedAt,
        now,
        userMessageCount,
        adminReplyCount,
      );

      userProductsToInsert.push({
        _id: userProductId,
        userId: user._id,
        productId: product._id,
        userSnapshot,
        productSnapshot: {
          title: product.title,
          description: product.description,
          priceIrt: priceSummary.amountIrt,
          ...(product.discount ? { discount: product.discount } : {}),
        },
        purchase: {
          status: UserProductPurchaseStatus.PAID,
          amountIrt: priceSummary.amountIrt,
          discountPercentage: priceSummary.discountPercentage,
          discountAmountIrt: priceSummary.discountAmountIrt,
          finalAmountIrt: priceSummary.finalAmountIrt,
          currency: UserProductPurchaseCurrency.IRT,
          paymentMethod: productIsFree
            ? UserProductPaymentMethod.FREE
            : UserProductPaymentMethod.GATEWAY,
          paymentProvider: productIsFree ? undefined : "ZARINPAL",
          paymentReference: SEED_TAG,
          transactionId: `seed-txn-${randomUUID()}`,
          paidAt,
          submittedInitiallyByAdmin: false,
          isManualStatusChange: false,
        },
        progress: { chapters: [] },
        chapterReleaseNotifications: { chapters: [] },
        audit: {
          createdAt: paidAt,
          updatedAt: paidAt,
          seedTag: SEED_TAG,
        },
      });

      reviewsToInsert.push({
        userId: user._id,
        productId: product._id,
        userProductId,
        userSnapshot: buildReviewUserSnapshot(user),
        productSnapshot: {
          title: product.title,
        },
        moderation: {
          visibility: ProductReviewVisibility.PUBLIC,
        },
        rating: {
          stars,
          comment: conversation.ratingComment,
          ratedAt,
          moderation: {
            visibility: ProductReviewVisibility.PUBLIC,
          },
        },
        messages: conversation.messages,
        audit: {
          createdAt: ratedAt,
          updatedAt: conversation.lastMessageAt,
          seedTag: SEED_TAG,
        },
      });

      userMessagesPerReview.push(userMessageCount);
      adminRepliesPerReview.push(adminReplyCount);
    });
  });

  if (userProductsToInsert.length > 0) {
    await userProductsCollection.insertMany(userProductsToInsert);
  }

  if (reviewsToInsert.length > 0) {
    await productReviewsCollection.insertMany(reviewsToInsert);
  }

  const minUserMessages =
    userMessagesPerReview.length > 0 ? Math.min(...userMessagesPerReview) : 0;
  const maxUserMessages =
    userMessagesPerReview.length > 0 ? Math.max(...userMessagesPerReview) : 0;
  const minAdminReplies =
    adminRepliesPerReview.length > 0 ? Math.min(...adminRepliesPerReview) : 0;
  const maxAdminReplies =
    adminRepliesPerReview.length > 0 ? Math.max(...adminRepliesPerReview) : 0;
  const totalAdminReplies = adminRepliesPerReview.reduce(
    (sum, count) => sum + count,
    0,
  );

  console.log(
    `Seeded ${users.length} users, ${userProductsToInsert.length} mock purchases, and ${reviewsToInsert.length} product reviews.`,
  );
  console.log(
    `Coverage: every user reviewed each of ${reviewableProducts.length} reviewable products.`,
  );
  console.log(
    `User messages per review: ${minUserMessages}-${maxUserMessages} (rating comment + follow-ups).`,
  );
  console.log(
    `SUPER_ADMIN replies (${superAdmin.user.username} / ${superAdmin.id.toString()}): ${totalAdminReplies} total, ${minAdminReplies}-${maxAdminReplies} per review.`,
  );
  console.log("Star ratings are random 1-5.");
  console.log(`Default seed user password: ${DEFAULT_PASSWORD}`);
  console.log(
    `Cleanup before seed: users=${cleanup.removedUsers}, user_products=${cleanup.removedUserProducts}, reviews=${cleanup.removedReviews}.`,
  );
}

seedProductReviews()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to seed product reviews: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
