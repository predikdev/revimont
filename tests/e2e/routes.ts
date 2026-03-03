import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECTS_FILE = resolve(process.cwd(), "src/data/projects.ts");

const readProjectSlugs = (): string[] => {
  const projectsFile = readFileSync(PROJECTS_FILE, "utf-8");
  return Array.from(
    projectsFile.matchAll(/slug:\s*"([^"]+)"/g),
    (match) => match[1],
  );
};

const staticRoutes = [
  "/",
  "/kontakt",
  "/realizace",
  "/ochrana-osobnich-udaju",
  "/sluzby/elektroinstalace",
  "/sluzby/revize",
  "/sluzby/opravy-montaze",
] as const;

const projectRoutes = readProjectSlugs().map((slug) => `/realizace/${slug}`);

export const e2eRoutes = [...new Set([...staticRoutes, ...projectRoutes])];
