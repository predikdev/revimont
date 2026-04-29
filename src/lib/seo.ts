import { SITE_URL } from "../data/company";

export type SchemaLike = Record<string, unknown>;

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface ServiceSchemaInput {
  serviceType: string;
  name: string;
  description: string;
  path: string;
  areaServed?: string;
}

interface ArticleSchemaInput {
  headline: string;
  description: string;
  image: string;
  path: string;
}

export const getSiteUrl = (site?: URL | string) =>
  (site?.toString() ?? SITE_URL).replace(/\/$/, "");

export const getPageUrl = (site: URL | undefined, path: string) =>
  `${getSiteUrl(site)}${normalizePath(path)}`;

export const createBreadcrumbSchema = (
  site: URL | undefined,
  items: BreadcrumbItem[],
): SchemaLike => {
  const siteUrl = getSiteUrl(site);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item:
        item.path === "/"
          ? `${siteUrl}/`
          : `${siteUrl}${normalizePath(item.path)}`,
    })),
  };
};

export const createServiceSchema = (
  site: URL | undefined,
  input: ServiceSchemaInput,
): SchemaLike => {
  const siteUrl = getSiteUrl(site);

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: input.serviceType,
    name: input.name,
    description: input.description,
    provider: { "@id": `${siteUrl}/#company` },
    areaServed: {
      "@type": "AdministrativeArea",
      name: input.areaServed ?? "Klatovy a okolí",
    },
    url: getPageUrl(site, input.path),
  };
};

export const createArticleSchema = (
  site: URL | undefined,
  input: ArticleSchemaInput,
): SchemaLike => {
  const siteUrl = getSiteUrl(site);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    image: new URL(input.image, `${siteUrl}/`).toString(),
    url: getPageUrl(site, input.path),
    inLanguage: "cs",
    publisher: { "@id": `${siteUrl}/#company` },
    author: { "@id": `${siteUrl}/#company` },
  };
};

const normalizePath = (path: string) =>
  path.startsWith("/") ? path : `/${path}`;
