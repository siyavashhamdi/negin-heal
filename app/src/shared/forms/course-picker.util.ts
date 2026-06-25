import type { CourseListItemRow } from "../../pages/Courses/courses-list.api";
import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";
import type { EntityAutocompleteOption } from "./EntityAutocompleteField";

export type CoursePickerOption = EntityAutocompleteOption & {
  readonly row?: CourseListItemRow;
};

export function calculateDiscountedCoursePrice(
  course: Pick<CourseListItemRow, "priceIrt" | "discount">
): number {
  const price = Math.max(0, course.priceIrt ?? 0);
  const discount = course.discount;
  if (!discount || discount.value <= 0 || price <= 0) {
    return price;
  }

  if (discount.type === "PERCENTAGE") {
    return Math.max(0, price - Math.round(price * (Math.min(discount.value, 100) / 100)));
  }

  return Math.max(0, price - Math.min(price, discount.value));
}

export function formatCoursePickerPrice(amount: number): string {
  return `${amount.toLocaleString("fa-IR").replace(/\u066c/g, ",")} تومان`;
}

export function mapCourseRowToPickerOption(row: CourseListItemRow): CoursePickerOption {
  const finalPrice = calculateDiscountedCoursePrice(row);

  return {
    id: row.id,
    label: row.title,
    subtitle: formatCoursePickerPrice(finalPrice),
    imageAccessUrl: row.coverImageAccessUrl as FileAccessUrl | null | undefined,
    row,
  };
}

export function createFallbackCoursePickerOption(courseId: string): CoursePickerOption {
  return {
    id: courseId,
    label: courseId,
    subtitle: courseId,
    imageUrl: null,
  };
}
