import type { APIRoute } from "astro";
import { SITE_URL } from "../data/company";
import { projects } from "../data/projects";

export const prerender = true;

const buildDate = new Date().toISOString().split("T")[0];
const astroPageFiles = Object.keys(import.meta.glob("./**/*.astro"));

const xmlEscape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface UrlEntry {
  path: string;
  priority: string;
  changefreq: string;
  lastmod: string; // ISO date YYYY-MM-DD
}

interface RouteOverride extends Partial<Omit<UrlEntry, "path">> {
  include?: boolean;
}

const routeOverrides: Record<string, RouteOverride> = {
  "/": { lastmod: "2026-03-04", priority: "1.0", changefreq: "weekly" },
  "/sluzby/elektroinstalace": {
    lastmod: "2026-03-04",
    priority: "0.9",
    changefreq: "monthly",
  },
  "/sluzby/revize": {
    lastmod: "2026-03-04",
    priority: "0.9",
    changefreq: "monthly",
  },
  "/sluzby/opravy-montaze": {
    lastmod: "2026-03-04",
    priority: "0.9",
    changefreq: "monthly",
  },
  "/realizace": {
    lastmod: "2026-03-04",
    priority: "0.8",
    changefreq: "monthly",
  },
  "/kontakt": {
    lastmod: "2025-10-01",
    priority: "0.6",
    changefreq: "yearly",
  },
  "/ochrana-osobnich-udaju": { include: false },
};

const pageFileToRoutePath = (filePath: string): string | null => {
  if (!filePath.endsWith(".astro")) return null;

  const relativePath = filePath.replace(/^\.\//, "").replace(/\.astro$/, "");
  if (
    !relativePath ||
    relativePath.includes("[") ||
    relativePath.includes("]")
  ) {
    return null;
  }

  if (relativePath === "index") return "/";

  const normalizedPath = relativePath.replace(/\/index$/, "");
  if (normalizedPath === "404" || normalizedPath === "500") return null;

  return `/${normalizedPath}`;
};

const buildStaticEntry = (path: string): UrlEntry => {
  const defaults =
    path === "/"
      ? { priority: "1.0", changefreq: "weekly" }
      : { priority: "0.7", changefreq: "monthly" };
  const overrides = routeOverrides[path] ?? {};

  return {
    path,
    priority: overrides.priority ?? defaults.priority,
    changefreq: overrides.changefreq ?? defaults.changefreq,
    lastmod: overrides.lastmod ?? buildDate,
  };
};

const getStaticEntries = (): UrlEntry[] =>
  astroPageFiles
    .map(pageFileToRoutePath)
    .filter((path): path is string => path !== null)
    .filter((path) => routeOverrides[path]?.include !== false)
    .sort((a, b) => a.localeCompare(b))
    .map(buildStaticEntry);

const getProjectEntries = (): UrlEntry[] =>
  projects.map((project) => ({
    path: `/realizace/${project.slug}`,
    lastmod: project.lastmod ?? buildDate,
    priority: "0.7",
    changefreq: "monthly",
  }));

const dedupeEntries = (entries: UrlEntry[]): UrlEntry[] => {
  const uniqueEntries = new Map<string, UrlEntry>();

  for (const entry of entries) {
    if (!uniqueEntries.has(entry.path)) {
      uniqueEntries.set(entry.path, entry);
    }
  }

  return Array.from(uniqueEntries.values()).sort((a, b) =>
    a.path.localeCompare(b.path),
  );
};

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(SITE_URL);
  const allEntries = dedupeEntries([
    ...getStaticEntries(),
    ...getProjectEntries(),
  ]);

  const urlTags = allEntries
    .map(({ path, priority, changefreq, lastmod }) => {
      const loc = xmlEscape(new URL(path, base).toString());
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlTags}\n</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
