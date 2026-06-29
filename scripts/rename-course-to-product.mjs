#!/usr/bin/env node
/**
 * Renames product -> product across the codebase.
 * Excludes: locales/, exception.constant.ts
 * Preserves: i18n translation keys and EXCEPTION_CONSTANT.* error codes in code.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "dist.next",
  ".git",
  "build",
  "coverage",
]);

const SKIP_FILE_SUFFIXES = ["/locales/"];
const SKIP_FILES = new Set([
  path.join(ROOT, "api/src/constants/exception.constant.ts"),
]);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".scss",
  ".css",
  ".html",
  ".md",
  ".txt",
  ".php",
  ".yml",
  ".yaml",
  ".xml",
]);

function shouldSkipFile(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (SKIP_FILES.has(filePath)) return true;
  if (normalized.includes("/locales/")) return true;
  if (normalized.includes("/android/app/build/")) return true;
  if (normalized.includes("/android/app/src/main/assets/")) return true;
  if (normalized.includes("/api/dist/")) return true;
  if (normalized.includes("/api/dist.next/")) return true;
  return false;
}

function walkDir(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".github") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkDir(full, files);
    } else if (entry.isFile()) {
      if (!shouldSkipFile(full)) files.push(full);
    }
  }
  return files;
}

function renamePathSegment(name) {
  const rules = [
    [/user-product-review/gi, (m) => matchCase(m, "user-product-review")],
    [/user-product/gi, (m) => matchCase(m, "user-product")],
    [/userProductReview/g, "userProductReview"],
    [/UserProductReview/g, "UserProductReview"],
    [/userProduct/g, "userProduct"],
    [/UserProduct/g, "UserProduct"],
    [/product-review/gi, (m) => matchCase(m, "product-review")],
    [/ProductReview/g, "ProductReview"],
    [/productReview/g, "productReview"],
    [/product-payment/gi, (m) => matchCase(m, "product-payment")],
    [/ProductPayment/g, "ProductPayment"],
    [/productPayment/g, "productPayment"],
    [/product-chapter/gi, (m) => matchCase(m, "product-chapter")],
    [/ProductChapter/g, "ProductChapter"],
    [/productChapter/g, "productChapter"],
    [/product-form/gi, (m) => matchCase(m, "product-form")],
    [/ProductForm/g, "ProductForm"],
    [/product-form/gi, (m) => matchCase(m, "product-form")],
    [/product-detail/gi, (m) => matchCase(m, "product-detail")],
    [/ProductDetail/g, "ProductDetail"],
    [/productDetail/g, "productDetail"],
    [/product-delete/gi, (m) => matchCase(m, "product-delete")],
    [/ProductDelete/g, "ProductDelete"],
    [/product-list/gi, (m) => matchCase(m, "products-list")],
    [/products-list/gi, (m) => matchCase(m, "products-list")],
    [/ProductsList/g, "ProductsList"],
    [/product-list/gi, (m) => matchCase(m, "product-list")],
    [/ProductList/g, "ProductList"],
    [/product-purchase/gi, (m) => matchCase(m, "product-purchase")],
    [/ProductPurchase/g, "ProductPurchase"],
    [/productPurchase/g, "productPurchase"],
    [/product-pricing/gi, (m) => matchCase(m, "product-pricing")],
    [/ProductPricing/g, "ProductPricing"],
    [/product-picker/gi, (m) => matchCase(m, "product-picker")],
    [/ProductPicker/g, "ProductPicker"],
    [/product-tag/gi, (m) => matchCase(m, "product-tag")],
    [/ProductTag/g, "ProductTag"],
    [/product-section/gi, (m) => matchCase(m, "product-section")],
    [/ProductSection/g, "ProductSection"],
    [/product-item/gi, (m) => matchCase(m, "product-item")],
    [/ProductItem/g, "ProductItem"],
    [/product-discount/gi, (m) => matchCase(m, "product-discount")],
    [/ProductDiscount/g, "ProductDiscount"],
    [/product-release/gi, (m) => matchCase(m, "product-release")],
    [/ProductRelease/g, "ProductRelease"],
    [/product-delete/gi, (m) => matchCase(m, "product-delete")],
    [/featured-products/gi, (m) => matchCase(m, "featured-products")],
    [/FeaturedProducts/g, "FeaturedProducts"],
    [/seed-real-products/gi, (m) => matchCase(m, "seed-real-products")],
    [/seed-product-reviews/gi, (m) => matchCase(m, "seed-product-reviews")],
    [/notification-product/gi, (m) => matchCase(m, "notification-product")],
    [/EndUserProduct/g, "EndUserProduct"],
    [/useAdminProduct/g, "useAdminProduct"],
    [/useProduct/g, "useProduct"],
    [/products/g, "products"],
    [/Products/g, "Products"],
    [/product/g, "product"],
    [/Product/g, "Product"],
  ];

  let result = name;
  for (const [pattern, replacement] of rules) {
    if (typeof replacement === "function") {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, replacement);
    }
  }
  return result;
}

function matchCase(source, target) {
  if (source === source.toUpperCase()) return target.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target;
}

function renameDirectories() {
  const dirRenames = [
    ["api/src/modules/product-review", "api/src/modules/product-review"],
    ["api/src/modules/product", "api/src/modules/product"],
    ["app/src/pages/Products/product-form-dialog", "app/src/pages/Products/product-form-dialog"],
    ["app/src/pages/Products", "app/src/pages/Products"],
  ];

  for (const [fromRel, toRel] of dirRenames) {
    const from = path.join(ROOT, fromRel);
    const to = path.join(ROOT, toRel);
    if (fs.existsSync(from) && !fs.existsSync(to)) {
      fs.renameSync(from, to);
      console.log(`DIR  ${fromRel} -> ${toRel}`);
    }
  }
}

function renameFiles() {
  const allFiles = walkDir(ROOT);
  const toRename = allFiles
    .filter((f) => /product/i.test(path.basename(f)))
    .sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);

  for (const filePath of toRename) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    const newBase = renamePathSegment(base);
    if (newBase !== base) {
      const newPath = path.join(dir, newBase);
      if (!fs.existsSync(newPath)) {
        fs.renameSync(filePath, newPath);
        console.log(`FILE ${path.relative(ROOT, filePath)} -> ${path.relative(ROOT, newPath)}`);
      }
    }
  }
}

const I18N_PLACEHOLDER_PREFIX = "__I18N_KEEP_";
let i18nPlaceholderCounter = 0;
const i18nPlaceholders = new Map();

function protectI18nAndErrors(content) {
  const patterns = [
    /pages\.products\.[a-zA-Z0-9_.${}`]+/g,
    /app\.pageTitles\.product[a-zA-Z]*/g,
    /seo\.pages\.product[a-zA-Z.]*/g,
    /table\.pages\.[a-zA-Z.]*product[a-zA-Z.]*/gi,
    /pages\.notifications\.[a-zA-Z.]*product[a-zA-Z.]*/gi,
    /EXCEPTION_CONSTANT\.[A-Z_]*COURSE[A-Z_]*/g,
    /EXCEPTION_CONSTANT\.USER_PRODUCT_[A-Z_]*/g,
    /EXCEPTION_CONSTANT\.COUPON_[A-Z_]*COURSE[A-Z_]*/g,
    /EXCEPTION_CONSTANT\.MANUAL_PAYMENT_[A-Z_]*COURSE[A-Z_]*/g,
    /["']PRODUCT_[A-Z_]+["']/g,
    /["']USER_PRODUCT_[A-Z_]+["']/g,
    /failCourseValidation/g,
    /failProductValidation/g, // restore if double-run
  ];

  let result = content;
  for (const pattern of patterns) {
    result = result.replace(pattern, (match) => {
      const key = `${I18N_PLACEHOLDER_PREFIX}${i18nPlaceholderCounter++}__`;
      i18nPlaceholders.set(key, match);
      return key;
    });
  }
  return result;
}

function restorePlaceholders(content) {
  let result = content;
  for (const [key, value] of i18nPlaceholders) {
    result = result.split(key).join(value);
  }
  return result;
}

const CONTENT_REPLACEMENTS = [
  // MongoDB collections & refs
  ['collection: "products"', 'collection: "products"'],
  ['collection: "user_products"', 'collection: "user_products"'],
  ['collection: "product_reviews"', 'collection: "product_reviews"'],
  ['ref: "Product"', 'ref: "Product"'],
  ['ref: "UserProduct"', 'ref: "UserProduct"'],
  ['ref: "ProductReview"', 'ref: "ProductReview"'],
  // Routes
  ['"/products"', '"/products"'],
  ["'/products'", "'/products'"],
  ["/products/", "/products/"],
  [":productId", ":productId"],
  // GraphQL names and identifiers - longest first
  ["userProductReviewList", "userProductReviewList"],
  ["UserProductReviewList", "UserProductReviewList"],
  ["userProductReview", "userProductReview"],
  ["UserProductReview", "UserProductReview"],
  ["productReviewModerationUpdate", "productReviewModerationUpdate"],
  ["ProductReviewModerationUpdate", "ProductReviewModerationUpdate"],
  ["productReviewSubmit", "productReviewSubmit"],
  ["ProductReviewSubmit", "ProductReviewSubmit"],
  ["productReviewList", "productReviewList"],
  ["ProductReviewList", "ProductReviewList"],
  ["userProductDetail", "userProductDetail"],
  ["UserProductDetail", "UserProductDetail"],
  ["userProductList", "userProductList"],
  ["UserProductList", "UserProductList"],
  ["productPaymentStatusUpdate", "productPaymentStatusUpdate"],
  ["ProductPaymentStatusUpdate", "ProductPaymentStatusUpdate"],
  ["productPaymentManualCreate", "productPaymentManualCreate"],
  ["ProductPaymentManualCreate", "ProductPaymentManualCreate"],
  ["productPaymentDetail", "productPaymentDetail"],
  ["ProductPaymentDetail", "ProductPaymentDetail"],
  ["productPaymentList", "productPaymentList"],
  ["ProductPaymentList", "ProductPaymentList"],
  ["productChapterComplete", "productChapterComplete"],
  ["ProductChapterComplete", "ProductChapterComplete"],
  ["productPurchaseSubmit", "productPurchaseSubmit"],
  ["ProductPurchaseSubmit", "ProductPurchaseSubmit"],
  ["productDeleteDependencies", "productDeleteDependencies"],
  ["ProductDeleteDependencies", "ProductDeleteDependencies"],
  ["productPayment", "productPayment"],
  ["ProductPayment", "ProductPayment"],
  ["userProduct", "userProduct"],
  ["UserProduct", "UserProduct"],
  ["productReview", "productReview"],
  ["ProductReview", "ProductReview"],
  ["productChapter", "productChapter"],
  ["ProductChapter", "ProductChapter"],
  ["productSnapshot", "productSnapshot"],
  ["ProductSnapshot", "ProductSnapshot"],
  ["productId", "productId"],
  ["ProductId", "ProductId"],
  ["productIds", "productIds"],
  ["ProductIds", "ProductIds"],
  ["productTitle", "productTitle"],
  ["ProductTitle", "ProductTitle"],
  ["productLookup", "productLookup"],
  ["productById", "productById"],
  ["productDetail", "productDetail"],
  ["ProductDetail", "ProductDetail"],
  ["productList", "productList"],
  ["ProductList", "ProductList"],
  ["productCreate", "productCreate"],
  ["ProductCreate", "ProductCreate"],
  ["productUpdate", "productUpdate"],
  ["ProductUpdate", "ProductUpdate"],
  ["productDelete", "productDelete"],
  ["ProductDelete", "ProductDelete"],
  ["productPurchase", "productPurchase"],
  ["ProductPurchase", "ProductPurchase"],
  ["productPricing", "productPricing"],
  ["ProductPricing", "ProductPricing"],
  ["productPicker", "productPicker"],
  ["ProductPicker", "ProductPicker"],
  ["productTag", "productTag"],
  ["ProductTag", "ProductTag"],
  ["productForm", "productForm"],
  ["ProductForm", "ProductForm"],
  ["productItem", "productItem"],
  ["ProductItem", "ProductItem"],
  ["productDiscount", "productDiscount"],
  ["ProductDiscount", "ProductDiscount"],
  ["productRelease", "productRelease"],
  ["ProductRelease", "ProductRelease"],
  ["productContent", "productContent"],
  ["ProductContent", "ProductContent"],
  ["productLink", "productLink"],
  ["ProductLink", "ProductLink"],
  ["productCard", "productCard"],
  ["ProductCard", "ProductCard"],
  ["productsIndex", "productsIndex"],
  ["ProductsIndex", "ProductsIndex"],
  ["featuredProducts", "featuredProducts"],
  ["FeaturedProducts", "FeaturedProducts"],
  ["buildProductPostLoginRedirect", "buildProductPostLoginRedirect"],
  ["buildProductLoginReturnState", "buildProductLoginReturnState"],
  ["getProductContentIntroText", "getProductContentIntroText"],
  ["getProductContentAccessNoteText", "getProductContentAccessNoteText"],
  ["getProductTagChipSx", "getProductTagChipSx"],
  ["scrollToProductReviewBoxEnd", "scrollToProductReviewBoxEnd"],
  ["parseProductPaymentStatusNotificationProductId", "parseProductPaymentStatusNotificationProductId"],
  ["useProductPaymentStatusNotificationRefetch", "useProductPaymentStatusNotificationRefetch"],
  ["useProductPaymentReviewRecord", "useProductPaymentReviewRecord"],
  ["useProductReviewList", "useProductReviewList"],
  ["useProductReviewSubmit", "useProductReviewSubmit"],
  ["useAdminProductReviewModeration", "useAdminProductReviewModeration"],
  ["useAdminProductReviewReply", "useAdminProductReviewReply"],
  ["useLandingFeaturedProducts", "useLandingFeaturedProducts"],
  ["EndUserProductFilterTabs", "EndUserProductFilterTabs"],
  ["ProductModule", "ProductModule"],
  ["ProductReviewModule", "ProductReviewModule"],
  ["ProductService", "ProductService"],
  ["ProductReviewService", "ProductReviewService"],
  ["ProductDocument", "ProductDocument"],
  ["ProductReviewDocument", "ProductReviewDocument"],
  ["UserProductDocument", "UserProductDocument"],
  ["ProductWriteGqlInput", "ProductWriteGqlInput"],
  ["ProductCommonGqlInput", "ProductCommonGqlInput"],
  ["calculateProductDiscountAmount", "calculateProductDiscountAmount"],
  ["normalizeProduct", "normalizeProduct"],
  ["seed-real-products", "seed-real-products"],
  ["seed-product-reviews", "seed-product-reviews"],
  ["seed:products", "seed:products"],
  ["seed:product-reviews", "seed:product-reviews"],
  ["product-delete-dependency-impact", "product-delete-dependency-impact"],
  ["product-discount-kind", "product-discount-kind"],
  ["product-discount-type", "product-discount-type"],
  ["product-item-type", "product-item-type"],
  ["product-release-type", "product-release-type"],
  ["product-review-moderation-target", "product-review-moderation-target"],
  ["product-review-visibility", "product-review-visibility"],
  ["user-product-payment-method", "user-product-payment-method"],
  ["user-product-purchase-currency", "user-product-purchase-currency"],
  ["user-product-purchase-status", "user-product-purchase-status"],
  ['"/modules/product-review"', '"/modules/product-review"'],
  ['"/modules/product"', '"/modules/product"'],
  ["./product-review", "./product-review"],
  ["./product", "./product"],
  ["../product-review", "../product-review"],
  ["../product", "../product"],
  ["../../product", "../../product"],
  ["pages/Products/", "pages/Products/"],
  ["pages\\Products\\", "pages\\Products\\"],
  ["APP_SHELL_ROUTES.products", "APP_SHELL_ROUTES.products"],
  ["APP_SHELL_ROUTES.productDetail", "APP_SHELL_ROUTES.productDetail"],
  ["products:", "products:"],
  ["productDetail:", "productDetail:"],
  ["isProductDetailPath", "isProductDetailPath"],
  ["isProductPath", "isProductPath"],
  ["PRODUCT_", "PRODUCT_"], // careful - will be restored for exception constants via placeholders
  ["products", "products"],
  ["Products", "Products"],
  ["product", "product"],
  ["Product", "Product"],
];

function replaceContent(content) {
  i18nPlaceholders.clear();
  i18nPlaceholderCounter = 0;
  let result = protectI18nAndErrors(content);
  for (const [from, to] of CONTENT_REPLACEMENTS) {
    result = result.split(from).join(to);
  }
  result = restorePlaceholders(result);
  return result;
}

function updateFileContents() {
  const allFiles = walkDir(ROOT).filter((f) => {
    const ext = path.extname(f);
    return TEXT_EXTENSIONS.has(ext) && !shouldSkipFile(f);
  });

  let changed = 0;
  for (const filePath of allFiles) {
    const original = fs.readFileSync(filePath, "utf8");
    const updated = replaceContent(original);
    if (updated !== original) {
      fs.writeFileSync(filePath, updated, "utf8");
      changed++;
      console.log(`EDIT ${path.relative(ROOT, filePath)}`);
    }
  }
  console.log(`\nUpdated ${changed} files`);
}

console.log("=== Phase 1: Rename directories ===");
renameDirectories();

console.log("\n=== Phase 2: Rename files ===");
renameFiles();

console.log("\n=== Phase 3: Update file contents ===");
updateFileContents();

console.log("\nDone.");
