import type { Db } from "mongodb";

export const COURSE_TO_PRODUCT_COLLECTION_RENAMES: ReadonlyArray<{
  readonly from: string;
  readonly to: string;
}> = [
  { from: "courses", to: "products" },
  { from: "user_courses", to: "user_products" },
  { from: "course_reviews", to: "product_reviews" },
];

export const COURSE_TO_PRODUCT_FIELD_RENAMES: ReadonlyArray<{
  readonly from: string;
  readonly to: string;
}> = [
  { from: "courseId", to: "productId" },
  { from: "courseSnapshot", to: "productSnapshot" },
  { from: "applicableCourseIds", to: "applicableProductIds" },
  { from: "userCourseId", to: "userProductId" },
];

export async function renameCollectionIfNeeded(
  db: Db,
  from: string,
  to: string,
): Promise<void> {
  const fromCollections = await db.listCollections({ name: from }).toArray();
  if (fromCollections.length === 0) {
    return;
  }

  const toCollections = await db.listCollections({ name: to }).toArray();
  if (toCollections.length === 0) {
    await db.collection(from).rename(to);
    return;
  }

  const fromCount = await db.collection(from).countDocuments();
  if (fromCount === 0) {
    return;
  }

  const toCount = await db.collection(to).countDocuments();
  if (toCount === 0) {
    await db.collection(to).drop();
    await db.collection(from).rename(to);
    return;
  }

  throw new Error(
    `Cannot rename collection "${from}" to "${to}": both collections contain documents`,
  );
}

export async function renameFieldsInCollection(
  db: Db,
  collectionName: string,
): Promise<void> {
  const exists = await db.listCollections({ name: collectionName }).toArray();
  if (exists.length === 0) {
    return;
  }

  const collection = db.collection(collectionName);

  for (const { from, to } of COURSE_TO_PRODUCT_FIELD_RENAMES) {
    await collection.updateMany(
      { [from]: { $exists: true } },
      { $rename: { [from]: to } },
    );
  }
}

export async function replaceEnumValues(
  db: Db,
  collectionName: string,
  field: string,
  replacements: ReadonlyArray<{ readonly from: string; readonly to: string }>,
): Promise<void> {
  const exists = await db.listCollections({ name: collectionName }).toArray();
  if (exists.length === 0) {
    return;
  }

  const collection = db.collection(collectionName);

  for (const { from, to } of replacements) {
    await collection.updateMany({ [field]: from }, { $set: { [field]: to } });
  }
}

export async function migrateCourseCollectionsToProduct(db: Db): Promise<void> {
  for (const { from, to } of COURSE_TO_PRODUCT_COLLECTION_RENAMES) {
    await renameCollectionIfNeeded(db, from, to);
  }

  for (const collectionName of [
    "products",
    "user_products",
    "product_reviews",
    "coupons",
  ]) {
    await renameFieldsInCollection(db, collectionName);
  }

  await replaceEnumValues(db, "notifications", "source", [
    { from: "COURSE", to: "PRODUCT" },
    { from: "COURSE_CHAPTER", to: "PRODUCT_CHAPTER" },
  ]);

  await replaceEnumValues(db, "tickets", "category", [
    { from: "COURSE", to: "PRODUCT" },
  ]);
}
