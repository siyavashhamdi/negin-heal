export type CourseReviewMessageBubbleTone = "own" | "user" | "support";

type CourseReviewMessageBubbleToneStyle = {
  readonly border: string;
  readonly background: string;
  readonly backgroundDark: string;
};

const COURSE_REVIEW_MESSAGE_TONE_STYLES: Record<
  CourseReviewMessageBubbleTone,
  CourseReviewMessageBubbleToneStyle
> = {
  own: {
    border: "#0d9488",
    background: "#ccfbf1",
    backgroundDark: "rgba(13, 148, 136, 0.24)",
  },
  support: {
    border: "#7c3aed",
    background: "#ede9fe",
    backgroundDark: "rgba(124, 58, 237, 0.24)",
  },
  user: {
    border: "#c9567e",
    background: "#fce7f3",
    backgroundDark: "rgba(201, 86, 126, 0.24)",
  },
};

export function resolveCourseReviewMessageBubbleTone(
  isMine: boolean,
  isSupport = false,
): CourseReviewMessageBubbleTone {
  if (isSupport) {
    return "support";
  }

  return isMine ? "own" : "user";
}

export function getCourseReviewMessageBubbleClassName(
  styles: Record<string, string>,
  tone: CourseReviewMessageBubbleTone,
): string {
  if (tone === "own") {
    return styles.reviewCommentBubbleOwn;
  }

  if (tone === "support") {
    return styles.reviewCommentBubbleSupport;
  }

  return styles.reviewCommentBubbleUser;
}

export function getCourseReviewMessageBubbleCssVars(
  tone: CourseReviewMessageBubbleTone,
  isDarkMode: boolean,
): Record<string, string> {
  const toneStyle = COURSE_REVIEW_MESSAGE_TONE_STYLES[tone];

  return {
    "--review-bubble-border": toneStyle.border,
    "--review-bubble-bg": isDarkMode ? toneStyle.backgroundDark : toneStyle.background,
  };
}
