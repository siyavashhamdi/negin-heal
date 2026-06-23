import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const envFilePath = path.join(appDir, ".env");
const outputPath = path.join(appDir, "public", "sitemap.xml");

const DEFAULT_SITE_URL = "https://neginheal.ir";
const COURSE_PAGE_SIZE = 100;

const STATIC_ROUTES = [
  { path: "/courses", changefreq: "daily", priority: "1.0" },
  { path: "/support", changefreq: "weekly", priority: "0.8" },
  { path: "/support/faq", changefreq: "weekly", priority: "0.8" },
  { path: "/more/about", changefreq: "monthly", priority: "0.6" },
  { path: "/more/privacy-policy", changefreq: "monthly", priority: "0.5" },
  { path: "/more/terms-of-use", changefreq: "monthly", priority: "0.5" },
];

const USER_COURSE_LIST_QUERY = `
  query UserCourseList($input: CourseListGqlInput!) {
    userCourseList(input: $input) {
      items {
        id
      }
      pagination {
        hasNextPage
        endCursor
      }
    }
  }
`;

async function loadEnvFile(filePath) {
  try {
    const content = await readFile(filePath, "utf8");

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional for local builds that export variables directly.
  }
}

function normalizeSiteUrl(value) {
  const trimmed = value?.trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_SITE_URL;
}

function toLastModDate() {
  return new Date().toISOString().slice(0, 10);
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildUrlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

function resolveGraphqlUrl(apiBaseUrl) {
  return `${apiBaseUrl.replace(/\/+$/, "")}/graphql`;
}

async function fetchActiveCourseIds(apiBaseUrl) {
  const graphqlUrl = resolveGraphqlUrl(apiBaseUrl);
  const courseIds = [];
  let startCursor;

  while (true) {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: USER_COURSE_LIST_QUERY,
        variables: {
          input: {
            filters: {
              isActive: true,
            },
            options: {
              limit: COURSE_PAGE_SIZE,
              ...(startCursor ? { startCursor } : {}),
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status ${response.status}`);
    }

    const payload = await response.json();

    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message).join("; "));
    }

    const page = payload.data?.userCourseList;
    if (!page) {
      throw new Error("userCourseList response was empty");
    }

    for (const item of page.items ?? []) {
      if (item?.id) {
        courseIds.push(item.id);
      }
    }

    if (!page.pagination?.hasNextPage) {
      break;
    }

    startCursor = page.pagination.endCursor;
    if (!startCursor) {
      break;
    }
  }

  return courseIds;
}

async function generateSitemap() {
  await loadEnvFile(envFilePath);

  const siteUrl = normalizeSiteUrl(process.env.VITE_APP_URL ?? process.env.VITE_API_BASE_URL);
  const apiBaseUrl = normalizeSiteUrl(process.env.VITE_API_BASE_URL ?? siteUrl);
  const lastmod = toLastModDate();

  const entries = STATIC_ROUTES.map((route) =>
    buildUrlEntry({
      loc: `${siteUrl}${route.path}`,
      lastmod,
      changefreq: route.changefreq,
      priority: route.priority,
    }),
  );

  try {
    const courseIds = await fetchActiveCourseIds(apiBaseUrl);

    for (const courseId of courseIds) {
      entries.push(
        buildUrlEntry({
          loc: `${siteUrl}/courses/${courseId}`,
          lastmod,
          changefreq: "weekly",
          priority: "0.9",
        }),
      );
    }

    console.log(`Generated sitemap with ${STATIC_ROUTES.length} static routes and ${courseIds.length} course routes`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Could not fetch courses for sitemap (${message}); writing static routes only`);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");

  await writeFile(outputPath, xml, "utf8");
  console.log(`Wrote ${outputPath}`);
}

await generateSitemap();
