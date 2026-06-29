/**
 * Seeds coupons into the renamed `coupons` collection.
 * Data was exported from the legacy `payment_coupons` collection on 2026-06-16.
 *
 * Run:
 *   npm run seed:coupons
 */
import { resolve } from "path";
import { config } from "dotenv";
import mongoose, { Types } from "mongoose";

import { CouponDiscountType } from "../enums";

config({ path: resolve(process.cwd(), ".env") });

type SeedCouponDefinition = {
  _id: string;
  code: string;
  title: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  startsAt?: string;
  expiresAt?: string;
  totalUsageLimit?: number;
  perUserUsageLimit?: number;
  applicableProductIds: string[];
  isFirstPurchaseOnly: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  note?: string;
  audit: {
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    deletedBy?: string;
  };
};

type SeedCouponDocument = {
  _id: Types.ObjectId;
  code: string;
  title: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  startsAt?: Date;
  expiresAt?: Date;
  totalUsageLimit?: number;
  perUserUsageLimit?: number;
  applicableProductIds: Types.ObjectId[];
  isFirstPurchaseOnly: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  note?: string;
  audit: {
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    deletedBy?: Types.ObjectId;
  };
};

const COUPON_DEFINITIONS: SeedCouponDefinition[] = [
  {
    _id: "6a2ebc3b2e87f21c19582a8e",
    code: "TEST-PRODUCT-MULTI",
    title: "QA multi-product coupon",
    description: "Applicable to three selected active products.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 200000,
    applicableProductIds: [
      "6a2d1bf45ee4d985f372f0eb",
      "6a2d1bf45ee4d985f372f0e1",
      "6a2d1bf45ee4d985f372f0f5",
    ],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "product-scoped to multiple active products",
    },
    note: "product-scoped to multiple active products",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a8d",
    code: "TEST-PRODUCT-ONLY-A",
    title: "QA single-product coupon",
    description: "Only applicable to the pregnancy preparation product.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 40,
    applicableProductIds: ["6a2d1bf45ee4d985f372f0eb"],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "product-scoped to one active product",
    },
    note: "product-scoped to one active product",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a86",
    code: "TEST-EXPIRED",
    title: "QA expired coupon",
    description: "Coupon with an expired date window.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 20,
    startsAt: "2026-05-31T14:35:38.880Z",
    expiresAt: "2026-06-13T14:35:38.880Z",
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "expired coupon should be rejected",
    },
    note: "expired coupon should be rejected",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a8a",
    code: "TEST-FIRST-PURCHASE",
    title: "QA first purchase only coupon",
    description: "Only valid for users with no committed purchases.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 35,
    applicableProductIds: [],
    isFirstPurchaseOnly: true,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "first-purchase-only condition",
    },
    note: "first-purchase-only condition",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a80",
    code: "TEST-FIXED-500K",
    title: "QA fixed 500k coupon",
    description: "Valid medium fixed amount coupon.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 500000,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "valid medium fixed amount",
    },
    note: "valid medium fixed amount",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a7f",
    code: "TEST-FIXED-50K",
    title: "QA fixed 50k coupon",
    description: "Valid small fixed amount coupon.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 50000,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "valid small fixed amount",
    },
    note: "valid small fixed amount",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a81",
    code: "TEST-FIXED-HUGE",
    title: "QA oversized fixed coupon",
    description:
      "Fixed amount larger than many product prices to verify final amount floors at zero.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 99999999,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "oversized fixed amount should be capped by payable amount",
    },
    note: "oversized fixed amount should be capped by payable amount",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a85",
    code: "TEST-FUTURE-START",
    title: "QA future start coupon",
    description: "Coupon that has not started yet.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 20,
    startsAt: "2026-06-21T14:35:38.880Z",
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "future startsAt should be rejected until active",
    },
    note: "future startsAt should be rejected until active",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a84",
    code: "TEST-INACTIVE",
    title: "QA inactive coupon",
    description: "Inactive coupon for invalid-state testing.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 25,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: false,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "inactive coupon should be rejected",
    },
    note: "inactive coupon should be rejected",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a88",
    code: "TEST-NO-END",
    title: "QA started no-expiry coupon",
    description: "Coupon with a start date and no expiry date.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 150000,
    startsAt: "2026-06-13T14:35:38.880Z",
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "started coupon without expiresAt",
    },
    note: "started coupon without expiresAt",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a89",
    code: "TEST-NO-START",
    title: "QA expiry-only coupon",
    description: "Coupon with an expiry date and no start date.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 175000,
    expiresAt: "2026-06-21T14:35:38.880Z",
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "expiresAt without startsAt",
    },
    note: "expiresAt without startsAt",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a7b",
    code: "TEST-PCT-10",
    title: "QA 10% percentage coupon",
    description: "Valid global percentage coupon.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 10,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "valid global percentage",
    },
    note: "valid global percentage",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a7d",
    code: "TEST-PCT-100",
    title: "QA 100% percentage coupon",
    description: "Valid coupon that can reduce payable amount to zero.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 100,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "full discount percentage",
    },
    note: "full discount percentage",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a7e",
    code: "TEST-PCT-150",
    title: "QA 150% capped percentage coupon",
    description:
      "Percentage above 100 to verify validation caps at full payable amount.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 150,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "percentage value above 100 should be capped by service",
    },
    note: "percentage value above 100 should be capped by service",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a7c",
    code: "TEST-PCT-50",
    title: "QA 50% percentage coupon",
    description: "Valid large global percentage coupon.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 50,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "valid high percentage",
    },
    note: "valid high percentage",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a8c",
    code: "TEST-PER-USER-1",
    title: "QA per-user usage limit one coupon",
    description: "Coupon with per-user usage limit set to one.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 125000,
    perUserUsageLimit: 1,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "per-user usage limit boundary; same user rejected after one committed use",
    },
    note: "per-user usage limit boundary; same user rejected after one committed use",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a8b",
    code: "TEST-TOTAL-LIMIT-1",
    title: "QA total usage limit one coupon",
    description: "Coupon with total usage limit set to one.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 15,
    totalUsageLimit: 1,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "total usage limit boundary; becomes exhausted after one committed use",
    },
    note: "total usage limit boundary; becomes exhausted after one committed use",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a87",
    code: "TEST-WINDOW-ACTIVE",
    title: "QA currently active date-window coupon",
    description: "Coupon with valid startsAt and expiresAt around today.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 30,
    startsAt: "2026-06-13T14:35:38.880Z",
    expiresAt: "2026-06-21T14:35:38.880Z",
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "currently inside valid date window",
    },
    note: "currently inside valid date window",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a83",
    code: "TEST-ZERO-FIXED",
    title: "QA zero fixed coupon",
    description: "Active but ineffective fixed coupon.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 0,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "should fail because it does not reduce payable amount",
    },
    note: "should fail because it does not reduce payable amount",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebc3b2e87f21c19582a82",
    code: "TEST-ZERO-PCT",
    title: "QA zero percent coupon",
    description: "Active but ineffective percentage coupon.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 0,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Comprehensive coupon QA seed",
      source: "cursor-direct-db-seed",
      note: "should fail because it does not reduce payable amount",
    },
    note: "should fail because it does not reduce payable amount",
    audit: {
      createdAt: "2026-06-14T14:35:38.880Z",
      updatedAt: "2026-06-14T14:35:38.880Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582a9a",
    code: "TEST_ACTIVE_WINDOW_15",
    title: "Test active scheduled 15 percent",
    description: "Valid scheduled coupon inside active date window.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 15,
    startsAt: "2026-06-13T14:43:12.405Z",
    expiresAt: "2026-07-14T14:43:12.405Z",
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Valid scheduled coupon inside active date window.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582a9e",
    code: "TEST_BOTH_LIMITS",
    title: "Test total and per-user limits",
    description:
      "Valid with both totalUsageLimit and perUserUsageLimit configured.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 75000,
    totalUsageLimit: 5,
    perUserUsageLimit: 1,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Valid with both totalUsageLimit and perUserUsageLimit configured.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582a9f",
    code: "TEST_PRODUCT1_20",
    title: "Test product 1 only 20 percent",
    description: "Only applicable to one active product.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 20,
    applicableProductIds: ["6a2d1bf55ee4d985f372f0ff"],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Only applicable to one active product.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582aa0",
    code: "TEST_PRODUCT2_FIXED",
    title: "Test product 2 only fixed 100k",
    description: "Only applicable to one active product.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 100000,
    applicableProductIds: ["6a2d1bf45ee4d985f372f0fa"],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Only applicable to one active product.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582a99",
    code: "TEST_EXPIRED_30",
    title: "Test expired 30 percent",
    description: "Invalid because expiresAt is in the past.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 30,
    startsAt: "2026-05-15T14:43:12.405Z",
    expiresAt: "2026-06-13T14:43:12.405Z",
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Invalid because expiresAt is in the past.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582a9b",
    code: "TEST_FIRST_ONLY_40",
    title: "Test first purchase only 40 percent",
    description: "Valid only for users with no committed purchases.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 40,
    applicableProductIds: [],
    isFirstPurchaseOnly: true,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Valid only for users with no committed purchases.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582a95",
    code: "TEST_FIXED_200K",
    title: "Test fixed 200k IRT",
    description: "Valid larger fixed amount coupon.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 200000,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Valid larger fixed amount coupon.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe022e87f21c19582a94",
    code: "TEST_FIXED_50K",
    title: "Test fixed 50k IRT",
    description: "Valid fixed amount coupon.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 50000,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Valid fixed amount coupon.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582a96",
    code: "TEST_FIXED_HUGE",
    title: "Test huge fixed amount",
    description:
      "Fixed amount higher than most products; service caps at payable amount.",
    discountType: CouponDiscountType.FIXED_AMOUNT,
    discountValue: 999999999,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Fixed amount higher than most products; service caps at payable amount.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582a98",
    code: "TEST_FUTURE_30",
    title: "Test future startsAt 30 percent",
    description: "Invalid until startsAt is reached.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 30,
    startsAt: "2026-06-15T14:43:12.405Z",
    expiresAt: "2026-07-14T14:43:12.405Z",
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Invalid until startsAt is reached.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe022e87f21c19582a90",
    code: "TEST_GLOBAL_10",
    title: "Test global 10 percent",
    description: "Valid global percentage coupon.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 10,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Valid global percentage coupon.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe022e87f21c19582a92",
    code: "TEST_GLOBAL_100",
    title: "Test global 100 percent",
    description: "Valid coupon that can make payable amount zero.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 100,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Valid coupon that can make payable amount zero.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe022e87f21c19582a91",
    code: "TEST_GLOBAL_25",
    title: "Test global 25 percent",
    description: "Valid global percentage coupon.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 25,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Valid global percentage coupon.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582a97",
    code: "TEST_INACTIVE_20",
    title: "Test inactive 20 percent",
    description: "Invalid because isActive is false.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 20,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: false,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Invalid because isActive is false.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582aa1",
    code: "TEST_MULTI_PRODUCT_15",
    title: "Test multi-product 15 percent",
    description: "Applicable to three active products.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 15,
    applicableProductIds: [
      "6a2d1bf55ee4d985f372f0ff",
      "6a2d1bf45ee4d985f372f0fa",
      "6a2d1bf45ee4d985f372f0f5",
    ],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Applicable to three active products.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe022e87f21c19582a93",
    code: "TEST_PERCENT_150_CAP",
    title: "Test percentage capped at 100",
    description:
      "Percentage above 100; service caps discount at payable amount.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 150,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Percentage above 100; service caps discount at payable amount.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582aa3",
    code: "TEST_SOFT_DELETED_20",
    title: "Test soft-deleted 20 percent",
    description:
      "Soft-deleted fixture; Mongoose queries should treat it like not found.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 20,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Soft-deleted fixture; Mongoose queries should treat it like not found.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
      deletedAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582a9c",
    code: "TEST_TOTAL_LIMIT_1",
    title: "Test total usage limit 1",
    description: "Valid until total committed coupon usage reaches 1.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 15,
    totalUsageLimit: 1,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Valid until total committed coupon usage reaches 1.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582a9d",
    code: "TEST_USER_LIMIT_1",
    title: "Test per-user usage limit 1",
    description: "Valid until the same user has one committed usage.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 15,
    perUserUsageLimit: 1,
    applicableProductIds: [],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Valid until the same user has one committed usage.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
  {
    _id: "6a2ebe032e87f21c19582aa2",
    code: "TEST_WRONG_PRODUCT_40",
    title: "Test non-matching product 40 percent",
    description:
      "Product-scoped to a fake product ID, so it should be inapplicable to real products.",
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 40,
    applicableProductIds: ["000000000000000000000001"],
    isFirstPurchaseOnly: false,
    isActive: true,
    metadata: {
      campaignName: "Coupon QA fixtures",
      source: "manual-db-seed",
      note: "Product-scoped to a fake product ID, so it should be inapplicable to real products.",
    },
    audit: {
      createdAt: "2026-06-14T14:43:12.405Z",
    },
  },
];

function getRequiredEnv(name: "MONGODB_URI" | "MONGODB_DATABASE"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required. Add it to api/.env before seeding.`);
  }

  return value;
}

function toObjectId(value?: string): Types.ObjectId | undefined {
  return value ? new Types.ObjectId(value) : undefined;
}

function buildCoupons(): SeedCouponDocument[] {
  return COUPON_DEFINITIONS.map((coupon) => ({
    _id: new Types.ObjectId(coupon._id),
    code: coupon.code,
    title: coupon.title,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    startsAt: coupon.startsAt ? new Date(coupon.startsAt) : undefined,
    expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : undefined,
    totalUsageLimit: coupon.totalUsageLimit,
    perUserUsageLimit: coupon.perUserUsageLimit,
    applicableProductIds: coupon.applicableProductIds.map(
      (productId) => new Types.ObjectId(productId),
    ),
    isFirstPurchaseOnly: coupon.isFirstPurchaseOnly,
    isActive: coupon.isActive,
    metadata: coupon.metadata,
    note: coupon.note,
    audit: {
      createdAt: new Date(coupon.audit.createdAt),
      updatedAt: coupon.audit.updatedAt
        ? new Date(coupon.audit.updatedAt)
        : undefined,
      deletedAt: coupon.audit.deletedAt
        ? new Date(coupon.audit.deletedAt)
        : undefined,
      createdBy: toObjectId(coupon.audit.createdBy),
      updatedBy: toObjectId(coupon.audit.updatedBy),
      deletedBy: toObjectId(coupon.audit.deletedBy),
    },
  }));
}

async function seedCoupons(): Promise<void> {
  const uri = getRequiredEnv("MONGODB_URI");
  const dbName = getRequiredEnv("MONGODB_DATABASE");

  await mongoose.connect(uri, { dbName });

  const coupons = buildCoupons();
  const couponsCollection = mongoose.connection.db.collection("coupons");
  const seedIds = coupons.map((coupon) => coupon._id);
  const seedCodes = coupons.map((coupon) => coupon.code);

  const removedById = await couponsCollection.deleteMany({
    _id: { $in: seedIds },
  });
  const removedByCode = await couponsCollection.deleteMany({
    code: { $in: seedCodes },
  });

  const result = await couponsCollection.insertMany(coupons);

  console.log(
    `Seeded ${result.insertedCount} coupons into the coupons collection.`,
  );
  console.log(
    `Removed ${removedById.deletedCount} existing coupons by _id and ${removedByCode.deletedCount} by code before insert.`,
  );
}

seedCoupons()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to seed coupons: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
