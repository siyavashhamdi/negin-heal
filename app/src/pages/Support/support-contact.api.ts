export type SupportContactChannelType =
  | "WHATSAPP"
  | "TELEGRAM"
  | "INSTAGRAM"
  | "TICKET"
  | "EMAIL"
  | "PHONE";

export type SupportContactChannel = {
  readonly type: SupportContactChannelType;
  readonly label: string;
  readonly value: string;
  readonly href: string;
  readonly description: string;
  readonly isActive: boolean;
  readonly isPrimary: boolean;
};

export type SupportFaqItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export type SupportFaqSection = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly items: readonly SupportFaqItem[];
};

export type SupportFaqPage = {
  readonly eyebrow: string;
  readonly heading: string;
  readonly subtitle: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly resultCountLabel: string;
  readonly noResultsLabel: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly emptyActionLabel: string;
  readonly sections: readonly SupportFaqSection[];
};

export type SupportContactConfig = {
  readonly eyebrow: string;
  readonly heading: string;
  readonly subtitle: string;
  readonly availabilityLabel: string;
  readonly responseTimeLabel: string;
  readonly faqTitle: string;
  readonly faqDescription: string;
  readonly contactSectionEyebrow: string;
  readonly contactSectionHeading: string;
  readonly contactSectionSubtitle: string;
  readonly tipsEyebrow: string;
  readonly tipsHeading: string;
  readonly channels: readonly SupportContactChannel[];
  readonly quickTips: readonly string[];
  readonly faqPage: SupportFaqPage;
};

export type SupportContactConfigQuery = {
  readonly supportContactConfig: SupportContactConfig;
};

const EMPTY_SUPPORT_FAQ_PAGE: SupportFaqPage = {
  eyebrow: "",
  heading: "",
  subtitle: "",
  searchLabel: "",
  searchPlaceholder: "",
  resultCountLabel: "",
  noResultsLabel: "",
  emptyTitle: "",
  emptyDescription: "",
  emptyActionLabel: "",
  sections: [],
};

export const EMPTY_SUPPORT_CONTACT: SupportContactConfig = {
  eyebrow: "",
  heading: "",
  subtitle: "",
  availabilityLabel: "",
  responseTimeLabel: "",
  faqTitle: "",
  faqDescription: "",
  contactSectionEyebrow: "",
  contactSectionHeading: "",
  contactSectionSubtitle: "",
  tipsEyebrow: "",
  tipsHeading: "",
  channels: [],
  quickTips: [],
  faqPage: EMPTY_SUPPORT_FAQ_PAGE,
};

export function isInternalSupportHref(href: string): boolean {
  return href.startsWith("/");
}
