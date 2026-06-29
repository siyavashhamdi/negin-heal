import type { ProductListItemRow } from "../../pages/Products/product-list.api";
import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";
import type { EntityAutocompleteOption } from "./EntityAutocompleteField";

export type ProductPickerOption = EntityAutocompleteOption & {
  readonly row?: ProductListItemRow;
};

export function calculateDiscountedProductPrice(
  product: Pick<ProductListItemRow, "priceIrt" | "discount">
): number {
  const price = Math.max(0, product.priceIrt ?? 0);
  const discount = product.discount;
  if (!discount || discount.value <= 0 || price <= 0) {
    return price;
  }

  if (discount.type === "PERCENTAGE") {
    return Math.max(0, price - Math.round(price * (Math.min(discount.value, 100) / 100)));
  }

  return Math.max(0, price - Math.min(price, discount.value));
}

export function formatProductPickerPrice(amount: number): string {
  return `${amount.toLocaleString("fa-IR").replace(/\u066c/g, ",")} تومان`;
}

export function mapProductRowToPickerOption(row: ProductListItemRow): ProductPickerOption {
  const finalPrice = calculateDiscountedProductPrice(row);

  return {
    id: row.id,
    label: row.title,
    subtitle: formatProductPickerPrice(finalPrice),
    imageAccessUrl: row.coverImageAccessUrl as FileAccessUrl | null | undefined,
    row,
  };
}

export function createFallbackProductPickerOption(productId: string): ProductPickerOption {
  return {
    id: productId,
    label: productId,
    subtitle: productId,
    imageUrl: null,
  };
}
