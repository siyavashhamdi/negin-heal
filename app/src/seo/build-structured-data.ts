import type { TFunction } from "i18next";
import { resolveAbsoluteUrl } from "./seo-text.util";

type BuildDefaultStructuredDataInput = {
  readonly t: TFunction;
  readonly appUrl: string;
  readonly canonicalUrl: string;
  readonly siteName: string;
  readonly description: string;
  readonly logoUrl: string;
};

export function buildDefaultStructuredData(
  input: BuildDefaultStructuredDataInput
): ReadonlyArray<Record<string, unknown>> {
  const { t, appUrl, canonicalUrl, siteName, description, logoUrl } = input;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
      name: siteName,
      url: appUrl,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
      description: t("seo.structuredData.organizationDescription"),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${appUrl}/#website`,
      url: appUrl,
      name: siteName,
      description: t("seo.structuredData.websiteDescription"),
      inLanguage: t("seo.brand.language"),
      publisher: {
        "@id": `${appUrl}/#organization`,
      },
      potentialAction: {
        "@type": "ReadAction",
        target: canonicalUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: siteName,
      description,
      isPartOf: {
        "@id": `${appUrl}/#website`,
      },
      inLanguage: t("seo.brand.language"),
    },
  ];
}

type BuildCourseStructuredDataInput = {
  readonly appUrl: string;
  readonly canonicalUrl: string;
  readonly courseId: string;
  readonly title: string;
  readonly description: string;
  readonly imageUrl?: string;
  readonly keywords?: string;
  readonly isFree: boolean;
  readonly priceIrt?: number | null;
};

export function buildCourseStructuredData(
  input: BuildCourseStructuredDataInput
): ReadonlyArray<Record<string, unknown>> {
  const {
    appUrl,
    canonicalUrl,
    courseId,
    title,
    description,
    imageUrl,
    keywords,
    isFree,
    priceIrt,
  } = input;

  const course: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${canonicalUrl}#course`,
    url: canonicalUrl,
    name: title,
    description,
    provider: {
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
    },
    inLanguage: "fa",
    courseCode: courseId,
    isAccessibleForFree: isFree,
  };

  if (imageUrl) {
    course.image = imageUrl;
  }

  if (keywords?.trim()) {
    course.keywords = keywords;
  }

  if (!isFree && typeof priceIrt === "number" && priceIrt > 0) {
    course.offers = {
      "@type": "Offer",
      price: priceIrt,
      priceCurrency: "IRR",
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
    };
  }

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: title,
      description,
      mainEntity: {
        "@id": `${canonicalUrl}#course`,
      },
    },
    course,
  ];
}

export function buildStructuredDataLogoUrl(appUrl: string, imagePath: string): string {
  return resolveAbsoluteUrl(appUrl, imagePath);
}

type BreadcrumbStructuredDataInput = {
  readonly appUrl: string;
  readonly items: ReadonlyArray<{ readonly name: string; readonly url: string }>;
};

export function buildBreadcrumbStructuredData(
  input: BreadcrumbStructuredDataInput
): ReadonlyArray<Record<string, unknown>> {
  if (input.items.length === 0) {
    return [];
  }

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    },
  ];
}

type FaqStructuredDataInput = {
  readonly canonicalUrl: string;
  readonly items: ReadonlyArray<{ readonly question: string; readonly answer: string }>;
};

export function buildFaqStructuredData(
  input: FaqStructuredDataInput
): ReadonlyArray<Record<string, unknown>> {
  if (input.items.length === 0) {
    return [];
  }

  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${input.canonicalUrl}#faq`,
      mainEntity: input.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];
}

type CourseListItem = {
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly url: string;
  readonly imageUrl?: string;
};

type CourseListStructuredDataInput = {
  readonly appUrl: string;
  readonly canonicalUrl: string;
  readonly siteName: string;
  readonly description: string;
  readonly courses: readonly CourseListItem[];
};

export function buildCourseListStructuredData(
  input: CourseListStructuredDataInput
): ReadonlyArray<Record<string, unknown>> {
  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${input.canonicalUrl}#course-list`,
      url: input.canonicalUrl,
      name: `${input.siteName} — دوره‌های آموزشی`,
      description: input.description,
      numberOfItems: input.courses.length,
      itemListElement: input.courses.map((course, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: course.url,
        item: {
          "@type": "Course",
          "@id": `${course.url}#course`,
          name: course.title,
          description: course.description?.trim() || course.title,
          url: course.url,
          ...(course.imageUrl ? { image: course.imageUrl } : {}),
          provider: {
            "@type": "Organization",
            "@id": `${input.appUrl}/#organization`,
          },
        },
      })),
    },
  ];
}
