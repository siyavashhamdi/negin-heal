export type CourseReviewMessageBubbleTone = "own" | "user" | "support";

export function resolveCourseReviewMessageBubbleTone(
  isMine: boolean,
  isSupport = false
): CourseReviewMessageBubbleTone {
  if (isSupport) {
    return "support";
  }

  return isMine ? "own" : "user";
}

export function getCourseReviewMessageBubbleClassName(
  styles: Record<string, string>,
  tone: CourseReviewMessageBubbleTone
): string {
  if (tone === "own") {
    return styles.reviewCommentBubbleOwn;
  }

  if (tone === "support") {
    return styles.reviewCommentBubbleSupport;
  }

  return styles.reviewCommentBubbleUser;
}
