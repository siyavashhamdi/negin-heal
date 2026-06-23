export type OpenGraphType = "website" | "article" | "product" | "profile";

export type TwitterCardType = "summary" | "summary_large_image" | "app" | "player";

export type PageSeoOverride = {
  readonly title?: string;
  readonly description?: string;
  readonly keywords?: string;
  readonly robots?: string;
  readonly canonicalPath?: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly ogType?: OpenGraphType;
  readonly twitterCard?: TwitterCardType;
  readonly noIndex?: boolean;
  readonly jsonLd?: ReadonlyArray<Record<string, unknown>>;
};

export type ResolvedPageSeo = {
  readonly title: string;
  readonly description: string;
  readonly keywords: string;
  readonly robots: string;
  readonly canonicalUrl: string;
  readonly imageUrl: string;
  readonly imageAlt: string;
  readonly ogType: OpenGraphType;
  readonly twitterCard: TwitterCardType;
  readonly siteName: string;
  readonly locale: string;
  readonly language: string;
  readonly author: string;
  readonly themeColor: string;
  readonly country: string;
  readonly hreflangUrl: string;
  readonly jsonLd: ReadonlyArray<Record<string, unknown>>;
};
