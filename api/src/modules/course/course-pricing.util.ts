import { CourseDiscountType } from "../../enums";

type CoursePricingSource = {
  readonly priceIrt?: number | null;
  readonly discount?: {
    readonly type: CourseDiscountType;
    readonly value: number;
  } | null;
};

export function isCourseFree(course: CoursePricingSource): boolean {
  const price = course.priceIrt ?? 0;
  if (price <= 0) {
    return true;
  }

  const discount = course.discount;
  if (!discount || discount.value <= 0) {
    return false;
  }

  if (discount.type === CourseDiscountType.PERCENTAGE) {
    return discount.value >= 100;
  }

  return discount.value >= price;
}
