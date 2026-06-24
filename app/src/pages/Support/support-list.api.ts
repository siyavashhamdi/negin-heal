import { parseJalaliParamDate } from "../../utilities/jalali-date-param.util";
import type {
  SupportTicketDetailRow,
  SupportTicketListFilters,
  SupportTicketListItemRow,
  SupportTicketListUserSummary,
  SupportTicketRecord,
  SupportTicketMessage,
  SupportTicketUserMinimal,
  TicketCategory,
  TicketClosedBy,
  TicketListQueryVariables,
  TicketPriority,
  TicketStatus,
  UserSupportTicketListFilters,
  UserSupportTicketListItemRow,
  UserTicketDetailRow,
  UserTicketListQueryVariables,
} from "./support.types";

const EMPTY_DISPLAY = "-";

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function display(value: string | null | undefined): string {
  return value?.trim() || EMPTY_DISPLAY;
}

function enumToNull<TValue extends string>(value: TValue | "ALL"): TValue | null {
  return value === "ALL" ? null : value;
}

function dateFilterToIsoDate(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const jalaliDate = parseJalaliParamDate(trimmed);
  if (!jalaliDate) {
    return trimmed;
  }

  const gregorianDate = jalaliDate.toDate();
  const year = String(gregorianDate.getFullYear()).padStart(4, "0");
  const month = String(gregorianDate.getMonth() + 1).padStart(2, "0");
  const day = String(gregorianDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatUserDisplayName(
  user?: SupportTicketUserMinimal | SupportTicketListUserSummary | null
): string {
  if (!user) {
    return EMPTY_DISPLAY;
  }
  const parts = [user.profile?.firstName?.trim(), user.profile?.lastName?.trim()].filter(
    (part): part is string => Boolean(part)
  );
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return display(user.username);
}

function countAttachments(messages: readonly SupportTicketMessage[]): number {
  return messages.reduce((total, message) => total + (message.attachmentFiles?.length ?? 0), 0);
}

function getLastMessageBody(messages: readonly SupportTicketMessage[]): string {
  if (messages.length === 0) {
    return EMPTY_DISPLAY;
  }

  const latestMessage = [...messages].sort((left, right) => {
    const leftTimestamp = left.sentAt ? new Date(left.sentAt).getTime() : 0;
    const rightTimestamp = right.sentAt ? new Date(right.sentAt).getTime() : 0;
    return rightTimestamp - leftTimestamp;
  })[0];

  const body = latestMessage?.body?.trim();
  return body || EMPTY_DISPLAY;
}

function mapDetailMessages(
  messages: SupportTicketDetailRow["messages"]
): SupportTicketRecord["messages"] {
  return messages.map((message) => ({
    body: message.body,
    sentAt: message.sentAt ?? null,
    senderUser: message.senderUser ?? null,
    attachmentFileIds: message.attachmentFileIds ?? [],
    attachmentFiles: message.attachmentFiles ?? [],
  }));
}

export function mapSupportTicketListItemRowToRecord(
  row: SupportTicketListItemRow
): SupportTicketRecord {
  return {
    id: String(row.id),
    title: display(row.title),
    category: row.category,
    priority: row.priority,
    status: row.status,
    closedBy: display(row.closedBy ?? undefined),
    closedByUserId: display(row.closedByUserId ?? undefined),
    closedByUserName: formatUserDisplayName(row.closedByUser),
    closedAt: row.closedAt ?? "",
    createdByUserId: display(row.createdByUserId ?? undefined),
    createdByUserName: formatUserDisplayName(row.createdByUser),
    createdByUser: null,
    updatedByUserId: display(row.updatedByUserId ?? undefined),
    updatedByUserName: formatUserDisplayName(row.updatedByUser),
    messageCount: row.messageCount,
    lastMessageBody: display(row.lastMessageBody),
    attachmentCount: row.attachmentCount,
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
    messages: [],
  };
}

export function mapUserSupportTicketListRowToRecord(
  row: UserSupportTicketListItemRow
): SupportTicketRecord {
  return {
    id: String(row.id),
    title: display(row.title),
    category: row.category,
    priority: row.priority,
    status: row.status,
    closedBy: display(row.closedBy ?? undefined),
    closedByUserId: EMPTY_DISPLAY,
    closedByUserName: EMPTY_DISPLAY,
    closedAt: row.closedAt ?? "",
    createdByUserId: EMPTY_DISPLAY,
    createdByUserName: EMPTY_DISPLAY,
    createdByUser: null,
    updatedByUserId: EMPTY_DISPLAY,
    updatedByUserName: EMPTY_DISPLAY,
    messageCount: row.messageCount,
    lastMessageBody: display(row.lastMessageBody),
    attachmentCount: row.attachmentCount,
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
    messages: [],
  };
}

export function mapUserTicketDetailRowToRecord(row: UserTicketDetailRow): SupportTicketRecord {
  return {
    id: String(row.id),
    title: display(row.title),
    category: row.category,
    priority: row.priority,
    status: row.status,
    closedBy: display(row.closedBy ?? undefined),
    closedByUserId: EMPTY_DISPLAY,
    closedByUserName: EMPTY_DISPLAY,
    closedAt: row.closedAt ?? "",
    createdByUserId: display(row.createdByUserId ?? undefined),
    createdByUserName: formatUserDisplayName(row.createdByUser),
    createdByUser: row.createdByUser ?? null,
    updatedByUserId: display(row.updatedByUserId ?? undefined),
    updatedByUserName: formatUserDisplayName(row.updatedByUser),
    messageCount: row.messages.length,
    lastMessageBody: getLastMessageBody(row.messages),
    attachmentCount: countAttachments(row.messages),
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
    messages: row.messages.map((message) => ({
      body: message.body,
      sentAt: message.sentAt ?? null,
      senderUser: message.senderUser ?? null,
      attachmentFileIds: message.attachmentFileIds ?? [],
      attachmentFiles: message.attachmentFiles ?? [],
    })),
  };
}

export function mapSupportTicketDetailRowToRecord(
  row: SupportTicketDetailRow
): SupportTicketRecord {
  return {
    id: String(row.id),
    title: display(row.title),
    category: row.category,
    priority: row.priority,
    status: row.status,
    closedBy: display(row.closedBy ?? undefined),
    closedByUserId: display(row.closedByUserId ?? undefined),
    closedByUserName: formatUserDisplayName(row.closedByUser),
    closedAt: row.closedAt ?? "",
    createdByUserId: display(row.createdByUserId ?? undefined),
    createdByUserName: formatUserDisplayName(row.createdByUser),
    createdByUser: row.createdByUser ?? null,
    updatedByUserId: display(row.updatedByUserId ?? undefined),
    updatedByUserName: formatUserDisplayName(row.updatedByUser),
    messageCount: row.messages.length,
    lastMessageBody: getLastMessageBody(row.messages),
    attachmentCount: countAttachments(row.messages),
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
    messages: mapDetailMessages(row.messages),
  };
}

export function hasSupportTicketFiltersApplied(filters: SupportTicketListFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.id.trim() !== "" ||
    filters.title.trim() !== "" ||
    filters.messageBody.trim() !== "" ||
    filters.category !== "ALL" ||
    filters.priority !== "ALL" ||
    filters.status !== "ALL" ||
    filters.closedBy !== "ALL" ||
    filters.createdByUserId.trim() !== "" ||
    filters.updatedByUserId.trim() !== "" ||
    filters.closedByUserId.trim() !== "" ||
    filters.attachmentFileId.trim() !== "" ||
    filters.createdAtFrom.trim() !== "" ||
    filters.createdAtTo.trim() !== "" ||
    filters.updatedAtFrom.trim() !== "" ||
    filters.updatedAtTo.trim() !== "" ||
    filters.closedAtFrom.trim() !== "" ||
    filters.closedAtTo.trim() !== ""
  );
}

export function hasUserSupportTicketFiltersApplied(filters: UserSupportTicketListFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.id.trim() !== "" ||
    filters.title.trim() !== "" ||
    filters.messageBody.trim() !== "" ||
    filters.category !== "ALL" ||
    filters.priority !== "ALL" ||
    filters.status !== "ALL" ||
    filters.closedBy !== "ALL" ||
    filters.attachmentFileId.trim() !== "" ||
    filters.createdAtFrom.trim() !== "" ||
    filters.createdAtTo.trim() !== "" ||
    filters.updatedAtFrom.trim() !== "" ||
    filters.updatedAtTo.trim() !== "" ||
    filters.closedAtFrom.trim() !== "" ||
    filters.closedAtTo.trim() !== ""
  );
}

function buildSharedTicketFilters(
  search: string,
  filters: {
    query: string;
    id: string;
    title: string;
    messageBody: string;
    category: TicketCategory | "ALL";
    priority: TicketPriority | "ALL";
    status: TicketStatus | "ALL";
    closedBy: TicketClosedBy | "ALL";
    attachmentFileId: string;
    createdAtFrom: string;
    createdAtTo: string;
    updatedAtFrom: string;
    updatedAtTo: string;
    closedAtFrom: string;
    closedAtTo: string;
  }
): Record<string, string | null> {
  return {
    query: trimToNull(search) ?? trimToNull(filters.query),
    id: trimToNull(filters.id),
    title: trimToNull(filters.title),
    messageBody: trimToNull(filters.messageBody),
    category: enumToNull(filters.category),
    priority: enumToNull(filters.priority),
    status: enumToNull(filters.status),
    closedBy: enumToNull(filters.closedBy),
    attachmentFileId: trimToNull(filters.attachmentFileId),
    createdAtFrom: dateFilterToIsoDate(filters.createdAtFrom),
    createdAtTo: dateFilterToIsoDate(filters.createdAtTo),
    updatedAtFrom: dateFilterToIsoDate(filters.updatedAtFrom),
    updatedAtTo: dateFilterToIsoDate(filters.updatedAtTo),
    closedAtFrom: dateFilterToIsoDate(filters.closedAtFrom),
    closedAtTo: dateFilterToIsoDate(filters.closedAtTo),
  };
}

export function buildTicketListQueryVariables(
  search: string,
  filters: SupportTicketListFilters,
  page: number,
  pageSize: number
): TicketListQueryVariables {
  const limit = Math.max(1, pageSize);
  const skip = Math.max(0, (Math.max(1, page) - 1) * limit);

  return {
    input: {
      filters: {
        ...buildSharedTicketFilters(search, filters),
        createdByUserId: trimToNull(filters.createdByUserId),
        updatedByUserId: trimToNull(filters.updatedByUserId),
        closedByUserId: trimToNull(filters.closedByUserId),
      },
      options: {
        limit,
        skip,
        sort: { updatedAt: "DESC" },
      },
    },
  };
}

export function buildUserTicketListQueryVariables(
  search: string,
  filters: UserSupportTicketListFilters,
  page: number,
  pageSize: number
): UserTicketListQueryVariables {
  const limit = Math.max(1, pageSize);
  const skip = Math.max(0, (Math.max(1, page) - 1) * limit);

  return {
    input: {
      filters: buildSharedTicketFilters(search, filters),
      options: {
        limit,
        skip,
        sort: { updatedAt: "DESC" },
      },
    },
  };
}
