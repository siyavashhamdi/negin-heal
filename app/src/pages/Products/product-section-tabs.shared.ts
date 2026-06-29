export type ProductSectionTab = "intro" | "content" | "reviews";

export const PRODUCT_SECTION_TABS: ReadonlyArray<{
  readonly value: ProductSectionTab;
  readonly label: string;
}> = [
  { value: "intro", label: "معرفی دوره" },
  { value: "content", label: "محتوای دوره" },
  { value: "reviews", label: "امتیاز و نظرات" },
];

export const PRODUCT_FORM_SECTION_TABS: ReadonlyArray<{
  readonly value: ProductSectionTab;
  readonly label: string;
}> = [
  { value: "intro", label: "اطلاعات اصلی" },
  { value: "content", label: "فصل‌ها" },
  { value: "reviews", label: "امتیاز و نظرات" },
];

export const PRODUCT_DETAIL_SECTION_TARGETS: Record<ProductSectionTab, string> = {
  intro: "product-intro",
  content: "product-content",
  reviews: "product-reviews",
};

export const PRODUCT_FORM_SECTION_TARGETS: Record<ProductSectionTab, string> = {
  intro: "product-form-intro",
  content: "product-form-content",
  reviews: "product-form-reviews",
};
