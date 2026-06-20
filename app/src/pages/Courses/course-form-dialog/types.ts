import type { FileAccessUrl } from "../../../utils/fileAccessUrl.util";

export type DiscountKind = "PERCENTAGE" | "FIXED_AMOUNT_IRT";
export type VisibleAfterUnit = "MINUTES" | "HOURS" | "DAYS";
export type DraftItemContentType = "ARTICLE" | "FILE";

export type DraftItem = {
  id: string;
  title: string;
  contentType: DraftItemContentType;
  article: string;
  file: File | null;
  fileAccessUrl: FileAccessUrl | null;
};

export type DraftChapter = {
  id: string;
  title: string;
  description: string;
  visibleAfterMinutes: string;
  visibleAfterUnit: VisibleAfterUnit;
  isFree: boolean;
  items: DraftItem[];
};

export type ExpandedItemByChapter = Record<string, string | null>;
