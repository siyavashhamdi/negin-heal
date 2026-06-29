export type ProductReviewMessageBubbleTone = "own" | "user" | "support";

export function resolveProductReviewMessageBubbleTone(
  isMine: boolean,
  isSupport = false
): ProductReviewMessageBubbleTone {
  if (isSupport) {
    return "support";
  }

  return isMine ? "own" : "user";
}

export function getProductReviewMessageBubbleClassName(
  styles: Record<string, string>,
  tone: ProductReviewMessageBubbleTone
): string {
  if (tone === "own") {
    return styles.reviewCommentBubbleOwn;
  }

  if (tone === "support") {
    return styles.reviewCommentBubbleSupport;
  }

  return styles.reviewCommentBubbleUser;
}
