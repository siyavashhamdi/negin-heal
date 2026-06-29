import { ProductDiscountType } from "../../enums";

type ProductPricingSource = {
  readonly priceIrt?: number | null;
  readonly discount?: {
    readonly type: ProductDiscountType;
    readonly value: number;
  } | null;
};

export function isProductFree(product: ProductPricingSource): boolean {
  const price = product.priceIrt ?? 0;
  if (price <= 0) {
    return true;
  }

  const discount = product.discount;
  if (!discount || discount.value <= 0) {
    return false;
  }

  if (discount.type === ProductDiscountType.PERCENTAGE) {
    return discount.value >= 100;
  }

  return discount.value >= price;
}
