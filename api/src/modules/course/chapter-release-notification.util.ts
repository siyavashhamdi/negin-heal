import { CourseChapter } from "../../database/schemas";
import { coercePaidAt, resolveChapterUnlocksAt } from "./chapter-access.util";

export type ChapterReleaseNotificationEntry = {
  key: string;
  notificationId?: unknown;
};

export function parseVisibleAfterMinutes(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function isTimedChapterCandidate(chapter: CourseChapter): boolean {
  if (chapter.isFree) {
    return false;
  }

  const visibleAfterMinutes = parseVisibleAfterMinutes(
    chapter.visibleAfterMinutes,
  );

  return visibleAfterMinutes != null && visibleAfterMinutes >= 0;
}

export function isChapterReleaseDue(
  paidAt: unknown,
  visibleAfterMinutes: number,
  now: Date = new Date(),
): boolean {
  const normalizedPaidAt = coercePaidAt(paidAt);
  if (!normalizedPaidAt) {
    return false;
  }

  const unlocksAt = resolveChapterUnlocksAt(
    normalizedPaidAt,
    visibleAfterMinutes,
  );
  if (!unlocksAt) {
    return false;
  }

  return now.getTime() >= unlocksAt.getTime();
}

export function getCompletedNotificationChapterKeys(
  entries: ChapterReleaseNotificationEntry[] | undefined,
): Set<string> {
  return new Set(
    (entries ?? [])
      .filter((entry) => entry.notificationId != null)
      .map((entry) => entry.key),
  );
}

export function findDueChapterReleaseNotifications(
  chapters: CourseChapter[],
  paidAt: unknown,
  notifiedKeys: ReadonlySet<string>,
  now: Date = new Date(),
): CourseChapter[] {
  return sortChaptersForNotification(chapters).filter((chapter) => {
    if (!isTimedChapterCandidate(chapter)) {
      return false;
    }

    if (notifiedKeys.has(chapter.key)) {
      return false;
    }

    const visibleAfterMinutes = parseVisibleAfterMinutes(
      chapter.visibleAfterMinutes,
    );
    if (visibleAfterMinutes == null) {
      return false;
    }

    return isChapterReleaseDue(paidAt, visibleAfterMinutes, now);
  });
}

export function sortChaptersForNotification(
  chapters: CourseChapter[],
): CourseChapter[] {
  return [...chapters].sort((first, second) => {
    const firstSortOrder = first.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const secondSortOrder = second.sortOrder ?? Number.MAX_SAFE_INTEGER;

    if (firstSortOrder !== secondSortOrder) {
      return firstSortOrder - secondSortOrder;
    }

    return first.title.localeCompare(second.title, "fa");
  });
}

export function buildChapterReleaseRetryClaimFilter(
  userCourseId: unknown,
  chapterKey: string,
): Record<string, unknown> {
  return {
    _id: userCourseId,
    "chapterReleaseNotifications.chapters": {
      $elemMatch: {
        key: chapterKey,
        $or: [
          { notificationId: { $exists: false } },
          { notificationId: null },
        ],
      },
    },
  };
}

export function buildChapterReleasePushClaimFilter(
  userCourseId: unknown,
  chapterKey: string,
): Record<string, unknown> {
  return {
    _id: userCourseId,
    $or: [
      {
        "chapterReleaseNotifications.chapters": {
          $not: {
            $elemMatch: { key: chapterKey },
          },
        },
      },
      { chapterReleaseNotifications: { $exists: false } },
      { "chapterReleaseNotifications.chapters": { $exists: false } },
    ],
  };
}
