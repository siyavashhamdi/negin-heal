import type { TFunction } from "i18next";
import { resolvePageTitleKey } from "../routing/resolvePageTitleKey";
import { buildDefaultStructuredData, buildStructuredDataLogoUrl } from "./build-structured-data";
import { DEFAULT_OG_IMAGE_PATH, DEFAULT_THEME_COLOR } from "./seo.constants";
import type { OpenGraphType, PageSeoOverride, ResolvedPageSeo, TwitterCardType } from "./seo.types";
import { resolvePageSeoKey } from "./resolve-page-seo-key";
import { resolveCanonicalPath } from "./resolve-canonical-path.util";
import { buildSeoDescription, buildSeoTitle, resolveAbsoluteUrl } from "./seo-text.util";

type BuildPageSeoInput = {
  readonly t: TFunction;
  readonly pathname: string;
  readonly appUrl: string;
  readonly override?: PageSeoOverride | null;
  readonly underConstruction?: boolean;
};

function readPageSeoField(
  t: TFunction,
  pageKey: string,
  field: "description" | "keywords" | "robots",
  interpolation?: Record<string, string>
): string {
  const pagePath = `seo.pages.${pageKey}.${field}`;
  const pageValue = t(pagePath, interpolation ?? {});
  if (pageValue !== pagePath) {
    return pageValue;
  }

  return t(`seo.defaults.${field}`);
}

export function buildPageSeo(input: BuildPageSeoInput): ResolvedPageSeo {
  const { t, pathname, appUrl, override, underConstruction } = input;

  const pageKey = underConstruction ? "underConstruction" : resolvePageSeoKey(pathname);
  const titleKey = underConstruction
    ? "pages.underConstruction.pageTitle"
    : resolvePageTitleKey(pathname);
  const siteName = t("seo.brand.name");
  const pageTitle = override?.title?.trim() || t(titleKey);
  const title = buildSeoTitle(siteName, pageTitle);

  const interpolation = override?.title?.trim() ? { title: override.title.trim() } : undefined;

  const description = buildSeoDescription(
    override?.description?.trim() || readPageSeoField(t, pageKey, "description", interpolation)
  );

  const keywords =
    override?.keywords?.trim() || readPageSeoField(t, pageKey, "keywords", interpolation);

  let robots = override?.robots?.trim() || readPageSeoField(t, pageKey, "robots");
  if (override?.noIndex) {
    robots = "noindex, nofollow";
  }

  const canonicalPath = override?.canonicalPath ?? resolveCanonicalPath(pathname);
  const canonicalUrl = resolveAbsoluteUrl(appUrl, canonicalPath);
  const imageUrl = resolveAbsoluteUrl(appUrl, override?.image?.trim() || DEFAULT_OG_IMAGE_PATH);
  const imageAlt = override?.imageAlt?.trim() || t("seo.defaults.ogImageAlt");
  const ogType = (override?.ogType ?? t("seo.defaults.ogType")) as OpenGraphType;
  const twitterCard = (override?.twitterCard ?? t("seo.defaults.twitterCard")) as TwitterCardType;

  const logoUrl = buildStructuredDataLogoUrl(appUrl, DEFAULT_OG_IMAGE_PATH);
  const jsonLd =
    override?.jsonLd ??
    buildDefaultStructuredData({
      t,
      appUrl,
      canonicalUrl,
      siteName,
      description,
      logoUrl,
    });

  return {
    title,
    description,
    keywords,
    robots,
    canonicalUrl,
    imageUrl,
    imageAlt,
    ogType,
    twitterCard,
    siteName,
    locale: t("seo.brand.locale"),
    language: t("seo.brand.language"),
    author: t("seo.brand.author"),
    themeColor: t("seo.brand.themeColor") || DEFAULT_THEME_COLOR,
    country: t("seo.brand.country"),
    hreflangUrl: canonicalUrl,
    jsonLd,
  };
}

export function resolveAppBaseUrl(configuredAppUrl: string): string {
  const trimmed = configuredAppUrl.trim();
  if (trimmed) {
    return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return "";
}
