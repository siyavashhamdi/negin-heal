import { APP_SHELL_ROUTES } from "../routing/app-shell-routes";

export type NotificationCourseLink = {
  readonly courseId: string;
  readonly href: string;
  readonly approvedByInvestigationTeam: boolean;
};

export const resolveNotificationCourseLink = (
  source: string,
  payload: Record<string, unknown> | null,
): NotificationCourseLink | null => {
  if (source !== "PAYMENT" || !payload) {
    return null;
  }

  const courseId =
    typeof payload.courseId === "string" ? payload.courseId.trim() : "";

  if (!courseId) {
    return null;
  }

  return {
    courseId,
    href: APP_SHELL_ROUTES.courseDetail.replace(":courseId", courseId),
    approvedByInvestigationTeam: payload.approvedByInvestigationTeam === true,
  };
};
