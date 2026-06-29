/**
 * This file imports all migrations so they are automatically registered.
 * When you create a new migration, add an import statement here.
 */

// Import migrations in order (they will be sorted by version automatically)
export * from "./001-create-default-super-admin-users.migration";
export * from "./002-seed-default-app-settings.migration";
export * from "./003-rename-course-collections-to-product.migration";
export * from "./004-repair-course-to-product-collection-rename.migration";

// Add more migrations here as you create them:
