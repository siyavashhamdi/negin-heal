import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";

export type TicketCategory = "PAYMENT" | "PRODUCT" | "ACCOUNT" | "TECHNICAL" | "BUG" | "OTHER";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";
export type TicketStatus = "OPEN" | "ANSWERED" | "CLOSED";
export type TicketClosedBy = "SUPPORT" | "END_USER" | "SYSTEM";

export type SupportTicketUserMinimal = {
  readonly id?: string | null;
  readonly username?: string | null;
  readonly profile?: {
    readonly firstName?: string | null;
    readonly lastName?: string | null;
    readonly avatarAccessUrl?: FileAccessUrl | null;
  } | null;
};

export type SupportTicketListUserSummary = {
  readonly username?: string | null;
  readonly profile?: {
    readonly firstName?: string | null;
    readonly lastName?: string | null;
  } | null;
};

export type SupportTicketAttachment = {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly mimeType?: string | null;
  readonly sizeBytes?: number | null;
  readonly path?: string | null;
  readonly accessUrl?: FileAccessUrl | null;
};

export type SupportTicketMessage = {
  readonly body: string;
  readonly sentAt?: string | null;
  readonly senderUser?: SupportTicketUserMinimal | null;
  readonly attachmentFileIds: readonly string[];
  readonly attachmentFiles: readonly SupportTicketAttachment[];
};

export type SupportTicketListItemRow = {
  readonly id: string;
  readonly title: string;
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly closedBy?: TicketClosedBy | null;
  readonly closedByUserId?: string | null;
  readonly closedByUser?: SupportTicketListUserSummary | null;
  readonly closedAt?: string | null;
  readonly createdByUserId?: string | null;
  readonly createdByUser?: SupportTicketListUserSummary | null;
  readonly updatedByUserId?: string | null;
  readonly updatedByUser?: SupportTicketListUserSummary | null;
  readonly messageCount: number;
  readonly lastMessageBody: string;
  readonly attachmentCount: number;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type UserSupportTicketListItemRow = {
  readonly id: string;
  readonly title: string;
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly closedBy?: TicketClosedBy | null;
  readonly closedAt?: string | null;
  readonly messageCount: number;
  readonly lastMessageBody: string;
  readonly attachmentCount: number;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type UserTicketDetailRow = {
  readonly id: string;
  readonly title: string;
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly closedBy?: TicketClosedBy | null;
  readonly closedAt?: string | null;
  readonly messages: readonly SupportTicketMessage[];
  readonly createdByUserId?: string | null;
  readonly createdByUser?: SupportTicketUserMinimal | null;
  readonly updatedByUserId?: string | null;
  readonly updatedByUser?: SupportTicketUserMinimal | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type SupportTicketDetailRow = {
  readonly id: string;
  readonly title: string;
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly closedBy?: TicketClosedBy | null;
  readonly closedByUserId?: string | null;
  readonly closedByUser?: SupportTicketUserMinimal | null;
  readonly closedAt?: string | null;
  readonly messages: readonly SupportTicketMessage[];
  readonly createdByUserId?: string | null;
  readonly createdByUser?: SupportTicketUserMinimal | null;
  readonly updatedByUserId?: string | null;
  readonly updatedByUser?: SupportTicketUserMinimal | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
};

export type SupportTicketRecord = {
  readonly id: string;
  readonly title: string;
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly closedBy: string;
  readonly closedByUserId: string;
  readonly closedByUserName: string;
  readonly closedAt: string;
  readonly createdByUserId: string;
  readonly createdByUserName: string;
  readonly createdByUser?: SupportTicketUserMinimal | null;
  readonly updatedByUserId: string;
  readonly updatedByUserName: string;
  readonly messageCount: number;
  readonly lastMessageBody: string;
  readonly attachmentCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly messages: readonly SupportTicketMessage[];
};

export type SupportTicketListFilters = {
  query: string;
  id: string;
  title: string;
  messageBody: string;
  category: TicketCategory | "ALL";
  priority: TicketPriority | "ALL";
  status: TicketStatus | "ALL";
  closedBy: TicketClosedBy | "ALL";
  createdByUserId: string;
  updatedByUserId: string;
  closedByUserId: string;
  attachmentFileId: string;
  createdAtFrom: string;
  createdAtTo: string;
  updatedAtFrom: string;
  updatedAtTo: string;
  closedAtFrom: string;
  closedAtTo: string;
};

export type UserSupportTicketListFilters = {
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
};

export const EMPTY_SUPPORT_TICKET_LIST_FILTERS: SupportTicketListFilters = {
  query: "",
  id: "",
  title: "",
  messageBody: "",
  category: "ALL",
  priority: "ALL",
  status: "ALL",
  closedBy: "ALL",
  createdByUserId: "",
  updatedByUserId: "",
  closedByUserId: "",
  attachmentFileId: "",
  createdAtFrom: "",
  createdAtTo: "",
  updatedAtFrom: "",
  updatedAtTo: "",
  closedAtFrom: "",
  closedAtTo: "",
};

export const EMPTY_USER_SUPPORT_TICKET_LIST_FILTERS: UserSupportTicketListFilters = {
  query: "",
  id: "",
  title: "",
  messageBody: "",
  category: "ALL",
  priority: "ALL",
  status: "ALL",
  closedBy: "ALL",
  attachmentFileId: "",
  createdAtFrom: "",
  createdAtTo: "",
  updatedAtFrom: "",
  updatedAtTo: "",
  closedAtFrom: "",
  closedAtTo: "",
};

export type TicketListQuery = {
  ticketList: {
    items: SupportTicketListItemRow[];
    pagination: {
      limit: number;
      skip: number;
      total: number;
      count: number;
    };
  };
};

export type UserTicketListQuery = {
  userTicketList: {
    items: UserSupportTicketListItemRow[];
    pagination: {
      limit: number;
      skip: number;
      total: number;
      count: number;
    };
  };
};

export type TicketListQueryVariables = {
  input: {
    filters?: Record<string, string | null>;
    options: {
      limit: number;
      skip: number;
      sort?: {
        createdAt?: "ASC" | "DESC";
        updatedAt?: "ASC" | "DESC";
        title?: "ASC" | "DESC";
        category?: "ASC" | "DESC";
        priority?: "ASC" | "DESC";
        status?: "ASC" | "DESC";
        closedBy?: "ASC" | "DESC";
        closedAt?: "ASC" | "DESC";
      };
    };
  };
};

export type TicketDetailQuery = {
  ticketDetail: SupportTicketDetailRow;
};

export type TicketDetailQueryVariables = {
  input: {
    id: string;
  };
};

export type UserTicketDetailQuery = {
  userTicketDetail: UserTicketDetailRow;
};

export type UserTicketDetailQueryVariables = {
  input: {
    id: string;
  };
};

export type UserTicketListQueryVariables = {
  input: {
    filters?: Record<string, string | null>;
    options: {
      limit: number;
      skip: number;
      sort?: {
        createdAt?: "ASC" | "DESC";
        updatedAt?: "ASC" | "DESC";
        title?: "ASC" | "DESC";
        category?: "ASC" | "DESC";
        priority?: "ASC" | "DESC";
        status?: "ASC" | "DESC";
        closedBy?: "ASC" | "DESC";
        closedAt?: "ASC" | "DESC";
      };
    };
  };
};
