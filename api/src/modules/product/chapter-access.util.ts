export type ChapterAccessInput = {
  isFree?: boolean;
  visibleAfterMinutes?: number;
};

export type ChapterAccessContext = {
  isProductFree: boolean;
  isPurchased: boolean;
  paidAt?: Date;
  now?: Date;
};

export function coercePaidAt(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function resolveChapterUnlocksAt(
  paidAt: Date | undefined,
  visibleAfterMinutes: number | undefined,
): Date | undefined {
  const normalizedPaidAt = coercePaidAt(paidAt);
  if (!normalizedPaidAt || typeof visibleAfterMinutes !== "number") {
    return undefined;
  }

  return new Date(normalizedPaidAt.getTime() + visibleAfterMinutes * 60_000);
}

export function canAccessChapter(
  chapter: ChapterAccessInput,
  context: ChapterAccessContext,
): boolean {
  if (chapter.isFree) {
    return true;
  }

  if (typeof chapter.visibleAfterMinutes === "number") {
    if (!context.isPurchased) {
      return false;
    }

    if (!context.paidAt) {
      return true;
    }

    const paidAt = coercePaidAt(context.paidAt);
    if (!paidAt) {
      return false;
    }

    const unlocksAt = resolveChapterUnlocksAt(
      paidAt,
      chapter.visibleAfterMinutes,
    );
    if (!unlocksAt) {
      return true;
    }

    const now = context.now ?? new Date();
    return now.getTime() >= unlocksAt.getTime();
  }

  return context.isProductFree || context.isPurchased;
}
