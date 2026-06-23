import { getFileIdFromAccessUrl } from "../../utils/fileAccessUrl.util";
import { hasRichTextContent } from "../../utils/richTextHtml.util";
import type { DiscountKind, DraftChapter } from "./course-form-dialog/types";

export type CourseFormValidationSection = "intro" | "content";

export type CourseFormValidationResult =
  | { readonly valid: true }
  | {
      readonly valid: false;
      readonly message: string;
      readonly section: CourseFormValidationSection;
    };

type ValidateCourseFormInput = {
  readonly title: string;
  readonly parsedPriceIrt: number | undefined;
  readonly discountEnabled: boolean;
  readonly hasPositivePrice: boolean;
  readonly discountKind: DiscountKind;
  readonly discountValue: string;
  readonly chapters: DraftChapter[];
  readonly parseOptionalNumber: (value: string) => number | undefined;
};

function formatPersianNumber(value: number): string {
  return value.toLocaleString("fa-IR");
}

function formatChapterLabel(chapterIndex: number, chapterTitle: string): string {
  const chapterNumber = formatPersianNumber(chapterIndex + 1);
  const trimmedTitle = chapterTitle.trim();
  return trimmedTitle ? `فصل «${trimmedTitle}»` : `فصل ${chapterNumber}`;
}

function formatItemLabel(
  chapterIndex: number,
  itemIndex: number,
  chapterTitle: string,
  itemTitle: string,
): string {
  const chapterLabel = formatChapterLabel(chapterIndex, chapterTitle);
  const itemNumber = formatPersianNumber(itemIndex + 1);
  const trimmedItemTitle = itemTitle.trim();
  const itemLabel = trimmedItemTitle ? `آیتم «${trimmedItemTitle}»` : `آیتم ${itemNumber}`;
  return `${itemLabel} در ${chapterLabel}`;
}

function invalid(
  message: string,
  section: CourseFormValidationSection,
): CourseFormValidationResult {
  return { valid: false, message, section };
}

export function validateCourseForm(input: ValidateCourseFormInput): CourseFormValidationResult {
  if (!input.title.trim()) {
    return invalid("عنوان دوره الزامی است.", "intro");
  }

  if (input.parsedPriceIrt != null && input.parsedPriceIrt < 0) {
    return invalid("قیمت دوره نمی‌تواند منفی باشد.", "intro");
  }

  if (input.discountEnabled && input.hasPositivePrice) {
    const parsedDiscountValue = input.parseOptionalNumber(input.discountValue);
    if (parsedDiscountValue == null) {
      return invalid("مقدار تخفیف الزامی است.", "intro");
    }
    if (
      input.discountKind === "PERCENTAGE" &&
      (parsedDiscountValue <= 0 || parsedDiscountValue > 100)
    ) {
      return invalid("مقدار تخفیف درصدی باید بین ۰ تا ۱۰۰ باشد.", "intro");
    }
    if (input.discountKind === "FIXED_AMOUNT_IRT" && parsedDiscountValue <= 0) {
      return invalid("مقدار تخفیف ثابت باید عددی مثبت باشد.", "intro");
    }
    if (
      input.discountKind === "FIXED_AMOUNT_IRT" &&
      input.parsedPriceIrt != null &&
      parsedDiscountValue > input.parsedPriceIrt
    ) {
      return invalid("مقدار تخفیف ثابت نمی‌تواند بیشتر از قیمت دوره باشد.", "intro");
    }
  }

  if (input.chapters.length === 0) {
    return invalid("حداقل یک فصل لازم است.", "content");
  }

  for (let chapterIndex = 0; chapterIndex < input.chapters.length; chapterIndex += 1) {
    const chapter = input.chapters[chapterIndex];
    const chapterLabel = formatChapterLabel(chapterIndex, chapter.title);

    if (!chapter.title.trim()) {
      return invalid(`عنوان ${chapterLabel} الزامی است.`, "content");
    }

    const parsedVisibleAfter = input.parseOptionalNumber(chapter.visibleAfterMinutes);
    if (parsedVisibleAfter != null && parsedVisibleAfter < 0) {
      return invalid(`مقدار «نمایش بعد از» در ${chapterLabel} نمی‌تواند منفی باشد.`, "content");
    }

    if (chapter.items.length === 0) {
      return invalid(`${chapterLabel} باید حداقل یک آیتم داشته باشد.`, "content");
    }

    for (let itemIndex = 0; itemIndex < chapter.items.length; itemIndex += 1) {
      const item = chapter.items[itemIndex];
      const itemLabel = formatItemLabel(
        chapterIndex,
        itemIndex,
        chapter.title,
        item.title,
      );

      if (!item.title.trim()) {
        return invalid(`عنوان ${itemLabel} الزامی است.`, "content");
      }

      if (item.contentType === "FILE") {
        const hasStoredFile =
          item.file != null || Boolean(getFileIdFromAccessUrl(item.fileAccessUrl));
        if (!hasStoredFile) {
          return invalid(`برای ${itemLabel} باید فایل انتخاب شود.`, "content");
        }
        continue;
      }

      if (!hasRichTextContent(item.article)) {
        return invalid(`برای ${itemLabel} باید متن مقاله وارد شود.`, "content");
      }
    }
  }

  return { valid: true };
}
