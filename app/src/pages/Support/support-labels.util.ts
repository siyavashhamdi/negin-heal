import type { TicketCategory, TicketClosedBy, TicketPriority, TicketStatus } from "./support.types";

export const TICKET_CATEGORY_LABEL: Record<TicketCategory, string> = {
  PAYMENT: "پرداخت",
  COURSE: "دوره",
  ACCOUNT: "حساب کاربری",
  TECHNICAL: "فنی",
  BUG: "گزارش باگ",
  OTHER: "سایر",
};

export const TICKET_PRIORITY_LABEL: Record<TicketPriority, string> = {
  LOW: "کم",
  MEDIUM: "متوسط",
  HIGH: "زیاد",
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "باز",
  ANSWERED: "پاسخ داده شده",
  CLOSED: "بسته",
};

export const TICKET_CLOSED_BY_LABEL: Record<TicketClosedBy, string> = {
  SUPPORT: "پشتیبانی",
  END_USER: "کاربر",
  SYSTEM: "سیستم",
};

export const TICKET_CATEGORY_OPTIONS: readonly TicketCategory[] = [
  "PAYMENT",
  "COURSE",
  "ACCOUNT",
  "TECHNICAL",
  "BUG",
  "OTHER",
];

export const TICKET_PRIORITY_OPTIONS: readonly TicketPriority[] = ["LOW", "MEDIUM", "HIGH"];

export const TICKET_STATUS_OPTIONS: readonly TicketStatus[] = ["OPEN", "ANSWERED", "CLOSED"];

export const TICKET_CLOSED_BY_OPTIONS: readonly TicketClosedBy[] = [
  "SUPPORT",
  "END_USER",
  "SYSTEM",
];
