import { SEO_DESCRIPTION_MAX_LENGTH, SEO_TITLE_MAX_LENGTH } from "./seo.constants";

export function htmlToPlainText(html: string): string {
  if (!html.trim()) {
    return "";
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function truncateSeoText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const slice = normalized.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.trimEnd()}…`;
}

export function buildSeoTitle(brand: string, pageTitle: string): string {
  return truncateSeoText(`${brand} - ${pageTitle}`, SEO_TITLE_MAX_LENGTH);
}

export function buildSeoDescription(text: string): string {
  return truncateSeoText(text, SEO_DESCRIPTION_MAX_LENGTH);
}

export function resolveAbsoluteUrl(baseUrl: string, pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) {
    return baseUrl;
  }

  try {
    return new URL(trimmed).href;
  } catch {
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${normalizedBase}${normalizedPath}`;
  }
}
