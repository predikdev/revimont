import type { APIRoute } from "astro";
import { projects } from "../data/projects";
import { SITE_URL } from "../data/company";

export const prerender = true;

const staticPaths = [
  "/",
  "/kontakt",
  "/sluzby",
  "/sluzby/elektroinstalace",
  "/sluzby/revize",
  "/sluzby/opravy-montaze",
  "/realizace",
  "/ochrana-osobnich-udaju",
];

const xmlEscape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(SITE_URL);
  const urls = [
    ...staticPaths.map((path) => new URL(path, base).toString()),
    ...projects.map((project) =>
      new URL(`/realizace/${project.slug}`, base).toString(),
    ),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`)
    .join("\n")}\n</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
