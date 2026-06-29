import {
  PRODUCT_ROUTE_ID_PARAM,
  PRODUCTS_API_ROUTE_PATH,
  PRODUCTS_ROUTE_PATH,
} from "./product-route-path.constants.mjs";

export { PRODUCT_ROUTE_ID_PARAM, PRODUCTS_API_ROUTE_PATH, PRODUCTS_ROUTE_PATH };

export const PRODUCTS_ROUTE_PATH_PREFIX = `${PRODUCTS_ROUTE_PATH}/` as const;

export const PRODUCT_DETAIL_ROUTE_PATTERN =
  `${PRODUCTS_ROUTE_PATH}/:${PRODUCT_ROUTE_ID_PARAM}` as const;

const PRODUCTS_ROUTE_PATH_REGEX = PRODUCTS_ROUTE_PATH.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const PRODUCTS_EDIT_PATH_REGEX = new RegExp(`^${PRODUCTS_ROUTE_PATH_REGEX}/edit/([^/]+)$`);

export const PRODUCT_DETAIL_ROUTE_REGEX = new RegExp(
  `^${PRODUCTS_ROUTE_PATH_REGEX}/[^/]+(?:/(?:purchase|max))?$`
);

export const PRODUCT_DETAIL_PAGE_ROUTE_REGEX = new RegExp(`^${PRODUCTS_ROUTE_PATH_REGEX}/[^/]+$`);

export const PRODUCTS_EDIT_PAGE_ROUTE_REGEX = new RegExp(
  `^${PRODUCTS_ROUTE_PATH_REGEX}/edit/[^/]+$`
);

export const PRODUCTS_DELETE_PAGE_ROUTE_REGEX = new RegExp(
  `^${PRODUCTS_ROUTE_PATH_REGEX}/delete/[^/]+$`
);

export function productsRoutePath(...segments: readonly string[]): string {
  if (segments.length === 0) {
    return PRODUCTS_ROUTE_PATH;
  }

  return `${PRODUCTS_ROUTE_PATH}/${segments.join("/")}`;
}

export function productDetailPath(productId: string): string {
  return productsRoutePath(productId);
}

export function productsPaymentZarinPalVerifyApiPath(): string {
  return `${PRODUCTS_API_ROUTE_PATH}/payment/zarinpal/verify`;
}

export function isProductsRoutePrefix(pathname: string): boolean {
  return pathname === PRODUCTS_ROUTE_PATH || pathname.startsWith(PRODUCTS_ROUTE_PATH_PREFIX);
}

export function isProductDetailRoutePathname(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "");
  return PRODUCT_DETAIL_ROUTE_REGEX.test(normalized.length > 0 ? normalized : "/");
}
