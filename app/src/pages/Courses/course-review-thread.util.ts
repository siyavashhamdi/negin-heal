import {
  resolveAdminCourseReviewMessageSenderLabel,
  resolveAdminReviewAuthorLabel,
  resolveCourseReviewThreadEntryAuthorLabel,
  type AdminCourseReviewRecord,
  type EndUserCourseReviewRecord,
} from "./course-reviews.api";

export type CourseReviewThreadEntry = {
  readonly key: string;
  readonly body: string;
  readonly sentAt: string;
  readonly authorLabel: string;
  readonly isOwnMessage: boolean;
  readonly isSupport: boolean;
  readonly stars?: number;
};

export type CourseReviewThreadMessageSegment = {
  readonly key: string;
  readonly body: string;
  readonly sentAt: string;
  readonly authorLabel: string;
  readonly isSupport: boolean;
  readonly stars?: number;
  readonly showAuthorLabel: boolean;
};

export function buildCourseReviewThreadEntries(
  review: EndUserCourseReviewRecord | null,
): CourseReviewThreadEntry[] {
  if (!review) {
    return [];
  }

  const isReviewOwnedByViewer = review.isMine;
  const entries: CourseReviewThreadEntry[] = [];

  if (review.rating?.comment?.trim()) {
    entries.push({
      key: "initial",
      body: review.rating.comment.trim(),
      sentAt: review.rating.updatedAt ?? review.rating.ratedAt,
      authorLabel: resolveCourseReviewThreadEntryAuthorLabel({
        senderFirstName: review.author.firstName,
        isSupport: false,
        isReviewOwnedByViewer,
      }),
      isOwnMessage: isReviewOwnedByViewer,
      isSupport: false,
    });
  }

  for (const message of review.messages) {
    entries.push({
      key: message.key,
      body: message.body,
      sentAt: message.sentAt,
      authorLabel: resolveCourseReviewThreadEntryAuthorLabel({
        senderFirstName: message.sender.firstName,
        isSupport: message.sender.isSupport,
        isReviewOwnedByViewer,
      }),
      isOwnMessage: isReviewOwnedByViewer && !message.sender.isSupport,
      isSupport: message.sender.isSupport,
    });
  }

  return entries.sort(
    (left, right) => new Date(right.sentAt).getTime() - new Date(left.sentAt).getTime(),
  );
}

export function sortCourseReviewThreadEntriesChronologically(
  entries: ReadonlyArray<CourseReviewThreadEntry>,
): CourseReviewThreadEntry[] {
  return [...entries].sort(
    (left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
  );
}

export type CourseReviewThreadPreviewMode = "newest" | "oldest";

export function resolveCourseReviewThreadPreviewEntries(
  entries: ReadonlyArray<CourseReviewThreadEntry>,
  previewLimit: number,
  collapsed: boolean,
  previewMode: CourseReviewThreadPreviewMode = "newest",
): CourseReviewThreadEntry[] {
  const chronological = sortCourseReviewThreadEntriesChronologically(entries);

  if (!collapsed || entries.length <= previewLimit) {
    return chronological;
  }

  if (previewMode === "oldest") {
    return chronological.slice(0, previewLimit);
  }

  return chronological.slice(-previewLimit);
}

function insertStarsOnlyEntry(
  entries: CourseReviewThreadEntry[],
  starsOnlyEntry: CourseReviewThreadEntry,
): CourseReviewThreadEntry[] {
  const starsTime = new Date(starsOnlyEntry.sentAt).getTime();
  const insertIndex = entries.findIndex((entry) => {
    const entryTime = new Date(entry.sentAt).getTime();
    return entryTime < starsTime;
  });

  if (insertIndex === -1) {
    return [...entries, starsOnlyEntry];
  }

  return [
    ...entries.slice(0, insertIndex),
    starsOnlyEntry,
    ...entries.slice(insertIndex),
  ];
}

export function buildCourseReviewDisplayThreadEntries(
  review: EndUserCourseReviewRecord | null,
): CourseReviewThreadEntry[] {
  const entries = buildCourseReviewThreadEntries(review);
  const rating = review?.rating;
  if (!rating || rating.stars < 1) {
    return entries;
  }

  const initialIndex = entries.findIndex((entry) => entry.key === "initial");
  if (initialIndex >= 0) {
    return entries.map((entry, index) =>
      index === initialIndex ? { ...entry, stars: rating.stars } : entry,
    );
  }

  const isReviewOwnedByViewer = Boolean(review?.isMine);
  const starsOnlyEntry: CourseReviewThreadEntry = {
    key: "initial",
    body: "",
    sentAt: rating.updatedAt ?? rating.ratedAt,
    authorLabel: resolveCourseReviewThreadEntryAuthorLabel({
      senderFirstName: review?.author.firstName ?? "کاربر",
      isSupport: false,
      isReviewOwnedByViewer,
    }),
    isOwnMessage: isReviewOwnedByViewer,
    isSupport: false,
    stars: rating.stars,
  };

  return insertStarsOnlyEntry(entries, starsOnlyEntry);
}

export function buildAdminCourseReviewThreadEntries(
  review: AdminCourseReviewRecord,
): CourseReviewThreadEntry[] {
  const ownerLabel = resolveAdminReviewAuthorLabel(review);
  const entries: CourseReviewThreadEntry[] = [];

  if (review.rating?.comment?.trim()) {
    entries.push({
      key: "initial",
      body: review.rating.comment.trim(),
      sentAt: review.rating.updatedAt ?? review.rating.ratedAt,
      authorLabel: ownerLabel,
      isOwnMessage: false,
      isSupport: false,
    });
  }

  for (const message of review.messages) {
    const isSupport = message.senderUserId !== review.userId;

    entries.push({
      key: message.key,
      body: message.body,
      sentAt: message.sentAt,
      authorLabel: resolveAdminCourseReviewMessageSenderLabel(review, message),
      isOwnMessage: false,
      isSupport,
    });
  }

  return entries.sort(
    (left, right) => new Date(right.sentAt).getTime() - new Date(left.sentAt).getTime(),
  );
}

function resolveThreadReplierKey(input: {
  readonly isSupport: boolean;
  readonly isOwnMessage: boolean;
  readonly authorLabel: string;
}): string {
  if (input.isSupport) {
    return "support";
  }

  return input.isOwnMessage ? "owner" : `author:${input.authorLabel}`;
}

export function buildCourseReviewThreadSegments(
  entries: ReadonlyArray<CourseReviewThreadEntry>,
): CourseReviewThreadMessageSegment[] {
  const segments: CourseReviewThreadMessageSegment[] = [];
  let previousReplierKey: string | null = null;

  for (const entry of entries) {
    const replierKey = resolveThreadReplierKey(entry);
    const showAuthorLabel = replierKey !== previousReplierKey;
    const body = entry.body.trim();

    if (body || entry.stars != null) {
      segments.push({
        key: entry.key,
        body,
        sentAt: entry.sentAt,
        authorLabel: entry.authorLabel,
        isSupport: entry.isSupport,
        stars: entry.stars,
        showAuthorLabel,
      });
    }

    previousReplierKey = replierKey;
  }

  return segments;
}
