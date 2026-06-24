import type { ResolvedPageSeo } from "./seo.types";
import { SEO_MANAGED_ATTR } from "./seo.constants";

const JSON_LD_SCRIPT_ID = "seo-json-ld";

/** Static fallbacks from index.html that must be removed once runtime SEO is applied. */
const UNMANAGED_STATIC_SEO_SELECTORS = [
  'meta[name="description"]:not([data-seo-managed])',
  'meta[name="keywords"]:not([data-seo-managed])',
  'meta[name="robots"]:not([data-seo-managed])',
  'meta[name="googlebot"]:not([data-seo-managed])',
  'meta[name="author"]:not([data-seo-managed])',
  'meta[name="application-name"]:not([data-seo-managed])',
  'meta[name="referrer"]:not([data-seo-managed])',
  'meta[name="theme-color"]:not([data-seo-managed])',
  'meta[name="format-detection"]:not([data-seo-managed])',
  'meta[name="mobile-web-app-title"]:not([data-seo-managed])',
  'meta[name="apple-mobile-web-app-title"]:not([data-seo-managed])',
  'meta[property^="og:"]:not([data-seo-managed])',
  'meta[name^="twitter:"]:not([data-seo-managed])',
  'link[rel="canonical"]:not([data-seo-managed])',
] as const;

let staticSeoFallbacksRemoved = false;

function removeUnmanagedStaticSeoFallbacks(): void {
  if (staticSeoFallbacksRemoved) {
    return;
  }

  staticSeoFallbacksRemoved = true;

  for (const selector of UNMANAGED_STATIC_SEO_SELECTORS) {
    document.head.querySelectorAll(selector).forEach((element) => {
      element.remove();
    });
  }
}

function upsertMeta(attribute: "name" | "property", key: string, content: string): void {
  const selector = `meta[${attribute}="${key}"][${SEO_MANAGED_ATTR}]`;
  let element = document.head.querySelector(selector);

  if (!(element instanceof HTMLMetaElement)) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    element.setAttribute(SEO_MANAGED_ATTR, "true");
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, extra?: Readonly<Record<string, string>>): void {
  const hreflang = extra?.hreflang;
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"][${SEO_MANAGED_ATTR}]`
    : `link[rel="${rel}"]:not([hreflang])[${SEO_MANAGED_ATTR}]`;
  let element = document.head.querySelector(selector);

  if (!(element instanceof HTMLLinkElement)) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    element.setAttribute(SEO_MANAGED_ATTR, "true");
    document.head.appendChild(element);
  }

  element.href = href;

  if (extra) {
    for (const [attr, value] of Object.entries(extra)) {
      element.setAttribute(attr, value);
    }
  }
}

function upsertJsonLd(data: ReadonlyArray<Record<string, unknown>>): void {
  let script = document.getElementById(JSON_LD_SCRIPT_ID);

  if (!(script instanceof HTMLScriptElement)) {
    script = document.createElement("script");
    script.id = JSON_LD_SCRIPT_ID;
    script.type = "application/ld+json";
    script.setAttribute(SEO_MANAGED_ATTR, "true");
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data.length === 1 ? data[0] : data);
}

export function applyPageSeo(seo: ResolvedPageSeo): void {
  removeUnmanagedStaticSeoFallbacks();

  document.title = seo.title;
  document.documentElement.lang = seo.language;
  document.documentElement.setAttribute("dir", "rtl");

  upsertMeta("name", "description", seo.description);
  upsertMeta("name", "keywords", seo.keywords);
  upsertMeta("name", "robots", seo.robots);
  upsertMeta("name", "googlebot", seo.robots);
  upsertMeta("name", "author", seo.author);
  upsertMeta("name", "application-name", seo.siteName);
  upsertMeta("name", "theme-color", seo.themeColor);
  upsertMeta("name", "mobile-web-app-title", seo.siteName);
  upsertMeta("name", "apple-mobile-web-app-title", seo.siteName);
  upsertMeta("name", "format-detection", "telephone=no");
  upsertMeta("name", "referrer", "strict-origin-when-cross-origin");
  upsertMeta("name", "language", "Persian");

  const country = seo.country?.trim();
  if (country) {
    upsertMeta("name", "geo.region", country);
  }

  upsertLink("canonical", seo.canonicalUrl);
  upsertLink("alternate", seo.hreflangUrl, { hreflang: seo.language });
  upsertLink("alternate", seo.hreflangUrl, { hreflang: "x-default" });

  upsertMeta("property", "og:title", seo.title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:url", seo.canonicalUrl);
  upsertMeta("property", "og:type", seo.ogType);
  upsertMeta("property", "og:site_name", seo.siteName);
  upsertMeta("property", "og:locale", seo.locale);
  upsertMeta("property", "og:image", seo.imageUrl);
  upsertMeta("property", "og:image:alt", seo.imageAlt);
  upsertMeta("property", "og:image:width", "512");
  upsertMeta("property", "og:image:height", "512");

  if (seo.imageUrl.startsWith("https://")) {
    upsertMeta("property", "og:image:secure_url", seo.imageUrl);
  } else {
    document.head
      .querySelector(`meta[property="og:image:secure_url"][${SEO_MANAGED_ATTR}]`)
      ?.remove();
  }

  upsertMeta("property", "og:image:type", "image/png");

  upsertMeta("name", "twitter:card", seo.twitterCard);
  upsertMeta("name", "twitter:title", seo.title);
  upsertMeta("name", "twitter:description", seo.description);
  upsertMeta("name", "twitter:image", seo.imageUrl);
  upsertMeta("name", "twitter:image:alt", seo.imageAlt);

  upsertJsonLd([...seo.jsonLd]);
}
