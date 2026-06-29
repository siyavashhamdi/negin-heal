import { productDetailPath } from "../routing/product-route-path";

export type NotificationProductLink = {
  readonly productId: string;
  readonly href: string;
  readonly actionLabel: "viewProduct" | "viewChapter";
  readonly chapterKey?: string;
};

const buildProductDetailHref = (productId: string, chapterKey?: string): string => {
  const baseHref = productDetailPath(productId);

  if (!chapterKey) {
    return baseHref;
  }

  const params = new URLSearchParams({ chapter: chapterKey });
  return `${baseHref}?${params.toString()}`;
};

export const resolveNotificationProductLink = (
  source: string,
  payload: Record<string, unknown> | null
): NotificationProductLink | null => {
  if (!payload) {
    return null;
  }

  const productId = typeof payload.productId === "string" ? payload.productId.trim() : "";

  if (!productId) {
    return null;
  }

  if (source === "PRODUCT_CHAPTER") {
    const chapterKey = typeof payload.chapterKey === "string" ? payload.chapterKey.trim() : "";

    if (!chapterKey) {
      return null;
    }

    return {
      productId,
      chapterKey,
      href: buildProductDetailHref(productId, chapterKey),
      actionLabel: "viewChapter",
    };
  }

  if (source === "PAYMENT") {
    return {
      productId,
      href: buildProductDetailHref(productId),
      actionLabel: "viewProduct",
    };
  }

  return null;
};
