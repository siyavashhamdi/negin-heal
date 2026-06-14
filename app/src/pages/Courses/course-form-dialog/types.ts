export type DiscountKind = "PERCENTAGE" | "FIXED_AMOUNT_IRT";
export type VisibleAfterUnit = "MINUTES" | "HOURS" | "DAYS";
export type DraftItemContentType = "ARTICLE" | "FILE";

export type DraftItem = {
  id: string;
  title: string;
  contentType: DraftItemContentType;
  article: string;
  file: File | null;
  fileId: string;
};

export type DraftChapter = {
  id: string;
  title: string;
  description: string;
  iconFile: File | null;
  iconFileId: string;
  visibleAfterMinutes: string;
  visibleAfterUnit: VisibleAfterUnit;
  isFree: boolean;
  items: DraftItem[];
};

export type ExpandedItemByChapter = Record<string, string | null>;
