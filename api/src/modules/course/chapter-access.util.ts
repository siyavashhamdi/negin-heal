export type ChapterAccessInput = {
  isFree?: boolean;
  visibleAfterMinutes?: number;
};

export type ChapterAccessContext = {
  isCourseFree: boolean;
  isPurchased: boolean;
  paidAt?: Date;
  now?: Date;
};

export function resolveChapterUnlocksAt(
  paidAt: Date | undefined,
  visibleAfterMinutes: number | undefined,
): Date | undefined {
  if (!paidAt || typeof visibleAfterMinutes !== "number") {
    return undefined;
  }

  return new Date(paidAt.getTime() + visibleAfterMinutes * 60_000);
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

    const unlocksAt = resolveChapterUnlocksAt(
      context.paidAt,
      chapter.visibleAfterMinutes,
    );
    if (!unlocksAt) {
      return true;
    }

    const now = context.now ?? new Date();
    return now.getTime() >= unlocksAt.getTime();
  }

  return context.isCourseFree || context.isPurchased;
}
