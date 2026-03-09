import type { APIRoute } from "astro";
import { projects } from "../data/projects";
import { SITE_URL } from "../data/company";

export const prerender = true;

const buildDate = new Date().toISOString().split("T")[0];

const xmlEscape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface UrlEntry {
  path: string;
  priority: string;
  changefreq: string;
  lastmod: string; // ISO date YYYY-MM-DD
}

const staticEntries: UrlEntry[] = [
  { path: "/", lastmod: "2026-03-04", priority: "1.0", changefreq: "weekly" },
  {
    path: "/sluzby/elektroinstalace",
    lastmod: "2026-03-04",
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    path: "/sluzby/revize",
    lastmod: "2026-03-04",
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    path: "/sluzby/opravy-montaze",
    lastmod: "2026-03-04",
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    path: "/realizace",
    lastmod: "2026-03-04",
    priority: "0.8",
    changefreq: "monthly",
  },
  {
    path: "/kontakt",
    lastmod: "2025-10-01",
    priority: "0.6",
    changefreq: "yearly",
  },
  {
    path: "/ochrana-osobnich-udaju",
    lastmod: "2025-10-01",
    priority: "0.3",
    changefreq: "yearly",
  },
];

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(SITE_URL);

  const allEntries: UrlEntry[] = [
    ...staticEntries,
    ...projects.map((project) => ({
      path: `/realizace/${project.slug}`,
      lastmod: project.lastmod ?? buildDate,
      priority: "0.7",
      changefreq: "monthly",
    })),
  ];

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
