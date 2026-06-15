import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class SupportContactChannelGqlResponse {
  @Field({ description: "Support channel type" })
  type: string;

  @Field({ description: "Support channel display label" })
  label: string;

  @Field({ description: "Human-readable support channel value" })
  value: string;

  @Field({ description: "Action URL for opening the channel" })
  href: string;

  @Field({ description: "Short guidance for when to use this channel" })
  description: string;

  @Field({ description: "Whether the channel should be visible" })
  isActive: boolean;

  @Field({ description: "Whether the channel should be highlighted first" })
  isPrimary: boolean;
}

@ObjectType()
export class SupportFaqItemGqlResponse {
  @Field({ description: "FAQ item id" })
  id: string;

  @Field({ description: "FAQ question" })
  question: string;

  @Field({ description: "FAQ answer" })
  answer: string;
}

@ObjectType()
export class SupportFaqSectionGqlResponse {
  @Field({ description: "FAQ section id" })
  id: string;

  @Field({ description: "FAQ section title" })
  title: string;

  @Field({ description: "FAQ section description" })
  description: string;

  @Field(() => [SupportFaqItemGqlResponse], {
    description: "FAQ section items",
  })
  items: SupportFaqItemGqlResponse[];
}

@ObjectType()
export class SupportFaqPageGqlResponse {
  @Field({ description: "FAQ page eyebrow" })
  eyebrow: string;

  @Field({ description: "FAQ page heading" })
  heading: string;

  @Field({ description: "FAQ page subtitle" })
  subtitle: string;

  @Field({ description: "FAQ search label" })
  searchLabel: string;

  @Field({ description: "FAQ search placeholder" })
  searchPlaceholder: string;

  @Field({ description: "FAQ search result count label" })
  resultCountLabel: string;

  @Field({ description: "FAQ inline no-results label" })
  noResultsLabel: string;

  @Field({ description: "FAQ empty state title" })
  emptyTitle: string;

  @Field({ description: "FAQ empty state description" })
  emptyDescription: string;

  @Field({ description: "FAQ empty state action label" })
  emptyActionLabel: string;

  @Field(() => [SupportFaqSectionGqlResponse], {
    description: "FAQ page sections",
  })
  sections: SupportFaqSectionGqlResponse[];
}

@ObjectType()
export class SupportContactConfigGqlResponse {
  @Field({ description: "Support page eyebrow" })
  eyebrow: string;

  @Field({ description: "Support page heading" })
  heading: string;

  @Field({ description: "Support page subtitle" })
  subtitle: string;

  @Field({ description: "Support availability copy" })
  availabilityLabel: string;

  @Field({ description: "Expected response time copy" })
  responseTimeLabel: string;

  @Field({ description: "FAQ card title for the support page" })
  faqTitle: string;

  @Field({ description: "FAQ card description for the support page" })
  faqDescription: string;

  @Field({ description: "Contact channels section eyebrow" })
  contactSectionEyebrow: string;

  @Field({ description: "Contact channels section heading" })
  contactSectionHeading: string;

  @Field({ description: "Contact channels section subtitle" })
  contactSectionSubtitle: string;

  @Field({ description: "Quick tips section eyebrow" })
  tipsEyebrow: string;

  @Field({ description: "Quick tips section heading" })
  tipsHeading: string;

  @Field(() => [SupportContactChannelGqlResponse], {
    description: "Configured support contact channels",
  })
  channels: SupportContactChannelGqlResponse[];

  @Field(() => [String], {
    description: "Helpful preparation tips before contacting support",
  })
  quickTips: string[];

  @Field(() => SupportFaqPageGqlResponse, {
    description: "Configurable FAQ page content",
  })
  faqPage: SupportFaqPageGqlResponse;
}
