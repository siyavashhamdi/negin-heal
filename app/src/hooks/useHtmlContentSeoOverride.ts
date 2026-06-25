import { useMemo } from "react";
import { API_CONFIG } from "../config";
import { resolveAppBaseUrl } from "../seo/build-page-seo";
import {
  buildBreadcrumbStructuredData,
  buildDefaultStructuredData,
  buildStructuredDataLogoUrl,
} from "../seo/build-structured-data";
import type { PageSeoOverride } from "../seo/seo.types";
import { buildSeoDescription, htmlToPlainText, resolveAbsoluteUrl } from "../seo/seo-text.util";
import { usePageSeoOverride } from "./usePageSeoOverride";
import { useTranslation } from "./useTranslation";

type BreadcrumbItem = {
  readonly name: string;
  readonly path: string;
};

type UseHtmlContentSeoOverrideInput = {
  readonly html?: string | null;
  readonly fallbackDescriptionKey: string;
  readonly canonicalPath: string;
  readonly breadcrumbs?: readonly BreadcrumbItem[];
  readonly pageTitle?: string;
};

export const useHtmlContentSeoOverride = ({
  html,
  fallbackDescriptionKey,
  canonicalPath,
  breadcrumbs,
  pageTitle,
}: UseHtmlContentSeoOverrideInput): void => {
  const { t } = useTranslation();
  const breadcrumbKey =
    breadcrumbs?.map((item) => `${item.path}\u0000${item.name}`).join("\u0001") ?? "";

  const override = useMemo((): PageSeoOverride | null => {
    const plainText = html?.trim() ? htmlToPlainText(html) : "";
    const description = plainText
      ? buildSeoDescription(plainText)
      : buildSeoDescription(t(fallbackDescriptionKey));
    const appUrl = resolveAppBaseUrl(API_CONFIG.APP_URL);
    const canonicalUrl = resolveAbsoluteUrl(appUrl, canonicalPath);
    const siteName = t("seo.brand.name");
    const logoUrl = buildStructuredDataLogoUrl(appUrl, "/icons/icon-512.png");
    const breadcrumbJsonLd = breadcrumbs?.length
      ? buildBreadcrumbStructuredData({
          appUrl,
          items: breadcrumbs.map((item) => ({
            name: item.name,
            url: resolveAbsoluteUrl(appUrl, item.path),
          })),
        })
      : [];

    return {
      ...(pageTitle ? { title: pageTitle } : {}),
      description,
      canonicalPath,
      ogType: "article",
      jsonLd: [
        ...buildDefaultStructuredData({
          t,
          appUrl,
          canonicalUrl,
          siteName,
          description,
          logoUrl,
        }),
        ...breadcrumbJsonLd,
      ],
    };
  }, [breadcrumbKey, canonicalPath, fallbackDescriptionKey, html, pageTitle, t]);

  usePageSeoOverride(override);
};
