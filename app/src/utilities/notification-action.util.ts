import { APP_SHELL_ROUTES } from "../routing/app-shell-routes";

export type NotificationActionPayload = {
  readonly label: string;
  readonly href: string;
};

export type NotificationActionInput = {
  readonly label: string;
  readonly href: string;
};

export function buildNotificationActionPayload(
  input: NotificationActionInput
): NotificationActionPayload | null {
  const label = input.label.trim();
  const href = input.href.trim();

  if (!label || !href) {
    return null;
  }

  return { label, href };
}

const buildCourseChapterHref = (courseId: string, chapterKey: string): string => {
  const baseHref = APP_SHELL_ROUTES.courseDetail.replace(":courseId", courseId);
  const params = new URLSearchParams({ chapter: chapterKey });
  return `${baseHref}?${params.toString()}`;
};

export function resolveNotificationActionPayload(
  payload: unknown
): NotificationActionPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as {
    readonly action?: {
      readonly label?: unknown;
      readonly href?: unknown;
      readonly url?: unknown;
      readonly to?: unknown;
    } | null;
    readonly actionLabel?: unknown;
    readonly actionUrl?: unknown;
    readonly courseId?: unknown;
    readonly chapterKey?: unknown;
  };

  const actionPayload = record.action;
  const label =
    typeof actionPayload?.label === "string"
      ? actionPayload.label.trim()
      : typeof record.actionLabel === "string"
        ? record.actionLabel.trim()
        : "";
  const hrefCandidate =
    typeof actionPayload?.href === "string"
      ? actionPayload.href
      : typeof actionPayload?.url === "string"
        ? actionPayload.url
        : typeof actionPayload?.to === "string"
          ? actionPayload.to
          : typeof record.actionUrl === "string"
            ? record.actionUrl
            : "";
  const href = hrefCandidate.trim();

  if (label && href) {
    return { label, href };
  }

  const courseId = typeof record.courseId === "string" ? record.courseId.trim() : "";
  const chapterKey = typeof record.chapterKey === "string" ? record.chapterKey.trim() : "";

  if (courseId && chapterKey) {
    return {
      label: "مشاهده فصل",
      href: buildCourseChapterHref(courseId, chapterKey),
    };
  }

  return null;
}
