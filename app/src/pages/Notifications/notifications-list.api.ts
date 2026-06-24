import type { SortOrder } from "../Courses/courses-list.api";

export type NotificationMode = "INFO" | "SUCCESS" | "WARNING" | "ERROR";
export type NotificationSource =
  | "COURSE"
  | "COURSE_CHAPTER"
  | "PAYMENT"
  | "USER"
  | "TICKET"
  | "OTHER";
export type NotificationUpdateAction = "SET_AS_READ" | "SET_AS_UNREAD" | "ARCHIVE" | "UNARCHIVE";
export type NotificationFilterTab = "all" | "unread" | "read" | "archived";

export type NotificationListItemRow = {
  readonly id: string;
  readonly userId?: string | null;
  readonly source: NotificationSource;
  readonly mode: NotificationMode;
  readonly title?: string | null;
  readonly message: string;
  readonly payload?: Record<string, unknown> | null;
  readonly isRead: boolean;
  readonly readAt?: string | null;
  readonly archivedAt?: string | null;
  readonly visibleUntil?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type NotificationListQuery = {
  userNotificationList: {
    items: NotificationListItemRow[];
    pagination: {
      limit: number;
      total: number;
      count: number;
      startCursor?: string | null;
      endCursor?: string | null;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
};

type NotificationListFilterInput = {
  isRead?: boolean;
  isArchived?: boolean;
};

type NotificationListSortInput = {
  createdAt?: SortOrder;
};

export type NotificationListQueryVariables = {
  input: {
    filters?: NotificationListFilterInput;
    options: {
      limit: number;
      startCursor?: string | null;
      sort?: NotificationListSortInput;
    };
  };
};

export type NotificationUpdateMutation = {
  userNotificationUpdate: {
    action: NotificationUpdateAction;
    notificationIds: string[];
    requestedCount: number;
    matchedCount: number;
    modifiedCount: number;
    items: NotificationListItemRow[];
  };
};

export type NotificationUpdateMutationVariables = {
  input: {
    notificationIds: string[];
    action: NotificationUpdateAction;
  };
};

export type NotificationRecord = {
  readonly id: string;
  readonly userId: string | null;
  readonly source: NotificationSource;
  readonly mode: NotificationMode;
  readonly title: string;
  readonly message: string;
  readonly payload: Record<string, unknown> | null;
  readonly isRead: boolean;
  readonly readAt: string | null;
  readonly archivedAt: string | null;
  readonly visibleUntil: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly isActionable: boolean;
};

export const NOTIFICATION_LIST_PAGE_SIZE = 12;

export const NOTIFICATION_SOURCE_LABEL: Record<NotificationSource, string> = {
  COURSE: "دوره",
  COURSE_CHAPTER: "فصل دوره",
  PAYMENT: "پرداخت",
  USER: "کاربر",
  TICKET: "پشتیبانی",
  OTHER: "سایر",
};

export const buildNotificationListFilters = (
  tab: NotificationFilterTab
): NotificationListFilterInput | undefined => {
  switch (tab) {
    case "unread":
      return { isRead: false, isArchived: false };
    case "read":
      return { isRead: true, isArchived: false };
    case "archived":
      return { isArchived: true };
    case "all":
    default:
      return undefined;
  }
};

export const buildNotificationListQueryVariables = (
  tab: NotificationFilterTab,
  limit: number = NOTIFICATION_LIST_PAGE_SIZE,
  startCursor?: string | null
): NotificationListQueryVariables => ({
  input: {
    filters: buildNotificationListFilters(tab),
    options: {
      limit,
      startCursor: startCursor ?? null,
    },
  },
});

export const mapNotificationListRowToRecord = (
  item: NotificationListItemRow
): NotificationRecord => ({
  id: item.id,
  userId: item.userId ?? null,
  source: item.source,
  mode: item.mode,
  title: item.title?.trim() || item.message,
  message: item.message,
  payload: item.payload && typeof item.payload === "object" ? item.payload : null,
  isRead: item.isRead,
  readAt: item.readAt ?? null,
  archivedAt: item.archivedAt ?? null,
  visibleUntil: item.visibleUntil ?? null,
  createdAt: item.createdAt ?? null,
  updatedAt: item.updatedAt ?? null,
  isActionable: true,
});

export const mergeUpdatedNotificationRecords = (
  current: NotificationRecord[],
  updatedItems: NotificationListItemRow[],
  tab: NotificationFilterTab
): NotificationRecord[] => {
  const updatedById = new Map(
    updatedItems.map((item) => [item.id, mapNotificationListRowToRecord(item)])
  );

  return current
    .map((item) => updatedById.get(item.id) ?? item)
    .filter((item) => shouldKeepNotificationInTab(item, tab));
};

const shouldKeepNotificationInTab = (
  item: NotificationRecord,
  tab: NotificationFilterTab
): boolean => {
  const isArchived = Boolean(item.archivedAt);

  switch (tab) {
    case "archived":
      return isArchived;
    case "unread":
      return !isArchived && !item.isRead;
    case "read":
      return !isArchived && item.isRead;
    case "all":
    default:
      return true;
  }
};
